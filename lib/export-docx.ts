import {
  AlignmentType,
  BorderStyle,
  Document,
  PageOrientation,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { Patient } from "@/lib/types";
import { fileDate, formatAdmissionDays, formatDate, getAdmissionDays } from "@/lib/date";

const COLORS = {
  ink: "1A2630",
  muted: "5E6C79",
  line: "D8E0E6",
  header: "E9F0F4",
  surface: "FFFFFF",
};

const emptyBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: COLORS.surface },
  bottom: { style: BorderStyle.NONE, size: 0, color: COLORS.surface },
  left: { style: BorderStyle.NONE, size: 0, color: COLORS.surface },
  right: { style: BorderStyle.NONE, size: 0, color: COLORS.surface },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.surface },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.surface },
};

const cardBorders = {
  top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.line },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.line },
  left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.line },
  right: { style: BorderStyle.SINGLE, size: 6, color: COLORS.line },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.surface },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.surface },
};

function compactText(value: string): string {
  return value.trim() || "—";
}

function sectionParagraph(title: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 45, line: 240 },
    children: [
      new TextRun({
        text: `${title.toUpperCase()}  `,
        bold: true,
        size: 15,
        color: COLORS.muted,
      }),
      new TextRun({
        text: compactText(value),
        size: 17,
        color: COLORS.ink,
      }),
    ],
  });
}

function patientCard(patient: Patient): Table {
  const days = getAdmissionDays(patient.admissionDate);
  const meta = [
    patient.age !== null ? `${patient.age} años` : null,
    patient.admissionDate ? `Ingreso ${formatDate(patient.admissionDate)}` : null,
    days !== null ? formatAdmissionDays(days) : null,
  ].filter(Boolean).join(" · ");

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: cardBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: {
              fill: COLORS.header,
              type: ShadingType.CLEAR,
            },
            margins: { top: 110, bottom: 95, left: 130, right: 130 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: patient.identifier || "Paciente",
                    bold: true,
                    size: 22,
                    color: COLORS.ink,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: meta || "Sin datos de cabecera",
                    size: 15,
                    color: COLORS.muted,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 80, bottom: 105, left: 130, right: 130 },
            children: [
              sectionParagraph("Ingreso", patient.admissionReason),
              sectionParagraph("Antecedentes", patient.relevantHistory),
              sectionParagraph("Situación clínica", patient.clinicalStatus),
              sectionParagraph("Plan terapéutico", patient.therapeuticPlan),
              sectionParagraph("Plan social", patient.socialPlan),
            ],
          }),
        ],
      }),
    ],
  });
}

function blankCell(): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: emptyBorders,
    margins: { top: 0, bottom: 120, left: 80, right: 80 },
    children: [new Paragraph("")],
  });
}

function cardCell(patient: Patient): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: emptyBorders,
    margins: { top: 0, bottom: 140, left: 70, right: 70 },
    verticalAlign: VerticalAlign.TOP,
    children: [patientCard(patient)],
  });
}

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

export async function exportPatientsToWord(patients: Patient[]): Promise<void> {
  const sorted = [...patients].sort((a, b) => a.order - b.order);
  const rows: TableRow[] = [];

  for (let index = 0; index < sorted.length; index += 2) {
    rows.push(
      new TableRow({
        cantSplit: true,
        children: [
          cardCell(sorted[index]),
          sorted[index + 1] ? cardCell(sorted[index + 1]) : blankCell(),
        ],
      }),
    );
  }

  const document = new Document({
    creator: "Pase clínico",
    title: `Resumen de pacientes ${formatDate(fileDate())}`,
    styles: {
      default: {
        document: {
          run: {
            font: "Aptos",
            size: 18,
            color: COLORS.ink,
          },
          paragraph: {
            spacing: { after: 0 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 520,
              right: 500,
              bottom: 520,
              left: 500,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: "Pase clínico",
                bold: true,
                size: 30,
                color: COLORS.ink,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: `${sorted.length} pacientes activos · ${formatDate(fileDate())}`,
                size: 17,
                color: COLORS.muted,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: emptyBorders,
            rows,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, `pase-clinico-${fileDate()}.docx`);
}
