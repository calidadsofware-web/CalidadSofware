import { useId, useRef, useState } from "react";
import { normalized } from "../utils/format";

export interface SelectItem {
  value: string;
  label: string;
  detail?: string;
  search?: string;
}
export function SearchSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Escribe para buscar...",
  required = false,
}: {
  label: string;
  options: SelectItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value);
  const results = options
    .filter((option) =>
      normalized(`${option.label} ${option.detail ?? ""} ${option.search ?? ""}`).includes(normalized(query)),
    )
    .slice(0, 8);
  function choose(option: SelectItem) {
    ref.current?.focus();
    onChange(option.value);
    setQuery("");
    setOpen(false);
  }
  return (
    <div
      className="search-select"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="required-label" aria-hidden="true">
            Obligatorio
          </span>
        )}
      </label>
      <input
        ref={ref}
        id={id}
        role="combobox"
        aria-required={required}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && results[active] ? `${id}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={open ? query : (selected?.label ?? query)}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
          onChange("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            setOpen(false);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, results.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(0, index - 1));
          }
          if (event.key === "Enter" && open) {
            event.preventDefault();
            if (results[active]) choose(results[active]);
          }
        }}
      />
      {selected && !open && <small className="field-hint">{selected.detail}</small>}
      {open && (
        <div className="select-popover">
          <div role="listbox" id={`${id}-list`} aria-label={label}>
            {results.map((option, index) => (
              <div
                key={option.value}
                id={`${id}-${index}`}
                role="option"
                aria-selected={index === active}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") choose(option);
                }}
              >
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </div>
            ))}
          </div>
          <p className="field-hint">
            {results.length
              ? "Hasta 8 coincidencias. Escribe para afinar la búsqueda."
              : "Sin coincidencias. Prueba otro nombre o documento."}
          </p>
        </div>
      )}
    </div>
  );
}
