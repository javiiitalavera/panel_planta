export type Patient = {
  id: string;
  identifier: string;
  age: number | null;
  admissionDate: string;
  admissionReason: string;
  relevantHistory: string;
  clinicalStatus: string;
  therapeuticPlan: string;
  socialPlan: string;
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type PatientDraft = Pick<
  Patient,
  | "identifier"
  | "age"
  | "admissionDate"
  | "admissionReason"
  | "relevantHistory"
  | "clinicalStatus"
  | "therapeuticPlan"
  | "socialPlan"
>;

export type BackupFile = {
  version: 1;
  exportedAt: string;
  patients: Patient[];
};
