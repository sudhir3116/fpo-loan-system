import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import './DataTable.css';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  onRowClick,
  pagination,
  keyExtractor = (item, index) => item._id || item.id || index,
  className = '',
}) => {
  const { t } = useTranslation();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const resolvedEmptyTitle = emptyTitle || t('emptyState.defaultTitle');
  const resolvedEmptyDescription = emptyDescription || t('emptyState.defaultDesc');

  const handleSort = (colKey) => {
    if (sortColumn === colKey) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
  }, [data, sortColumn, sortDirection]);

  return (
    <div className={`data-table-card glass-panel ${className}`}>
      <div className="table-responsive-wrapper">
        <table className="custom-data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.header}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className={col.sortable ? 'sortable-header' : ''}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="header-cell-content" style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="sort-icon-wrapper">
                        {sortColumn === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={13} className="active-sort" />
                          ) : (
                            <ArrowDown size={13} className="active-sort" />
                          )
                        ) : (
                          <ArrowUpDown size={13} className="inactive-sort" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="table-loading-cell">
                  <LoadingSpinner message={t('common.loading')} />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty-cell">
                  <EmptyState
                    icon={emptyIcon}
                    title={resolvedEmptyTitle}
                    description={resolvedEmptyDescription}
                  />
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key || col.header}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render ? col.render(item, index) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
};

export default DataTable;
