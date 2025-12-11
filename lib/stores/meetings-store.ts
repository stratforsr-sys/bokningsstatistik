import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'list' | 'calendar' | 'board';

export interface MeetingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
  ownerIds?: string[];
  qualityMin?: number;
  qualityMax?: number;
}

interface MeetingsStore {
  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Filters
  filters: MeetingFilters;
  setFilters: (filters: MeetingFilters) => void;
  updateFilter: (key: keyof MeetingFilters, value: any) => void;
  resetFilters: () => void;

  // Selection (for bulk operations)
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  quickViewMeetingId: string | null;
  setQuickViewMeetingId: (id: string | null) => void;
}

export const useMeetingsStore = create<MeetingsStore>()(
  persist(
    (set, get) => ({
      // Initial view state
      viewMode: 'list',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Initial filters
      filters: {},
      setFilters: (filters) => set({ filters }),
      updateFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      resetFilters: () => set({ filters: {} }),

      // Initial selection
      selectedIds: new Set<string>(),
      toggleSelect: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedIds: newSet };
        }),
      selectAll: (ids) => set({ selectedIds: new Set(ids) }),
      clearSelection: () => set({ selectedIds: new Set() }),
      isSelected: (id) => get().selectedIds.has(id),

      // Initial UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      quickViewMeetingId: null,
      setQuickViewMeetingId: (id) => set({ quickViewMeetingId: id }),
    }),
    {
      name: 'meetings-preferences',
      // Only persist view mode, not filters or selection
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
);
