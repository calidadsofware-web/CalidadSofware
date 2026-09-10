import { EmptyState } from "./EmptyState";

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
}

function rowKey(row: DataRow, index: number): string {
  return String(row.id ?? row.code ?? row.number ?? index);
}

function cellValue(row: DataRow, key: string, moneyKeys: readonly string[]): string {
  if (moneyKeys.includes(key)) return PEN.format(Number(row[key] ?? 0));
  const value = row[key];
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

export function DataTable({ caption, rows, columns, moneyKeys = [] }: DataTableProps) {
  if (!rows.length) return <EmptyState text="No hay información para mostrar." />;

  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)}>
              {columns.map(([key]) => (
                <td key={key}>{cellValue(row, key, moneyKeys)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
