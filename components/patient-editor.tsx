"use client";

import { useEffect, useState } from "react";
import type { Patient, PatientDraft } from "@/lib/types";
import { EMPTY_PATIENT_DRAFT } from "@/lib/constants";
import { X } from "@/components/icons";
import { RichTextField } from "@/components/rich-text-field";

type PatientEditorProps = {
  patient: Patient | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: PatientDraft) => Promise<void>;
};

export function PatientEditor({
  patient,
  open,
  saving,
  onClose,
  onSave,
}: PatientEditorProps) {
  const [draft, setDraft] = useState<PatientDraft>(() =>
    patient
      ? {
          identifier: patient.identifier,
          age: patient.age,
          admissionDate: patient.admissionDate,
          admissionReason: patient.admissionReason,
          relevantHistory: patient.relevantHistory,
          clinicalStatus: patient.clinicalStatus,
          therapeuticPlan: patient.therapeuticPlan,
          socialPlan: patient.socialPlan,
        }
      : EMPTY_PATIENT_DRAFT,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const setField = <K extends keyof PatientDraft>(
    key: K,
    value: PatientDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!draft.identifier.trim()) {
      setError("Escribe un identificador para el paciente.");
      return;
    }

    try {
      await onSave(draft);
    } catch {
      setError("No se ha podido guardar. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Cerrar editor"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-editor-title"
        className="relative z-10 flex h-full w-full max-w-[640px] flex-col border-l border-slate-200 bg-slate-50 shadow-2xl shadow-slate-950/15"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              {patient ? "Editar ficha" : "Nueva ficha"}
            </p>
            <h2 id="patient-editor-title" className="mt-0.5 text-lg font-semibold text-slate-900">
              {patient?.identifier || "Nuevo paciente"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_130px_170px]">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Identificador</span>
                <input
                  autoFocus
                  value={draft.identifier}
                  placeholder="Ej. Paciente 26"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                  onChange={(event) => setField("identifier", event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Edad</span>
                <input
                  type="number"
                  min={0}
                  max={130}
                  inputMode="numeric"
                  value={draft.age ?? ""}
                  placeholder="Edad"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                  onChange={(event) =>
                    setField("age", event.target.value ? Number(event.target.value) : null)
                  }
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Fecha de ingreso</span>
                <input
                  type="date"
                  value={draft.admissionDate}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-800 outline-none transition focus:border-slate-400 focus:ring-3 focus:ring-slate-100"
                  onChange={(event) => setField("admissionDate", event.target.value)}
                />
              </label>
            </div>

            <div className="mt-5 space-y-4">
              <RichTextField
                label="Ingreso"
                value={draft.admissionReason}
                placeholder="Motivos principales del ingreso."
                onChange={(value) => setField("admissionReason", value)}
              />
              <RichTextField
                label="Antecedentes relevantes"
                value={draft.relevantHistory}
                placeholder="Solo aquello que conviene tener siempre presente."
                onChange={(value) => setField("relevantHistory", value)}
              />
              <RichTextField
                label="Situación clínica"
                value={draft.clinicalStatus}
                placeholder="Problemas actuales: sueño, piel, tránsito, tensión, marcha, conducta…"
                onChange={(value) => setField("clinicalStatus", value)}
              />
              <RichTextField
                label="Plan terapéutico"
                value={draft.therapeuticPlan}
                placeholder="Qué estás cambiando o vigilando en este momento."
                onChange={(value) => setField("therapeuticPlan", value)}
              />
              <RichTextField
                label="Plan social"
                value={draft.socialPlan}
                placeholder="Con quién vive, destino al alta y recursos en gestión."
                onChange={(value) => setField("socialPlan", value)}
              />
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
            {error && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar ficha"}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
