import { useId, useMemo, useState, type ReactNode } from "react";
import { DataTable, type DataColumn, type DataRow } from "./DataTable";
import { dateKey, normalized } from "../utils/format";

export function CollectionTable({
  title,
  rows,
  columns,
  filters = [],
  moneyKeys = [],
  actions,
  renderCell,
  dateField,
  searchKeys = [],
  placeholder = "Buscar por nombre o código...",
  summary,
}: {
  title: string;
  rows: object[];
  columns: readonly DataColumn[];
  filters?: readonly DataColumn[];
  moneyKeys?: readonly string[];
  actions?: (row: DataRow) => ReactNode;
  renderCell?: (row: DataRow, key: string) => ReactNode | undefined;
  dateField?: string;
  placeholder?: string;
  searchKeys?: readonly string[];
  /** Contenido calculado sobre las filas visibles (por ejemplo, el resumen de un periodo). */
  summary?: (rows: DataRow[], range: { from: string; to: string }) => ReactNode;
}) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const data = rows as DataRow[];
  const filtered = useMemo(
    () =>
      data.filter((row) => {
        const matches =
          !search.trim() ||
          [...columns.map(([key]) => key), ...searchKeys].some((key) =>
            normalized(row[key]).includes(normalized(search.trim())),
          );
        return (
          matches &&
          filters.every(([key]) => !selected[key] || String(row[key]) === selected[key]) &&
          (!dateField ||
            ((!from || dateKey(row[dateField]).slice(0, 10) >= from) &&
              (!to || dateKey(row[dateField]).slice(0, 10) <= to)))
        );
      }),
    [data, search, columns, filters, selected, dateField, from, to, searchKeys],
  );
  return (
    <section className="panel collection-panel" aria-label={title}>
      <div className="collection-toolbar">
        <label className="search" htmlFor={id}>
          Buscar
          <input
            id={id}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={placeholder}
          />
        </label>
        {filters.map(([key, label]) => (
          <label key={key}>
            {label}
            <select
              value={selected[key] ?? ""}
              onChange={(event) => setSelected((current) => ({ ...current, [key]: event.target.value }))}
            >
              <option value="">Todos</option>
              {[...new Set(data.map((row) => String(row[key] ?? "")))]
                .filter(Boolean)
                .sort()
                .map((value) => (
                  <option key={value}>{value}</option>
                ))}
            </select>
          </label>
        ))}
        {dateField && (
          <>
            <label>
              Desde
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </>
        )}
        {(search || Object.values(selected).some(Boolean) || from || to) && (
          <button
            className="quiet"
            type="button"
            onClick={() => {
              setSearch("");
              setSelected({});
              setFrom("");
              setTo("");
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <DataTable
        key={JSON.stringify([search, selected, from, to])}
        caption={title}
        rows={filtered}
        columns={columns}
        moneyKeys={moneyKeys}
        actions={actions}
        renderCell={renderCell}
      />
      {summary?.(filtered, { from, to })}
    </section>
  );
}
