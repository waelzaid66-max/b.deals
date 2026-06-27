import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useGetDealerStats, getGetDealerStatsQueryKey,
  listTransactions,
  useGetPromoAdSummary, getGetPromoAdSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useClerk } from "@clerk/react";
import { Loader2, Activity, ListOrdered, Users, Target, TrendingUp, Megaphone, Percent, Gift } from "lucide-react";

const AD_SPEND_TYPES = new Set(["boost_charge", "lead_charge"]);
const PLATFORM_SPEND_TYPES = new Set(["boost_charge", "lead_charge", "subscription_charge"]);
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Ad/platform spend has no BFF aggregate, so derive it from wallet transactions.
// The transactions endpoint caps at 50/page, so paginate the full 30-day window
// (results are newest-first) rather than summing only the first page.
async function fetchSpend30d(): Promise<{ adSpend: number; platformSpend: number }> {
  const since = Date.now() - WINDOW_MS;
  let cursor: string | undefined;
  let adSpend = 0;
  let platformSpend = 0;
  for (let page = 0; page < 20; page++) {
    const res = await listTransactions({ limit: 50, ...(cursor ? { cursor } : {}) });
    const txs = res.data ?? [];
    let reachedOld = false;
    for (const t of txs) {
      if (new Date(t.created_at).getTime() < since) { reachedOld = true; continue; }
      const amt = Math.abs(parseFloat(t.amount) || 0);
      if (AD_SPEND_TYPES.has(t.type)) adSpend += amt;
      if (PLATFORM_SPEND_TYPES.has(t.type)) platformSpend += amt;
    }
    cursor = res.meta?.cursor;
    if (reachedOld || !res.meta?.has_next || !cursor || txs.length === 0) break;
  }
  return { adSpend, platformSpend };
}

function fmtMoney(n: number): string {
  if (!isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const { user } = useClerk();

  const { data: stats, isLoading } = useGetDealerStats({
    query: { enabled: !!user, queryKey: getGetDealerStatsQueryKey() },
  });

  const { data: spendData } = useQuery({
    queryKey: ["dealer-spend-30d"],
    queryFn: fetchSpend30d,
    enabled: !!user,
  });

  const { data: promoResp } = useGetPromoAdSummary({
    query: { enabled: !!user, queryKey: getGetPromoAdSummaryQueryKey() },
  });

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  // Spend is derived over a trailing 30-day window so it lines up with the
  // 30-day lead chart (see fetchSpend30d — paginates the full window).
  const adSpend = spendData?.adSpend ?? 0;
  const platformSpend = spendData?.platformSpend ?? 0;
  const leads30 = (stats?.data?.leads_chart ?? []).reduce((acc, p) => acc + (p.leads ?? 0), 0);
  const costPerLead = leads30 > 0 ? adSpend / leads30 : null;
  const conversionRate = stats?.data?.conversion_rate;

  const promo = promoResp?.data;
  const promoBalance = promo ? Number(promo.balance) : 0;
  const showPromo = !!promo?.campaign_enabled && promoBalance > 0;
  const promoExpiry = promo?.expires_at
    ? new Date(promo.expires_at).toLocaleDateString()
    : null;

  const kpis = [
    { label: "Active Listings", value: stats?.data?.active_listings ?? 0, icon: Activity },
    { label: "Total Views", value: stats?.data?.total_views ?? 0, icon: ListOrdered },
    { label: "Leads Today", value: stats?.data?.leads_today ?? 0, icon: Users },
    { label: "Ad Spend (30d)", value: `${fmtMoney(adSpend)} EGP`, icon: Target },
  ];

  const efficiency = [
    { label: "Ad Spend", value: `${fmtMoney(adSpend)} EGP`, hint: "Boost + lead charges", icon: Megaphone },
    { label: "Platform Spend", value: `${fmtMoney(platformSpend)} EGP`, hint: "Incl. subscription", icon: TrendingUp },
    { label: "Cost / Lead", value: costPerLead != null ? `${fmtMoney(costPerLead)} EGP` : "—", hint: `${leads30} leads (30d)`, icon: Target },
    { label: "Conversion Rate", value: conversionRate ?? "—", hint: "Leads / views", icon: Percent },
  ];

  return (
    <SidebarLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your listings and lead performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <Card key={i} className="bg-card border-card-border" data-testid={`kpi-${kpi.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Spend & Efficiency (last 30 days) — derived from wallet transactions. */}
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Spend &amp; Efficiency <span className="text-sm font-normal text-muted-foreground">· last 30 days</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {efficiency.map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className="rounded-lg border border-border p-4" data-testid={`roi-${m.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{m.label}</span>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-xl font-bold text-foreground mt-2">{m.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m.hint}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {showPromo ? (
          <Card className="bg-card border-card-border" data-testid="card-promo-credit">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {fmtMoney(promoBalance)} EGP
                  </span>
                  <span className="text-sm font-medium text-primary">free ad credit</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Spent automatically before your wallet on any boost.
                  {promoExpiry ? ` Use it before ${promoExpiry} — unused credit expires.` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">30-Day Lead Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full" data-testid="chart-leads">
              {stats?.data?.leads_chart && stats.data.leads_chart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.data.leads_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="#E8002D"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#E8002D', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No chart data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
