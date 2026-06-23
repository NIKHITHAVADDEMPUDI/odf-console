import { useMemo } from 'react';
import { isConfigurePerformanceProfileVisible } from '@odf/core/components/configure-performance-profiles/utils';
import { LSO_OPERATOR } from '@odf/core/constants';
import AddCapacityModal from '@odf/core/modals/add-capacity/add-capacity-modal';
import CapacityAutoscalingModal from '@odf/core/modals/capacity-autoscaling/capacity-autoscaling-modal';
import { useODFSystemFlagsSelector } from '@odf/core/redux';
import { useGetExternalClusterDetails } from '@odf/core/redux/utils';
import { isCapacityAutoScalingAllowed } from '@odf/core/utils';
import {
  DEFAULT_INFRASTRUCTURE,
  getName,
  getNamespace,
  InfrastructureKind,
  StorageClusterKind,
  useFetchCsv,
  useK8sGet,
  useModalWrapper,
} from '@odf/shared';
import {
  InfrastructureModel,
  ODFStorageSystem,
  StorageClusterModel,
} from '@odf/shared/models';
import { StorageSystemKind } from '@odf/shared/types';
import {
  getInfrastructurePlatform,
  groupVersionFor,
  isCSVSucceeded,
  isOCSStorageSystem,
  referenceFor,
  referenceForModel,
} from '@odf/shared/utils';
import {
  Action,
  useFlag,
  useK8sModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { LaunchModal } from '@openshift-console/dynamic-plugin-sdk/lib/app/modal-support/ModalProvider';
import { PROVIDER_MODE } from '../../features';

export const useCsvActions = ({
  resource,
}: {
  resource: StorageSystemKind;
}) => {
  const { group, version } = groupVersionFor(resource.apiVersion);
  const [k8sModel, inFlight] = useK8sModel(
    referenceFor(group)(version)(resource.kind)
  );
  const launchModal = useModalWrapper();
  const isProviderMode = useFlag(PROVIDER_MODE);
  const { systemFlags } = useODFSystemFlagsSelector();
  const externalClusterDetails = useGetExternalClusterDetails();
  const hasExternalMode = externalClusterDetails.clusterName !== '';
  const [csv, csvLoaded, csvLoadError] = useFetchCsv({
    specName: LSO_OPERATOR,
  });
  const [infrastructure] = useK8sGet<InfrastructureKind>(
    InfrastructureModel,
    DEFAULT_INFRASTRUCTURE
  );
  const [storageCluster] = useK8sWatchResource<StorageClusterKind>({
    kind: referenceForModel(StorageClusterModel),
    name: resource.spec.name,
    namespace: resource.spec.namespace,
  });
  const resourceProfile = storageCluster?.spec?.resourceProfile;
  const isLSOInstalled = csvLoaded && !csvLoadError && isCSVSucceeded(csv);
  const actions = useMemo(() => {
    const items = [];
    if (
      referenceForModel(k8sModel) === referenceForModel(ODFStorageSystem) &&
      isOCSStorageSystem(resource)
    ) {
      items.push(AddCapacityStorageSystem(launchModal, storageCluster));
      if (
        isConfigurePerformanceProfileVisible({
          storageCluster,
          hasExternalMode,
          isProviderMode,
          isNoobaaAvailable:
            !!systemFlags[resource.spec.namespace]?.isNoobaaAvailable,
        })
      ) {
        items.push(ConfigurePerformanceStorageSystem(storageCluster));
      }
      if (
        isCapacityAutoScalingAllowed(
          getInfrastructurePlatform(infrastructure),
          resourceProfile
        )
      ) {
        items.push(CapacityAutoscalingAction(launchModal, storageCluster));
      }
      if (isLSOInstalled) {
        items.push(AttachStorageStorageSystem(resource));
      }
    }
    return items;
  }, [
    k8sModel,
    resource,
    launchModal,
    infrastructure,
    isProviderMode,
    hasExternalMode,
    systemFlags,
    isLSOInstalled,
    resourceProfile,
    storageCluster,
  ]);

  return useMemo(() => [actions, !inFlight, undefined], [actions, inFlight]);
};

const AttachStorageStorageSystem = (resource: StorageSystemKind): Action => {
  return {
    id: 'attach-storage-lso-storage-system',
    label: 'Attach Storage',
    insertBefore: 'add-capacity-storage-system',
    cta: {
      href: `/odf/system/ns/${getNamespace(resource)}/${referenceForModel(
        StorageClusterModel
      )}/${getName(resource)}/~attachstorage`,
      external: false,
    },
  };
};

const AddCapacityStorageSystem = (
  launchModal: LaunchModal,
  storageCluster: StorageClusterKind
): Action => {
  return {
    id: 'add-capacity-storage-system',
    label: 'Add Capacity',
    insertBefore: 'edit-csv',
    cta: () => {
      launchModal(AddCapacityModal, {
        extraProps: { storageCluster },
        isOpen: true,
      });
    },
  };
};

const ConfigurePerformanceStorageSystem = (
  storageCluster: StorageClusterKind
): Action => {
  return {
    id: 'configure-performance-storage-system',
    label: 'Configure performance profiles',
    insertAfter: 'add-capacity-storage-system',
    cta: {
      href: `/odf/system/ns/${getNamespace(storageCluster)}/${referenceForModel(
        StorageClusterModel
      )}/${getName(storageCluster)}/~configureperformanceprofile`,
      external: false,
    },
  };
};

const CapacityAutoscalingAction = (
  launchModal: LaunchModal,
  storageCluster: StorageClusterKind
): Action => {
  return {
    id: 'capacity-autoscaling-action',
    label: 'Automatic capacity scaling',
    insertAfter: 'configure-performance-storage-system',
    cta: () => {
      launchModal(CapacityAutoscalingModal, {
        extraProps: { storageCluster },
        isOpen: true,
      });
    },
  };
};
