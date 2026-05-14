import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exports canvas pages to PDF using html2canvas + jsPDF.
 *
 * Font embedding note: this implementation rasterises each page to JPEG via
 * html2canvas, so all web fonts are baked into the image pixels. No separate
 * font-embedding step in jsPDF is required. The `preloadFonts` call below
 * ensures that any pending font downloads finish before capture begins, so the
 * rasterised output always contains the correct glyphs.
 *
 * Each page element must have id="canvas-page-{pageId}".
 * Returns a Blob of the PDF.
 */

/** Ensure all web fonts used in the canvas are loaded before capture. */
async function preloadFonts(): Promise<void> {
  if (!document.fonts) return;
  try {
    await document.fonts.ready;
  } catch {
    // Font loading failures should not block PDF export.
  }
}

export async function exportCanvasToPdf(
  pageIds: string[],
  onProgress?: (current: number, total: number) => void,
  filename = 'proposta.pdf',
): Promise<Blob> {
  await preloadFonts();

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pdf.setProperties({
    title: filename.replace(/\.pdf$/i, ''),
    creator: 'Kurupira — Neonorte',
  });

  const A4_MM_W = 210;
  const A4_MM_H = 297;

  for (let i = 0; i < pageIds.length; i++) {
    onProgress?.(i + 1, pageIds.length);
    const el = document.getElementById(`canvas-page-${pageIds[i]}`);
    if (!el) continue;

    const elWidth  = el.offsetWidth;
    const elHeight = el.offsetHeight;

    // Temporarily remove clip so full content is captured
    const prevOverflow = el.style.overflow;
    el.style.overflow = 'visible';

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      imageTimeout: 0,
      windowWidth: elWidth,
      windowHeight: elHeight,
    } as any);

    el.style.overflow = prevOverflow;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, A4_MM_W, A4_MM_H);
  }

  return pdf.output('blob');
}
