// store/postStore.ts
import { create } from "zustand";

type PostFormData = {
  title: string;
  description: string;
  image: File | null;
  categories: number[];
};

type PostStore = PostFormData & {
  setField: <K extends keyof PostFormData>(
    key: K,
    value: PostFormData[K],
  ) => void;
  reset: () => void;
};

export const usePostStore = create<PostStore>((set) => ({
  title: "",
  description: "",
  image: null,
  categories: [],
  setField: (key, value) => set((state) => ({ ...state, [key]: value })),
  reset: () =>
    set({
      title: "",
      description: "",
      image: null,
      categories: [],
    }),
}));
