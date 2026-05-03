import { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUploadEquipment } from '@/hooks/useCatalog';

interface EquipmentUploadZoneProps {
  type: 'module' | 'inverter';
  onSuccess: () => void;
}

export default function EquipmentUploadZone({ type, onSuccess }: EquipmentUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileState, setFileState] = useState<{ name: string; size: number } | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const ext = type === 'module' ? '.pan' : '.ond';
  const endpoint = type === 'module' ? '/catalog/modules' : '/catalog/inverters';

  const { mutate: upload, loading, error, setError } = useUploadEquipment(endpoint, () => {
    setUploadedName(fileState?.name ?? null);
    setFileState(null);
    onSuccess();
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setUploadedName(null);
    if (!file.name.toLowerCase().endsWith(ext)) {
      setError(`O arquivo deve ter a extensão ${ext}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo é grande demais (max 5MB)');
      return;
    }

    setFileState({ name: file.name, size: file.size });

    // PVSyst < 6.80 usa ANSI/Latin-1; 6.80+ usa UTF-8 (com ou sem BOM).
    // Tenta UTF-8 estrito primeiro; se falhar, decodifica como Latin-1.
    const buffer = await file.arrayBuffer();
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      text = new TextDecoder('latin1').decode(buffer);
    }

    try {
      await upload(file.name, text);
    } catch {
      // Error is handled by hook
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center rounded-sm border-2 border-dashed p-6 text-center transition-colors ${
          dragActive
            ? 'border-sky-500 bg-sky-500/10'
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ext}
          onChange={handleChange}
          className="hidden"
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-8 w-8 animate-bounce text-sky-400" />
            <p className="text-xs font-medium text-sky-400">Enviando {fileState?.name}...</p>
            <p className="text-[10px] text-slate-500">Isso pode levar alguns segundos dependendo do Kurupira.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
              <FileType className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Arraste seu arquivo <span className="font-mono text-sky-400">{ext}</span> aqui
            </p>
            <p className="text-xs text-slate-500">ou</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-sm bg-slate-700 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              Selecione o arquivo
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
      {!error && uploadedName && !loading && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span><span className="font-mono">{uploadedName}</span> importado com sucesso.</span>
        </div>
      )}
    </div>
  );
}
