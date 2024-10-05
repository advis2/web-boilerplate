import { create } from 'zustand';

export interface Organization {
  id: string;
  name: string;
}

export interface UseStore {
  organizations: Organization[];
  addOrganization: (organization: Organization) => void;
  removeOrganization: (id: string) => void;
  removeLastOrganization: () => void;
}

export const useStore = create<UseStore>((set) => ({
  // 초기 상태
  organizations: [],

  // organization 추가
  addOrganization: (organization: Organization) =>
    set((state) => ({
      ...state,
      organizations: [...state.organizations, organization],
    })),

  // organization 삭제
  removeOrganization: (id: string) =>
    set((state) => ({
      ...state,
      organizations: state.organizations.filter((org) => org.id !== id),
    })),

  removeLastOrganization: () =>
    set((state) => {
      if (state.organizations.length > 0) {
        const lastOrganization =
          state.organizations[state.organizations.length - 1];
        return {
          ...state,
          organizations: state.organizations.filter(
            (org) => org.id !== lastOrganization.id
          ),
        };
      }
      // 변동 없음
      return state;
    }),
}));
