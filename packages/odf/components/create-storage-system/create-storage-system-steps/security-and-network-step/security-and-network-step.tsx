import * as React from 'react';
import { StorageClassWizardStepExtensionProps as ExternalStorage } from '@odf/odf-plugin-sdk/extensions';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk-internal/lib/extensions/console-types';
import { Form } from '@patternfly/react-core';
import { NetworkType, NADSelectorType } from '../../../../types';
import { WizardDispatch, WizardState } from '../../reducer';
import { ConnectionDetails } from '../connection-details-step';
import { NetworkFormGroup } from './configure';
import { Encryption } from './encryption';

export const SecurityAndNetwork: React.FC<SecurityAndNetworkProps> = ({
  securityAndNetworkState,
  dispatch,
  infraType,
  isExternal,
  connectionDetailState,
  externalStorage,
  supportedExternalStorage,
  systemNamespace,
}) => {
  const {
    networkType: nwType,
    clusterNetwork,
    publicNetwork,
    encryption,
    kms,
    addressRanges: {
      cluster: [cephClusterCIDR],
      public: [cephPublicCIDR],
    },
  } = securityAndNetworkState;

  const setNetworkType = (networkType: NetworkType) => {
    dispatch({
      type: 'securityAndNetwork/setNetworkType',
      payload: networkType,
    });
    if (
      networkType === NetworkType.DEFAULT ||
      networkType === NetworkType.HOST
    ) {
      dispatch({ type: 'securityAndNetwork/setClusterNetwork', payload: null });
      dispatch({ type: 'securityAndNetwork/setPublicNetwork', payload: null });
    }
  };

  const setMultusNetwork = React.useCallback(
    (network: NADSelectorType, resource: K8sResourceCommon) =>
      dispatch({
        type:
          network === NADSelectorType.CLUSTER
            ? 'securityAndNetwork/setClusterNetwork'
            : 'securityAndNetwork/setPublicNetwork',
        payload: resource,
      }),
    [dispatch]
  );

  const setCIDRNetwork = React.useCallback(
    (clusterCIDR: string, publicCIDR: string) => {
      dispatch({
        type: 'securityAndNetwork/setCephCIDR',
        payload: [clusterCIDR],
      });
      dispatch({
        type: 'securityAndNetwork/setPublicCIDR',
        payload: [publicCIDR],
      });
    },
    [dispatch]
  );

  return (
    <Form noValidate={false}>
      <Encryption
        encryption={encryption}
        kms={kms}
        dispatch={dispatch}
        infraType={infraType}
        isExternal={isExternal}
        systemNamespace={systemNamespace}
      />
      {!isExternal && (
        <NetworkFormGroup
          networkType={nwType}
          setNetworkType={setNetworkType}
          setMultusNetwork={setMultusNetwork}
          setCIDRNetwork={setCIDRNetwork}
          cephPublicCIDR={cephPublicCIDR}
          cephClusterCIDR={cephClusterCIDR}
          clusterNetwork={clusterNetwork}
          publicNetwork={publicNetwork}
          systemNamespace={systemNamespace}
        />
      )}
      {isExternal && (
        <ConnectionDetails
          state={connectionDetailState}
          dispatch={dispatch}
          externalStorage={externalStorage}
          supportedExternalStorage={supportedExternalStorage}
        />
      )}
    </Form>
  );
};

type SecurityAndNetworkProps = {
  securityAndNetworkState: WizardState['securityAndNetwork'];
  dispatch: WizardDispatch;
  infraType: string;
  isExternal?: boolean;
  connectionDetailState?: WizardState['connectionDetails'];
  externalStorage?: WizardState['backingStorage']['externalStorage'];
  supportedExternalStorage?: ExternalStorage[];
  systemNamespace: WizardState['backingStorage']['systemNamespace'];
};
