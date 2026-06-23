import * as React from 'react';
import { getStorageClusterBaseRoute } from '@odf/core/constants';
import { PROVIDER_MODE } from '@odf/core/features';
import { useClusterNodes } from '@odf/core/hooks';
import { useODFSystemFlagsSelector } from '@odf/core/redux';
import { useGetExternalClusterDetails } from '@odf/core/redux/utils';
import {
  PageHeading,
  StatusBox,
  StorageClusterKind,
  StorageClusterModel,
} from '@odf/shared';
import { referenceForModel } from '@odf/shared/utils';
import {
  useFlag,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
import { Content, ContentVariants } from '@patternfly/react-core';
import { ConfigurePerformanceProfileFormFooter } from './configure-performance-profile-footer';
import {
  CoreStorageSection,
  submitCoreStorageProfile,
} from './core-storage-section';
import {
  ObjectAccessSection,
  submitObjectAccessProfile,
} from './multicloud-object-gateway-section';
import {
  configurePerformanceProfileReducer,
  ConfigurePerformanceProfileActionType,
  initialConfigurePerformanceProfileState,
} from './state';
import {
  checkRequiredValues,
  isConfigurePerformanceProfileVisible,
  isCoreStorageSectionVisible,
  isCoreStorageSaveDisabled,
  isObjectAccessSaveDisabled,
  isObjectAccessSectionVisible,
} from './utils';
import './configure-performance-profile.scss';

const ConfigurePerformanceProfile: React.FC = () => {
  const { t } = useTranslation();
  const { resourceName, namespace } = useParams();
  const navigate = useNavigate();
  const [state, dispatch] = React.useReducer(
    configurePerformanceProfileReducer,
    initialConfigurePerformanceProfileState
  );

  const isProviderMode = useFlag(PROVIDER_MODE);
  const { systemFlags, areFlagsLoaded, flagsLoadError } =
    useODFSystemFlagsSelector();
  const externalClusterDetails = useGetExternalClusterDetails();
  const hasExternalMode = externalClusterDetails.clusterName !== '';
  const [storageCluster, storageClusterLoaded, storageClusterLoadError] =
    useK8sWatchResource<StorageClusterKind>({
      kind: referenceForModel(StorageClusterModel),
      name: resourceName,
      namespace,
    });

  const visibility = {
    storageCluster,
    hasExternalMode,
    isProviderMode,
    isNoobaaAvailable: !!systemFlags[namespace]?.isNoobaaAvailable,
  };
  const showCoreStorage = isCoreStorageSectionVisible(visibility);
  const showObjectAccess = isObjectAccessSectionVisible(visibility) && false; // will remove false once MCG object access profile is implemented
  const showConfigurePerformance =
    isConfigurePerformanceProfileVisible(visibility);
  const { clusterNodes, nodesLoaded, nodesLoadError } = useClusterNodes();

  const isLoaded =
    areFlagsLoaded && storageClusterLoaded && (!showCoreStorage || nodesLoaded);
  const isLoadError =
    flagsLoadError ||
    storageClusterLoadError ||
    (showCoreStorage && !!nodesLoadError);

  React.useEffect(() => {
    if (!isLoaded || isLoadError || showConfigurePerformance) {
      return;
    }
    navigate(getStorageClusterBaseRoute(namespace, resourceName), {
      replace: true,
    });
  }, [
    isLoaded,
    isLoadError,
    showConfigurePerformance,
    navigate,
    namespace,
    resourceName,
  ]);

  const onClose = () => navigate(-1);

  const onConfirm = async () => {
    if (checkRequiredValues(state, showCoreStorage, showObjectAccess)) {
      return;
    }

    dispatch({
      type: ConfigurePerformanceProfileActionType.SET_ERROR_MESSAGE,
      payload: null,
    });
    dispatch({
      type: ConfigurePerformanceProfileActionType.SET_INPROGRESS,
      payload: true,
    });

    try {
      if (
        showCoreStorage &&
        !isCoreStorageSaveDisabled(state.resourceProfile, state.validation)
      ) {
        await submitCoreStorageProfile({
          storageCluster,
          resourceProfile: state.resourceProfile,
          validation: state.validation,
          nodes: clusterNodes,
        });
      }
      if (showObjectAccess && !isObjectAccessSaveDisabled()) {
        await submitObjectAccessProfile();
      }
      onClose();
    } catch (error) {
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_ERROR_MESSAGE,
        payload: error?.message || t('An unexpected error has occured.'),
      });
    } finally {
      dispatch({
        type: ConfigurePerformanceProfileActionType.SET_INPROGRESS,
        payload: false,
      });
    }
  };

  if (!isLoaded || isLoadError) {
    return (
      <>
        <PageHeading
          title={t('Configure performance profile')}
          hasUnderline={false}
        >
          <Content component={ContentVariants.p} className="pf-v6-u-mt-sm">
            {t(
              'Select a profile to customize the performance of the Data Foundation cluster to meet your requirements.'
            )}
          </Content>
        </PageHeading>
        <div className="pf-v6-u-pb-xl">
          <StatusBox
            loaded={isLoaded}
            loadError={isLoadError}
            label={t('Configure performance profile')}
          />
        </div>
      </>
    );
  }

  if (!showConfigurePerformance) {
    return null;
  }

  return (
    <>
      <PageHeading
        title={t('Configure performance profile')}
        hasUnderline={false}
      >
        <Content component={ContentVariants.p} className="pf-v6-u-mt-sm">
          {t(
            'Select a profile to customize the performance of the Data Foundation cluster to meet your requirements.'
          )}
        </Content>
      </PageHeading>
      <div className="odf-m-pane__body odf-m-pane__form configure-performance-profile__content pf-v6-u-mt-md">
        {showCoreStorage && (
          <CoreStorageSection
            state={state}
            dispatch={dispatch}
            storageCluster={storageCluster}
            clusterNodes={clusterNodes}
          />
        )}
        {showObjectAccess && <ObjectAccessSection />}
      </div>
      <div className="odf-m-pane__body configure-performance-profile__footer">
        <ConfigurePerformanceProfileFormFooter
          state={state}
          showCoreStorage={showCoreStorage}
          showObjectAccess={showObjectAccess}
          cancel={onClose}
          onConfirm={onConfirm}
        />
      </div>
    </>
  );
};

export default ConfigurePerformanceProfile;
