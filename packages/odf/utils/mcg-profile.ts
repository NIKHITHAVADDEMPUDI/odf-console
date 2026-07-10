import { McgPerformanceProfile } from '@odf/core/types';
import { TFunction } from 'react-i18next';

type McgProfileRequirements = {
  cpu: number;
  memoryGiB: number;
};

const MCG_PROFILE_REQUIREMENTS: Record<
  McgPerformanceProfile,
  McgProfileRequirements
> = {
  [McgPerformanceProfile.Default]: { cpu: 3.2, memoryGiB: 6.5 },
  [McgPerformanceProfile.MixedWorkload]: { cpu: 13.2, memoryGiB: 22.5 },
  [McgPerformanceProfile.SmallObjects]: { cpu: 17.2, memoryGiB: 38.5 },
};

export const getMcgProfileRequirements = (
  profile: McgPerformanceProfile
): { minCpu: number; minMem: number } => {
  const { cpu, memoryGiB } = MCG_PROFILE_REQUIREMENTS[profile];
  return {
    minCpu: Math.ceil(cpu),
    minMem: Math.ceil(memoryGiB),
  };
};

export const isMcgProfileAllowed = (
  profile: McgPerformanceProfile,
  clusterCpu: number,
  clusterMemoryGiB: number
): boolean => {
  const { minCpu, minMem } = getMcgProfileRequirements(profile);
  return clusterCpu >= minCpu && clusterMemoryGiB >= minMem;
};

export const getMcgProfileDisplayName = (
  profile: McgPerformanceProfile,
  t: TFunction
): string => {
  switch (profile) {
    case McgPerformanceProfile.Default:
      return t('Default');
    case McgPerformanceProfile.MixedWorkload:
      return t('Mixed workload');
    case McgPerformanceProfile.SmallObjects:
      return t('Small objects');
    default:
      return profile;
  }
};
