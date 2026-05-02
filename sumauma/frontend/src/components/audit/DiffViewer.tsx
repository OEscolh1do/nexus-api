

interface DiffViewerProps {
  before: string | null;
  after: string | null;
}

export default function DiffViewer({ before, after }: DiffViewerProps) {
  const sanitize = (jsonStr: string | null) => {
    if (!jsonStr) return null;
    try {
      const obj = JSON.parse(jsonStr);
      const sensitiveKeys = ['password', 'token', 'secret', 'key'];
      
      const clean = (data: any): any => {
        if (typeof data !== 'object' || data === null) return data;
        if (Array.isArray(data)) return data.map(clean);
        
        const newObj: any = {};
        for (const key in data) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            newObj[key] = '********';
          } else {
            newObj[key] = clean(data[key]);
          }
        }
        return newObj;
      };

      return JSON.stringify(clean(obj), null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

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
