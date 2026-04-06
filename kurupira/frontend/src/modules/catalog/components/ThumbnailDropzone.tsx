import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThumbnailDropzoneProps {
  onFileProcessed: (file: Blob, previewUrl: string) => void;
  currentImageUrl?: string;
  maxSizeBytes?: number;
}

export const ThumbnailDropzone: React.FC<ThumbnailDropzoneProps> = ({
  onFileProcessed,
  currentImageUrl,
  maxSizeBytes = 200 * 1024, // default 200kb
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Formato inválido. Envie uma imagem (JPEG, PNG, WebP).');
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      // Se a imagem for muito pequena, podemos não compila-la novamente. Mas faremos WebP de todo jeito por padronização.
      const canvas = document.createElement('canvas');
      // Limit dimensions to ~1000px max to save space
      const MAX_DIM = 1000;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        } else {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Falha ao processar canvas');

      // Fill with transparent fallback white if image has alpha
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.9;
      let finalBlob: Blob | null = null;
      let finalPreview = '';

      // Tenta comprimir até caber no tamanho (maxSizeBytes)
      while (quality > 0.1) {
        finalBlob = await new Promise<Blob | null>(resolve => 
          canvas.toBlob(resolve, 'image/webp', quality)
        );
        if (finalBlob && finalBlob.size <= maxSizeBytes) {
          break;
        }
        quality -= 0.15;
      }

      if (!finalBlob) throw new Error('Não foi possível comprimir a imagem.');

      finalPreview = URL.createObjectURL(finalBlob);
      setPreview(finalPreview);
      onFileProcessed(finalBlob, finalPreview);

      // Limpeza da memória
      URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      setError(err.message || 'Erro durante a compressão da imagem');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all",
          isDragging ? "border-neonorte-purple bg-neonorte-purple/5" : "border-slate-300 bg-slate-50",
          error ? "border-red-400 bg-red-50" : ""
        )}
      >
        <input 
          type="file" 
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        />
        
        {preview && !isProcessing ? (
          <div className="relative flex flex-col items-center">
            <img src={preview} alt="Preview" className="h-24 object-contain rounded-md shadow-sm mb-2" />
            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle size={12}/> Pronta para envio
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Clique ou arraste para alterar</p>
          </div>
        ) : isProcessing ? (
          <div className="text-sm font-medium text-neonorte-purple animate-pulse flex items-center gap-2">
            <ImageIcon size={18} /> Comprimindo com WebP...
          </div>
        ) : (
          <div className="text-center">
            <UploadCloud size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">Arraste a foto do produto aqui</p>
            <p className="text-xs text-slate-500 mt-1">Será comprimida automaticamente {'<'}200KB (WebP)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium">
          <AlertCircle size={12}/> {error}
        </div>
      )}
    </div>
  );
};
