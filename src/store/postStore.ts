// store/postStore.ts
import { create } from "zustand";

type PostFormData = {
  title: string;
  short_description: string;
  description: string;
  image: File | null;
  categories: number[];
  empty: boolean;
};

export type FillableField =
  "title" | "short_description" | "description" | "categories";

// Page order, so the highlight cascades down the form.
const FILL_ORDER: FillableField[] = [
  "title",
  "short_description",
  "description",
  "categories",
];

type PostStore = PostFormData & {
  // Fields written by the last `fill`; a new object per fill so cards can
  // replay their highlight.
  lastFill: { fields: FillableField[] } | null;
  setField: <K extends keyof PostFormData>(
    key: K,
    value: PostFormData[K],
  ) => void;
  fill: (data: Partial<Pick<PostFormData, FillableField>>) => void;
  reset: () => void;
};

export const usePostStore = create<PostStore>((set) => ({
  title: "",
  short_description: "",
  description: "",
  image: null,
  categories: [],
  empty: false,
  lastFill: null,
  setField: (key, value) => set((state) => ({ ...state, [key]: value })),
  fill: (data) => {
    const fields = FILL_ORDER.filter((key) => data[key] !== undefined);

    if (fields.length === 0) {
      return;
    }

    set({ ...data, empty: false, lastFill: { fields } });
  },
  reset: () =>
    set({
      title: "",
      short_description: "",
      description: "",
      image: null,
      categories: [],
      empty: true,
    }),
}));
