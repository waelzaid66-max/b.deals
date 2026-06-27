import { useGetModerationQueue, useModerateListing, getGetModerationQueueQueryKey, getGetAdminOverviewQueryKey } from "@workspace/api-client-react";
import type { ModerateListingBodyAction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, X, Flag } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: resp, isLoading } = useGetModerationQueue();
  const items = resp?.data ?? [];
  const moderate = useModerateListing();

  const act = (id: string, action: ModerateListingBodyAction) => {
    moderate.mutate(
      { id, data: { action } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetModerationQueueQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
          toast({ title: "Listing moderated", description: `Action: ${action}` });
        },
        onError: () => toast({ title: "Action failed", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>
        <p className="text-muted-foreground mt-2">Listings awaiting review, flagged, or reported.</p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Reports</TableHead>
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
            ) : !items.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Queue is clear. Nothing to review.
                </TableCell>
              </TableRow>
            ) : (
              items.map((listing: (typeof items)[number]) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="font-medium truncate max-w-[280px]">{listing.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {listing.category} · {listing.price_display}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{listing.seller_name}</div>
                    {listing.seller_shadow_banned ? (
                      <Badge variant="destructive" className="mt-1">Banned seller</Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {listing.report_count ? (
                      <Badge variant="destructive">{listing.report_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={listing.is_flagged ? "destructive" : "secondary"}>
                      {listing.status?.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button size="sm" variant="outline" disabled={moderate.isPending}
                      onClick={() => act(listing.id!, "approve")}>
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" disabled={moderate.isPending}
                      onClick={() => act(listing.id!, "reject")}>
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" variant="ghost" disabled={moderate.isPending}
                      onClick={() => act(listing.id!, listing.is_flagged ? "unflag" : "flag")}>
                      <Flag className="w-4 h-4 mr-1" /> {listing.is_flagged ? "Unflag" : "Flag"}
                    </Button>
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
