export interface PVSystObject {
  [key: string]: string | number | PVSystObject | PVSystObject[];
}

/**
 * Sanitiza campos de input contra injeções básicas e falhas no parser.
 */
function sanitizeField(value: string): string {
  return value
    .replace(/[<>"']/g, '')          // XSS mitigation
    .replace(/[\x00-\x08\x0b-\x1f]/g, '') // remove controle
    .trim()
    .slice(0, 500);                  // cap em 500 chars por campo
}

/**
 * Infere float e inteiros.
 */
function inferType(value: string): string | number {
  if (value.includes('.')) {
    const f = parseFloat(value);
    if (!isNaN(f)) return f;
  }
  const i = parseInt(value, 10);
  if (!isNaN(i) && String(i) === value) return i;
  return value;
}

/**
 * Parser canônico de arquivos PVSyst (.PAN e .OND).
 * Baseado na hierarquia de 2 espaços por nível (similar ao pvlib.iotools).
 *
 * @param content String bruta do arquivo lido
 * @returns Objeto PVSyst estruturado
 */
export function parsePanOnd(content: string): PVSystObject {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const stack: Array<{ obj: PVSystObject; level: number }> = [];
  const root: PVSystObject = {};
  
  stack.push({ obj: root, level: -1 });

  for (const line of lines) {
    if (!line.trim() || !line.includes('=')) continue;
    if (line.trimStart().startsWith('End of PVObject')) continue;

    // A hierarquia do PVSyst depende estritamente dos espaços à esquerda.
    // 2 espaços = 1 nível aprofundado.
    const indent = line.length - line.trimStart().length;
    const level = Math.floor(indent / 2);
    const eqIdx = line.indexOf('=');
    
    // Fallback caso a linha não tenha `=`
    if (eqIdx === -1) continue;

    const key = line.slice(indent, eqIdx).trim();
    const rawVal = line.slice(eqIdx + 1).trim();

    // Pop stack até o nível correto da árvore
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;
    const safeVal = sanitizeField(rawVal);
    const value = inferType(safeVal);

    if (typeof value === 'string' && value.startsWith('pv')) {
      // Declaração de um novo sub-objeto
      const child: PVSystObject = { [key]: value };

      // Lógica pvlib para tratamento de chaves repetidas:
      // Se já existir, transforma em Array (útil para múltiplos MPPTs ou perfis de eficiência)
      if (parent[key] !== undefined) {
         if (Array.isArray(parent[key])) {
            (parent[key] as PVSystObject[]).push(child);
         } else {
            parent[key] = [parent[key] as PVSystObject, child];
         }
      } else {
         parent[key] = child;
      }
      
      stack.push({ obj: child, level });
    } else {
      // Atribuição de valor simples (Folha da árvore)
      parent[key] = value;
    }
  }

  return root;
}
