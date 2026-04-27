/**
 * PVSyst Parser (.PAN / .OND)
 * 
 * Este utilitário implementa o parsing de arquivos hierárquicos do PVSyst
 * estritamente compatível com a biblioteca pvlib.iotools.read_panond.
 */

export interface PVSystObject {
  [key: string]: string | number | PVSystObject;
}

/**
 * Sanitiza valores de entrada para evitar injeção ou caracteres inválidos
 */
function sanitizeField(value: string): string {
  return value
    .replace(/[<>"']/g, '') // Previne injeção HTML/XSS na UI
    .replace(/[\x00-\x08\x0b-\x1f]/g, '') // Remove chars de controle
    .trim()
    .slice(0, 500); // Impede sobrecarga de memória (buffer attack)
}

/**
 * Infere o tipo (string, int ou float) de forma segura
 */
function inferType(value: string): string | number {
  // Tenta parsing de float se tiver ponto e for numérico
  if (value.includes('.') && /^-?\d+\.\d+$/.test(value)) {
    const f = parseFloat(value);
    if (!isNaN(f)) return f;
  }
  
  // Tenta parsing de inteiro
  const i = parseInt(value, 10);
  if (!isNaN(i) && String(i) === value) return i;
  
  // Fallback string
  return value;
}

/**
 * Faz o parsing de um conteúdo .PAN ou .OND em texto
 * @param content Conteúdo em texto do arquivo carregado
 * @returns Objeto hierárquico PVSystObject
 */
export function parsePanOnd(content: string): PVSystObject {
  // Normaliza quebras de linha (Windows/Unix)
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  
  const stack: Array<{ obj: PVSystObject; level: number }> = [];
  const root: PVSystObject = {};
  stack.push({ obj: root, level: -1 });

  for (const rawLine of lines) {
    // Ignora linhas vazias, blocos de comentários e "End of PVObject"
    if (!rawLine.trim() || !rawLine.includes('=')) continue;
    if (rawLine.trimStart().startsWith('End of PVObject')) continue;

    // Calcula indentação: O PVSyst usa EXATAMENTE 2 espaços por nível
    const indent = rawLine.length - rawLine.trimStart().length;
    const level = Math.floor(indent / 2);
    const eqIdx = rawLine.indexOf('=');
    
    if (eqIdx === -1) continue;

    const key = rawLine.slice(indent, eqIdx).trim();
    let rawVal = rawLine.slice(eqIdx + 1).trim();
    
    // Sanitização e tipagem
    rawVal = sanitizeField(rawVal);
    const value = inferType(rawVal);

    // Ajusta a pilha (stack pop) até encontrar o nó pai correspondente à indentação
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    // Detecta início de sub-objeto (geralmente começa com 'pv', ex: 'pvCommercial')
    if (typeof value === 'string' && value.startsWith('pv')) {
      // Conforme convenção, a própria chave é repetida dentro do objeto filho
      const child: PVSystObject = { [key]: value };
      parent[key] = child;
      stack.push({ obj: child, level });
    } else {
      parent[key] = value;
    }
  }

  return root;
}
