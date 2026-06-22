import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { Activity } from '../types/activity.js';
import type { Bicycle } from '../types/bicycle.js';
import type { Component } from '../types/component.js';
import type { MaintenanceRecord } from '../types/maintenance.js';

// Builds the .docx maintenance report for a single bike. Pure formatting layer:
// callers pass already-loaded, already-authorized domain data.

function heading(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } });
}

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function cell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph(text)],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function table(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(headerCell), tableHeader: true }),
      ...rows.map((row) => new TableRow({ children: row.map(cell) })),
    ],
  });
}

function wearStatus(wearState: number): string {
  if (wearState >= 100) return 'Overdue';
  if (wearState > 80) return 'Due soon';
  return 'OK';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function generateBicycleReportDocx(
  bicycle: Bicycle,
  components: Component[],
  maintenance: MaintenanceRecord[],
  activities: Activity[],
): Promise<Buffer> {
  const totalActivities = activities.length;
  const totalServices = maintenance.length;
  const avgDistancePerActivity = totalActivities > 0 ? bicycle.totalDistance / totalActivities : 0;
  const attentionComponents = components.filter((c) => c.wearState > 80).length;

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: `${bicycle.name} — Maintenance Report`, bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Generated on ${formatDate(new Date().toISOString())}`, italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),

    heading('Bike details'),
    table(
      ['Field', 'Value'],
      [
        ['Brand', bicycle.brand],
        ['Model', bicycle.model],
        ['Type', bicycle.type],
        ['Purchase date', formatDate(bicycle.purchaseDate)],
        ['Frame size', bicycle.frameSize ?? '—'],
        ['Wheel size', bicycle.wheelSize ?? '—'],
        ['Total distance', `${bicycle.totalDistance} km`],
      ],
    ),

    heading('Summary'),
    table(
      ['Metric', 'Value'],
      [
        ['Total distance ridden', `${bicycle.totalDistance} km`],
        ['Activities logged', `${totalActivities}`],
        ['Average distance per activity', `${avgDistancePerActivity.toFixed(1)} km`],
        ['Services performed', `${totalServices}`],
        ['Components tracked', `${components.length}`],
        ['Components needing attention', `${attentionComponents}`],
      ],
    ),

    heading('Component wear'),
    components.length
      ? table(
          ['Component', 'Service interval (km)', 'Distance since service (km)', 'Wear', 'Status'],
          components.map((c) => [
            c.name,
            `${c.serviceIntervalKm}`,
            `${Math.max(0, bicycle.totalDistance - c.distanceAtService)}`,
            `${c.wearState}%`,
            wearStatus(c.wearState),
          ]),
        )
      : new Paragraph('No components tracked for this bike.'),

    heading('Maintenance history'),
    maintenance.length
      ? table(
          ['Date', 'Component', 'Type', 'Distance at service (km)', 'Notes'],
          maintenance.map((m) => [
            formatDate(m.date),
            m.componentName ?? '—',
            m.type,
            `${m.distanceAtService}`,
            m.notes ?? '—',
          ]),
        )
      : new Paragraph('No maintenance recorded yet.'),

    heading('Activity log'),
    activities.length
      ? table(
          ['Date', 'Distance (km)'],
          activities.map((a) => [formatDate(a.date), `${a.distanceKm}`]),
        )
      : new Paragraph('No activities logged yet.'),
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
