
interface DiffViewerProps {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key'];

function sanitize(data: Record<string, unknown> | string | null): string | null {
  if (!data) return null;

  let obj: unknown = data;
  if (typeof data === 'string') {
    try {
      obj = JSON.parse(data);
    } catch {
      return data;
    }
  }

  function clean(val: unknown): JsonValue {
    if (typeof val !== 'object' || val === null) return val as JsonValue;
    if (Array.isArray(val)) return val.map(clean);

    const newObj: { [key: string]: JsonValue } = {};
    for (const key in val as Record<string, unknown>) {
      if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk))) {
        newObj[key] = '********';
      } else {
        newObj[key] = clean((val as Record<string, unknown>)[key]);
      }
    }
    return newObj;
  }

  return JSON.stringify(clean(obj), null, 2);
}

export default function DiffViewer({ before, after }: DiffViewerProps) {
  const beforeClean = sanitize(before);
  const afterClean = sanitize(after);

  if (!beforeClean && !afterClean) return <p className="text-xs text-slate-500 italic">Sem dados de payload.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <div className="space-y-1">
        <span className="text-[10px] font-medium uppercase text-slate-500">Antes</span>
        <pre className="p-2 rounded-sm bg-slate-900 border border-slate-800 text-[11px] font-mono text-red-400 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
          {beforeClean || '{}'}
        </pre>
      </div>
      <div className="space-y-1">
        <span className="text-[10px] font-medium uppercase text-slate-500">Depois</span>
        <pre className="p-2 rounded-sm bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
          {afterClean || '{}'}
        </pre>
      </div>
    </div>
  );
}
