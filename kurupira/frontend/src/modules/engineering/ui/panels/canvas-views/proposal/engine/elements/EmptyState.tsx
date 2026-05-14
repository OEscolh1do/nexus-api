export function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 6,
      background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: 4,
      color: '#94a3b8', fontSize: 11, fontWeight: 500, textAlign: 'center',
      padding: 8,
    }}>
      <span style={{ fontSize: 20, opacity: 0.4 }}>📊</span>
      <span>{label}</span>
      <span style={{ fontSize: 10, opacity: 0.7 }}>Sem dados disponíveis</span>
    </div>
  );
}
