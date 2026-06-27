import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import {
  useGetDealerListings,
  getGetDealerListingsQueryKey,
  useBoostListing,
} from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowUpRight, Zap, Star, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AD_TYPE_META = {
  featured: { label: "Featured Listing", desc: "Highlighted placement in search results", icon: Star },
  native_feed: { label: "Native Feed", desc: "Blended placement in buyer discovery feed", icon: Zap },
  top_search: { label: "Top Search Result", desc: "Pinned at the top of relevant searches", icon: Search },
};

export default function AdsPage() {
  const { user } = useClerk();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [boostOpen, setBoostOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adType, setAdType] = useState<"featured" | "native_feed" | "top_search">("featured");
  const [duration, setDuration] = useState("7");

  const { data: listingsData, isLoading } = useGetDealerListings(
    { limit: 100, status: "active" },
    {
      query: {
        enabled: !!user,
        queryKey: getGetDealerListingsQueryKey({ limit: 100, status: "active" }),
      }
    }
  );

  const boostMutation = useBoostListing();

  const listings = listingsData?.data ?? [];

  function openBoost(id: string) {
    setSelectedId(id);
    setAdType("featured");
    setDuration("7");
    setBoostOpen(true);
  }

  function handleBoost() {
    if (!selectedId) return;
    boostMutation.mutate(
      { data: { listing_id: selectedId, ad_type: adType, duration_days: parseInt(duration) } },
      {
        onSuccess: () => {
          toast({ title: "Listing boosted", description: `${AD_TYPE_META[adType].label} for ${duration} days` });
          setBoostOpen(false);
          queryClient.invalidateQueries({ queryKey: getGetDealerListingsQueryKey() });
        },
        onError: () => {
          toast({ title: "Boost failed", variant: "destructive" });
        },
      }
    );
  }

  const selectedListing = listings.find(l => l.id === selectedId);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ads</h1>
          <p className="text-muted-foreground mt-2">Promote your active listings to reach more buyers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(AD_TYPE_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <Card key={key} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="w-4 h-4 text-primary" />
                    {meta.label}
                  </CardTitle>
                  <CardDescription>{meta.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Active Listings — Ready to Boost</CardTitle>
            <CardDescription>Select any active listing to promote it across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : listings.length ? (
              <div className="space-y-2">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                    data-testid={`ad-listing-${listing.id}`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-medium text-sm text-foreground truncate">{listing.title}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{listing.location}</span>
                        <span className="text-xs text-muted-foreground">{listing.price_display}</span>
                        <Badge variant="outline" className="text-xs border-border">
                          {listing.views ?? 0} views
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white flex-shrink-0"
                      onClick={() => openBoost(listing.id!)}
                      data-testid={`btn-boost-ad-${listing.id}`}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      Boost
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                No active listings to boost.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={boostOpen} onOpenChange={setBoostOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Boost Listing</DialogTitle>
            <DialogDescription>
              {selectedListing?.title ?? "Selected listing"} — choose your promotion type and duration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Ad Type</label>
              <Select value={adType} onValueChange={(v: any) => setAdType(v)}>
                <SelectTrigger className="border-border bg-input" data-testid="select-ad-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured Listing</SelectItem>
                  <SelectItem value="native_feed">Native Feed</SelectItem>
                  <SelectItem value="top_search">Top Search Result</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{AD_TYPE_META[adType].desc}</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="border-border bg-input" data-testid="select-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setBoostOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleBoost}
              disabled={boostMutation.isPending}
              data-testid="btn-confirm-boost"
            >
              {boostMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Boost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
