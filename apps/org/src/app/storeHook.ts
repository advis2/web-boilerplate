import { UseStore, useStore } from '../store/store';

export function useStoreHook(): UseStore {
  const {
    organizations,
    addOrganization,
    removeOrganization,
    removeLastOrganization,
  } = useStore();

  return {
    organizations,
    addOrganization,
    removeOrganization,
    removeLastOrganization,
  };
}
