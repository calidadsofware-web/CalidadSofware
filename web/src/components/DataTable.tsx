import { useState, type ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { dateKey, normalized } from "../utils/format";

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export type DataRow = Record<string, unknown>;
export type DataColumn = readonly [key: string, label: string];

interface DataTableProps {
  caption: string;
  rows: DataRow[];
  columns: readonly DataColumn[];
  moneyKeys?: readonly string[];
  actions?: (row: DataRow) => ReactNode;
  renderCell?: (row: DataRow, key: string) => ReactNode | undefined;
}

function rowKey(row: DataRow, index: number): string {
  return String(row.id ?? row.code ?? row.number ?? index);
}

function cellValue(row: DataRow, key: string, moneyKeys: readonly string[]): string {
  if (moneyKeys.includes(key)) return PEN.format(Number(row[key] ?? 0));
  const value = row[key];
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

export function DataTable({ caption, rows, columns, moneyKeys = [], actions, renderCell }: DataTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ key: string; direction: number } | null>(null);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pages);
  const ordered = sort
    ? [...rows].sort((a, b) => {
        const left = a[sort.key],
          right = b[sort.key];
        const compared =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : normalized(dateKey(left)).localeCompare(normalized(dateKey(right)), "es", { numeric: true });
        return compared * sort.direction;
      })
    : rows;
  const visible = ordered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  if (!rows.length) return <EmptyState text="No hay información para mostrar." />;

  return (
    <div>
      <div className="table-wrap" role="region" aria-label={`Tabla: ${caption}`} tabIndex={0}>
        <table>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map(([key, label]) => (
                <th
                  key={key}
                  scope="col"
                  aria-sort={sort?.key === key ? (sort.direction === 1 ? "ascending" : "descending") : "none"}
                >
                  <button
                    className="table-sort"
                    type="button"
                    onClick={() => {
                      setSort({ key, direction: sort?.key === key ? -sort.direction : 1 });
                      setPage(1);
                    }}
                    aria-label={`Ordenar por ${label}`}
                  >
                    {label}
                    {sort?.key === key ? (sort.direction === 1 ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
              {actions && <th scope="col">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={rowKey(row, index)}>
                {columns.map(([key]) => (
                  <td
                    key={key}
                    className={
                      [
                        "phone",
                        "document",
                        "ruc",
                        "code",
                        "number",
                        "date",
                        "createdAt",
                        "requiredDate",
                        "deadline",
                      ].includes(key)
                        ? "table-nowrap"
                        : undefined
                    }
                  >
                    {renderCell?.(row, key) ??
                      (key === "status" || key === "priority" ? (
                        <span className={`status-badge status-${normalized(row[key]).replaceAll(" ", "-")}`}>
                          {cellValue(row, key, moneyKeys)}
                        </span>
                      ) : (
                        cellValue(row, key, moneyKeys)
                      ))}
                  </td>
                ))}
                {actions && <td className="table-actions">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small className="table-scroll-hint">
        Desliza la tabla horizontalmente para ver todas las columnas.
      </small>
      <div className="pagination">
        <span role="status">
          {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} de {rows.length}{" "}
          registros
        </span>
        <label>
          Por página
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </label>
        <div className="actions">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            Anterior
          </button>
          <span>
            {currentPage} / {pages}
          </span>
          <button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
