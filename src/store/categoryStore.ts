import { create } from "zustand";

type CategoryState = {
  id: number | null;
  setId: (id: number | null) => void;
};

export const useCategoryStore = create<CategoryState>((set) => ({
  id: null,
  setId: (id) => set({ id }),
}));
