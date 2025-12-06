export interface BinderTestExtractedData {
  performanceGrade: string | null;
  flashPointCOC_C: number | null;
  viscosity155_PaS: number | null;

  pgHigh: number | null;
  pgLow: number | null;
  softeningPointC: number | null;
  viscosity155_cP: number | null;
  ductilityCm: number | null;
  recoveryPct: number | null;
  jnr_3_2: number | null;

  dsr_original_82C_kPa: number | null;
  rtfo_massChange_pct: number | null;
  dsr_rtfo_82C_kPa: number | null;
  dsr_pav_34C_kPa: number | null;
  bbr_stiffness_minus12C_MPa: number | null;
  bbr_mValue_minus12C: number | null;
  mscr_jnr_3_2_kPa_inv: number | null;
  mscr_percentRecovery_64C_pct: number | null;
  mscr_percentRecoveryOverall_pct: number | null;

  testingLocation: string | null;
  testReportNumber: string | null;
  sampleName: string | null;
  testDate: string | null;
  labName: string | null;

  dsrData: Record<string, number> | null;
}

export type ValueSource = "manual" | "parser" | "ai";

export type BinderTestValueSources = {
  [K in keyof BinderTestExtractedData]?: ValueSource;
};

export const EMPTY_EXTRACTED: BinderTestExtractedData = {
  performanceGrade: null,
  flashPointCOC_C: null,
  viscosity155_PaS: null,
  pgHigh: null,
  pgLow: null,
  softeningPointC: null,
  viscosity155_cP: null,
  ductilityCm: null,
  recoveryPct: null,
  jnr_3_2: null,
  dsr_original_82C_kPa: null,
  rtfo_massChange_pct: null,
  dsr_rtfo_82C_kPa: null,
  dsr_pav_34C_kPa: null,
  bbr_stiffness_minus12C_MPa: null,
  bbr_mValue_minus12C: null,
  mscr_jnr_3_2_kPa_inv: null,
  mscr_percentRecovery_64C_pct: null,
  mscr_percentRecoveryOverall_pct: null,
  testingLocation: null,
  testReportNumber: null,
  sampleName: null,
  testDate: null,
  labName: null,
  dsrData: null,
};
