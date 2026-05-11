import React, { Suspense } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import PageLoading from "@/components/layout/PageLoading";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <Suspense fallback={<PageLoading loading={true} error={null} message="Initializing workspace..." />}>
        {children}
      </Suspense>
    </DashboardShell>
  );
}
