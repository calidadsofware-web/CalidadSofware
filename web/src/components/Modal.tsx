import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  title,
  children,
  onClose,
  busy = false,
  warnOnClose = false,
  hasChanges = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  warnOnClose?: boolean;
  hasChanges?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    const dialog = ref.current;
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  function requestClose() {
    if (busy) return;
    if (warnOnClose && (dirty || hasChanges)) setDiscard(true);
    else onClose();
  }
  return createPortal(
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onChangeCapture={() => setDirty(true)}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="quiet"
          onClick={requestClose}
          disabled={busy}
          aria-label="Cerrar ventana"
        >
          Cerrar
        </button>
      </div>
      {discard && (
        <div className="discard-notice" role="alert">
          <p>Tienes cambios sin guardar. ¿Quieres descartarlos?</p>
          <div className="actions">
            <button type="button" onClick={() => setDiscard(false)}>
              Seguir editando
            </button>
            <button type="button" className="danger-button" onClick={onClose}>
              Descartar cambios
            </button>
          </div>
        </div>
      )}
      {children}
    </dialog>,
    document.body,
  );
}
