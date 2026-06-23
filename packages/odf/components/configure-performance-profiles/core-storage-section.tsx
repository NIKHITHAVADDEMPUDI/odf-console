import * as React from 'react';
import ConfigurePerformance from '@odf/core/components/create-storage-system/create-storage-system-steps/capacity-and-nodes-step/configure-performance';
import { labelNodes } from '@odf/core/components/create-storage-system/payloads';
import { WizardNodeState } from '@odf/core/components/create-storage-system/reducer';
import { getTotalCpu, getTotalMemoryInGiB } from '@odf/core/components/utils';
import { ResourceProfile } from '@odf/core/types';
import { getOsdAmount } from '@odf/core/utils';
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

type SubmitCoreStorageProfileParams = {
  storageCluster: StorageClusterKind;
  resourceProfile: ResourceProfile | null;
  nodes: WizardNodeState[];
};

export const submitCoreStorageProfile = async ({
  storageCluster,
  resourceProfile,
  nodes,
}: SubmitCoreStorageProfileParams): Promise<void> => {
  if (isCoreStorageSaveDisabled(resourceProfile)) {
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
  const { resourceProfile } = state;

  const osdAmount = storageCluster?.spec?.storageDeviceSets?.reduce(
    (total, deviceSet: DeviceSet) =>
      total + getOsdAmount(deviceSet.count, deviceSet.replica),
    0
  );
  const enableNFS = storageCluster?.spec?.nfs?.enable || false;
  const clusterCpu = getTotalCpu(clusterNodes);
  const clusterMemoryGiB = getTotalMemoryInGiB(clusterNodes);

  const onProfileChange = React.useCallback(
    (newProfile: ResourceProfile): void => {
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_RESOURCE_PROFILE,
        payload: newProfile,
      });
    },
    [dispatch]
  );

  React.useEffect(() => {
    if (storageCluster && !resourceProfile) {
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_RESOURCE_PROFILE,
        payload: storageCluster.spec?.resourceProfile,
      });
    }
  }, [storageCluster, resourceProfile, dispatch]);

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
        <Trans t={t}>
          Optimize CPU and memory allocation for Block, File, and RADOS Gateway
          services and storage performance. Available nodes can be added to the
          storage cluster to add additional resources. Learn more about{' '}
          <ExternalLink href={scalingStorageDoc(DOC_VERSION)}>
            scaling storage
          </ExternalLink>{' '}
          for more cluster resources.
        </Trans>
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
        disableUnsupportedProfiles
      />
    </div>
  );
};
