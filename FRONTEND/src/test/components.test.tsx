import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssetStatusBadge, IncidentStatusBadge, SystemStatusBadge } from '../components/data-display/StatusBadge';
import { SeverityBadge } from '../components/data-display/SeverityBadge';
import { Pagination } from '../components/data-display/Pagination';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { InduxApiError } from '../api/errors';

describe('Component Visual & Accessibility Tests (PRD Section 14.2)', () => {
  it('renders status badges with accessible visible text labels', () => {
    const { rerender } = render(<AssetStatusBadge status="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();

    rerender(<AssetStatusBadge status="normal" />);
    expect(screen.getByText('Normal')).toBeInTheDocument();

    rerender(<AssetStatusBadge status="unknown" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders incident severity badges with clear text label', () => {
    const { rerender } = render(<SeverityBadge severity="critical" />);
    expect(screen.getByText(/critical/i)).toBeInTheDocument();

    rerender(<SeverityBadge severity="low" />);
    expect(screen.getByText(/low/i)).toBeInTheDocument();
  });

  it('renders system status badges with correct labels', () => {
    render(<SystemStatusBadge status="healthy" />);
    expect(screen.getByText('System Operational')).toBeInTheDocument();
  });

  it('renders pagination counts and handles single page correctly', () => {
    const onPageChange = () => {};
    const { rerender } = render(
      <Pagination total={75} limit={20} offset={20} onPageChange={onPageChange} />
    );
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();

    rerender(<Pagination total={10} limit={20} offset={0} onPageChange={onPageChange} />);
    expect(screen.getByText('Showing all 10 records')).toBeInTheDocument();
  });

  it('renders empty states with title and description', () => {
    render(
      <EmptyState
        title="No Incidents in Queue"
        description="All industrial equipment operating within nominal parameters."
      />
    );
    expect(screen.getByText('No Incidents in Queue')).toBeInTheDocument();
    expect(
      screen.getByText('All industrial equipment operating within nominal parameters.')
    ).toBeInTheDocument();
  });

  it('renders error state with code and retry affordance', () => {
    const error = new InduxApiError(503, 'SERVICE_UNAVAILABLE', 'Ingestion service unreachable');
    let retried = false;
    render(
      <ErrorState
        title="Ingestion Offline"
        error={error}
        onRetry={() => {
          retried = true;
        }}
      />
    );

    expect(screen.getByText('Ingestion Offline')).toBeInTheDocument();
    expect(screen.getByText('SERVICE_UNAVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('Ingestion service unreachable')).toBeInTheDocument();

    const retryBtn = screen.getByText('Retry Request');
    retryBtn.click();
    expect(retried).toBe(true);
  });
});
