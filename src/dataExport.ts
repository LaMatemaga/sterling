/**
 * The table that produced a figure, after any transformations used by the
 * wrapper. This deliberately does not claim to be the original source file.
 */
export interface SterlingDataExport {
  rows: readonly Record<string, unknown>[];
  /** Optional stem for the generated CSV. The title is used when omitted. */
  fileName?: string;
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeCsvCell(value: unknown) {
  const cell = csvCell(value);
  return /[\",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

/** Turn the exact rows supplied to a Sterling figure into a portable UTF-8 CSV. */
export function sterlingRowsToCsv(rows: SterlingDataExport["rows"]) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    columns.map(escapeCsvCell).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(",")),
  ].join("\r\n");
}

function rowsFromArray(values: unknown[]) {
  return values.map((value) => {
    if (Array.isArray(value)) {
      return Object.fromEntries(value.map((cell, index) => [`value_${index + 1}`, cell]));
    }
    if (value && typeof value === "object") return value as Record<string, unknown>;
    return { value };
  });
}

/**
 * A graceful fallback for wrappers that have not supplied `dataExport` yet.
 * It only inspects the already-processed props passed to common primitives;
 * explicit `dataExport` is preferable when field names need editorial care.
 */
export function inferSterlingDataExport(props: Record<string, unknown>): SterlingDataExport | undefined {
  if (Array.isArray(props.data)) return { rows: rowsFromArray(props.data) };
  if (Array.isArray(props.rows)) return { rows: rowsFromArray(props.rows) };
  if (Array.isArray(props.links)) return { rows: rowsFromArray(props.links) };
  if (Array.isArray(props.points)) return { rows: rowsFromArray(props.points) };

  if (Array.isArray(props.groups)) {
    const groups = props.groups as Array<{ label?: unknown; values?: unknown }>;
    if (groups.every((group) => Array.isArray(group.values))) {
      return {
        rows: groups.flatMap((group) => (group.values as unknown[]).map((value) => ({ group: group.label, value }))),
      };
    }
  }

  if (Array.isArray(props.values)) {
    const values = props.values as unknown[];
    if (values.every((value) => typeof value === "number")) return { rows: values.map((value) => ({ value })) };

    if (values.every(Array.isArray)) {
      const rowLabels = Array.isArray(props.rowLabels) ? props.rowLabels : [];
      const columnLabels = Array.isArray(props.columnLabels) ? props.columnLabels : [];
      return {
        rows: values.flatMap((row, rowIndex) => (row as unknown[]).map((value, columnIndex) => ({
          row: rowLabels[rowIndex] ?? rowIndex + 1,
          column: columnLabels[columnIndex] ?? columnIndex + 1,
          value,
        }))),
      };
    }
  }

  if (Array.isArray(props.series) && Array.isArray(props.labels)) {
    const labels = props.labels as unknown[];
    const series = props.series as Array<{ label?: unknown; values?: unknown }>;
    if (series.every((item) => Array.isArray(item.values))) {
      return {
        rows: labels.map((label, index) => Object.fromEntries([
          ["label", label],
          ...series.map((item) => [String(item.label ?? "value"), (item.values as unknown[])[index]]),
        ])),
      };
    }
  }

  if (Array.isArray(props.nodes)) return { rows: rowsFromArray(props.nodes) };
  return undefined;
}
