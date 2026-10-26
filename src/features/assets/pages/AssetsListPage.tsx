import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { queryKeys } from '../../../lib/queryKeys';
import { AssetStatusBadge } from '../../../components/data-display/StatusBadge';
import { Timestamp } from '../../../components/data-display/Timestamp';
import { Pagination } from '../../../components/data-display/Pagination';
import { TableSkeleton } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Cpu, Search, MapPin, ArrowRight, Filter } from 'lucide-react';
import { AssetStatus } from '../../../api/types';

export const AssetsListPage: React.FC = () => {
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    data: assetList,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.assets(limit, offset),
    queryFn: () => apiClient.listAssets(limit, offset),
  });

  // Client-side filtering on current page as specified in PRD 6.2
  const items = assetList?.items || [];
  const filteredItems = items.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-[#0E1524] border border-[#1E293B]">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            Monitored Industrial Assets
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status inventory across all connected plant equipment.
          </p>
        </div>

        {/* Search and local filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search loaded assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-56"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </div>

      {(searchTerm || statusFilter !== 'all') && (
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 px-2">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Note: Filtering the currently loaded page ({filteredItems.length} of {items.length} shown). Server-side total: {assetList?.total ?? 0}.</span>
        </div>
      )}

      {/* Main Table / State */}
      {isLoading && <TableSkeleton rows={6} />}

      {isError && (
        <ErrorState
          title="Could Not Load Assets"
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && filteredItems.length === 0 && (
        <EmptyState
          title={items.length === 0 ? 'No Assets Registered' : 'No Assets Match Your Search'}
          description={
            items.length === 0
              ? 'The backend asset registry currently returns no industrial equipment.'
              : 'Try clearing your search term or status filter.'
          }
          icon={<Cpu className="w-6 h-6" />}
          action={
            (searchTerm || statusFilter !== 'all') ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Clear Filters
              </button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !isError && filteredItems.length > 0 && (
        <div className="rounded-lg bg-[#0E1524] border border-[#1E293B] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141C2E] border-b border-[#1E293B] text-slate-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Asset Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Physical Location</th>
                  <th className="py-3 px-4">Operating Status</th>
                  <th className="py-3 px-4">Last Seen Telemetry</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2438]">
                {filteredItems.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/assets/${asset.id}`}
                        className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors flex items-center gap-1.5"
                      >
                        {asset.name}
                      </Link>
                      <span className="font-mono text-[11px] text-slate-500 block mt-0.5">
                        ID: {asset.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {asset.asset_type}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {asset.location ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{asset.location}</span>
                        </span>
                      ) : (
                        <span className="italic text-slate-600">Unassigned location</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <AssetStatusBadge status={asset.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <Timestamp value={asset.last_seen_at} relative />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/assets/${asset.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-xs font-medium transition-colors"
                      >
                        <span>Telemetry</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {assetList && (
            <div className="px-4 bg-[#0B101B]">
              <Pagination
                total={assetList.total}
                limit={assetList.limit}
                offset={assetList.offset}
                onPageChange={(newOffset) => setOffset(newOffset)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
