import { McgPerformanceProfile, ResourceProfile } from '@odf/core/types';
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

export const isMcgPerformanceSectionVisible = ({
  isNoobaaAvailable,
}: Pick<ConfigurePerformanceProfileVisibility, 'isNoobaaAvailable'>): boolean =>
  isNoobaaAvailable;

export const isConfigurePerformanceProfileVisible = (
  visibility: ConfigurePerformanceProfileVisibility
): boolean =>
  isCoreStorageSectionVisible(visibility) ||
  isMcgPerformanceSectionVisible(visibility);

export const isCoreStorageSaveDisabled = (
  resourceProfile: ResourceProfile | null
): boolean => !resourceProfile;

export const isMcgPerformanceSaveDisabled = (
  mcgPerformanceProfile: McgPerformanceProfile | null
): boolean => !mcgPerformanceProfile;

export const checkRequiredValues = (
  state: ConfigurePerformanceProfileFormState,
  showCoreStorage: boolean,
  showMcgPerformance: boolean
): boolean =>
  (showCoreStorage && isCoreStorageSaveDisabled(state.resourceProfile)) ||
  (showMcgPerformance &&
    isMcgPerformanceSaveDisabled(state.mcgPerformanceProfile));
