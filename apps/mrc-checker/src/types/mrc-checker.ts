import { z } from "zod";

export const fieldStatusSchema = z.enum(["matched", "missing", "attention"]);
export const clauseStatusSchema = z.enum(["present", "missing", "attention"]);
export const issueSeveritySchema = z.enum(["warning", "referral"]);

export const mrcCheckRequestSchema = z.object({
  mrcText: z.string().min(80, "Provide MRC text with enough detail for deterministic checks."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

export const mrcStructuredDataSchema = z.object({
  uniqueMarketReference: z.string().nullable(),
  insuredName: z.string().nullable(),
  broker: z.string().nullable(),
  contractType: z.string().nullable(),
  interest: z.string().nullable(),
  inceptionDate: z.string().nullable(),
  expiryDate: z.string().nullable(),
  territory: z.string().nullable(),
  limit: z.string().nullable(),
  currency: z.string().nullable(),
  retention: z.string().nullable(),
  premiumPaymentTerms: z.string().nullable(),
  claimsNotification: z.string().nullable(),
  governingLaw: z.string().nullable(),
  jurisdiction: z.string().nullable(),
  subjectivitiesExplicitlyCleared: z.boolean(),
  subjectivities: z.array(z.string()),
  notableClauseMentions: z.array(z.string())
});

export const fieldCheckSchema = z.object({
  fieldKey: z.string(),
  label: z.string(),
  required: z.boolean(),
  status: fieldStatusSchema,
  extractedValue: z.string().nullable(),
  evidence: z.string().nullable(),
  rationale: z.string()
});

export const clauseCheckSchema = z.object({
  clauseKey: z.string(),
  label: z.string(),
  status: clauseStatusSchema,
  snippet: z.string().nullable(),
  rationale: z.string()
});

export const issueSchema = z.object({
  severity: issueSeveritySchema,
  title: z.string(),
  rationale: z.string(),
  action: z.string(),
  relatedKeys: z.array(z.string()),
  snippet: z.string().nullable()
});

export const queryHitSchema = z.object({
  section: z.string(),
  label: z.string(),
  snippet: z.string()
});

export const commentarySchema = z.object({
  executiveSummary: z.string(),
  observations: z.array(z.string()),
  actions: z.array(z.string())
});

export const mrcSummarySchema = z.object({
  fieldCoverage: z.number().int().min(0).max(100),
  matchedFields: z.number().int().min(0),
  attentionFields: z.number().int().min(0),
  missingFields: z.number().int().min(0),
  gatePassed: z.boolean(),
  requiredFieldCount: z.number().int().min(0),
  missingRequiredFields: z.array(z.string()),
  warningCount: z.number().int().min(0),
  referralCount: z.number().int().min(0),
  clauseAttentionCount: z.number().int().min(0)
});

export const mrcInsightSchema = z.object({
  structuredData: mrcStructuredDataSchema,
  fieldChecks: z.array(fieldCheckSchema),
  clauseChecks: z.array(clauseCheckSchema),
  warnings: z.array(issueSchema),
  referrals: z.array(issueSchema),
  commentary: commentarySchema,
  summary: mrcSummarySchema,
  query: z.object({
    question: z.string().nullable(),
    hits: z.array(queryHitSchema)
  })
});

export const persistenceSchema = z.object({
  status: z.enum(["stored", "failed", "skipped"]),
  reason: z.string().optional()
});

export const mrcCheckResponseSchema = z.object({
  requestId: z.string().uuid(),
  analysis: mrcInsightSchema,
  persistence: persistenceSchema,
  processingTimeMs: z.number().nonnegative()
});

export type MrcCheckRequest = z.infer<typeof mrcCheckRequestSchema>;
export type MrcStructuredData = z.infer<typeof mrcStructuredDataSchema>;
export type FieldCheck = z.infer<typeof fieldCheckSchema>;
export type ClauseCheck = z.infer<typeof clauseCheckSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type QueryHit = z.infer<typeof queryHitSchema>;
export type Commentary = z.infer<typeof commentarySchema>;
export type MrcSummary = z.infer<typeof mrcSummarySchema>;
export type MrcInsight = z.infer<typeof mrcInsightSchema>;
export type Persistence = z.infer<typeof persistenceSchema>;
export type MrcCheckResponse = z.infer<typeof mrcCheckResponseSchema>;
