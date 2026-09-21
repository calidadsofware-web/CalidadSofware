import { Component, type ReactNode } from "react";

/** Keeps navigation usable if a lazy section fails to load. */
export class SectionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="panel" role="alert">
        <h2>No se pudo abrir esta sección</h2>
        <p>
          Puedes volver a otro módulo desde el menú o recargar para intentarlo otra vez. Los cambios sin
          guardar de esta pantalla no se conservarán.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Recargar página
        </button>
      </section>
    );
  }
}
