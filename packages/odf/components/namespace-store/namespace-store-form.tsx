import * as React from 'react';
import NamespaceSafetyBox from '@odf/core/components/utils/safety-box';
import { useSafeK8sList } from '@odf/core/hooks';
import { NooBaaNamespaceStoreModel } from '@odf/shared';
import { formSettings } from '@odf/shared/constants';
import { fieldRequirementsTranslations } from '@odf/shared/constants';
import ResourceDropdown from '@odf/shared/dropdown/ResourceDropdown';
import StaticDropdown from '@odf/shared/dropdown/StaticDropdown';
import { FormGroupController } from '@odf/shared/form-group-controller';
import { ButtonBar } from '@odf/shared/generic/ButtonBar';
import { TextInputWithFieldRequirements } from '@odf/shared/input-with-requirements';
import { PersistentVolumeClaimModel, SecretModel } from '@odf/shared/models';
import { getName } from '@odf/shared/selectors';
import { PersistentVolumeClaimKind, SecretKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import validationRegEx from '@odf/shared/utils/validation';
import { useYupValidationResolver } from '@odf/shared/yup-validation-resolver';
import {
  getAPIVersionForModel,
  k8sCreate,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
  TextInput,
} from '@patternfly/react-core';
import {
  StoreProviders,
  NOOBAA_TYPE_MAP,
  PROVIDERS_NOOBAA_MAP,
  BUCKET_LABEL_NOOBAA_MAP,
  StoreType,
  providerSchema,
} from '../../constants';
import { NamespaceStoreKind } from '../../types';
import {
  getExternalProviders,
  getProviders,
  secretPayloadCreator,
} from '../../utils';
import { S3EndPointType } from '../mcg-endpoints/s3-endpoint-type';
import {
  initialState,
  providerDataReducer,
  ProviderDataState,
  StoreAction,
} from './reducer';
import '../../style.scss';
import '../mcg-endpoints/noobaa-provider-endpoints.scss';

const PROVIDERS = getProviders(StoreType.NS);
const externalProviders = getExternalProviders(StoreType.NS);

type Payload = K8sResourceCommon & {
  spec: {
    type: string;
    [key: string]: any;
  };
};

type NamespaceStoreFormProps = {
  redirectHandler: (resources?: (NamespaceStoreKind | SecretKind)[]) => void;
  namespace: string;
  className?: string;
  onCancel: () => void;
};

const createSecret = async (
  dataSourceName: string,
  namespace: string,
  provider: StoreProviders,
  providerDataState: ProviderDataState,
  providerDataDispatch: React.Dispatch<StoreAction>
) => {
  const { secretKey, accessKey } = providerDataState;
  let createdSecret: SecretKind;
  let secretName = dataSourceName.concat('-secret');
  const secretPayload = secretPayloadCreator(
    provider,
    namespace,
    secretName,
    accessKey,
    secretKey
  );
  try {
    createdSecret = (await k8sCreate({
      model: SecretModel,
      data: secretPayload,
    })) as SecretKind;
  } catch {
    secretName = dataSourceName.concat('-');
    const newSecretPayload = {
      ...secretPayload,
      metadata: {
        generateName: secretName,
        namespace: secretPayload.metadata.namespace,
      },
    };
    createdSecret = (await k8sCreate({
      model: SecretModel,
      data: newSecretPayload,
    })) as SecretKind;
  } finally {
    secretName = createdSecret?.metadata?.name;
    providerDataDispatch({ type: 'setSecretName', value: secretName });
  }
  return secretName;
};

const NamespaceStoreForm: React.FC<NamespaceStoreFormProps> = (props) => {
  const { t } = useCustomTranslation();
  const [providerDataState, providerDataDispatch] = React.useReducer(
    providerDataReducer,
    initialState
  );

  const [inProgress, setProgress] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showSecret, setShowSecret] = React.useState(true);

  const { onCancel, className, redirectHandler, namespace } = props;

  const [data, loaded, loadError] = useSafeK8sList<NamespaceStoreKind>(
    NooBaaNamespaceStoreModel,
    namespace
  );

  const { schema, fieldRequirements } = React.useMemo(() => {
    const existingNames =
      loaded && !loadError ? data?.map((dataItem) => getName(dataItem)) : [];

    const fieldRequirements = [
      fieldRequirementsTranslations.maxChars(t, 43),
      fieldRequirementsTranslations.startAndEndName(t),
      fieldRequirementsTranslations.alphaNumericPeriodAdnHyphen(t),
      fieldRequirementsTranslations.uniqueName(t, 'NamespaceStore'),
    ];

    const baseSchema = Yup.object({
      'ns-name': Yup.string()
        .required()
        .max(43, fieldRequirements[0])
        .matches(
          validationRegEx.startAndEndsWithAlphanumerics,
          fieldRequirements[1]
        )
        .matches(
          validationRegEx.alphaNumericsPeriodsHyphensNonConsecutive,
          fieldRequirements[2]
        )
        .test(
          'unique-name',
          fieldRequirements[3],
          (value: string) => !existingNames.includes(value)
        ),
    });

    const schema = baseSchema.concat(providerSchema(showSecret));

    return { schema, fieldRequirements };
  }, [data, loadError, loaded, showSecret, t]);

  const resolver = useYupValidationResolver(schema);
  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid, isSubmitted },
  } = useForm({
    ...formSettings,
    resolver,
  });

  const provider = watch('provider-name');

  const onSubmit = async (values, event) => {
    event.preventDefault();
    setProgress(true);
    try {
      const nsName = values['ns-name'];
      const pvc = values['pvc-name'];
      const folderName = values['folder-name'];
      let { secretName } = providerDataState;
      if (!secretName) {
        /** Create a secret if secret ==='' */
        secretName = await createSecret(
          nsName,
          namespace,
          provider,
          providerDataState,
          providerDataDispatch
        );
      }
      /** Payload for nss */
      const nssPayload: Payload = {
        apiVersion: getAPIVersionForModel(NooBaaNamespaceStoreModel as any),
        kind: NooBaaNamespaceStoreModel.kind,
        metadata: {
          namespace,
          name: nsName,
        },
        spec: {
          type: NOOBAA_TYPE_MAP[provider],
        },
      };
      if (externalProviders.includes(provider)) {
        nssPayload.spec = {
          ...nssPayload.spec,
          [PROVIDERS_NOOBAA_MAP[provider]]: {
            [BUCKET_LABEL_NOOBAA_MAP[provider]]: providerDataState.target,
            secret: {
              name: secretName,
              namespace,
            },
          },
        };
      }
      switch (provider) {
        case StoreProviders.S3:
          nssPayload.spec.s3Compatible = {
            ...nssPayload.spec.s3Compatible,
            endpoint: providerDataState.endpoint,
          };
          break;
        case StoreProviders.IBM:
          nssPayload.spec.ibmCos = {
            ...nssPayload.spec.ibmCos,
            endpoint: providerDataState.endpoint,
          };
          break;
        case StoreProviders.AWS:
          nssPayload.spec.awsS3 = {
            ...nssPayload.spec.awsS3,
            region: providerDataState.region,
          };
          break;
        case StoreProviders.FILESYSTEM:
          nssPayload.spec.nsfs = {
            ...nssPayload.spec.nsfs,
            pvcName: getName(pvc),
            subPath: folderName,
          };
          break;
      }

      const resources = await k8sCreate({
        model: NooBaaNamespaceStoreModel,
        data: nssPayload,
      });
      redirectHandler([resources]);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setProgress(false);
    }
  };

  return (
    <NamespaceSafetyBox>
      <Form
        className={classNames(
          'nb-endpoints-form',
          'odf-m-pane__body',
          className
        )}
        onSubmit={handleSubmit(onSubmit)}
        noValidate={false}
      >
        <TextInputWithFieldRequirements
          control={control}
          fieldRequirements={fieldRequirements}
          popoverProps={{
            headerContent: t('Name requirements'),
            footerContent: `${t('Example')}: my-namespacestore`,
          }}
          formGroupProps={{
            label: t('Namespace store name'),
            fieldId: 'namespacestore-name',
            className: 'nb-endpoints-form-entry',
            isRequired: true,
          }}
          textInputProps={{
            id: 'ns-name',
            name: 'ns-name',
            'data-test': 'namespacestore-name',
            placeholder: 'my-namespacestore',
          }}
        />

        <FormGroupController
          name="provider-name"
          control={control}
          defaultValue={StoreProviders.AWS}
          formGroupProps={{
            label: t('Provider'),
            fieldId: 'provider-name',
            className: 'nb-endpoints-form-entry',
            isRequired: true,
          }}
          render={({ value, onChange, onBlur }) => (
            <StaticDropdown
              className="nb-endpoints-form-entry__dropdown"
              onSelect={onChange}
              onBlur={onBlur}
              dropdownItems={PROVIDERS}
              defaultSelection={value}
              data-test="namespacestore-provider"
            />
          )}
        />
        {(provider === StoreProviders.AWS ||
          provider === StoreProviders.S3 ||
          provider === StoreProviders.IBM ||
          provider === StoreProviders.AZURE) && (
          <S3EndPointType
            showSecret={showSecret}
            setShowSecret={setShowSecret}
            control={control}
            type={StoreType.NS}
            provider={provider}
            namespace={namespace}
            state={providerDataState}
            dispatch={providerDataDispatch}
          />
        )}
        {provider === StoreProviders.FILESYSTEM && (
          <>
            <FormGroupController
              name="pvc-name"
              control={control}
              formGroupProps={{
                label: t('Persistent volume claim'),
                fieldId: 'pvc-name',
                className: 'nb-endpoints-form-entry',
                isRequired: true,
              }}
              render={({ onChange, onBlur }) => (
                <ResourceDropdown<PersistentVolumeClaimKind>
                  id="pvc-name"
                  resourceModel={PersistentVolumeClaimModel}
                  resource={{
                    kind: PersistentVolumeClaimModel.kind,
                    isList: true,
                    namespace,
                  }}
                  onSelect={onChange}
                  onBlur={onBlur}
                  filterResource={(pvcObj: PersistentVolumeClaimKind) =>
                    pvcObj?.status?.phase === 'Bound' &&
                    pvcObj?.spec?.accessModes.some(
                      (mode) => mode === 'ReadWriteMany'
                    )
                  }
                />
              )}
            />
            <FormGroupController
              name="folder-name"
              control={control}
              formGroupProps={{
                label: t('Folder'),
                fieldId: 'folder-name',
                helperText: t(
                  'If the name you write exists, we will be using the existing folder if not we will create a new folder '
                ),
                className: 'nb-endpoints-form-entry',
                isRequired: true,
              }}
              render={({ value, onChange, onBlur }) => (
                <TextInput
                  id="folder-name"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                  data-test="folder-name"
                  placeholder="Please enter the folder name"
                />
              )}
            />
          </>
        )}
        {!isValid && isSubmitted && (
          <Alert
            variant="danger"
            isInline
            title={t('Address form errors to proceed')}
          />
        )}
        <ButtonBar errorMessage={error} inProgress={inProgress}>
          <ActionGroup>
            <Button
              type="submit"
              data-test="namespacestore-create-button"
              variant="primary"
            >
              {t('Create')}
            </Button>
            <Button onClick={onCancel} variant="secondary">
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </NamespaceSafetyBox>
  );
};

export default NamespaceStoreForm;
