import SettingsClient from "@/app/(dashboard)/settings/settings-client";
import { Suspense } from "react";
import PageLoading from "@/components/layout/PageLoading";

// export const unstable_instant = { prefetch: 'static' };

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoading loading={true} error={null} message="Initializing preferences..." />}>
      <SettingsClient />
    </Suspense>
  );
}
