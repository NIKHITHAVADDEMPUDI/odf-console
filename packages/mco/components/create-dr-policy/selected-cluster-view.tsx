import * as React from 'react';
import { parseNamespaceName } from '@odf/mco/utils';
import { getName } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import {
  Text,
  Badge,
  TextContent,
  TextVariants,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { ManagedClusterInfoType } from './utils/reducer';
import './create-dr-policy.scss';

type SelectedClusterViewProps = {
  index: number;
  cluster: ManagedClusterInfoType;
};

export const SelectedClusterView: React.FC<SelectedClusterViewProps> = ({
  index,
  cluster,
}) => {
  const { t } = useCustomTranslation();
  const { region, odfInfo } = cluster;
  const [storageSystemName] = parseNamespaceName(
    odfInfo.storageClusterInfo.storageSystemNamespacedName
  );
  return (
    <Flex
      display={{ default: 'inlineFlex' }}
      className="mco-create-data-policy__flex"
    >
      <FlexItem>
        <Badge key={index} isRead>
          {index}
        </Badge>
      </FlexItem>
      <FlexItem>
        <TextContent>
          <Text component={TextVariants.p}>{getName(cluster)}</Text>
          {!!storageSystemName ? (
            <>
              <Text component={TextVariants.small}>{region}</Text>
              <Text component={TextVariants.small}>{storageSystemName}</Text>
            </>
          ) : (
            <Text component={TextVariants.small}>
              {t('Information unavailable')}
            </Text>
          )}
        </TextContent>
      </FlexItem>
    </Flex>
  );
};
