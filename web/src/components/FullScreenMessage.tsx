interface FullScreenMessageProps {
  title: string;
  text: string;
}

export function FullScreenMessage({ title, text }: FullScreenMessageProps) {
  return (
    <main className="center-screen" aria-busy="true" aria-live="polite">
      <img src="/datacell-mark.png" alt="" />
      <h1>{title}</h1>
      <p>{text}</p>
    </main>
  );
}
