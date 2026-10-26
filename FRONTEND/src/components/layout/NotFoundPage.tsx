import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-6 text-center text-slate-100">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-white">404 — Route Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mt-2">
        The requested URL path does not exist in the INDUX operations dashboard or landing site.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
        <Link
          to="/"
          className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
        >
          Landing Page
        </Link>
      </div>
    </div>
  );
};

