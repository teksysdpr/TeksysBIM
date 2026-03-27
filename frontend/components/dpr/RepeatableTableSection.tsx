"use client";

import type { ReactNode } from "react";

export type DprColumnType =
  | "text"
  | "textarea"
  | "number"
  | "integer"
  | "date"
  | "time"
  | "select"
  | "readonly";

export type DprTableColumn<Row extends { sr_no: number }> = {
  key: keyof Row;
  label: string;
  type?: DprColumnType;
  widthClass?: string;
  placeholder?: string;
  readOnly?: boolean;
  options?: Array<{ label: string; value: string }>;
  step?: string;
  min?: number;
  max?: number;
  align?: "left" | "center" | "right";
  renderReadonly?: (row: Row, index: number) => ReactNode;
};

type RepeatableTableSectionProps<Row extends { sr_no: number }> = {
  title: string;
  description?: string;
  rows: Row[];
  columns: DprTableColumn<Row>[];
  createEmptyRow: () => Row;
  onRowsChange: (rows: Row[]) => void;
  readOnly?: boolean;
  footer?: ReactNode;
  minRows?: number;
};

function normalizeRows<Row extends { sr_no: number }>(rows: Row[]): Row[] {
  return rows.map((row, index) => ({
    ...row,
    sr_no: index + 1,
  }));
}

function parseInputValue(type: DprColumnType, raw: string): unknown {
  if (type === "number") {
    if (raw === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (type === "integer") {
    if (raw === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }
  return raw;
}

function inputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function alignClass(align?: "left" | "center" | "right") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export default function RepeatableTableSection<Row extends { sr_no: number }>(
  props: RepeatableTableSectionProps<Row>
) {
  const {
    title,
    description,
    rows,
    columns,
    createEmptyRow,
    onRowsChange,
    readOnly = false,
    footer,
    minRows = 1,
  } = props;

  const safeRows = rows.length ? rows : [createEmptyRow()];

  const updateRows = (nextRows: Row[]) => {
    onRowsChange(normalizeRows(nextRows));
  };

  const setCellValue = (rowIndex: number, key: keyof Row, type: DprColumnType, raw: string) => {
    const nextRows = safeRows.slice();
    const current = nextRows[rowIndex];
    nextRows[rowIndex] = {
      ...current,
      [key]: parseInputValue(type, raw),
    } as Row;
    updateRows(nextRows);
  };

  const addRowBelow = (rowIndex: number) => {
    const nextRows = safeRows.slice();
    nextRows.splice(rowIndex + 1, 0, createEmptyRow());
    updateRows(nextRows);
  };

  const deleteRow = (rowIndex: number) => {
    if (safeRows.length <= minRows) {
      updateRows([createEmptyRow()]);
      return;
    }
    const nextRows = safeRows.slice();
    nextRows.splice(rowIndex, 1);
    updateRows(nextRows);
  };

  const moveRow = (rowIndex: number, direction: -1 | 1) => {
    const nextIndex = rowIndex + direction;
    if (nextIndex < 0 || nextIndex >= safeRows.length) return;
    const nextRows = safeRows.slice();
    const current = nextRows[rowIndex];
    nextRows[rowIndex] = nextRows[nextIndex];
    nextRows[nextIndex] = current;
    updateRows(nextRows);
  };

  return (
    <article className="rounded-2xl border border-[#decbbb] bg-white p-4 shadow-[0_10px_24px_rgba(44,19,5,0.1)]">
      <div className="mb-3">
        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-xs text-slate-600">{description}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e8d7c9] bg-white">
        <table className="min-w-full border-collapse text-xs text-[#4a2c1d]">
          <thead className="bg-[#f6ece4]">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={[
                    "border-b border-[#e6d4c8] px-2 py-2 text-left font-bold uppercase tracking-wide text-[#6b432d]",
                    column.widthClass || "",
                    alignClass(column.align),
                  ].join(" ")}
                >
                  {column.label}
                </th>
              ))}
              <th className="w-[108px] border-b border-[#e6d4c8] px-2 py-2 text-center font-bold uppercase tracking-wide text-[#6b432d]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row.sr_no}`} className="border-b border-[#f1e4da] align-top">
                {columns.map((column) => {
                  const type = column.type || "text";
                  const cellReadOnly = readOnly || type === "readonly" || column.readOnly;
                  const value = row[column.key];
                  const sharedClass = [
                    "w-full rounded border border-[#ddcabd] bg-white px-2 py-1 text-xs text-[#4a2c1d] outline-none focus:border-[#a67855]",
                    alignClass(column.align),
                  ].join(" ");

                  return (
                    <td
                      key={`${rowIndex}-${String(column.key)}`}
                      className={["px-2 py-1", column.widthClass || ""].join(" ")}
                    >
                      {cellReadOnly ? (
                        <div
                          className={[
                            "min-h-[30px] rounded border border-[#eadccd] bg-[#faf6f2] px-2 py-1",
                            alignClass(column.align),
                          ].join(" ")}
                        >
                          {column.renderReadonly
                            ? column.renderReadonly(row, rowIndex)
                            : inputValue(value)}
                        </div>
                      ) : type === "textarea" ? (
                        <textarea
                          value={inputValue(value)}
                          onChange={(event) =>
                            setCellValue(rowIndex, column.key, type, event.target.value)
                          }
                          placeholder={column.placeholder || ""}
                          className={`${sharedClass} min-h-[62px] resize-y`}
                        />
                      ) : type === "select" ? (
                        <select
                          value={inputValue(value)}
                          onChange={(event) =>
                            setCellValue(rowIndex, column.key, type, event.target.value)
                          }
                          className={sharedClass}
                        >
                          <option value="">Select</option>
                          {(column.options || []).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            type === "number" || type === "integer"
                              ? "number"
                              : type === "date"
                              ? "date"
                              : type === "time"
                              ? "time"
                              : "text"
                          }
                          value={inputValue(value)}
                          onChange={(event) =>
                            setCellValue(rowIndex, column.key, type, event.target.value)
                          }
                          placeholder={column.placeholder || ""}
                          className={sharedClass}
                          step={column.step}
                          min={column.min}
                          max={column.max}
                        />
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-1">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      disabled={readOnly || rowIndex === 0}
                      onClick={() => moveRow(rowIndex, -1)}
                      className="rounded border border-[#d8c4b6] bg-[#f6eee8] px-1.5 py-1 text-[11px] font-bold text-[#67412d] disabled:cursor-not-allowed disabled:opacity-45"
                      title="Move Up"
                    >
                      ^
                    </button>
                    <button
                      type="button"
                      disabled={readOnly || rowIndex === safeRows.length - 1}
                      onClick={() => moveRow(rowIndex, 1)}
                      className="rounded border border-[#d8c4b6] bg-[#f6eee8] px-1.5 py-1 text-[11px] font-bold text-[#67412d] disabled:cursor-not-allowed disabled:opacity-45"
                      title="Move Down"
                    >
                      v
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => addRowBelow(rowIndex)}
                      className="rounded border border-[#9e6f4e] bg-[#7c4e31] px-1.5 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                      title="Add Row"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => deleteRow(rowIndex)}
                      className="rounded border border-[#c18c76] bg-[#ad6142] px-1.5 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                      title="Delete Row"
                    >
                      -
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </article>
  );
}

