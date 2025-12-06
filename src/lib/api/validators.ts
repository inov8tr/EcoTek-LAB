import { z } from "zod";

// Shared helpers
export const uuidString = z.string().uuid("Invalid id");

// Generic rule: 0–100 %
export const percentage = z.coerce
  .number()
  .min(0, "Must be >= 0")
  .max(100, "Must be <= 100");

// EcoCap % range: 5–20 %
export const ecoCapPercentage = z.coerce
  .number()
  .min(5, "EcoCap % must be at least 5")
  .max(20, "EcoCap % must be at most 20");

// Reagent (Aerosil) % range: 0–5 %
export const reagentPercentage = z.coerce
  .number()
  .min(0, "Reagent % must be >= 0")
  .max(5, "Reagent % must be <= 5");

// Capsule material composition
export const capsuleMaterial = z.object({
  materialName: z.string().trim().min(1, "Material name is required"),
  percentage,
});

export const capsuleBody = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  materials: z.array(capsuleMaterial).min(2).max(10),
});

// Bitumen origin details
export const bitumenOriginBody = z.object({
  refineryName: z.string().trim().min(1),
  binderGrade: z.string().trim().min(1),
  originCountry: z.string().trim().optional().default(""),
  description: z.string().optional().default(""),
});

// Base bitumen tests
export const bitumenTestBody = z.object({
  bitumenOriginId: uuidString,
  batchCode: z.string().trim().min(1),
  softeningPoint: z.coerce.number().optional(),
  penetration: z.coerce.number().optional(),
  viscosity135: z.coerce.number().optional(),
  viscosity165: z.coerce.number().optional(),
  basePgHigh: z.coerce.number().optional(),
  basePgLow: z.coerce.number().optional(),
  baseDuctility: z.coerce.number().optional(),
  baseRecovery: z.coerce.number().optional(),
  notes: z.string().optional(),
  testedAt: z.string().optional(),
});

// PMA Formula Info
const optionalUuid = z.union([uuidString, z.null()]).optional();

export const pmaFormulaBody = z.object({
  name: z.string().trim().min(1, "Name is required"),
  capsuleFormulaId: uuidString,
  bitumenOriginId: uuidString,
  bitumenTestId: optionalUuid,
  ecoCapPercentage,
  reagentPercentage,
  mixRpm: z.coerce.number().optional(),
  mixTimeMinutes: z.coerce.number().optional(),
  targetPgHigh: z.coerce.number().optional(),
  targetPgLow: z.coerce.number().optional(),
  bitumenGradeOverride: z.string().optional(),
  notes: z.string().optional(),
});

// PMA Batch
export const pmaBatchBody = z.object({
  pmaFormulaId: uuidString,
  batchCode: z.string().trim().min(1),
  sampleDate: z.string().optional(),
  notes: z.string().optional(),
});

// PMA Test Results
export const pmaResultBody = z.object({
  pmaBatchId: uuidString,
  softeningPoint: z.coerce.number().optional(),
  viscosity135: z.coerce.number().optional(),
  viscosity165: z.coerce.number().optional(),
  ductility: z.coerce.number().optional(),
  elasticRecovery: z.coerce.number().optional(),
  storageStabilityDifference: z.coerce.number().min(0).max(100).optional(),
  pgHigh: z.coerce.number().optional(),
  pgLow: z.coerce.number().optional(),

  // DSR original
  dsrOriginalTemp: z.coerce.number().optional(),
  dsrOriginalGOverSin: z.coerce.number().optional(),

  // DSR RTFO
  dsrRtfoTemp: z.coerce.number().optional(),
  dsrRtfoGOverSin: z.coerce.number().optional(),

  // DSR PAV
  dsrPavTemp: z.coerce.number().optional(),
  dsrPavGTimesSin: z.coerce.number().optional(),

  // BBR
  bbrTemp: z.coerce.number().optional(),
  bbrStiffness: z.coerce.number().optional(),
  bbrMValue: z.coerce.number().optional(),
});
