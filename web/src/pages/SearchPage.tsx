import { useMemo, useState } from "react";
import { DataTable, type DataColumn, type DataRow } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";

interface SearchPageProps {
  title: string;
  description: string;
  rows: object[];
  columns: readonly DataColumn[];
  moneyKeys?: readonly string[];
}

export function SearchPage({ title, description, rows, columns, moneyKeys = [] }: SearchPageProps) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-PE");
    if (!query) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLocaleLowerCase("es-PE").includes(query)),
    );
  }, [rows, search]);

  return (
    <>
      <PageHeader title={title} description={description} />
      <section className="panel" aria-label={`Listado de ${title.toLocaleLowerCase("es-PE")}`}>
        <div className="toolbar">
          <label className="search" htmlFor={`${title}-search`}>
            Buscar
            <input
              id={`${title}-search`}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar en ${title.toLocaleLowerCase("es-PE")}...`}
            />
          </label>
          <span aria-live="polite">{filtered.length} resultados</span>
        </div>
        <DataTable
          caption={`Resultados de ${title.toLocaleLowerCase("es-PE")}`}
          rows={filtered as DataRow[]}
          columns={columns}
          moneyKeys={moneyKeys}
        />
      </section>
    </>
  );
}
