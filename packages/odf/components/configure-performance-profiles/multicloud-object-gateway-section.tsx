import * as React from 'react';
import { labelNodes } from '@odf/core/components/create-storage-system/payloads';
import { WizardNodeState } from '@odf/core/components/create-storage-system/reducer';
import { getTotalCpu, getTotalMemoryInGiB } from '@odf/core/components/utils';
import { McgPerformanceProfile } from '@odf/core/types';
import {
  getMcgProfileDisplayName,
  getMcgProfileRequirements,
  isMcgProfileAllowed,
} from '@odf/core/utils';
import { StorageClusterKind, StorageClusterModel } from '@odf/shared';
import { SingleSelectDropdown } from '@odf/shared/dropdown';
import { getNamespace } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { k8sPatch, Patch } from '@openshift-console/dynamic-plugin-sdk';
import { TFunction } from 'react-i18next';
import { Content, ContentVariants, SelectOption } from '@patternfly/react-core';
import { InlineResourceRequirementsText } from '@odf/core/components/create-storage-system/create-storage-system-steps/capacity-and-nodes-step/inline-resource-requirements-text';
import '../create-storage-system/create-storage-system-steps/capacity-and-nodes-step/configure-performance.scss';
import {
  ConfigurePerformanceProfileAction,
  ConfigurePerformanceProfileActionType,
  ConfigurePerformanceProfileFormState,
} from './state';
import { isMcgPerformanceSaveDisabled } from './utils';

const selectOptions = (
  t: TFunction,
  clusterCpu: number,
  clusterMemoryGiB: number
) =>
  Object.values(McgPerformanceProfile).map((profile) => {
    const { minCpu, minMem } = getMcgProfileRequirements(profile);
    const description = `CPUs required: ${minCpu}, Memory required: ${minMem} GiB`;
    const isDisabled = !isMcgProfileAllowed(
      profile,
      clusterCpu,
      clusterMemoryGiB
    );
    return (
      <SelectOption
        key={profile}
        value={profile}
        description={description}
        data-test-id={`${profile}-mcg-profile`}
        isDisabled={isDisabled}
      >
        {getMcgProfileDisplayName(profile, t)}
      </SelectOption>
    );
  });

type SubmitMcgPerformanceProfileParams = {
  storageCluster: StorageClusterKind;
  mcgPerformanceProfile: McgPerformanceProfile | null;
  nodes: WizardNodeState[];
};

export const submitMcgPerformanceProfile = async ({
  storageCluster,
  mcgPerformanceProfile,
  nodes,
}: SubmitMcgPerformanceProfileParams): Promise<void> => {
  if (isMcgPerformanceSaveDisabled(mcgPerformanceProfile)) {
    return;
  }
  await labelNodes(nodes, getNamespace(storageCluster));
  const patch: Patch = {
    op: 'replace',
    path: '/spec/multiCloudGateway',
    value: {
      ...storageCluster.spec?.multiCloudGateway,
      performanceProfile: mcgPerformanceProfile,
    },
  };
  await k8sPatch({
    model: StorageClusterModel,
    resource: storageCluster,
    data: [patch],
  });
};

type McgPerformanceSectionProps = {
  state: ConfigurePerformanceProfileFormState;
  dispatch: React.Dispatch<ConfigurePerformanceProfileAction>;
  storageCluster: StorageClusterKind;
  clusterNodes: WizardNodeState[];
};

export const McgPerformanceSection: React.FC<McgPerformanceSectionProps> = ({
  state,
  dispatch,
  storageCluster,
  clusterNodes,
}) => {
  const { t } = useCustomTranslation();
  const { mcgPerformanceProfile } = state;
  const clusterCpu = getTotalCpu(clusterNodes);
  const clusterMemoryGiB = getTotalMemoryInGiB(clusterNodes);
  const mcgProfileRequirements = mcgPerformanceProfile
    ? getMcgProfileRequirements(mcgPerformanceProfile)
    : null;

  const onProfileChange = React.useCallback(
    (newProfile: string): void => {
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_MCG_PERFORMANCE_PROFILE,
        payload: newProfile as McgPerformanceProfile,
      });
    },
    [dispatch]
  );

  React.useEffect(() => {
    if (storageCluster && !mcgPerformanceProfile) {
      const profile =
        (storageCluster.spec?.multiCloudGateway
          ?.performanceProfile as McgPerformanceProfile) ||
        McgPerformanceProfile.Default;
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_MCG_PERFORMANCE_PROFILE,
        payload: profile,
      });
    }
  }, [storageCluster, mcgPerformanceProfile, dispatch]);

  return (
    <div className="multicloud-object-gateway-section configure-performance-profile__section pf-v6-u-mb-2xl">
      <Content component={ContentVariants.h3} className="pf-v6-u-mb-sm">
        {t('Multicloud Object Gateway')}
      </Content>
      <Content
        component={ContentVariants.small}
        id="mcg-performance-desc"
        className="pf-v6-u-mb-xl"
      >
        {t(
          'Optimize Multicloud Object Gateway resource usage for object workload patterns. These settings do not affect Block, File, or RADOS Gateway.'
        )}
      </Content>
      <SingleSelectDropdown
        aria-label={t(
          'Select a Multicloud Object Gateway profile from the list'
        )}
        selectedKey={mcgPerformanceProfile}
        id="mcg-performance-profile"
        className="odf-configure-performance__selector pf-v6-u-mb-md"
        selectOptions={selectOptions(t, clusterCpu, clusterMemoryGiB)}
        onChange={onProfileChange}
      />
      {mcgProfileRequirements && (
        <InlineResourceRequirementsText
          id="mcg-resource-requirements"
          minCpu={mcgProfileRequirements.minCpu}
          minMem={mcgProfileRequirements.minMem}
          clusterCpu={clusterCpu}
          clusterMemoryGiB={clusterMemoryGiB}
        />
      )}
    </div>
  );
};
