export function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty" role="status">
      <span aria-hidden="true">○</span>
      <p>{text}</p>
    </div>
  );
}
