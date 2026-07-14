"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useLiveQuery } from "dexie-react-hooks";
import type { Patient, PatientDraft } from "@/lib/types";
import {
  createPatient,
  db,
  deletePatient,
  replaceAllPatients,
  setPatientArchived,
  updatePatient,
  updatePatientOrder,
} from "@/lib/db";
import { exportBackup, parseBackup } from "@/lib/backup";
import { exportPatientsToWord } from "@/lib/export-docx";
import { PatientCard } from "@/components/patient-card";
import { PatientEditor } from "@/components/patient-editor";
import { Toolbar } from "@/components/toolbar";
import { HardDrive, Plus, Search } from "@/components/icons";

type Notice = {
  tone: "success" | "error";
  text: string;
};

export function PatientDashboard() {
  const patients = useLiveQuery(() => db.patients.orderBy("order").toArray(), []);
  const [search, setSearch] = useState("");
  const [showingArchived, setShowingArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [exportingWord, setExportingWord] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const allPatients = useMemo(() => patients ?? [], [patients]);
  const activePatients = useMemo(
    () => allPatients.filter((patient) => !patient.archived),
    [allPatients],
  );
  const archivedPatients = useMemo(
    () => allPatients.filter((patient) => patient.archived),
    [allPatients],
  );

  const currentPatients = showingArchived ? archivedPatients : activePatients;
  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const visiblePatients = useMemo(() => {
    if (!normalizedSearch) return currentPatients;

    return currentPatients.filter((patient) =>
      [
        patient.identifier,
        patient.admissionReason,
        patient.relevantHistory,
        patient.clinicalStatus,
        patient.therapeuticPlan,
        patient.socialPlan,
      ].some((value) => value.toLocaleLowerCase("es").includes(normalizedSearch)),
    );
  }, [currentPatients, normalizedSearch]);

  const showNotice = useCallback((nextNotice: Notice) => {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const openNewPatient = () => {
    setEditingPatient(null);
    setEditorOpen(true);
  };

  const openPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditorOpen(true);
  };

  const closeEditor = useCallback(() => {
    if (saving) return;
    setEditorOpen(false);
    setEditingPatient(null);
  }, [saving]);

  const savePatient = async (draft: PatientDraft) => {
    setSaving(true);
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, draft);
        showNotice({ tone: "success", text: "Ficha actualizada." });
      } else {
        await createPatient(draft);
        showNotice({ tone: "success", text: "Paciente creado." });
      }
      setEditorOpen(false);
      setEditingPatient(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleArchived = async (patient: Patient) => {
    await setPatientArchived(patient.id, !patient.archived);
    showNotice({
      tone: "success",
      text: patient.archived ? "Paciente reactivado." : "Paciente archivado.",
    });
  };

  const removePatient = async (patient: Patient) => {
    const confirmed = window.confirm(
      `¿Eliminar definitivamente la ficha de “${patient.identifier}”? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    await deletePatient(patient.id);
    showNotice({ tone: "success", text: "Ficha eliminada." });
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || search || showingArchived) return;

    const oldIndex = activePatients.findIndex((patient) => patient.id === active.id);
    const newIndex = activePatients.findIndex((patient) => patient.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(activePatients, oldIndex, newIndex);
    await updatePatientOrder(reordered.map((patient) => patient.id));
  };

  const handleExportWord = async () => {
    if (!activePatients.length || exportingWord) return;
    setExportingWord(true);
    try {
      await exportPatientsToWord(activePatients);
      showNotice({ tone: "success", text: "Documento Word generado." });
    } catch {
      showNotice({ tone: "error", text: "No se ha podido generar el Word." });
    } finally {
      setExportingWord(false);
    }
  };

  const handleImport = async (file: File) => {
    const confirmed = window.confirm(
      "La importación reemplazará todos los datos que tienes ahora en este navegador. ¿Continuar?",
    );
    if (!confirmed) return;

    try {
      const importedPatients = await parseBackup(file);
      await replaceAllPatients(importedPatients);
      setShowingArchived(false);
      setSearch("");
      showNotice({
        tone: "success",
        text: `Copia restaurada: ${importedPatients.length} fichas.`,
      });
    } catch {
      showNotice({
        tone: "error",
        text: "El archivo no es una copia válida de Pase clínico.",
      });
    }
  };

  const loading = patients === undefined;
  const dragDisabled = Boolean(search) || showingArchived;

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <span className="text-sm font-bold">P</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-[-0.025em] text-slate-950">Pase clínico</h1>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Resumen operativo de pacientes
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <HardDrive size={14} />
            <span>Guardado únicamente en este navegador</span>
          </div>
        </header>

        <Toolbar
          search={search}
          showingArchived={showingArchived}
          activeCount={activePatients.length}
          archivedCount={archivedPatients.length}
          exportDisabled={!activePatients.length || exportingWord}
          backupDisabled={!allPatients.length}
          onSearchChange={setSearch}
          onToggleArchived={() => {
            setShowingArchived((value) => !value);
            setSearch("");
          }}
          onNewPatient={openNewPatient}
          onExportWord={handleExportWord}
          onExportBackup={() => exportBackup(allPatients)}
          onImportFile={handleImport}
        />

        <div className="mt-4 flex min-h-7 items-center justify-between px-1 text-[12px] text-slate-500">
          <span>
            {loading
              ? "Cargando…"
              : `${visiblePatients.length} ${visiblePatients.length === 1 ? "paciente" : "pacientes"}${
                  showingArchived ? " archivados" : " activos"
                }`}
          </span>
          {!dragDisabled && visiblePatients.length > 1 && (
            <span className="hidden sm:inline">Arrastra las fichas para cambiar el orden</span>
          )}
        </div>

        {loading ? (
          <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[330px] animate-pulse rounded-[18px] border border-slate-200 bg-white/70"
              />
            ))}
          </div>
        ) : visiblePatients.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visiblePatients.map((patient) => patient.id)}
              strategy={rectSortingStrategy}
            >
              <div className="mt-2 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                {visiblePatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    dragDisabled={dragDisabled}
                    onEdit={openPatient}
                    onToggleArchived={toggleArchived}
                    onDelete={removePatient}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="mt-2 flex min-h-[420px] flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-white/65 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              {search ? <Search size={21} /> : showingArchived ? <HardDrive size={21} /> : <Plus size={21} />}
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-800">
              {search
                ? "No hay coincidencias"
                : showingArchived
                  ? "No hay pacientes archivados"
                  : "Todavía no hay pacientes"}
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
              {search
                ? "Prueba con otro término o borra la búsqueda."
                : showingArchived
                  ? "Las fichas que archives aparecerán aquí."
                  : "Crea la primera ficha y mantén en una sola vista la información que necesitas recordar."}
            </p>
            {!search && !showingArchived && (
              <button
                type="button"
                className="mt-5 flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={openNewPatient}
              >
                <Plus size={17} /> Nuevo paciente
              </button>
            )}
          </div>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-xl ${
            notice.tone === "success"
              ? "border-slate-200 bg-slate-900 text-white"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      <PatientEditor
        key={`${editorOpen ? "open" : "closed"}-${editingPatient?.id ?? "new"}`}
        patient={editingPatient}
        open={editorOpen}
        saving={saving}
        onClose={closeEditor}
        onSave={savePatient}
      />
    </main>
  );
}
