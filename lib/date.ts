const DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : DATE_FORMATTER.format(date);
}

export function getAdmissionDays(value: string): number | null {
  if (!value) return null;

  const admission = new Date(`${value}T00:00:00`);
  if (Number.isNaN(admission.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const milliseconds = today.getTime() - admission.getTime();
  return Math.max(0, Math.floor(milliseconds / 86_400_000));
}

export function formatAdmissionDays(days: number): string {
  return days === 1 ? "1 día" : `${days} días`;
}

export function fileDate(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
