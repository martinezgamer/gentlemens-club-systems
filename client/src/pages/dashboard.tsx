import React from 'react';
import { DashboardWidgets } from '@/components/dashboard/dashboard-widgets';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/header';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <Header title="Dashboard" />
      <div className="container mx-auto px-4 py-6">
        <DashboardWidgets />
      </div>
    </>
  );
}