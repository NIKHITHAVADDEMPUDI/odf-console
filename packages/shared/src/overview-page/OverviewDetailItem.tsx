import * as React from 'react';
import classNames from 'classnames';

import './OverviewDetailItem.scss';

export type OverviewDetailItemProps = {
  /** Details card title */
  title: string;
  children: React.ReactNode;
  /** Trigger skeleton loading component during the loading phase. */
  isLoading?: boolean;
  /** Value for a className */
  valueClassName?: string;

  error?: string;
};

export const OverviewDetailItem: React.FC<OverviewDetailItemProps> = ({
  title,
  isLoading = false,
  children,
  error,
  valueClassName,
}) => {
  let status: React.ReactNode;

  if (error) {
    status = (
      <span className="odf-overview-details-card__text-secondary">{error}</span>
    );
  } else if (isLoading) {
    status = <div className="odf-overview-details-card__skeleton-text" />;
  } else {
    status = children;
  }
  return (
    <>
      <dt
        className="odf-overview-details-card__item-title"
        data-test="detail-item-title"
      >
        {title}
      </dt>
      <dd
        className={classNames(
          'odf-overview-details-card__item-value',
          valueClassName
        )}
        data-test="detail-item-value"
      >
        {status}
      </dd>
    </>
  );
};
