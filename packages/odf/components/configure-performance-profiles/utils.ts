import { ResourceProfile, ValidationType } from '@odf/core/types';
import { StorageClusterKind } from '@odf/shared';
import { ConfigurePerformanceProfileFormState } from './state';

export type ConfigurePerformanceProfileVisibility = {
  storageCluster?: StorageClusterKind;
  hasExternalMode: boolean;
  isProviderMode: boolean;
  isNoobaaAvailable: boolean;
};

export const isCoreStorageSectionVisible = ({
  storageCluster,
  hasExternalMode,
  isProviderMode,
}: ConfigurePerformanceProfileVisibility): boolean =>
  !!storageCluster && !hasExternalMode && !isProviderMode;

export const isObjectAccessSectionVisible = ({
  isNoobaaAvailable,
}: Pick<ConfigurePerformanceProfileVisibility, 'isNoobaaAvailable'>): boolean =>
  isNoobaaAvailable;

export const isConfigurePerformanceProfileVisible = (
  visibility: ConfigurePerformanceProfileVisibility
): boolean =>
  isCoreStorageSectionVisible(visibility) ||
  isObjectAccessSectionVisible(visibility);

export const isCoreStorageSaveDisabled = (
  resourceProfile: ResourceProfile | null,
  validation: ValidationType | null
): boolean => !resourceProfile || !!validation;

export const isObjectAccessSaveDisabled = (): boolean => true;

export const checkRequiredValues = (
  state: ConfigurePerformanceProfileFormState,
  showCoreStorage: boolean,
  showObjectAccess: boolean
): boolean => {
  const coreStorageDisabled = showCoreStorage
    ? isCoreStorageSaveDisabled(state.resourceProfile, state.validation)
    : true;
  const objectAccessDisabled = showObjectAccess
    ? isObjectAccessSaveDisabled()
    : true;

  if (showCoreStorage && showObjectAccess) {
    return coreStorageDisabled && objectAccessDisabled;
  }
  if (showCoreStorage) {
    return coreStorageDisabled;
  }
  return objectAccessDisabled;
};
