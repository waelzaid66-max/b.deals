import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetFinancingRequests,
  getGetFinancingRequestsQueryKey,
  useUpdateFinancingRequest,
  useGetFinancingIntermediaries,
  getGetFinancingIntermediariesQueryKey,
  useCreateFinancingIntermediary,
  useUpdateFinancingIntermediary,
  type FinancingRequest,
  type FinancingIntermediary,
  type GetFinancingRequestsParams,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Download, Plus, Search, Building2, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["new", "forwarded", "contacted", "closed", "rejected"] as const;
type Status = (typeof STATUSES)[number];

const CATEGORIES = ["car", "real_estate", "industrial"] as const;

const STATUS_STYLE: Record<Status, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  forwarded: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  contacted: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  closed: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

const CATEGORY_LABEL: Record<string, string> = {
  car: "Car",
  real_estate: "Real Estate",
  industrial: "Industrial",
};

const UNASSIGNED = "__none__";

function fmtMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function FinancingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  // Cursor stack for prev/next page navigation. cursorStack[i] is the cursor used
  // to fetch page i+1 (page 1 = undefined). The table renders the current page
  // directly from react-query data, so mutations/invalidation always show fresh
  // rows (no separately-accumulated local copy to go stale).
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const cursor = cursorStack[cursorStack.length - 1];

  const PAGE_SIZE = 50;

  const params: GetFinancingRequestsParams = useMemo(() => {
    const p: GetFinancingRequestsParams = { limit: PAGE_SIZE };
    if (category !== "all") p.category = category as GetFinancingRequestsParams["category"];
    if (status !== "all") p.status = status as GetFinancingRequestsParams["status"];
    if (search) p.search = search;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    if (cursor) p.cursor = cursor;
    return p;
  }, [category, status, search, dateFrom, dateTo, cursor]);

  // Reset paging to the first page whenever a filter changes.
  const filterKey = `${category}|${status}|${search}|${dateFrom}|${dateTo}`;
  const lastFilterKey = useRef(filterKey);
  useEffect(() => {
    if (lastFilterKey.current !== filterKey) {
      lastFilterKey.current = filterKey;
      setCursorStack([undefined]);
    }
  }, [filterKey]);

  const { data: resp, isLoading, isFetching } = useGetFinancingRequests(params, {
    query: { queryKey: getGetFinancingRequestsQueryKey(params) },
  });

  // Render straight from react-query — invalidation after a save refetches this
  // exact page and the table updates immediately.
  const requests = resp?.data ?? [];
  const nextCursor = resp?.meta?.cursor;
  const page = cursorStack.length;
  const hasNext = Boolean(resp?.meta?.has_next && nextCursor);
  const hasPrev = cursorStack.length > 1;

  const goNext = () => {
    if (nextCursor) setCursorStack((s) => [...s, nextCursor]);
  };
  const goPrev = () => {
    setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

  const { data: intermResp } = useGetFinancingIntermediaries({
    query: { queryKey: getGetFinancingIntermediariesQueryKey() },
  });
  const intermediaries = intermResp?.data ?? [];

  const updateRequest = useUpdateFinancingRequest();

  const refetchRequests = () =>
    queryClient.invalidateQueries({ queryKey: getGetFinancingRequestsQueryKey(params) });

  async function applyUpdate(
    leadId: string,
    body: { status?: Status; intermediary_id?: string | null; notes?: string | null },
  ) {
    try {
      await updateRequest.mutateAsync({ leadId, data: body });
      await refetchRequests();
      toast({ title: "Updated", description: "Finance request saved." });
    } catch {
      toast({ title: "Update failed", description: "Could not save the change.", variant: "destructive" });
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (category !== "all") qs.set("category", category);
      if (status !== "all") qs.set("status", status);
      if (search) qs.set("search", search);
      if (dateFrom) qs.set("date_from", dateFrom);
      if (dateTo) qs.set("date_to", dateTo);
      const url = `/api/v1/admin/financing/requests/export${qs.toString() ? `?${qs.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `financing-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      toast({ title: "Export failed", description: "Could not export requests.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financing CRM</h1>
          <p className="text-muted-foreground mt-2">
            Bank-financing (installment) requests across cars, real estate and industrial listings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <IntermediariesDialog intermediaries={intermediaries} />
          <Button onClick={handleExport} disabled={exporting} variant="outline">
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search buyer or listing…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchInput.trim());
            }}
            className="pl-9 w-[260px]"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px]"
            aria-label="Requested from"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px]"
            aria-label="Requested to"
          />
        </div>
        {(category !== "all" || status !== "all" || search || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            onClick={() => {
              setCategory("all");
              setStatus("all");
              setSearch("");
              setSearchInput("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Amount &amp; Terms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Intermediary</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : !requests.length ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No financing requests.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <RequestRow
                  key={req.lead_id}
                  req={req}
                  intermediaries={intermediaries}
                  busy={updateRequest.isPending}
                  onUpdate={applyUpdate}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          {isLoading
            ? "Loading…"
            : `Page ${page} · ${requests.length} request${requests.length === 1 ? "" : "s"}`}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!hasPrev || isFetching} onClick={goPrev}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!hasNext || isFetching} onClick={goNext}>
            {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function RequestRow({
  req,
  intermediaries,
  busy,
  onUpdate,
}: {
  req: FinancingRequest;
  intermediaries: FinancingIntermediary[];
  busy: boolean;
  onUpdate: (
    leadId: string,
    body: { status?: Status; intermediary_id?: string | null; notes?: string | null },
  ) => void;
}) {
  const leadId = req.lead_id ?? "";
  return (
    <TableRow>
      <TableCell className="font-medium truncate max-w-[220px]">{req.listing_title}</TableCell>
      <TableCell>
        <Badge variant="outline">{CATEGORY_LABEL[req.category ?? ""] ?? req.category}</Badge>
      </TableCell>
      <TableCell>
        <div>{req.buyer_name ?? "—"}</div>
        <div className="text-xs text-muted-foreground">{req.buyer_phone ?? ""}</div>
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        <div>Price: {fmtMoney(req.asset_price)}</div>
        <div className="text-xs text-muted-foreground">
          {fmtMoney(req.monthly_payment)}/mo
          {req.duration_months ? ` × ${req.duration_months}m` : ""}
          {req.down_payment ? ` · ${fmtMoney(req.down_payment)} down` : ""}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={req.status ?? "new"}
          onValueChange={(v) => onUpdate(leadId, { status: v as Status })}
          disabled={busy}
        >
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue>
              <Badge variant="outline" className={`capitalize ${STATUS_STYLE[(req.status ?? "new") as Status]}`}>
                {req.status ?? "new"}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={req.intermediary_id ?? UNASSIGNED}
          onValueChange={(v) =>
            onUpdate(leadId, { intermediary_id: v === UNASSIGNED ? null : v })
          }
          disabled={busy}
        >
          <SelectTrigger className="w-[170px] h-8">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {intermediaries
              .filter((im) => im.is_active || im.id === req.intermediary_id)
              .map((im) => (
                <SelectItem key={im.id} value={im.id ?? ""}>{im.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
        {req.created_at ? new Date(req.created_at).toLocaleDateString() : "—"}
      </TableCell>
      <TableCell className="text-right">
        <NotesDialog req={req} onSave={(notes) => onUpdate(leadId, { notes })} />
      </TableCell>
    </TableRow>
  );
}

function NotesDialog({ req, onSave }: { req: FinancingRequest; onSave: (notes: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(req.notes ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setValue(req.notes ?? "");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="w-3.5 h-3.5 mr-1" />
          {req.notes ? "Edit" : "Add"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CRM Notes</DialogTitle>
          <DialogDescription className="truncate">{req.listing_title}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          placeholder="Internal notes about this request…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onSave(value);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntermediariesDialog({ intermediaries }: { intermediaries: FinancingIntermediary[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancingIntermediary | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);

  const createInterm = useCreateFinancingIntermediary();
  const updateInterm = useUpdateFinancingIntermediary();
  const busy = createInterm.isPending || updateInterm.isPending;

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: getGetFinancingIntermediariesQueryKey() });

  function resetForm() {
    setEditing(null);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setActive(true);
  }

  function startEdit(im: FinancingIntermediary) {
    setEditing(im);
    setName(im.name ?? "");
    setEmail(im.contact_email ?? "");
    setPhone(im.contact_phone ?? "");
    setNotes(im.notes ?? "");
    setActive(im.is_active ?? true);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    try {
      if (editing?.id) {
        await updateInterm.mutateAsync({
          id: editing.id,
          data: {
            name: name.trim(),
            contact_email: email.trim() || null,
            contact_phone: phone.trim() || null,
            notes: notes.trim() || null,
            is_active: active,
          },
        });
      } else {
        await createInterm.mutateAsync({
          data: {
            name: name.trim(),
            contact_email: email.trim() || null,
            contact_phone: phone.trim() || null,
            notes: notes.trim() || null,
          },
        });
      }
      await refetch();
      toast({ title: "Saved", description: "Intermediary saved." });
      resetForm();
    } catch {
      toast({ title: "Save failed", description: "Could not save intermediary.", variant: "destructive" });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Building2 className="w-4 h-4 mr-2" />
          Intermediaries
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Banks &amp; Financiers</DialogTitle>
          <DialogDescription>Manage the intermediaries you forward finance requests to.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
          {!intermediaries.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No intermediaries yet.</p>
          ) : (
            intermediaries.map((im) => (
              <div key={im.id} className="flex items-center justify-between border rounded-md p-3">
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    {im.name}
                    {!im.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[im.contact_email, im.contact_phone].filter(Boolean).join(" · ") || "No contact info"}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => startEdit(im)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2 font-medium text-sm">
            {editing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editing ? "Edit intermediary" : "Add intermediary"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. National Bank" />
            </div>
            <div>
              <Label className="text-xs">Contact email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" />
            </div>
            <div>
              <Label className="text-xs">Contact phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optional" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="optional" />
            </div>
            {editing && (
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} id="interm-active" />
                <Label htmlFor="interm-active" className="text-sm">Active</Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {editing && (
            <Button variant="ghost" onClick={resetForm} disabled={busy}>Cancel edit</Button>
          )}
          <Button onClick={handleSave} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? "Save changes" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
