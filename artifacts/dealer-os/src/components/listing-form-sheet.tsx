import { useEffect, useState } from "react";
import {
  useCreateListing,
  useUpdateListing,
  useGetListing, getGetListingQueryKey,
  getGetDealerListingsQueryKey,
  CreateListingBodyCategory,
  CreateListingBodyPaymentOptionsItemMode,
} from "@workspace/api-client-react";
import type {
  CreateListingBody, UpdateListingBody, DealerListing,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";

type Category = "car" | "real_estate" | "industrial";

type SpecField = { key: string; label: string; numeric?: boolean };

const SPEC_FIELDS: Record<Category, SpecField[]> = {
  car: [
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "year", label: "Year", numeric: true },
    { key: "mileage", label: "Mileage (km)", numeric: true },
    { key: "transmission", label: "Transmission" },
    { key: "fuel_type", label: "Fuel type" },
    { key: "condition", label: "Condition" },
  ],
  real_estate: [
    { key: "property_type", label: "Property type" },
    { key: "area", label: "Area (sqm)", numeric: true },
    { key: "rooms", label: "Rooms", numeric: true },
    { key: "bathrooms", label: "Bathrooms", numeric: true },
    { key: "finishing", label: "Finishing" },
  ],
  industrial: [
    { key: "equipment_type", label: "Equipment type" },
    { key: "brand", label: "Brand" },
    { key: "year", label: "Year", numeric: true },
    { key: "condition", label: "Condition" },
    { key: "capacity", label: "Capacity" },
  ],
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: "Cash",
  seller_installment: "Seller installment",
  bank_finance: "Bank finance",
};

type PaymentRow = {
  mode: "cash" | "seller_installment" | "bank_finance" | "";
  down_payment: string;
  monthly_payment: string;
  duration_months: string;
  is_islamic_compliant: boolean;
};

const emptyPaymentRow = (): PaymentRow => ({
  mode: "",
  down_payment: "",
  monthly_payment: "",
  duration_months: "",
  is_islamic_compliant: false,
});

function cleanNumberString(s: string | undefined | null): string {
  if (!s) return "";
  const n = parseFloat(String(s).replace(/[, ]/g, ""));
  return isFinite(n) ? String(n) : "";
}

export function ListingFormSheet({
  open,
  onOpenChange,
  listing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: DealerListing | null;
}) {
  const isEdit = !!listing?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createListing = useCreateListing();
  const updateListing = useUpdateListing();

  const { data: detailData, isLoading: detailLoading } = useGetListing(listing?.id ?? "", {
    query: { enabled: open && isEdit, queryKey: getGetListingQueryKey(listing?.id ?? "") },
  });

  const [category, setCategory] = useState<Category>("car");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [initialPrice, setInitialPrice] = useState("");
  const [location, setLocation] = useState("");
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [originalSpecs, setOriginalSpecs] = useState<Record<string, unknown>>({});
  const [media, setMedia] = useState<string[]>([""]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  // Reset to a clean state whenever a CREATE sheet is opened.
  useEffect(() => {
    if (open && !isEdit) {
      setCategory("car");
      setTitle("");
      setDescription("");
      setPrice("");
      setInitialPrice("");
      setLocation("");
      setSpecs({});
      setOriginalSpecs({});
      setMedia([""]);
      setPayments([]);
    }
  }, [open, isEdit]);

  // Prefill from the listing row + fetched detail when EDITing.
  useEffect(() => {
    if (!open || !isEdit) return;
    const rowCat = (listing?.category as Category) || "car";
    setCategory(rowCat);
    setLocation(listing?.location ?? "");
    const p = cleanNumberString(listing?.price_raw);
    setPrice(p);
    setInitialPrice(p);
    setTitle(listing?.title ?? "");
  }, [open, isEdit, listing]);

  useEffect(() => {
    const detail = detailData?.data;
    if (!detail) return;
    if (detail.title) setTitle(detail.title);
    setDescription(detail.description ?? "");
    if (detail.location) setLocation(detail.location);
    const ds = (detail.specs ?? {}) as Record<string, unknown>;
    setOriginalSpecs(ds);
    const asStrings: Record<string, string> = {};
    for (const [k, v] of Object.entries(ds)) {
      if (v !== null && v !== undefined && typeof v !== "object") asStrings[k] = String(v);
    }
    setSpecs(asStrings);
  }, [detailData]);

  const fields = SPEC_FIELDS[category];

  const buildSpecsObject = (): Record<string, unknown> => {
    const obj: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = specs[f.key]?.trim();
      if (!raw) continue;
      if (f.numeric) {
        const n = Number(raw);
        if (isFinite(n)) obj[f.key] = n;
      } else {
        obj[f.key] = raw;
      }
    }
    return obj;
  };

  const validateCommon = (): string | null => {
    if (!title.trim()) return "Title is required";
    if (!location.trim()) return "Location is required";
    const priceNum = Number(price.replace(/[, ]/g, ""));
    if (!isFinite(priceNum) || priceNum < 0) return "Enter a valid cash price";
    return null;
  };

  const isPending = createListing.isPending || updateListing.isPending;

  const handleCreate = () => {
    const err = validateCommon();
    if (err) {
      toast({ title: err, variant: "destructive" });
      return;
    }
    const mediaArr = media
      .map((u) => u.trim())
      .filter(Boolean)
      .map((url, i) => ({ type: "image" as const, url, is_thumbnail: i === 0 }));

    const numOrUndef = (s: string) => (s !== "" && isFinite(Number(s)) ? Number(s) : undefined);
    const paymentArr = payments
      .filter((p) => p.mode)
      .map((p) => {
        const downPayment = numOrUndef(p.down_payment);
        const monthlyPayment = numOrUndef(p.monthly_payment);
        const durationMonths = numOrUndef(p.duration_months);
        return {
          mode: p.mode as CreateListingBodyPaymentOptionsItemMode,
          ...(downPayment !== undefined ? { down_payment: downPayment } : {}),
          ...(monthlyPayment !== undefined ? { monthly_payment: monthlyPayment } : {}),
          ...(durationMonths !== undefined ? { duration_months: durationMonths } : {}),
          is_islamic_compliant: p.is_islamic_compliant,
        };
      });

    const body: CreateListingBody = {
      title: title.trim(),
      category: category as CreateListingBodyCategory,
      base_price_cash: Number(price.replace(/[, ]/g, "")),
      location: location.trim(),
      specs: buildSpecsObject(),
      media: mediaArr,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(paymentArr.length ? { payment_options: paymentArr } : {}),
    };

    createListing.mutate(
      { data: body },
      {
        onSuccess: () => {
          toast({ title: "Listing created" });
          queryClient.invalidateQueries({ queryKey: getGetDealerListingsQueryKey({ limit: 100 }) });
          onOpenChange(false);
        },
        onError: () => toast({ title: "Failed to create listing", variant: "destructive" }),
      },
    );
  };

  const handleUpdate = () => {
    if (!listing?.id) return;
    const err = validateCommon();
    if (err) {
      toast({ title: err, variant: "destructive" });
      return;
    }
    const body: UpdateListingBody = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      // Preserve unknown spec keys: PATCH may replace the whole specs object.
      specs: { ...originalSpecs, ...buildSpecsObject() },
    };
    // Only send price when the user actually changed it (price_raw is lossy).
    if (price !== initialPrice) {
      const priceNum = Number(price.replace(/[, ]/g, ""));
      if (isFinite(priceNum) && priceNum >= 0) body.base_price_cash = priceNum;
    }

    updateListing.mutate(
      { id: listing.id, data: body },
      {
        onSuccess: () => {
          toast({ title: "Listing updated" });
          queryClient.invalidateQueries({ queryKey: getGetDealerListingsQueryKey({ limit: 100 }) });
          queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(listing.id!) });
          onOpenChange(false);
        },
        onError: () => toast({ title: "Failed to update listing", variant: "destructive" }),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground text-left">
            {isEdit ? "Edit Listing" : "New Listing"}
          </SheetTitle>
          <SheetDescription className="text-left">
            {isEdit
              ? "Update the core details of your listing."
              : "Create a new listing with taxonomy, financing and media."}
          </SheetDescription>
        </SheetHeader>

        {isEdit && detailLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              {isEdit ? (
                <div>
                  <Badge variant="outline" className="border-white/10 capitalize">
                    {category.replace("_", " ")}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Category can't be changed after creation.</p>
                </div>
              ) : (
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="bg-input border-border" data-testid="form-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="real_estate">Real estate</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Core fields */}
            <div className="space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-input border-border" data-testid="form-title" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-input border-border" data-testid="form-description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cash price (EGP) *</Label>
                <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-input border-border" data-testid="form-price" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Location *</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-input border-border" data-testid="form-location" />
              </div>
            </div>

            {/* Specs */}
            <div>
              <Separator className="bg-border" />
              <h3 className="text-sm font-semibold text-foreground mt-4 mb-3 capitalize">
                {category.replace("_", " ")} specs
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      type={f.numeric ? "number" : "text"}
                      value={specs[f.key] ?? ""}
                      onChange={(e) => setSpecs((s) => ({ ...s, [f.key]: e.target.value }))}
                      className="bg-input border-border"
                      data-testid={`form-spec-${f.key}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Media + financing are create-only (not in UpdateListingBody). */}
            {!isEdit && (
              <>
                <div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between mt-4 mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Media (image URLs)
                    </h3>
                    <Button type="button" size="sm" variant="outline" className="border-border h-7" onClick={() => setMedia((m) => [...m, ""])} data-testid="form-add-media">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {media.map((url, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={url}
                          placeholder="https://…"
                          onChange={(e) => setMedia((m) => m.map((u, idx) => (idx === i ? e.target.value : u)))}
                          className="bg-input border-border"
                          data-testid={`form-media-${i}`}
                        />
                        {i === 0 ? (
                          <Badge variant="outline" className="border-white/10 text-xs whitespace-nowrap">Thumbnail</Badge>
                        ) : (
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setMedia((m) => m.filter((_, idx) => idx !== i))}>
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between mt-4 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Financing options</h3>
                    <Button type="button" size="sm" variant="outline" className="border-border h-7" onClick={() => setPayments((p) => [...p, emptyPaymentRow()])} data-testid="form-add-payment">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {payments.length === 0 && (
                      <p className="text-xs text-muted-foreground">Cash is always available. Add installment or bank-finance options below.</p>
                    )}
                    {payments.map((p, i) => (
                      <div key={i} className="rounded-md border border-border p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <Select value={p.mode} onValueChange={(v) => setPayments((arr) => arr.map((row, idx) => (idx === i ? { ...row, mode: v as PaymentRow["mode"] } : row)))}>
                            <SelectTrigger className="bg-input border-border" data-testid={`form-payment-mode-${i}`}>
                              <SelectValue placeholder="Payment mode" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PAYMENT_MODE_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v}>{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setPayments((arr) => arr.filter((_, idx) => idx !== i))}>
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                        {p.mode && p.mode !== "cash" && (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Down payment</Label>
                                <Input type="number" value={p.down_payment} onChange={(e) => setPayments((arr) => arr.map((row, idx) => (idx === i ? { ...row, down_payment: e.target.value } : row)))} className="bg-input border-border" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Monthly</Label>
                                <Input type="number" value={p.monthly_payment} onChange={(e) => setPayments((arr) => arr.map((row, idx) => (idx === i ? { ...row, monthly_payment: e.target.value } : row)))} className="bg-input border-border" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Months</Label>
                                <Input type="number" value={p.duration_months} onChange={(e) => setPayments((arr) => arr.map((row, idx) => (idx === i ? { ...row, duration_months: e.target.value } : row)))} className="bg-input border-border" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Islamic-compliant (Sharia)</Label>
                              <Switch
                                checked={p.is_islamic_compliant}
                                onCheckedChange={(c) => setPayments((arr) => arr.map((row, idx) => (idx === i ? { ...row, is_islamic_compliant: c } : row)))}
                                data-testid={`form-payment-islamic-${i}`}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <SheetFooter>
          <Button variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={isEdit ? handleUpdate : handleCreate}
            disabled={isPending || (isEdit && detailLoading)}
            data-testid="btn-save-listing"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Listing"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
