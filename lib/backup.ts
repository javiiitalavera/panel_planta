import { z } from "zod";
import type { BackupFile, Patient } from "@/lib/types";
import { fileDate } from "@/lib/date";
import { sanitizeRichText } from "@/lib/rich-text";

const patientSchema = z.object({
  id: z.string().min(1),
  identifier: z.string(),
  age: z.number().int().min(0).max(130).nullable(),
  admissionDate: z.string(),
  admissionReason: z.string(),
  relevantHistory: z.string(),
  clinicalStatus: z.string(),
  therapeuticPlan: z.string(),
  socialPlan: z.string(),
  archived: z.boolean(),
  order: z.number().finite(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  patients: z.array(patientSchema),
});

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportBackup(patients: Patient[]): void {
  const backup: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    patients,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  downloadBlob(blob, `copia-pacientes-javi-${fileDate()}.json`);
}

export async function parseBackup(file: File): Promise<Patient[]> {
  const text = await file.text();
  const json: unknown = JSON.parse(text);
  const parsed = backupSchema.parse(json);

  return parsed.patients
    .map((patient, index) => ({
      ...patient,
      admissionReason: sanitizeRichText(patient.admissionReason),
      relevantHistory: sanitizeRichText(patient.relevantHistory),
      clinicalStatus: sanitizeRichText(patient.clinicalStatus),
      therapeuticPlan: sanitizeRichText(patient.therapeuticPlan),
      socialPlan: sanitizeRichText(patient.socialPlan),
      order: Number.isFinite(patient.order) ? patient.order : index,
    }))
    .sort((a, b) => a.order - b.order);
}
