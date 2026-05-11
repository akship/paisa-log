import AnalyticsClient from "@/app/(dashboard)/analytics/analytics-client";
import { Suspense } from "react";
import PageLoading from "@/components/layout/PageLoading";

// export const unstable_instant = { prefetch: 'static' };

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageLoading loading={true} error={null} message="Scanning records..." />}>
      <AnalyticsClient />
    </Suspense>
  );
}
