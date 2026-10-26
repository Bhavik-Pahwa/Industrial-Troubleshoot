import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AssetDetailPage } from '../features/assets/pages/AssetDetailPage';
import { apiClient } from '../api/client';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('keeps history query stable across renders and validates empty custom dates without crashing', async () => {
  apiClient.setMode('mock');
  const history = vi.spyOn(apiClient, 'getTelemetryHistory').mockResolvedValue({ items: [], total: 0, limit: 200, offset: 0 });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = () => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/assets/pump-101']}>
        <Routes><Route path="/assets/:assetId" element={<AssetDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  const { rerender } = render(view());
  await screen.findByText('No Telemetry in Selected Range');
  expect(history).toHaveBeenCalledTimes(1);
  rerender(view());
  fireEvent.change(screen.getByLabelText('Start (UTC)'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply Range' }));
  await screen.findByText('Start timestamp is invalid');
  await waitFor(() => expect(history).toHaveBeenCalledTimes(1));
  client.clear();
});
