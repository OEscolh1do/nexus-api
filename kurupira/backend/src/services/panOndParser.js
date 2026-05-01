/**
 * Parser de arquivos .PAN e .OND (PVSyst)
 * Regra principal: A hierarquia é definida apenas por indentação (2 espaços).
 */

function parsePanOnd(content) {
  // Padroniza as quebras de linha e remove caracteres nulos
  const lines = content.replace(/\r\n/g, '\n').replace(/[\x00-\x08\x0b-\x1f]/g, '').split('\n');
  
  const stack = [];
  const root = {};
  stack.push({ obj: root, level: -1 });

  for (let line of lines) {
    if (!line.trim() || !line.includes('=')) continue;
    if (line.trimStart().startsWith('End of PVObject')) continue;

    const indent = line.length - line.trimStart().length;
    const level = Math.floor(indent / 2);
    const eqIdx = line.indexOf('=');
    const key = line.slice(indent, eqIdx).trim();
    const rawVal = line.slice(eqIdx + 1).trim();

    // Pop stack até o nível correto
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;
    const value = inferType(rawVal);

    if (typeof value === 'string' && value.startsWith('pv')) {
      // É uma declaração de sub-objeto (ex: PVObject_Commercial=pvCommercial)
      // O PV lib repete a chave no filho, mas por simplicidade, podemos apenas associar ao pai.
      const child = { [key]: value };
      parent[key] = child;
      stack.push({ obj: child, level });
    } else if (typeof value === 'string' && value.startsWith('T') && key.startsWith('PVObject_')) {
      // Declaração genérica de bloco estruturado (ex: PVObject_=TCubicProfile)
      const child = { [key]: value };
      parent[key] = child;
      stack.push({ obj: child, level });
    } else {
      parent[key] = value;
    }
  }

  return root;
}

function inferType(value) {
  if (value.includes('.')) {
    const f = parseFloat(value);
    if (!isNaN(f) && String(f) !== 'NaN') return f;
  }
  const i = parseInt(value, 10);
  if (!isNaN(i) && String(i) === value) return i;
  return value;
}

module.exports = { parsePanOnd };
