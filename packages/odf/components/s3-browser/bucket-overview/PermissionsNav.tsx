import * as React from 'react';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import Tabs, { TabPage } from '@odf/shared/utils/Tabs';
import { PERMISSIONS_ROUTE } from '../../../constants';
import { BucketPolicy } from '../bucket-policy/BucketPolicy';

const CorsList = () => <>CORS</>;

const PermissionsNav = ({ obj }) => {
  const { t } = useCustomTranslation();

  const pages: TabPage[] = React.useMemo(
    () => [
      {
        href: 'policy',
        title: t('Bucket policy'),
        component: BucketPolicy,
      },
      {
        href: 'cors',
        title: t('CORS'),
        component: CorsList,
      },
    ],
    [t]
  );

  return (
    <Tabs
      id="s3-permissions-tab"
      tabs={pages}
      customData={obj}
      basePath={PERMISSIONS_ROUTE}
    />
  );
};

export default PermissionsNav;
