import Dexie, { type EntityTable } from "dexie";
import type { Patient, PatientDraft } from "@/lib/types";
import { sanitizeRichText } from "@/lib/rich-text";

class PatientDatabase extends Dexie {
  patients!: EntityTable<Patient, "id">;

  constructor() {
    super("pase-clinico-local");

    this.version(1).stores({
      patients: "id, archived, order, identifier, updatedAt",
    });
  }
}

export const db = new PatientDatabase();

function normalizeDraft(draft: PatientDraft): PatientDraft {
  return {
    identifier: draft.identifier.trim(),
    age: draft.age,
    admissionDate: draft.admissionDate,
    admissionReason: sanitizeRichText(draft.admissionReason),
    relevantHistory: sanitizeRichText(draft.relevantHistory),
    clinicalStatus: sanitizeRichText(draft.clinicalStatus),
    therapeuticPlan: sanitizeRichText(draft.therapeuticPlan),
    socialPlan: sanitizeRichText(draft.socialPlan),
  };
}

export async function createPatient(draft: PatientDraft): Promise<Patient> {
  const last = await db.patients.orderBy("order").last();
  const now = new Date().toISOString();
  const patient: Patient = {
    id: crypto.randomUUID(),
    ...normalizeDraft(draft),
    archived: false,
    order: (last?.order ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  };

  await db.patients.add(patient);
  return patient;
}

export async function updatePatient(
  id: string,
  draft: PatientDraft,
): Promise<void> {
  await db.patients.update(id, {
    ...normalizeDraft(draft),
    updatedAt: new Date().toISOString(),
  });
}

export async function setPatientArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const maxOrder = await db.patients.orderBy("order").last();
  await db.patients.update(id, {
    archived,
    order: (maxOrder?.order ?? -1) + 1,
    updatedAt: new Date().toISOString(),
  });
}

export async function deletePatient(id: string): Promise<void> {
  await db.patients.delete(id);
}

export async function updatePatientOrder(ids: string[]): Promise<void> {
  await db.transaction("rw", db.patients, async () => {
    await Promise.all(
      ids.map((id, index) => db.patients.update(id, { order: index })),
    );
  });
}

export async function replaceAllPatients(patients: Patient[]): Promise<void> {
  await db.transaction("rw", db.patients, async () => {
    await db.patients.clear();
    await db.patients.bulkAdd(patients);
  });
}
