import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useQueryClient } from '@tanstack/react-query';

export const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const location = useLocation();

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/dashboard') {
      return { title: 'Operations Overview', subtitle: 'Live asset telemetry, incident queue, and system health status' };
    }
    if (path.startsWith('/assets/')) {
      return { title: 'Asset Detail & Telemetry', subtitle: 'Historical sensor time-series, latest readings, and hardware telemetry' };
    }
    if (path === '/assets') {
      return { title: 'Asset Inventory', subtitle: 'Monitored equipment, running status, and physical location' };
    }
    if (path.startsWith('/incidents/')) {
      return { title: 'Incident Detail & Triage', subtitle: 'Diagnostic telemetry evidence, anomaly classification, and resolution workflow' };
    }
    if (path === '/incidents') {
      return { title: 'Incident Queue', subtitle: 'Detected operational anomalies and threshold excursions' };
    }
    if (path === '/system') {
      return { title: 'System Status & Infrastructure', subtitle: 'API process reachability and backend component health' };
    }
    if (path === '/ingest') {
      return { title: 'Telemetry Ingest Simulator', subtitle: 'Batch ingestion tool conforming to POST /telemetry/ingest' };
    }
    return { title: 'Operations Dashboard', subtitle: 'Local-first industrial monitoring interface' };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries();
    setLastRefreshed(new Date());
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const pageInfo = getPageInfo();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0D14]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-xs h-full bg-[#0D131F]">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          lastRefreshTime={lastRefreshed}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
