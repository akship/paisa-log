import PortfolioClient from "@/app/(dashboard)/portfolio/portfolio-client";
import { Suspense } from "react";
import PageLoading from "@/components/layout/PageLoading";

// export const unstable_instant = { prefetch: 'static' };

export default function PortfolioPage() {
  return (
    <Suspense fallback={<PageLoading loading={true} error={null} message="Loading portfolio..." />}>
      <PortfolioClient />
    </Suspense>
  );
}
