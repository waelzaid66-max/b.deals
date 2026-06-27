import { useGetAdminReports, useResolveReport, getGetAdminReportsQueryKey, getGetAdminOverviewQueryKey } from "@workspace/api-client-react";
import type { ResolveReportBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  reviewing: "default",
  resolved: "secondary",
  dismissed: "outline",
};

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: resp, isLoading } = useGetAdminReports();
  const reports = resp?.data ?? [];
  const resolve = useResolveReport();

  const act = (id: string, status: ResolveReportBodyStatus) => {
    resolve.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminReportsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
          toast({ title: "Report updated", description: `Marked ${status}` });
        },
        onError: () => toast({ title: "Action failed", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">User-submitted reports against listings.</p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : !reports.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No reports.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((r: (typeof reports)[number]) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium truncate max-w-[260px]">{r.listing_title ?? r.listing_id}</div>
                    {r.details ? (
                      <div className="text-xs text-muted-foreground truncate max-w-[260px]">{r.details}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{r.reason?.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>{r.reporter_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status ?? "open"]}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    {r.status === "open" || r.status === "reviewing" ? (
                      <>
                        <Button size="sm" variant="outline" disabled={resolve.isPending}
                          onClick={() => act(r.id!, "resolved")}>
                          <Check className="w-4 h-4 mr-1" /> Resolve
                        </Button>
                        <Button size="sm" variant="ghost" disabled={resolve.isPending}
                          onClick={() => act(r.id!, "dismissed")}>
                          <X className="w-4 h-4 mr-1" /> Dismiss
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {r.resolution_note ?? "Closed"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
