import * as pdfjs from 'pdfjs-dist';

// In pdfjs-dist v5, workerSrc must be a string URL pointing to the worker script.
// The ?url Vite suffix emits the file as a static asset and returns its public URL,
// which avoids the ArrayBuffer-transfer issue that occurs with new URL() + import.meta.url
// in some Vite configurations.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — Vite-specific ?url import, not in TS moduleResolution
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfPagePreview {
  pageNumber: number; // 1-based
  dataUrl: string;    // JPEG thumbnail
  width: number;      // original page width in px at scale 1
  height: number;
}

/**
 * Loads a PDF from an ArrayBuffer and renders each page as a thumbnail.
 *
 * We copy the buffer into a Uint8Array before passing it to pdfjs so that
 * pdfjs can transfer it to the worker thread without detaching the caller's
 * reference — allowing the same buffer to be used again in renderPdfPageFull.
 */
export async function renderPdfThumbnails(
  buffer: ArrayBuffer,
  scale = 0.3,
): Promise<PdfPagePreview[]> {
  // Copy so pdfjs can transfer without detaching the caller's reference.
  const data = new Uint8Array(buffer.slice(0));
  const pdf  = await pdfjs.getDocument({ data }).promise;
  const results: PdfPagePreview[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page     = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas   = document.createElement('canvas');
    canvas.width   = Math.round(viewport.width);
    canvas.height  = Math.round(viewport.height);

    // pdfjs-dist v5: pass canvas directly (primary API).
    await page.render({ canvas, viewport }).promise;

    results.push({
      pageNumber: pageNum,
      dataUrl: canvas.toDataURL('image/jpeg', 0.85),
      width:   Math.round(page.getViewport({ scale: 1 }).width),
      height:  Math.round(page.getViewport({ scale: 1 }).height),
    });
  }

  return results;
}

/**
 * Renders a single PDF page at high quality (scale 2 for high-DPI output).
 * Returns a JPEG data URL suitable for use as a background image or canvas element.
 */
export async function renderPdfPageFull(
  buffer: ArrayBuffer,
  pageNumber: number,
  scale = 2,
): Promise<string> {
  const data     = new Uint8Array(buffer.slice(0));
  const pdf      = await pdfjs.getDocument({ data }).promise;
  const page     = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement('canvas');
  canvas.width   = Math.round(viewport.width);
  canvas.height  = Math.round(viewport.height);

  await page.render({ canvas, viewport }).promise;

  return canvas.toDataURL('image/jpeg', 0.92);
}
