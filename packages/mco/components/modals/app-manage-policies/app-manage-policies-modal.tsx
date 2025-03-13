import * as React from 'react';
import { SearchResultItemType } from '@odf/mco/types';
import { convertSearchResult } from '@odf/mco/utils';
import { getName, getNamespace } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { Trans } from 'react-i18next';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { AppManagePoliciesModalBody } from './app-manage-policies-modal-body';
import { ModalViewContext } from './utils/reducer';

export const AppManagePoliciesModal: React.FC<AppManagePoliciesModalProps> = ({
  resource,
  cluster,
  isOpen,
  close,
}) => {
  const { t } = useCustomTranslation();
  const [currentModalContext, setCurrentModalContext] = React.useState(
    ModalViewContext.MANAGE_POLICY_VIEW
  );

  const application =
    'apigroup' in resource ? convertSearchResult(resource) : resource;
  const applicationName = getName(application) ?? application?.['name'];
  const applicationNamespace =
    getNamespace(application) ?? application?.['namespace'];

  const title =
    currentModalContext === ModalViewContext.ASSIGN_POLICY_VIEW
      ? t('Enroll managed application')
      : t('Manage disaster recovery');

  const description = (
    <Trans t={t}>
      <strong>Application:</strong> {applicationName} (Namespace:{' '}
      {applicationNamespace})
    </Trans>
  );

  return (
    <Modal
      title={title}
      description={description}
      variant={ModalVariant.large}
      isOpen={isOpen}
      aria-label="Manage policy modal"
      aria-describedby="manage-policy-modal"
      onClose={close}
    >
      <AppManagePoliciesModalBody
        application={application}
        cluster={cluster}
        setCurrentModalContext={setCurrentModalContext}
      />
    </Modal>
  );
};

// ACM action custom plugin callback,
// For more: https://github.com/stolostron/console/blob/main/frontend/src/plugin-extensions/properties/actionExtensionProps.ts#L27
type AppManagePoliciesModalProps = {
  resource: K8sResourceCommon | SearchResultItemType;
  isOpen: boolean;
  close: () => void;
  // Specific field for the ACM VM list page
  cluster?: string;
};

export default AppManagePoliciesModal;
