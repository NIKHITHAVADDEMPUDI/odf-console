import * as React from 'react';
import ConfigurePerformance from '@odf/core/components/create-storage-system/create-storage-system-steps/capacity-and-nodes-step/configure-performance';
import { labelNodes } from '@odf/core/components/create-storage-system/payloads';
import { WizardNodeState } from '@odf/core/components/create-storage-system/reducer';
import { getTotalCpu, getTotalMemoryInGiB } from '@odf/core/components/utils';
import { ValidationMessage } from '@odf/core/components/utils/common-odf-install-el';
import { ResourceProfile, ValidationType } from '@odf/core/types';
import {
  getNodeArchitectureFromState,
  getOsdAmount,
  isResourceProfileAllowed,
} from '@odf/core/utils';
import { StorageClusterKind, StorageClusterModel } from '@odf/shared';
import { scalingStorageDoc } from '@odf/shared/constants/doc';
import { DOC_VERSION } from '@odf/shared/hooks';
import { getNamespace } from '@odf/shared/selectors';
import { DeviceSet } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { ExternalLink } from '@odf/shared/utils';
import { k8sPatch, Patch } from '@openshift-console/dynamic-plugin-sdk';
import { Trans } from 'react-i18next';
import { Content, ContentVariants } from '@patternfly/react-core';
import '../create-storage-system/create-storage-system-steps/capacity-and-nodes-step/configure-performance.scss';
import {
  ConfigurePerformanceProfileAction,
  ConfigurePerformanceProfileActionType,
  ConfigurePerformanceProfileFormState,
} from './state';
import { isCoreStorageSaveDisabled } from './utils';

const getValidation = (
  profile: ResourceProfile,
  nodes: WizardNodeState[],
  osdAmount: number,
  enableNFS?: boolean
): ValidationType => {
  if (!profile) {
    return null;
  }
  const architecture = getNodeArchitectureFromState(nodes);

  return isResourceProfileAllowed(
    profile,
    getTotalCpu(nodes),
    getTotalMemoryInGiB(nodes),
    osdAmount,
    architecture,
    enableNFS
  )
    ? null
    : ValidationType.RESOURCE_PROFILE;
};

type SubmitCoreStorageProfileParams = {
  storageCluster: StorageClusterKind;
  resourceProfile: ResourceProfile | null;
  validation: ValidationType | null;
  nodes: WizardNodeState[];
};

export const submitCoreStorageProfile = async ({
  storageCluster,
  resourceProfile,
  validation,
  nodes,
}: SubmitCoreStorageProfileParams): Promise<void> => {
  if (isCoreStorageSaveDisabled(resourceProfile, validation)) {
    return;
  }
  await labelNodes(nodes, getNamespace(storageCluster));
  const patch: Patch = {
    op: 'replace',
    path: '/spec/resourceProfile',
    value: resourceProfile,
  };
  await k8sPatch({
    model: StorageClusterModel,
    resource: storageCluster,
    data: [patch],
  });
};

type CoreStorageSectionProps = {
  state: ConfigurePerformanceProfileFormState;
  dispatch: React.Dispatch<ConfigurePerformanceProfileAction>;
  storageCluster: StorageClusterKind;
  clusterNodes: WizardNodeState[];
};

export const CoreStorageSection: React.FC<CoreStorageSectionProps> = ({
  state,
  dispatch,
  storageCluster,
  clusterNodes,
}) => {
  const { t } = useCustomTranslation();
  const { resourceProfile, validation } = state;

  const osdAmount = storageCluster?.spec?.storageDeviceSets
    ?.map((deviceSet: DeviceSet) =>
      getOsdAmount(deviceSet.count, deviceSet.replica)
    )
    .reduce((accumulator: number, current: number) => accumulator + current, 0);
  const architecture = getNodeArchitectureFromState(clusterNodes);
  const enableNFS = storageCluster?.spec?.nfs?.enable || false;
  const clusterCpu = getTotalCpu(clusterNodes);
  const clusterMemoryGiB = getTotalMemoryInGiB(clusterNodes);

  const onProfileChange = React.useCallback(
    (newProfile: ResourceProfile): void => {
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_RESOURCE_PROFILE,
        payload: newProfile,
      });
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_VALIDATION,
        payload: getValidation(newProfile, clusterNodes, osdAmount, enableNFS),
      });
    },
    [clusterNodes, dispatch, enableNFS, osdAmount]
  );

  React.useEffect(() => {
    if (storageCluster && !resourceProfile) {
      const profile = storageCluster.spec?.resourceProfile;
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_RESOURCE_PROFILE,
        payload: profile,
      });
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_VALIDATION,
        payload: getValidation(profile, clusterNodes, osdAmount, enableNFS),
      });
    }
  }, [
    storageCluster,
    resourceProfile,
    clusterNodes,
    osdAmount,
    enableNFS,
    dispatch,
  ]);

  React.useEffect(() => {
    if (resourceProfile && clusterNodes.length) {
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_VALIDATION,
        payload: getValidation(
          resourceProfile,
          clusterNodes,
          osdAmount,
          enableNFS
        ),
      });
    }
  }, [clusterNodes, resourceProfile, osdAmount, enableNFS, dispatch]);

  return (
    <div className="core-storage-section configure-performance-profile__section pf-v6-u-mb-2xl">
      <Content component={ContentVariants.h3} className="pf-v6-u-mb-sm">
        {t('Core storage')}
      </Content>
      <Content
        component={ContentVariants.small}
        id="core-storage-desc"
        className="pf-v6-u-mb-xl"
      >
        <Trans
          t={t}
          ns="plugin__odf-console"
          i18nKey="Optimize CPU and memory allocation for Block, File, and RADOS Gateway services and storage performance. Available nodes can be added to the storage cluster to add additional resources. Learn more about <0>scaling storage</0> for more cluster resources."
          components={[
            <ExternalLink
              key="scaling-storage-doc"
              href={scalingStorageDoc(DOC_VERSION)}
            />,
          ]}
        />
      </Content>
      <ConfigurePerformance
        onResourceProfileChange={onProfileChange}
        resourceProfile={resourceProfile}
        showDescription={false}
        profileRequirementsVariant="inline"
        clusterCpu={clusterCpu}
        clusterMemoryGiB={clusterMemoryGiB}
        selectedNodes={clusterNodes}
        osdAmount={osdAmount}
        enableNFS={enableNFS}
      />
      {validation && (
        <ValidationMessage
          resourceProfile={resourceProfile}
          osdAmount={osdAmount}
          key={validation}
          validation={validation}
          className="pf-v6-u-mt-md"
          architecture={architecture}
          enableNFS={enableNFS}
        />
      )}
    </div>
  );
};
