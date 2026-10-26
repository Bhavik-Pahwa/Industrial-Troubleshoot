import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { AssetsListPage } from '../features/assets/pages/AssetsListPage';
import { AssetDetailPage } from '../features/assets/pages/AssetDetailPage';
import { IncidentsListPage } from '../features/incidents/pages/IncidentsListPage';
import { IncidentDetailPage } from '../features/incidents/pages/IncidentDetailPage';
import { SystemStatusPage } from '../features/system/pages/SystemStatusPage';
import { IngestionToolPage } from '../features/ingestion/pages/IngestionToolPage';
import { NotFoundPage } from '../components/layout/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'assets',
        element: <AssetsListPage />,
      },
      {
        path: 'assets/:assetId',
        element: <AssetDetailPage />,
      },
      {
        path: 'incidents',
        element: <IncidentsListPage />,
      },
      {
        path: 'incidents/:incidentId',
        element: <IncidentDetailPage />,
      },
      {
        path: 'system',
        element: <SystemStatusPage />,
      },
      {
        path: 'ingest',
        element: <IngestionToolPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

