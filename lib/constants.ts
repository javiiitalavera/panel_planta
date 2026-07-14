import type { PatientDraft } from "@/lib/types";

export const EMPTY_PATIENT_DRAFT: PatientDraft = {
  identifier: "",
  age: null,
  admissionDate: "",
  admissionReason: "",
  relevantHistory: "",
  clinicalStatus: "",
  therapeuticPlan: "",
  socialPlan: "",
};

export const APP_NAME = "Pase clínico";
