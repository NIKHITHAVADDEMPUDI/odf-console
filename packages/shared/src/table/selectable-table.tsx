import * as React from 'react';
import { StatusBox } from '@odf/shared/generic/status-box';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import {
  Table,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { useSelectList } from '../hooks/select-list';
import { useSortList } from '../hooks/sort-list';
import { getUID } from '../selectors';
import { TableColumnProps, RowComponentType } from './composable-table';

export enum TABLE_VARINAT {
  DEFAULT = 'default',
  COMPACT = 'compact',
}

const hasNoDeletionTimestamp: IsRowSelectable = <T extends K8sResourceCommon>(
  row: T
) => !row?.metadata?.deletionTimestamp;

const areAllRowsSelected = <T extends K8sResourceCommon>(
  selectableRows: T[],
  selectedRows: T[]
) => {
  const selectedRowIds = selectedRows?.map(getUID);
  const selecteableRowsIds = selectableRows.map(getUID);
  return (
    selecteableRowsIds?.length &&
    selecteableRowsIds.every((rowId) => selectedRowIds?.includes(rowId))
  );
};

const isRowSelected = <T extends K8sResourceCommon>(
  rowId: string,
  selectedRows: T[]
) => selectedRows.some((row) => getUID(row) === rowId);

const canApplyInitialSort = (
  columns: TableColumnProps[],
  initialSortIndex: number
): boolean => !!columns[initialSortIndex]?.sortFunction;

export const SelectableTable: SelectableTableProps = <
  T extends K8sResourceCommon
>({
  selectedRows,
  setSelectedRows,
  columns,
  rows,
  RowComponent,
  extraProps,
  isColumnSelectableHidden,
  loaded,
  loadError,
  emptyRowMessage,
  initialSortColumnIndex,
  borders,
  className,
  isRowSelectable,
  variant,
}) => {
  const {
    onSort,
    sortIndex: activeSortIndex,
    sortDirection: activeSortDirection,
    sortedData: sortedRows,
  } = useSortList<T>(
    rows,
    columns,
    false,
    canApplyInitialSort(columns, initialSortColumnIndex)
      ? initialSortColumnIndex
      : -1
  );

  const [selectableRows, rowIds] = React.useMemo(() => {
    const selectableRows =
      sortedRows?.filter(isRowSelectable || hasNoDeletionTimestamp) || [];
    const rowIds = new Set(selectableRows?.map(getUID));
    return [selectableRows, rowIds];
  }, [sortedRows, isRowSelectable]);

  const { onSelect } = useSelectList<T>(
    selectableRows,
    rowIds,
    false,
    setSelectedRows
  );

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: onSort,
    columnIndex,
  });

  return (
    <StatusBox
      loadError={loadError}
      loaded={loaded}
      EmptyMsg={emptyRowMessage}
      data={sortedRows}
      skeleton={<div className="loading-skeleton--table pf-v5-u-mt-lg" />}
    >
      <Table
        className={className}
        translate={null}
        aria-label="Selectable table"
        borders={borders}
        variant={
          variant !== TABLE_VARINAT.DEFAULT ? TABLE_VARINAT.COMPACT : undefined
        }
      >
        <Thead translate={null}>
          <Tr translate={null}>
            <Th
              translate={null}
              {...(!isColumnSelectableHidden
                ? {
                    select: {
                      onSelect: onSelect,
                      isSelected: areAllRowsSelected(
                        selectableRows,
                        selectedRows
                      ),
                    },
                  }
                : {})}
            />
            {columns?.map((col, index) => (
              <Th
                {...(!!col?.thProps ? col.thProps : {})}
                {...(!!col?.sortFunction ? { sort: getSortParams(index) } : {})}
                translate={null}
                key={col?.columnName}
              >
                {col?.columnName}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody translate={null}>
          {sortedRows.map((row, rowIndex) => (
            <Tr translate={null} key={getUID(row)}>
              <Td
                translate={null}
                select={{
                  rowIndex,
                  onSelect: onSelect,
                  isSelected: isRowSelected(getUID(row), selectedRows),
                  isDisabled:
                  (!!isRowSelectable && !isRowSelectable(row)) ||
                  !hasNoDeletionTimestamp(row),
                  props: {
                    id: getUID(row),
                  },
                }}
              />
              <RowComponent row={row} extraProps={extraProps} />
            </Tr>
          ))}
        </Tbody>
      </Table>
    </StatusBox>
  );
};

type IsRowSelectable = <T extends K8sResourceCommon>(row: T) => boolean;

type TableProps<T extends K8sResourceCommon> = {
  rows: T[];
  columns: TableColumnProps[];
  RowComponent: React.ComponentType<RowComponentType<T>>;
  selectedRows: T[];
  setSelectedRows: (selectedRows: T[]) => void;
  extraProps?: any;
  isColumnSelectableHidden?: boolean;
  loaded: boolean;
  loadError?: any;
  emptyRowMessage?: React.FC;
  initialSortColumnIndex?: number;
  /** Render borders */
  borders?: boolean;
  /** Additional classes added to the Table  */
  className?: string;
  isRowSelectable?: IsRowSelectable;
  variant?: TABLE_VARINAT;
};

type SelectableTableProps = <T extends K8sResourceCommon>(
  props: React.PropsWithoutRef<TableProps<T>>
) => ReturnType<React.FC>;
