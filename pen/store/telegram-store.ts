import { create } from 'zustand';

interface TelegramStore {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useTelegramStore = create<TelegramStore>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
