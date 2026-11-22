import { create } from "zustand";
import { persist } from "zustand/middleware";

import { processProductImage } from "@/lib/imageProcessing";
import { createProductOnSite, uploadMediaToSite } from "@/lib/wooRequests";
import { pushNotification } from "@/lib/utils";
import { BackgroundSettings } from "@/types/background";
import { WatermarkSettings } from "@/types/watermark";

export const MIN_CONCURRENCY = 1;
export const MAX_CONCURRENCY = 3;

export type UploadJobStatus = "pending" | "running" | "failed";

export type UploadJob = {
  id: string;
  siteId: string;
  siteName: string;
  title: string;
  short_description: string;
  description: string;
  categoryIds: number[];
  image: File;
  // Image settings snapshot taken when the job was queued.
  watermark: WatermarkSettings;
  background: BackgroundSettings;
  status: UploadJobStatus;
  step: string | null;
  error: string | null;
  // Kept after a successful media upload so a retry doesn't re-upload it.
  imageId: number | null;
  createdAt: number;
};

export type EnqueueInput = Omit<
  UploadJob,
  "id" | "status" | "step" | "error" | "imageId" | "createdAt"
>;

type UploadQueueState = {
  jobs: UploadJob[];
  concurrency: number;
  enqueue: (input: EnqueueInput) => void;
  retry: (id: string) => void;
  retryAllFailed: () => void;
  remove: (id: string) => void;
  clearFailed: () => void;
  setConcurrency: (value: number) => void;
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const clampConcurrency = (value: number) =>
  Math.min(MAX_CONCURRENCY, Math.max(MIN_CONCURRENCY, Math.round(value) || 1));

export const useUploadQueueStore = create<UploadQueueState>()(
  persist(
    (set, get) => {
      const patchJob = (id: string, patch: Partial<UploadJob>) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...patch } : job,
          ),
        }));

      const runJob = async (id: string) => {
        const job = get().jobs.find((j) => j.id === id);

        if (!job) return;

        try {
          let imageId = job.imageId;

          if (!imageId) {
            patchJob(id, { step: "Processing image" });
            const processed = await processProductImage(
              job.image,
              job.title,
              job.watermark,
              job.background,
            );

            patchJob(id, { step: "Uploading image" });
            const media = await uploadMediaToSite(
              job.siteId,
              processed,
              job.title,
            );

            imageId = media.id;
            patchJob(id, { imageId });
          }

          patchJob(id, { step: "Creating product" });
          await createProductOnSite(job.siteId, {
            name: job.title,
            short_description: job.short_description,
            description: job.description,
            categories: job.categoryIds.map((categoryId) => ({
              id: categoryId,
            })),
            imageId: imageId ?? undefined,
          });

          set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));
          pushNotification(`Uploaded "${job.title}"`, "success");
        } catch (err) {
          const message = (err as Error)?.message || "Upload failed";

          patchJob(id, { status: "failed", step: null, error: message });
          pushNotification(`Failed "${job.title}": ${message}`, "danger");
        } finally {
          pump();
        }
      };

      // Start pending jobs until the concurrency limit is reached.
      const pump = () => {
        const { jobs, concurrency } = get();
        let running = jobs.filter((j) => j.status === "running").length;
        const toStart: string[] = [];

        for (const job of jobs) {
          if (running >= concurrency) break;
          if (job.status !== "pending") continue;
          toStart.push(job.id);
          running += 1;
        }

        if (toStart.length === 0) return;

        set((state) => ({
          jobs: state.jobs.map((job) =>
            toStart.includes(job.id)
              ? { ...job, status: "running", error: null, step: "Starting" }
              : job,
          ),
        }));
        toStart.forEach((id) => void runJob(id));
      };

      return {
        jobs: [],
        concurrency: 2,
        enqueue: (input) => {
          set((state) => ({
            jobs: [
              ...state.jobs,
              {
                ...input,
                id: createId(),
                status: "pending",
                step: null,
                error: null,
                imageId: null,
                createdAt: Date.now(),
              },
            ],
          }));
          pump();
        },
        retry: (id) => {
          set((state) => ({
            jobs: state.jobs.map((job) =>
              job.id === id && job.status === "failed"
                ? { ...job, status: "pending", error: null }
                : job,
            ),
          }));
          pump();
        },
        retryAllFailed: () => {
          set((state) => ({
            jobs: state.jobs.map((job) =>
              job.status === "failed"
                ? { ...job, status: "pending", error: null }
                : job,
            ),
          }));
          pump();
        },
        remove: (id) =>
          set((state) => ({
            jobs: state.jobs.filter(
              (job) => job.id !== id || job.status === "running",
            ),
          })),
        clearFailed: () =>
          set((state) => ({
            jobs: state.jobs.filter((job) => job.status !== "failed"),
          })),
        setConcurrency: (value) => {
          set({ concurrency: clampConcurrency(value) });
          pump();
        },
      };
    },
    {
      name: "upload-queue-settings",
      // Jobs hold File objects and live only for this tab session.
      partialize: (state) => ({ concurrency: state.concurrency }),
    },
  ),
);

// Jobs live in memory only — warn before closing the tab with unfinished work.
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (event) => {
    const hasUnfinished = useUploadQueueStore
      .getState()
      .jobs.some((job) => job.status !== "failed");

    if (hasUnfinished) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}
