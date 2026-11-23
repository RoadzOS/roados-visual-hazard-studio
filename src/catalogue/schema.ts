/**
 * RVHL 1.0 catalogue schema.
 *
 * The catalogue is UI-independent: JSON source files in ./data are loaded,
 * merged with family defaults and validated against these schemas.
 * The same JSON (normalised) is what the export centre ships and what a future
 * API / C++ Skia SDK will consume.
 */
import { z } from 'zod';

export const SEVERITY_LEVELS = ['S1', 'S2', 'S3', 'S4', 'S5'] as const;
export const SeveritySchema = z.enum(SEVERITY_LEVELS);
export type Severity = z.infer<typeof SeveritySchema>;

export const FAMILY_IDS = [
  'traffic_signals',
  'signs',
  'road_markings',
  'road_infrastructure',
  'road_geometry',
  'road_damage',
  'speed_control',
  'temporary_obstacles',
  'debris',
  'environmental',
  'moving_hazards',
  'visibility_roadside',
  'bridge_structures',
  'vehicle_context',
] as const;
export const FamilySchema = z.enum(FAMILY_IDS);
export type FamilyId = z.infer<typeof FamilySchema>;

/**
 * standardised          – element is defined by an official standard / convention document.
 * convention_inspired   – element follows conventional sign geometry but its exact form is a RoadOS rendering.
 * non_standard_hazard   – real-world hazard not covered by sign standards (e.g. potholes, debris).
 * roados_extension      – RoadOS-only information concept (vehicle context, data-quality states).
 */
export const StandardStatusSchema = z.enum([
  'standardised',
  'convention_inspired',
  'non_standard_hazard',
  'roados_extension',
]);
export type StandardStatus = z.infer<typeof StandardStatusSchema>;

export const FrameSchema = z.enum([
  'warning_triangle',
  'prohibitory_circle',
  'mandatory_circle',
  'stop_octagon',
  'give_way_triangle',
  'info_rect',
  'direction_board',
  'roados_hazard',
  'roados_marking',
  'roados_infrastructure',
  'roados_signal',
  'roados_context',
]);
export type Frame = z.infer<typeof FrameSchema>;

export const DetectionMethodSchema = z.enum([
  'camera',
  'motion_sensor',
  'community_report',
  'map_data',
  'authority_feed',
  'v2x',
  'radar',
  'lidar',
  'weather_feed',
  'vehicle_bus',
  'manual_survey',
]);
export type DetectionMethod = z.infer<typeof DetectionMethodSchema>;

export const SeverityFactorSchema = z.enum([
  'physical_size',
  'height_or_depth',
  'lane_position',
  'approach_speed',
  'distance',
  'visibility',
  'surface_condition',
  'traffic_density',
  'vehicle_type',
]);
export type SeverityFactor = z.infer<typeof SeverityFactorSchema>;

export const ReferenceLinkSchema = z.object({
  /** id of a document in references.json */
  doc: z.string(),
  /** How the element relates to the document. */
  relation: z.enum(['explicitly_standardised', 'inspired_by_convention', 'related_guidance', 'roados_extension']),
  /** Clause / figure / page. MUST stay null until verified against the official text. */
  clause: z.string().nullable().default(null),
  figure: z.string().nullable().default(null),
  page: z.string().nullable().default(null),
  verification: z.enum(['pending', 'verified']).default('pending'),
  verifiedBy: z.string().optional(),
  verifiedOn: z.string().optional(),
  note: z.string().optional(),
});
export type ReferenceLink = z.infer<typeof ReferenceLinkSchema>;

export const SpeedRulesSchema = z.object({
  /** independent: legal limit is shown only from map/authority/sign data, never derived from the hazard. defines: the element itself carries a legal limit. */
  legalLimit: z.enum(['independent', 'defines', 'not_applicable']),
  /** conditional: RoadOS may compute an advisory speed when factors justify it. */
  advisory: z.enum(['conditional', 'never', 'recommended']),
  notes: z.string().optional(),
});

export const DimensionsSchema = z.object({
  typical: z.string().optional(),
  measuredFields: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

/** Raw entry as authored in JSON (family defaults fill the gaps). */
export const RawEntrySchema = z.object({
  id: z.string().regex(/^[A-Z]{3}-\d{3}$/),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9_]+$/).optional(),
  description: z.string().min(1),
  glyph: z.string().min(1),
  glyphVariant: z.string().optional(),
  frame: FrameSchema.optional(),
  /** Frame used when the "standard" representation is requested, if a convention form exists. */
  standardFrame: FrameSchema.optional(),
  slash: z.boolean().optional(),
  legend: z.string().optional(),
  standardStatus: StandardStatusSchema.optional(),
  variants: z.array(z.string()).optional(),
  severity: z.object({ default: SeveritySchema, dynamic: z.boolean().default(true) }).optional(),
  severityDefault: SeveritySchema.optional(),
  escalation: z.array(z.string()).optional(),
  speed: SpeedRulesSchema.optional(),
  detectionMethods: z.array(DetectionMethodSchema).optional(),
  confidence: z.object({ minimumToDisplay: z.number().min(0).max(1), minimumToAlert: z.number().min(0).max(1) }).optional(),
  dimensions: DimensionsSchema.optional(),
  references: z.array(ReferenceLinkSchema).optional(),
  tags: z.array(z.string()).optional(),
});
export type RawEntry = z.infer<typeof RawEntrySchema>;

export const FamilyDefaultsSchema = z.object({
  id: FamilySchema,
  code: z.string().length(3),
  letter: z.string().length(1),
  label: z.string(),
  section: z.enum(['signs', 'markings', 'infrastructure', 'hazards', 'context']),
  description: z.string(),
  frame: FrameSchema,
  standardStatus: StandardStatusSchema,
  severityDefault: SeveritySchema,
  dynamicSeverity: z.boolean(),
  severityFactors: z.array(SeverityFactorSchema),
  escalation: z.array(z.string()),
  speed: SpeedRulesSchema,
  detectionMethods: z.array(DetectionMethodSchema),
  confidence: z.object({ minimumToDisplay: z.number(), minimumToAlert: z.number() }),
  dimensions: DimensionsSchema,
  references: z.array(ReferenceLinkSchema),
});
export type FamilyDefaults = z.infer<typeof FamilyDefaultsSchema>;

/** Fully normalised entry: what the app, exports and the future SDK consume. */
export const CatalogueEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  family: FamilySchema,
  description: z.string(),
  standardStatus: StandardStatusSchema,
  frame: FrameSchema,
  standardFrame: FrameSchema.nullable(),
  variants: z.array(z.string()),
  severity: z.object({ default: SeveritySchema, dynamic: z.boolean(), factors: z.array(SeverityFactorSchema) }),
  escalation: z.array(z.string()),
  speed: SpeedRulesSchema,
  detectionMethods: z.array(DetectionMethodSchema),
  confidence: z.object({ minimumToDisplay: z.number(), minimumToAlert: z.number() }),
  dimensions: DimensionsSchema,
  visual: z.object({
    glyph: z.string(),
    glyphVariant: z.string().nullable(),
    slash: z.boolean(),
    legend: z.string().nullable(),
    asset: z.string(),
  }),
  references: z.array(ReferenceLinkSchema),
  tags: z.array(z.string()),
  version: z.string(),
});
export type CatalogueEntry = z.infer<typeof CatalogueEntrySchema>;

export const ReferenceDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  identifier: z.string(),
  publisher: z.string(),
  edition: z.string().nullable(),
  url: z.string().url(),
  urlKind: z.enum(['document', 'catalogue_page', 'publisher_portal']),
  urlNote: z.string().optional(),
  scope: z.string(),
  licensing: z.string(),
  metadataVerification: z.enum(['pending', 'verified']),
});
export type ReferenceDoc = z.infer<typeof ReferenceDocSchema>;
