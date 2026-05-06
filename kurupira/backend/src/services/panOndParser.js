/**
 * Parser de arquivos .PAN e .OND (PVSyst)
 * Regra principal: A hierarquia é definida apenas por indentação (2 espaços).
 */

function parsePanOnd(content) {
  // Padroniza as quebras de linha e remove caracteres nulos
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[\x00-\x08\x0b-\x1f]/g, '').split('\n');
  
  const stack = [];
  const root = {};
  stack.push({ obj: root, level: -1 });

  for (let line of lines) {
    if (!line.trim() || !line.includes('=')) continue;
    // Ignorar todos os terminadores: End of PVObject, End of TConverter, End of TCubicProfile, End of Remarks, etc.
    if (/^\s*End of /.test(line)) continue;
    // Ignorar bloco Remarks (linhas Str_N= são metadados textuais, não parâmetros elétricos)
    if (/^\s*Remarks,/.test(line)) continue;

    const indent = line.length - line.trimStart().length;
    // Normaliza para nível lógico (2 espaços = 1 nível), igual ao parser do frontend
    const level = Math.floor(indent / 2);
    const eqIdx = line.indexOf('=');
    const key = line.slice(indent, eqIdx).trim();
    const rawVal = line.slice(eqIdx + 1).trim();

    // Pop stack até o nível correto — CRÍTICO: deve usar >= para não deixar
    // campos de mesmo nível presos dentro do sub-objeto anterior
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;
    const value = inferType(rawVal);

    if (typeof value === 'string' && value.startsWith('pv')) {
      // Sub-objeto PVSyst (ex: PVObject_Commercial=pvCommercial, PVObject_IAM=pvIAM)
      const child = { [key]: value };
      parent[key] = child;
      stack.push({ obj: child, level });
    } else if (typeof value === 'string' && /^T[A-Z]/.test(value)) {
      // Bloco estruturado cujo tipo começa com T maiúsculo (ex: TCubicProfile).
      // Cobre tanto PVObject_=TCubicProfile quanto IAMProfile=TCubicProfile.
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
  // Par separado por vírgula (ex: Point_N=0.0,1.00000 em perfis IAM/TCubicProfile)
  // Preservar como string para não descartar o segundo valor silenciosamente.
  if (value.includes(',')) return value;

  // Versão ou string com múltiplos pontos (ex: 7.1.1)
  if ((value.match(/\./g) || []).length > 1) return value;

  if (value.includes('.')) {
    const f = parseFloat(value);
    if (!isNaN(f) && String(f) !== 'NaN') return f;
  }

  // Inteiros
  const i = parseInt(value, 10);
  if (!isNaN(i) && String(i) === value) return i;

  return value;
}

module.exports = { parsePanOnd };

