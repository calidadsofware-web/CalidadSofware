interface FullScreenMessageProps {
  title: string;
  text: string;
}

export function FullScreenMessage({ title, text }: FullScreenMessageProps) {
  return (
    <main className="center-screen" aria-busy="true" aria-live="polite">
      <section className="status-card">
        <img src="/media/brand-mark-v1.png" width="52" height="52" alt="" decoding="async" />
        <div>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
        <span className="status-progress" aria-hidden="true" />
      </section>
    </main>
  );
}
