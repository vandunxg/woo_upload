// store/postStore.ts
import { create } from "zustand";

type PostFormData = {
  title: string;
  description: string;
  image: File | null;
  categories: number[];
  empty: boolean;
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
  empty: false,
  setField: (key, value) => set((state) => ({ ...state, [key]: value })),
  reset: () =>
    set({
      title: "",
      description: "",
      image: null,
      categories: [],
      empty: true,
    }),
}));
