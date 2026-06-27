import { useEffect, useState } from "react";
import {
  useGetPromoCampaign,
  useUpdatePromoCampaign,
  useRenewPromoCampaign,
  getGetPromoCampaignQueryKey,
} from "@workspace/api-client-react";
import type {
  PromoCampaignView,
  PromoCampaignUpdate,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Gift,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CalendarClock,
  BadgeCheck,
  ShieldOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface FormState {
  enabled: boolean;
  verifiedAmount: string;
  unverifiedAmount: string;
  durationMonths: string;
}

function seedForm(view: PromoCampaignView): FormState {
  return {
    enabled: view.enabled,
    verifiedAmount: view.verified_monthly_amount,
    unverifiedAmount: view.unverified_monthly_amount,
    durationMonths: String(view.duration_months),
  };
}

const STATUS_META: Record<
  PromoCampaignView["status"],
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  active: { label: "Active", variant: "default" },
  upcoming: { label: "Upcoming", variant: "secondary" },
  ended: { label: "Ended", variant: "secondary" },
  disabled: { label: "Disabled", variant: "destructive" },
};

export default function PromoPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: resp, isLoading } = useGetPromoCampaign();
  const view = resp?.data;

  const update = useUpdatePromoCampaign();
  const renew = useRenewPromoCampaign();

  const [form, setForm] = useState<FormState | null>(null);

  // Re-seed the editable form whenever the server view materially changes
  // (after a save/renew refetch bumps the version or timestamps).
  const seedKey = view
    ? `${view.campaign_version}|${view.updated_at ?? ""}|${view.enabled}`
    : "";
  useEffect(() => {
    if (view) setForm(seedForm(view));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  if (isLoading || !view || !form) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetPromoCampaignQueryKey() });

  const buildPayload = (): PromoCampaignUpdate => {
    const months = parseInt(form.durationMonths, 10);
    return {
      enabled: form.enabled,
      verified_monthly_amount: form.verifiedAmount.trim() || "0",
      unverified_monthly_amount: form.unverifiedAmount.trim() || "0",
      duration_months: Number.isFinite(months) ? months : view.duration_months,
    };
  };

  const handleSave = () => {
    update.mutate(
      { data: buildPayload() },
      {
        onSuccess: () => {
          invalidate();
          toast({
            title: "Promo campaign saved",
            description: "Changes apply to the next monthly grant cycle.",
          });
        },
        onError: () => toast({ title: "Save failed", variant: "destructive" }),
      }
    );
  };

  const handleRenew = () => {
    // Renew starts a fresh cycle (new version) from today, applying any edited
    // amounts/duration so admins can relaunch in one action.
    renew.mutate(
      { data: buildPayload() },
      {
        onSuccess: () => {
          invalidate();
          toast({
            title: "New campaign cycle started",
            description:
              "Every user becomes eligible for a fresh grant this month.",
          });
        },
        onError: () => toast({ title: "Renew failed", variant: "destructive" }),
      }
    );
  };

  const statusMeta = STATUS_META[view.status];
  const fmtAmount = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : v;
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Gift className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Free Ad Credit</h1>
          <p className="text-muted-foreground mt-1">
            A separate, virtual ad-only allowance granted to every user each
            month. It is consumed before the real wallet on boosts and is
            use-it-or-lose-it — it is never real money and cannot be withdrawn.
          </p>
        </div>
      </div>

      {/* Status summary */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
          <StatusItem label="Status">
            <Badge
              variant={statusMeta.variant}
              className={
                view.status === "active"
                  ? "bg-green-600 hover:bg-green-600"
                  : undefined
              }
            >
              {view.status === "active" ? (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              ) : view.status === "disabled" ? (
                <XCircle className="w-3.5 h-3.5 mr-1" />
              ) : (
                <CalendarClock className="w-3.5 h-3.5 mr-1" />
              )}
              {statusMeta.label}
            </Badge>
          </StatusItem>
          <StatusItem label="Campaign version">
            <span className="text-sm font-medium">#{view.campaign_version}</span>
          </StatusItem>
          <StatusItem label="Month">
            <span className="text-sm font-medium">
              {view.current_month_index < 0
                ? "Not started"
                : `${view.current_month_index + 1} of ${view.duration_months}`}
            </span>
          </StatusItem>
          <StatusItem label="Months remaining">
            <span className="text-sm font-medium">{view.months_remaining}</span>
          </StatusItem>
          <StatusItem label="Started">
            <span className="text-sm text-muted-foreground">
              {new Date(view.starts_at).toLocaleDateString()}
            </span>
          </StatusItem>
          {view.updated_at ? (
            <StatusItem label="Last updated">
              <span className="text-sm text-muted-foreground">
                {new Date(view.updated_at).toLocaleString()}
              </span>
            </StatusItem>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> Campaign configuration
          </CardTitle>
          <CardDescription>
            Set the monthly allowance per verification tier and how many months
            the campaign runs. Edits take effect on the next grant cycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Enable monthly grants</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                When off, no new free ad credit is granted. Existing balances
                still apply until they expire.
              </p>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => set("enabled", v)}
            />
          </div>

          {/* Tiered amounts */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="verifiedAmount" className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-primary" /> Verified users
                (EGP / month)
              </Label>
              <Input
                id="verifiedAmount"
                inputMode="decimal"
                value={form.verifiedAmount}
                onChange={(e) => set("verifiedAmount", e.target.value)}
                placeholder="10000"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="unverifiedAmount"
                className="flex items-center gap-1.5"
              >
                <ShieldOff className="w-4 h-4 text-muted-foreground" /> Unverified
                users (EGP / month)
              </Label>
              <Input
                id="unverifiedAmount"
                inputMode="decimal"
                value={form.unverifiedAmount}
                onChange={(e) => set("unverifiedAmount", e.target.value)}
                placeholder="5000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="durationMonths">Duration (months)</Label>
            <Input
              id="durationMonths"
              type="number"
              min={1}
              max={24}
              value={form.durationMonths}
              onChange={(e) => set("durationMonths", e.target.value)}
              placeholder="4"
            />
            <p className="text-xs text-muted-foreground">
              How many monthly grants this campaign runs for (1–24). Current
              tiers: verified {fmtAmount(view.verified_monthly_amount)} EGP,
              unverified {fmtAmount(view.unverified_monthly_amount)} EGP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={update.isPending}>
              {update.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save configuration
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={renew.isPending}>
                  {renew.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Start new cycle
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start a fresh campaign cycle?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This begins a brand-new campaign from today using the values
                    above. Every user becomes eligible for a new monthly grant,
                    and the month counter resets to 1. Existing unused balances
                    remain until their own expiry. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRenew}>
                    Start new cycle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="text-xs text-muted-foreground">
            Grants run automatically once a day (Africa/Cairo). Saving only
            changes future grants; use “Start new cycle” to relaunch the program
            immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
