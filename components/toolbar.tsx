"use client";

import { useRef, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Columns2,
  Columns3,
  Download,
  FileDown,
  HardDrive,
  Plus,
  Search,
  Upload,
  X,
} from "@/components/icons";

export type GridColumns = 2 | 3;

type ToolbarProps = {
  search: string;
  showingArchived: boolean;
  activeCount: number;
  archivedCount: number;
  gridColumns: GridColumns;
  exportDisabled: boolean;
  backupDisabled: boolean;
  onSearchChange: (value: string) => void;
  onToggleArchived: () => void;
  onGridColumnsChange: (value: GridColumns) => void;
  onNewPatient: () => void;
  onExportWord: () => void;
  onExportBackup: () => void;
  onImportFile: (file: File) => void;
};

const viewOptions = [
  {
    value: 2 as const,
    label: "Dos columnas",
    description: "Fichas más amplias",
    icon: Columns2,
  },
  {
    value: 3 as const,
    label: "Tres columnas",
    description: "Más pacientes a la vista",
    icon: Columns3,
  },
];

export function Toolbar({
  search,
  showingArchived,
  activeCount,
  archivedCount,
  gridColumns,
  exportDisabled,
  backupDisabled,
  onSearchChange,
  onToggleArchived,
  onGridColumnsChange,
  onNewPatient,
  onExportWord,
  onExportBackup,
  onImportFile,
}: ToolbarProps) {
  const [backupOpen, setBackupOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const CurrentViewIcon = gridColumns === 3 ? Columns3 : Columns2;

  const closeMenus = () => {
    setBackupOpen(false);
    setViewOpen(false);
  };

  return (
    <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          placeholder="Buscar paciente…"
          className="h-10 w-full rounded-xl border border-transparent bg-slate-100/80 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-3 focus:ring-slate-100"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {search && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
            onClick={() => onSearchChange("")}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition ${
            showingArchived
              ? "border-slate-300 bg-slate-100 text-slate-900"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          onClick={onToggleArchived}
        >
          <Archive size={16} />
          {showingArchived ? `Activos (${activeCount})` : `Archivados (${archivedCount})`}
        </button>

        <div className="relative">
          <button
            type="button"
            aria-expanded={viewOpen}
            aria-haspopup="menu"
            className={`flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition ${
              viewOpen
                ? "border-slate-300 bg-slate-100 text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => {
              setBackupOpen(false);
              setViewOpen((value) => !value);
            }}
          >
            <CurrentViewIcon size={16} />
            <span className="hidden sm:inline">Vista</span>
            <ChevronDown size={14} className={`transition ${viewOpen ? "rotate-180" : ""}`} />
          </button>

          {viewOpen && (
            <>
              <button
                type="button"
                aria-label="Cerrar menú de vista"
                className="fixed inset-0 z-30 cursor-default"
                onClick={closeMenus}
              />
              <div
                role="menu"
                className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
              >
                <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Distribución de fichas
                </div>
                {viewOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const selected = gridColumns === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition ${
                        selected ? "bg-slate-100" : "hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        onGridColumnsChange(option.value);
                        setViewOpen(false);
                      }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                        <OptionIcon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-800">{option.label}</span>
                        <span className="mt-0.5 block text-[12px] text-slate-500">{option.description}</span>
                      </span>
                      {selected && <Check size={16} className="shrink-0 text-slate-700" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          disabled={exportDisabled}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onExportWord}
        >
          <FileDown size={16} />
          <span className="hidden sm:inline">Exportar Word</span>
          <span className="sm:hidden">Word</span>
        </button>

        <div className="relative">
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => {
              setViewOpen(false);
              setBackupOpen((value) => !value);
            }}
          >
            <HardDrive size={16} />
            Copia
            <ChevronDown size={14} className={`transition ${backupOpen ? "rotate-180" : ""}`} />
          </button>

          {backupOpen && (
            <>
              <button
                type="button"
                aria-label="Cerrar menú de copia"
                className="fixed inset-0 z-30 cursor-default"
                onClick={closeMenus}
              />
              <div className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                <button
                  type="button"
                  disabled={backupDisabled}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => {
                    setBackupOpen(false);
                    onExportBackup();
                  }}
                >
                  <Download size={15} /> Exportar copia JSON
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setBackupOpen(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload size={15} /> Importar copia JSON
                </button>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImportFile(file);
              event.target.value = "";
            }}
          />
        </div>

        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={onNewPatient}
        >
          <Plus size={17} />
          Nuevo paciente
        </button>
      </div>
    </div>
  );
}
