import { useEffect, useMemo } from "react";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { Button } from "@heroui/button";
import { AlertCircle, Clock, Loader2, RotateCcw, Trash2 } from "lucide-react";

import {
  MAX_CONCURRENCY,
  MIN_CONCURRENCY,
  UploadJob,
  useUploadQueueStore,
} from "@/store/uploadQueueStore";

type UploadQueueModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const useJobThumbnail = (file: File) => {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return url;
};

const JobRow = ({ job }: { job: UploadJob }) => {
  const retry = useUploadQueueStore((s) => s.retry);
  const remove = useUploadQueueStore((s) => s.remove);
  const thumb = useJobThumbnail(job.image);

  return (
    <li className="flex items-start gap-3 border-b px-1 py-2.5 last:border-b-0">
      <img
        alt=""
        className="size-10 shrink-0 rounded border object-cover"
        src={thumb}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{job.title}</p>
        <p className="truncate text-xs text-muted-foreground">{job.siteName}</p>
        {job.status === "running" && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="size-3 animate-spin" />
            {job.step ?? "Uploading"}
          </p>
        )}
        {job.status === "pending" && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" /> Waiting in queue
          </p>
        )}
        {job.status === "failed" && (
          <p className="mt-0.5 flex items-start gap-1.5 text-xs text-danger">
            <AlertCircle className="mt-px size-3 shrink-0" />
            <span className="break-words">{job.error}</span>
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {job.status === "failed" && (
          <Button
            isIconOnly
            aria-label="Retry"
            size="sm"
            title="Retry"
            variant="light"
            onPress={() => retry(job.id)}
          >
            <RotateCcw className="size-4" />
          </Button>
        )}
        {job.status !== "running" && (
          <Button
            isIconOnly
            aria-label="Remove from queue"
            color="danger"
            size="sm"
            title="Remove from queue"
            variant="light"
            onPress={() => remove(job.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </li>
  );
};

const Section = ({ title, jobs }: { title: string; jobs: UploadJob[] }) =>
  jobs.length === 0 ? null : (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
        {title} ({jobs.length})
      </p>
      <ul className="rounded border px-2">
        {jobs.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </ul>
    </div>
  );

export const UploadQueueModal = ({
  isOpen,
  onClose,
}: UploadQueueModalProps) => {
  const jobs = useUploadQueueStore((s) => s.jobs);
  const concurrency = useUploadQueueStore((s) => s.concurrency);
  const setConcurrency = useUploadQueueStore((s) => s.setConcurrency);
  const retryAllFailed = useUploadQueueStore((s) => s.retryAllFailed);
  const clearFailed = useUploadQueueStore((s) => s.clearFailed);

  const running = jobs.filter((j) => j.status === "running");
  const pending = jobs.filter((j) => j.status === "pending");
  const failed = jobs.filter((j) => j.status === "failed");

  const options = Array.from(
    { length: MAX_CONCURRENCY - MIN_CONCURRENCY + 1 },
    (_, i) => MIN_CONCURRENCY + i,
  );

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Upload queue
          <span className="text-xs font-normal text-muted-foreground">
            {running.length} uploading · {pending.length} waiting ·{" "}
            {failed.length} failed
          </span>
        </ModalHeader>
        <ModalBody className="gap-4 pb-6">
          <div className="flex items-center justify-between gap-3 rounded border bg-muted/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Parallel uploads</p>
              <p className="text-xs text-muted-foreground">
                Number of products uploaded at the same time
              </p>
            </div>
            <div className="flex overflow-hidden rounded border">
              {options.map((value) => (
                <button
                  key={value}
                  className={`h-8 w-9 text-sm ${
                    value === concurrency
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                  type="button"
                  onClick={() => setConcurrency(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {jobs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Queue is empty. Successful uploads are cleared automatically.
            </p>
          ) : (
            <>
              <Section jobs={running} title="Uploading" />
              <Section jobs={pending} title="Waiting" />
              {failed.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="flat" onPress={retryAllFailed}>
                      Retry all failed
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      variant="flat"
                      onPress={clearFailed}
                    >
                      Clear failed
                    </Button>
                  </div>
                  <Section jobs={failed} title="Failed" />
                </div>
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
