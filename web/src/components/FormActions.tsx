interface FormActionsProps {
  busy: boolean;
  label: string;
  disabled?: boolean;
}

export function FormActions({ busy, label, disabled = false }: FormActionsProps) {
  return (
    <div className="form-actions">
      <button className="primary" type="submit" disabled={busy || disabled}>
        {busy ? "Guardando..." : label}
      </button>
    </div>
  );
}
