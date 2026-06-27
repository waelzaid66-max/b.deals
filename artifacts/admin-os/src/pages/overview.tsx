import { useGetAdminOverview, getGetAdminOverviewQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OverviewPage() {
  const { data: overviewResp, isLoading } = useGetAdminOverview();
  const overview = overviewResp?.data;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Users", value: overview?.total_users ?? 0 },
    { label: "Active Listings", value: overview?.active_listings ?? 0 },
    { label: "Moderation Queue", value: overview?.moderation_queue_count ?? 0, highlight: true },
    { label: "Open Reports", value: overview?.open_reports ?? 0, highlight: true },
    { label: "Open Tickets", value: overview?.open_tickets ?? 0 },
    { label: "Active Alerts", value: overview?.active_alerts ?? 0, highlight: true },
    { label: "Fraud Signals", value: overview?.fraud_signals ?? 0, highlight: true },
    { label: "Revenue MTD", value: overview?.revenue_mtd ?? "EGP 0" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">Platform command dashboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className={kpi.highlight && (kpi.value as number) > 0 ? "border-primary/50 bg-primary/5" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
