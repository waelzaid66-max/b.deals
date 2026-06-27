import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  successResponse,
  errorResponse,
  validateResponse,
  FinancingRequestsQuerySchema,
  UpdateFinancingRequestSchema,
  CreateFinancingIntermediarySchema,
  UpdateFinancingIntermediarySchema,
  FinancingRequestSchema,
  FinancingIntermediarySchema,
} from "../validators/schemas";
import * as FinancingService from "../services/FinancingService";

function handleError(res: Response, err: unknown, label: string, fallback: string) {
  if (err instanceof ZodError) {
    return res.status(400).json(errorResponse("INVALID_DATA", err.errors[0]?.message ?? "Invalid data"));
  }
  const e = err as { code?: string; message?: string };
  if (e.code === "NOT_FOUND") {
    return res.status(404).json(errorResponse("NOT_FOUND", e.message ?? "Not found"));
  }
  if (e.code === "INVALID_DATA") {
    return res.status(400).json(errorResponse("INVALID_DATA", e.message ?? "Invalid data"));
  }
  console.error(label, err);
  return res.status(500).json(errorResponse("INTERNAL_ERROR", fallback));
}

/* ── Requests ──────────────────────────────────────────── */

export async function financingRequestsHandler(req: Request, res: Response) {
  try {
    const query = FinancingRequestsQuerySchema.parse(req.query);
    const result = await FinancingService.listFinancingRequests({
      category: query.category,
      status: query.status,
      search: query.search,
      dateFrom: query.date_from,
      dateTo: query.date_to,
      cursor: query.cursor,
      limit: query.limit,
    });
    const validated = validateResponse(FinancingRequestSchema.array(), result.items);
    return res.json(successResponse(validated, { cursor: result.cursor, has_next: result.has_next }));
  } catch (err) {
    return handleError(res, err, "[Financing requests]", "Failed to load financing requests");
  }
}

export async function financingRequestsExportHandler(req: Request, res: Response) {
  try {
    const query = FinancingRequestsQuerySchema.parse(req.query);
    const csv = await FinancingService.exportFinancingRequestsCsv({
      category: query.category,
      status: query.status,
      search: query.search,
      dateFrom: query.date_from,
      dateTo: query.date_to,
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="financing-requests-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    return handleError(res, err, "[Financing export]", "Failed to export financing requests");
  }
}

export async function updateFinancingRequestHandler(req: Request, res: Response) {
  try {
    const leadId = req.params.leadId as string;
    const input = UpdateFinancingRequestSchema.parse(req.body);
    const result = await FinancingService.updateFinancingRequest({
      leadId,
      status: input.status,
      intermediaryId: input.intermediary_id,
      notes: input.notes,
      adminUserId: req.dbUserId!,
    });
    return res.json(successResponse(validateResponse(FinancingRequestSchema, result)));
  } catch (err) {
    return handleError(res, err, "[Financing update]", "Failed to update financing request");
  }
}

/* ── Intermediaries ────────────────────────────────────── */

export async function financingIntermediariesHandler(_req: Request, res: Response) {
  try {
    const result = await FinancingService.listIntermediaries();
    return res.json(successResponse(validateResponse(FinancingIntermediarySchema.array(), result)));
  } catch (err) {
    return handleError(res, err, "[Financing intermediaries]", "Failed to load intermediaries");
  }
}

export async function createFinancingIntermediaryHandler(req: Request, res: Response) {
  try {
    const input = CreateFinancingIntermediarySchema.parse(req.body);
    const result = await FinancingService.createIntermediary({
      name: input.name,
      contactEmail: input.contact_email,
      contactPhone: input.contact_phone,
      notes: input.notes,
      adminUserId: req.dbUserId!,
    });
    return res.json(successResponse(validateResponse(FinancingIntermediarySchema, result)));
  } catch (err) {
    return handleError(res, err, "[Financing intermediary create]", "Failed to create intermediary");
  }
}

export async function updateFinancingIntermediaryHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const input = UpdateFinancingIntermediarySchema.parse(req.body);
    const result = await FinancingService.updateIntermediary({
      id,
      name: input.name,
      contactEmail: input.contact_email,
      contactPhone: input.contact_phone,
      notes: input.notes,
      isActive: input.is_active,
      adminUserId: req.dbUserId!,
    });
    return res.json(successResponse(validateResponse(FinancingIntermediarySchema, result)));
  } catch (err) {
    return handleError(res, err, "[Financing intermediary update]", "Failed to update intermediary");
  }
}
