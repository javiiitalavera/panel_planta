"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Patient } from "@/lib/types";
import { formatAdmissionDays, formatDate, getAdmissionDays } from "@/lib/date";
import {
  Archive,
  ArchiveRestore,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "@/components/icons";

const sections = [
  ["Ingreso", "admissionReason"],
  ["Antecedentes relevantes", "relevantHistory"],
  ["Situación clínica", "clinicalStatus"],
  ["Plan terapéutico", "therapeuticPlan"],
  ["Plan social", "socialPlan"],
] as const;

type PatientCardProps = {
  patient: Patient;
  dragDisabled: boolean;
  onEdit: (patient: Patient) => void;
  onToggleArchived: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
};

export function PatientCard({
  patient,
  dragDisabled,
  onEdit,
  onToggleArchived,
  onDelete,
}: PatientCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const days = getAdmissionDays(patient.admissionDate);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: patient.id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-visible rounded-[18px] border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.035)] transition-[box-shadow,border-color,opacity] duration-200 hover:border-slate-300 hover:shadow-[0_8px_28px_rgba(16,24,40,0.07)] ${
        isDragging ? "border-slate-400 opacity-80 shadow-xl" : "border-slate-200"
      }`}
    >
      <header className="flex items-start gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5">
        <button
          type="button"
          aria-label="Reordenar paciente"
          title={dragDisabled ? "El orden solo se puede cambiar sin filtros" : "Arrastrar para reordenar"}
          disabled={dragDisabled}
          className="mt-0.5 -ml-1 hidden h-8 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 active:cursor-grabbing disabled:cursor-default disabled:opacity-25 sm:flex"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={17} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          onClick={() => onEdit(patient)}
        >
          <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-slate-900">
            {patient.identifier || "Paciente sin identificar"}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
            {patient.age !== null && <span>{patient.age} años</span>}
            {patient.admissionDate && (
              <>
                <span aria-hidden="true">·</span>
                <span>Ingreso {formatDate(patient.admissionDate)}</span>
              </>
            )}
            {days !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatAdmissionDays(days)}</span>
              </>
            )}
          </div>
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Acciones del paciente"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(patient);
                  }}
                >
                  <Pencil size={15} /> Editar
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleArchived(patient);
                  }}
                >
                  {patient.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  {patient.archived ? "Reactivar" : "Archivar"}
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(patient);
                  }}
                >
                  <Trash2 size={15} /> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <button
        type="button"
        className="block w-full px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500"
        onClick={() => onEdit(patient)}
      >
        <div className="space-y-3">
          {sections.map(([title, key]) => (
            <section key={key}>
              <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.095em] text-slate-500">
                {title}
              </h3>
              <p className={`whitespace-pre-wrap text-[13px] leading-[1.42] ${patient[key] ? "text-slate-700" : "text-slate-300"}`}>
                {patient[key] || "—"}
              </p>
            </section>
          ))}
        </div>
      </button>
    </article>
  );
}
