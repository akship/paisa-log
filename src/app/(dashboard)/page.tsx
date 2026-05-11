import DashboardClient from "@/app/(dashboard)/dashboard-client";
import { Suspense } from "react";
import PageLoading from "@/components/layout/PageLoading";

// export const unstable_instant = { prefetch: 'static' };

export default function OverviewPage() {
  return (
    <Suspense fallback={<PageLoading loading={true} error={null} message="Scanning records..." />}>
      <DashboardClient />
    </Suspense>
  );
}
