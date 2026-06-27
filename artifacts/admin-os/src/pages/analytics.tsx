import { useGetAdminAnalytics } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AnalyticsPage() {
  const { data: resp, isLoading } = useGetAdminAnalytics();
  const a = resp?.data;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { label: "Conversion Rate", value: `${((a?.conversion_rate ?? 0) * 100).toFixed(1)}%` },
    { label: "Total Listings", value: a?.total_listings ?? 0 },
    { label: "Active Listings", value: a?.active_listings ?? 0 },
    { label: "Sold Listings", value: a?.sold_listings ?? 0 },
    { label: "Total Leads", value: a?.total_leads ?? 0 },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Marketplace performance insights.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {kpis.map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Top Categories</h2>
          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Listings</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!a?.top_categories?.length ? (
                  <TableRow><TableCell colSpan={3} className="h-16 text-center text-muted-foreground">No data.</TableCell></TableRow>
                ) : (
                  a.top_categories.map((c: NonNullable<typeof a.top_categories>[number], i: number) => (
                    <TableRow key={i}>
                      <TableCell className="capitalize font-medium">{c.category}</TableCell>
                      <TableCell className="text-right">{c.listing_count}</TableCell>
                      <TableCell className="text-right">{c.lead_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Best Sellers</h2>
          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!a?.best_sellers?.length ? (
                  <TableRow><TableCell colSpan={3} className="h-16 text-center text-muted-foreground">No data.</TableCell></TableRow>
                ) : (
                  a.best_sellers.map((s: NonNullable<typeof a.best_sellers>[number], i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium truncate max-w-[160px]">{s.name}</TableCell>
                      <TableCell className="text-right">{s.sold_count}</TableCell>
                      <TableCell className="text-right">{s.lead_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Trending Listings</h2>
          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!a?.trending_listings?.length ? (
                  <TableRow><TableCell colSpan={3} className="h-16 text-center text-muted-foreground">No data.</TableCell></TableRow>
                ) : (
                  a.trending_listings.map((t: NonNullable<typeof a.trending_listings>[number], i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium truncate max-w-[160px]">{t.title}</TableCell>
                      <TableCell className="text-right">{t.view_count}</TableCell>
                      <TableCell className="text-right">{t.lead_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
