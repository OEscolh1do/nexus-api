import { globalLeafletMapRef } from '../../engineering/components/MapCore';

/**
 * Captures the current state of the Leaflet Map and the WebGL overlay,
 * merging them into a single Base64 image via a native Canvas compositor.
 * Bypasses html2canvas entirely for extreme performance and 0 freezes.
 */
export async function captureViewport(): Promise<string | null> {
  try {
    const map = globalLeafletMapRef.current;
    if (!map) {
      console.warn("[captureViewport] Leaflet map instance not found.");
      return null;
    }

    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();

    // 1. Create offline composition canvas
    const canvas = document.createElement('canvas');
    canvas.width = mapRect.width;
    canvas.height = mapRect.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn("captureViewport: Could not get 2D context.");
      return null;
    }

    // 2. Black/Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Helper function to load CORS-safe clones
    const loadCorsImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';
        newImg.onload = () => resolve(newImg);
        newImg.onerror = reject;
        // Cache bypass to prevent tainted canvas from previously cached non-CORS tiles
        const urlStr = new URL(src, document.baseURI);
        urlStr.searchParams.set('_c', Date.now().toString());
        newImg.src = urlStr.toString();
      });
    };

    // 4. Draw all loaded Leaflet tiles natively
    const tiles = Array.from(mapContainer.querySelectorAll<HTMLImageElement>('.leaflet-tile'));
    
    // Draw tiles sequentially to preserve order and context
    for (const img of tiles) {
      if (!img.src || img.naturalWidth === 0) continue;
      
      const imgRect = img.getBoundingClientRect();
      const x = imgRect.left - mapRect.left;
      const y = imgRect.top - mapRect.top;
      
      try {
        const corsImg = await loadCorsImage(img.src);
        ctx.drawImage(corsImg, x, y, imgRect.width, imgRect.height);
      } catch (e) {
        console.warn("[captureViewport] Failed to download/compose CORS tile", e);
      }
    }

    // 4. Draw WebGL Overlay
    const webglCanvas = document.querySelector('canvas[data-engine^="three.js"]') as HTMLCanvasElement 
      || document.querySelector('.webgl-overlay canvas') as HTMLCanvasElement
      || mapContainer.querySelector('canvas'); 

    if (webglCanvas) {
      const glRect = webglCanvas.getBoundingClientRect();
      const glX = glRect.left - mapRect.left;
      const glY = glRect.top - mapRect.top;
      
      try {
        ctx.drawImage(webglCanvas, glX, glY, glRect.width, glRect.height);
      } catch (e) {
        console.warn("captureViewport: Failed to composite WebGL layer", e);
      }
    } else {
      console.warn("captureViewport: WebGL canvas not found.");
    }

    // 5. Export
    return canvas.toDataURL('image/png');

  } catch (error) {
    console.error("captureViewport: Fatal error generating snapshot:", error);
    return null;
  }
}
