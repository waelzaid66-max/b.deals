import { db } from "@workspace/db";
import {
  users,
  listings,
  leadHistory,
  paymentOptions,
  financingRequests,
  financingIntermediaries,
} from "@workspace/db/schema";
import { and, asc, desc, eq, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { writeAudit } from "./AbuseService";

/* ── Types ─────────────────────────────────────────────── */

type FinancingStatus = "new" | "forwarded" | "contacted" | "closed" | "rejected";
type ListingCategory = "car" | "real_estate" | "industrial";

export interface FinancingRequestRow {
  lead_id: string;
  status: FinancingStatus;
  listing_id: string;
  listing_title: string;
  category: ListingCategory;
  buyer_name: string | null;
  buyer_phone: string | null;
  asset_price: string | null;
  down_payment: string | null;
  monthly_payment: string | null;
  duration_months: number | null;
  provider_name: string | null;
  intermediary_id: string | null;
  intermediary_name: string | null;
  notes: string | null;
  assigned_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FinancingIntermediaryRow {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string | null;
}

interface ListFilters {
  category?: ListingCategory;
  status?: FinancingStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/* ── Shared query building ─────────────────────────────── */

// The effective CRM status: the sidecar value when a row exists, otherwise the
// implicit "new" state for a finance-request lead nobody has touched yet.
const effectiveStatus = sql<FinancingStatus>`coalesce(${financingRequests.status}, 'new')`;

// Deterministically pick ONE bank-finance payment option for the listing so the
// down-payment / monthly / duration / provider all come from the SAME plan
// (cheapest monthly first, then a stable id tiebreak).
function bankFinanceField<T>(column: string): SQL<T | null> {
  return sql<T | null>`(
    select po.${sql.raw(column)}
    from payment_options po
    where po.listing_id = ${listings.id} and po.mode = 'bank_finance'
    order by po.monthly_payment asc nulls last, po.id asc
    limit 1
  )`;
}

const rowSelection = {
  leadId: leadHistory.id,
  status: effectiveStatus,
  listingId: leadHistory.listingId,
  listingTitle: listings.title,
  category: listings.category,
  buyerName: sql<string | null>`coalesce(${leadHistory.buyerName}, ${users.name})`,
  buyerPhone: sql<string | null>`coalesce(${leadHistory.buyerPhone}, ${users.phone})`,
  assetPrice: listings.basePriceCash,
  downPayment: bankFinanceField<string>("down_payment"),
  monthlyPayment: bankFinanceField<string>("monthly_payment"),
  durationMonths: bankFinanceField<number>("duration_months"),
  providerName: bankFinanceField<string>("provider_name"),
  intermediaryId: financingRequests.intermediaryId,
  intermediaryName: financingIntermediaries.name,
  notes: financingRequests.notes,
  assignedAt: financingRequests.assignedAt,
  createdAt: leadHistory.createdAt,
  updatedAt: financingRequests.updatedAt,
} as const;

type RawRow = {
  leadId: string;
  status: FinancingStatus;
  listingId: string;
  listingTitle: string | null;
  category: ListingCategory | null;
  buyerName: string | null;
  buyerPhone: string | null;
  assetPrice: string | null;
  downPayment: string | null;
  monthlyPayment: string | null;
  durationMonths: number | null;
  providerName: string | null;
  intermediaryId: string | null;
  intermediaryName: string | null;
  notes: string | null;
  assignedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function buildConditions(filters: ListFilters, cursor?: string): SQL[] {
  const conditions: SQL[] = [eq(leadHistory.actionType, "finance_request")];

  if (filters.category) conditions.push(eq(listings.category, filters.category));
  if (filters.status) conditions.push(sql`${effectiveStatus} = ${filters.status}`);

  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    const match = or(
      ilike(listings.title, term),
      ilike(leadHistory.buyerName, term),
      ilike(leadHistory.buyerPhone, term),
      ilike(users.name, term),
      ilike(users.phone, term),
    );
    if (match) conditions.push(match);
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    if (!Number.isNaN(from.getTime())) {
      conditions.push(sql`${leadHistory.createdAt} >= ${from}`);
    }
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    if (!Number.isNaN(to.getTime())) {
      // Treat a bare date as inclusive of the whole day.
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.dateTo.trim())) {
        to.setHours(23, 59, 59, 999);
      }
      conditions.push(sql`${leadHistory.createdAt} <= ${to}`);
    }
  }

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      conditions.push(lt(leadHistory.createdAt, cursorDate));
    }
  }

  return conditions;
}

function baseQuery(conditions: SQL[]) {
  return db
    .select(rowSelection)
    .from(leadHistory)
    .leftJoin(listings, eq(leadHistory.listingId, listings.id))
    .leftJoin(users, eq(leadHistory.buyerId, users.id))
    .leftJoin(financingRequests, eq(financingRequests.leadId, leadHistory.id))
    .leftJoin(
      financingIntermediaries,
      eq(financingRequests.intermediaryId, financingIntermediaries.id),
    )
    .where(and(...conditions))
    .orderBy(desc(leadHistory.createdAt));
}

function mapRow(r: RawRow): FinancingRequestRow {
  return {
    lead_id: r.leadId,
    status: r.status ?? "new",
    listing_id: r.listingId,
    listing_title: r.listingTitle ?? "—",
    category: r.category ?? "car",
    buyer_name: r.buyerName,
    buyer_phone: r.buyerPhone,
    asset_price: r.assetPrice,
    down_payment: r.downPayment,
    monthly_payment: r.monthlyPayment,
    duration_months: r.durationMonths,
    provider_name: r.providerName,
    intermediary_id: r.intermediaryId,
    intermediary_name: r.intermediaryName,
    notes: r.notes,
    assigned_at: r.assignedAt ? r.assignedAt.toISOString() : null,
    created_at: r.createdAt ? r.createdAt.toISOString() : null,
    updated_at: r.updatedAt ? r.updatedAt.toISOString() : null,
  };
}

/* ── Requests: list / get / export ─────────────────────── */

export async function listFinancingRequests(params: {
  category?: ListingCategory;
  status?: FinancingStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit: number;
}): Promise<{ items: FinancingRequestRow[]; cursor?: string; has_next: boolean }> {
  const conditions = buildConditions(params, params.cursor);
  const rows = (await baseQuery(conditions).limit(params.limit + 1)) as RawRow[];

  const has_next = rows.length > params.limit;
  const page = rows.slice(0, params.limit);
  const last = page[page.length - 1];

  return {
    items: page.map(mapRow),
    cursor: has_next && last?.createdAt ? last.createdAt.toISOString() : undefined,
    has_next,
  };
}

async function getFinancingRequestByLeadId(
  leadId: string,
): Promise<FinancingRequestRow | null> {
  const rows = (await baseQuery([
    eq(leadHistory.actionType, "finance_request"),
    eq(leadHistory.id, leadId),
  ]).limit(1)) as RawRow[];
  const row = rows[0];
  return row ? mapRow(row) : null;
}

// Export the FULL filtered set (no pagination) for CSV download. Capped to keep
// a single export bounded.
const EXPORT_CAP = 5000;

const CSV_COLUMNS: { header: string; key: keyof FinancingRequestRow }[] = [
  { header: "Lead ID", key: "lead_id" },
  { header: "Status", key: "status" },
  { header: "Category", key: "category" },
  { header: "Listing", key: "listing_title" },
  { header: "Listing ID", key: "listing_id" },
  { header: "Buyer", key: "buyer_name" },
  { header: "Buyer Phone", key: "buyer_phone" },
  { header: "Asset Price", key: "asset_price" },
  { header: "Down Payment", key: "down_payment" },
  { header: "Monthly Payment", key: "monthly_payment" },
  { header: "Duration (months)", key: "duration_months" },
  { header: "Plan Provider", key: "provider_name" },
  { header: "Intermediary", key: "intermediary_name" },
  { header: "Notes", key: "notes" },
  { header: "Assigned At", key: "assigned_at" },
  { header: "Requested At", key: "created_at" },
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function exportFinancingRequestsCsv(params: {
  category?: ListingCategory;
  status?: FinancingStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<string> {
  const conditions = buildConditions(params);
  const rows = (await baseQuery(conditions).limit(EXPORT_CAP)) as RawRow[];
  const items = rows.map(mapRow);

  const lines = [CSV_COLUMNS.map((c) => csvCell(c.header)).join(",")];
  for (const item of items) {
    lines.push(CSV_COLUMNS.map((c) => csvCell(item[c.key])).join(","));
  }
  // Prepend a BOM so Excel opens UTF-8 (Arabic listing titles) correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/* ── Requests: update (upsert sidecar) ─────────────────── */

export async function updateFinancingRequest(params: {
  leadId: string;
  status?: FinancingStatus;
  // undefined = leave unchanged; null = clear assignment; string = assign.
  intermediaryId?: string | null;
  notes?: string | null;
  adminUserId: string;
}): Promise<FinancingRequestRow> {
  const { leadId, adminUserId } = params;

  // The lead must exist AND be a finance request — we never invent CRM rows for
  // non-finance leads.
  const [lead] = await db
    .select({ id: leadHistory.id, actionType: leadHistory.actionType })
    .from(leadHistory)
    .where(eq(leadHistory.id, leadId))
    .limit(1);

  if (!lead || lead.actionType !== "finance_request") {
    throw Object.assign(new Error("Finance request not found"), { code: "NOT_FOUND" });
  }

  // Validate the intermediary exists when assigning one.
  if (params.intermediaryId) {
    const [im] = await db
      .select({ id: financingIntermediaries.id })
      .from(financingIntermediaries)
      .where(eq(financingIntermediaries.id, params.intermediaryId))
      .limit(1);
    if (!im) {
      throw Object.assign(new Error("Intermediary not found"), { code: "NOT_FOUND" });
    }
  }

  const now = new Date();

  // Build the partial update set — only touch the fields the caller provided.
  const set: Partial<typeof financingRequests.$inferInsert> = { updatedAt: now };
  if (params.status !== undefined) set.status = params.status;
  if (params.notes !== undefined) set.notes = params.notes;
  if (params.intermediaryId !== undefined) {
    set.intermediaryId = params.intermediaryId;
    set.assignedAt = params.intermediaryId ? now : null;
  }

  await db
    .insert(financingRequests)
    .values({
      leadId,
      status: params.status ?? "new",
      intermediaryId: params.intermediaryId ?? null,
      assignedAt: params.intermediaryId ? now : null,
      notes: params.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({ target: financingRequests.leadId, set });

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: adminUserId,
    reason: "financing_request_update",
    metadata: {
      lead_id: leadId,
      status: params.status ?? null,
      intermediary_id: params.intermediaryId ?? null,
    },
  });

  const updated = await getFinancingRequestByLeadId(leadId);
  if (!updated) {
    throw Object.assign(new Error("Finance request not found"), { code: "NOT_FOUND" });
  }
  return updated;
}

/* ── Intermediaries ────────────────────────────────────── */

function mapIntermediary(r: {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
}): FinancingIntermediaryRow {
  return {
    id: r.id,
    name: r.name,
    contact_email: r.contactEmail,
    contact_phone: r.contactPhone,
    notes: r.notes,
    is_active: r.isActive ?? true,
    created_at: r.createdAt ? r.createdAt.toISOString() : null,
  };
}

const intermediarySelection = {
  id: financingIntermediaries.id,
  name: financingIntermediaries.name,
  contactEmail: financingIntermediaries.contactEmail,
  contactPhone: financingIntermediaries.contactPhone,
  notes: financingIntermediaries.notes,
  isActive: financingIntermediaries.isActive,
  createdAt: financingIntermediaries.createdAt,
} as const;

export async function listIntermediaries(): Promise<FinancingIntermediaryRow[]> {
  const rows = await db
    .select(intermediarySelection)
    .from(financingIntermediaries)
    .orderBy(desc(financingIntermediaries.isActive), asc(financingIntermediaries.name));
  return rows.map(mapIntermediary);
}

export async function createIntermediary(params: {
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  adminUserId: string;
}): Promise<FinancingIntermediaryRow> {
  const [row] = await db
    .insert(financingIntermediaries)
    .values({
      name: params.name,
      contactEmail: params.contactEmail ?? null,
      contactPhone: params.contactPhone ?? null,
      notes: params.notes ?? null,
    })
    .returning(intermediarySelection);

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: params.adminUserId,
    reason: "financing_intermediary_create",
    metadata: { intermediary_id: row!.id, name: params.name },
  });

  return mapIntermediary(row!);
}

export async function updateIntermediary(params: {
  id: string;
  name?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  isActive?: boolean;
  adminUserId: string;
}): Promise<FinancingIntermediaryRow> {
  const set: Partial<typeof financingIntermediaries.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (params.name !== undefined) set.name = params.name;
  if (params.contactEmail !== undefined) set.contactEmail = params.contactEmail;
  if (params.contactPhone !== undefined) set.contactPhone = params.contactPhone;
  if (params.notes !== undefined) set.notes = params.notes;
  if (params.isActive !== undefined) set.isActive = params.isActive;

  const [row] = await db
    .update(financingIntermediaries)
    .set(set)
    .where(eq(financingIntermediaries.id, params.id))
    .returning(intermediarySelection);

  if (!row) {
    throw Object.assign(new Error("Intermediary not found"), { code: "NOT_FOUND" });
  }

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: params.adminUserId,
    reason: "financing_intermediary_update",
    metadata: { intermediary_id: params.id },
  });

  return mapIntermediary(row);
}
