import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  limit,
  offset,
  onPageChange,
  className = '',
}) => {
  if (total <= limit && offset === 0) {
    return (
      <div className={`flex items-center justify-between text-xs text-slate-400 py-3 ${className}`}>
        <span>Showing all {total} records</span>
      </div>
    );
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total > 0 ? offset + 1 : 0;
  const endItem = Math.min(offset + limit, total);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 py-3 border-t border-slate-800 ${className}`}>
      <div className="font-mono">
        Showing <span className="text-slate-200 font-semibold">{startItem}</span> to{' '}
        <span className="text-slate-200 font-semibold">{endItem}</span> of{' '}
        <span className="text-slate-200 font-semibold">{total}</span> total
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={!canPrev}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={() => onPageChange(offset + limit)}
          disabled={!canNext}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
