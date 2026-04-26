---
name: parser-panond
description: >
  Especialista em leitura, escrita e serialização de arquivos .PAN (módulos FV) e .OND (inversores)
  do PVSyst. Ative quando o Kurupira precisar importar ou exportar componentes fotovoltaicos nesses
  formatos — cobrindo: parser de indentação hierárquica, detecção de codificação (UTF-8 vs ANSI
  legado), inferência de tipos, resolução de conflito de chave em sub-objetos, e serialização com
  terminadores e quebras de linha compatíveis com o PVSyst.
---

# Skill: Parser de Arquivos .PAN e .OND (PVSyst)

Consultor de domínio ativado durante qualquer tarefa do Kurupira que envolva leitura ou geração
de arquivos de componentes do PVSyst — módulos (`.PAN`) ou inversores (`.OND`).

---

## Por Que o Formato Exige uma Skill Dedicada

O formato PVSyst não é JSON, XML ou INI. É um sistema de pares `Chave=Valor` com hierarquia
definida **exclusivamente por indentação de espaços** — sem delimitadores de bloco explícitos
além dos marcadores `PVObject_=...` e `End of PVObject ...`. Dois espaços = um nível. Um erro
de espaçamento silenciosamente muda o pai de um parâmetro e corrompe a simulação sem nenhuma
mensagem de erro no PVSyst.

Além disso, o mesmo arquivo pode estar em ANSI (versões < 6.40), codificação local/Windows
(6.40–6.79) ou UTF-8 (6.80+). Um parser que não detecta a codificação corretamente corrompe
nomes de fabricantes com caracteres especiais.

A biblioteca de referência para este formato é `pvlib.iotools.read_panond` — ela processa
**ambos** `.PAN` e `.OND` com o mesmo algoritmo. Toda implementação no Kurupira deve ser
compatível com o comportamento dessa função.

---

## Estrutura Canônica de um Arquivo PVSyst

```
PVObject_=pvModule                    ← declaração do objeto raiz
  Version=7.1.1                       ← metadado de versão
  PVObject_Commercial=pvCommercial    ← sub-objeto (nível 1 = 2 espaços)
    Manufacturer=Honor Solar           ← parâmetro do sub-objeto (nível 2 = 4 espaços)
    Model=HY-M12-132H-665W
    Width=1.303
    Height=2.384
  End of PVObject pvCommercial        ← terminador obrigatório
  Technol=mtSiMono                    ← de volta ao nível 0
  NCelS=66
  NCelP=2
  ...
End of PVObject pvModule              ← terminador do objeto raiz
```

Regras estruturais absolutas:
- **Dois espaços** por nível de indentação — nunca tabs
- Linhas sem `=` são ignoradas pelo PVSyst (exceto `End of PVObject ...` e `Remarks`)
- Blocos `Remarks` podem conter múltiplas linhas de texto livre
- O mesmo nome de chave pode repetir-se em sub-objetos distintos sem conflito

---

## Algoritmo de Parsing (Referência pvlib)

### Passo a passo

```
1. Detectar e decodificar a codificação do arquivo
2. Para cada linha:
   a. Contar espaços iniciais → nível = espaços / 2
   b. Se contém '=': separar em chave e valor
   c. Se nível > nível_anterior: criar sub-objeto com a chave atual no dict pai
   d. Se nível < nível_anterior: retornar ao dict do nível correspondente
   e. Inferir tipo do valor e armazenar
3. Retornar dicionário aninhado
```

### Detecção de codificação

```python
def detect_encoding(filepath: str) -> str:
    with open(filepath, 'rb') as f:
        raw = f.read(4)
    if raw.startswith(b'\xef\xbb\xbf'):
        return 'utf-8-sig'   # UTF-8 com BOM (versão 6.80+)
    try:
        raw_full = open(filepath, 'rb').read()
        raw_full.decode('utf-8')
        return 'utf-8'
    except UnicodeDecodeError:
        return 'latin-1'     # ANSI/Windows legado (versões < 6.80)
```

### Inferência de tipos

```python
def infer_type(value: str):
    if '.' in value:
        try: return float(value)
        except ValueError: pass
    try: return int(value)
    except ValueError: pass
    return value  # string
```

### Resolução de conflito de chave

Quando uma linha indentada abre um sub-objeto cujo nome já é usado como chave no nível pai,
a convenção do pvlib é **repetir a chave dentro do sub-objeto filho**:

```python
# Linha: "  PVObject_Commercial=pvCommercial"
# Resultado no dict:
{
    "PVObject_Commercial": {
        "PVObject_Commercial": "pvCommercial",  # chave repetida no filho
        "Manufacturer": "Honor Solar",
        ...
    }
}
```

Isso preserva a identidade do tipo de objeto sem sobrescrever o valor original da chave pai.

---

## Implementação TypeScript (Frontend / Node.js)

```typescript
interface PVSystObject {
  [key: string]: string | number | PVSystObject;
}

function parsePanOnd(content: string): PVSystObject {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const stack: Array<{ obj: PVSystObject; level: number }> = [];
  const root: PVSystObject = {};
  stack.push({ obj: root, level: -1 });

  for (const line of lines) {
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
      // É uma declaração de sub-objeto
      const child: PVSystObject = { [key]: value };
      parent[key] = child;
      stack.push({ obj: child, level });
    } else {
      parent[key] = value;
    }
  }

  return root;
}

function inferType(value: string): string | number {
  if (value.includes('.')) {
    const f = parseFloat(value);
    if (!isNaN(f)) return f;
  }
  const i = parseInt(value, 10);
  if (!isNaN(i) && String(i) === value) return i;
  return value;
}
```

---

## Serialização para Exportação

### Regras críticas de serialização

| Regra | Motivo |
|-------|--------|
| Quebras de linha `\r\n` (CRLF) | PVSyst é Windows-native; parsers internos podem falhar com `\n` puro |
| Codificação UTF-8 sem BOM | Padrão da versão 6.80+; BOM causa falha na leitura em v6.40–6.79 |
| Dois espaços por nível | Qualquer outro valor quebra a hierarquia silenciosamente |
| Terminador `End of PVObject <tipo>` | Obrigatório para cada bloco — sem ele o PVSyst ignora parâmetros subsequentes |
| Precisão decimal preservada | `RSerie=0.123456` ≠ `RSerie=0.12` — arredondamento desloca a curva I-V |

### Template de exportação .PAN

```
PVObject_=pvModule\r\n
Version=7.1.1\r\n
PVObject_Commercial=pvCommercial\r\n
  Manufacturer={manufacturer}\r\n
  Model={model}\r\n
  Width={width}\r\n
  Height={height}\r\n
  DataSource={dataSource}\r\n
End of PVObject pvCommercial\r\n
Technol={technol}\r\n
NCelS={nCelS}\r\n
NCelP={nCelP}\r\n
SubType={subType}\r\n
Pnom={pnom}\r\n
Vmp={vmp}\r\n
Imp={imp}\r\n
Voc={voc}\r\n
Isc={isc}\r\n
TempCoeff_Voc={tempCoeffVoc}\r\n
TempCoeff_Isc={tempCoeffIsc}\r\n
TempCoeff_Pmax={tempCoeffPmax}\r\n
RShunt={rShunt}\r\n
Rp_0={rp0}\r\n
Rp_Exp={rpExp}\r\n
RSerie={rSerie}\r\n
Gamma={gamma}\r\n
muGamma={muGamma}\r\n
End of PVObject pvModule\r\n
```

### Template de exportação .OND

```
PVObject_=pvInverter\r\n
Version=7.1.1\r\n
PVObject_Commercial=pvCommercial\r\n
  Manufacturer={manufacturer}\r\n
  Model={model}\r\n
End of PVObject pvCommercial\r\n
Vac={vac}\r\n
PackageType={packageType}\r\n
Pnom={pAcNom}\r\n
Pmax={pAcMax}\r\n
Vmin={vMinMpp}\r\n
Vmax={vMaxMpp}\r\n
Vabsmax={vAbsMax}\r\n
Eff_Max={effMax}\r\n
Pthreshold={pThreshold}\r\n
PVObject_=TCubicProfile\r\n
  ...curva de eficiência...\r\n
End of PVObject TCubicProfile\r\n
End of PVObject pvInverter\r\n
```

---

## Integração com pvlib (Backend Python)

Quando o backend rodar Python (FastAPI/Django), usar diretamente a função oficial:

```python
from pvlib.iotools import read_panond

# Funciona para .PAN e .OND com a mesma função
module_params, module_info = read_panond('modulo.pan')
inverter_params, inverter_info = read_panond('inversor.ond')
```

Retorna dois dicionários: parâmetros técnicos e metadados comerciais.

---

## Sanitização de Input para Segurança

Arquivos `.PAN`/`.OND` carregados por usuários podem conter:
- Strings com comprimento excessivo (ataque de buffer em parsers ingênuos)
- Caracteres de controle injetados nos campos de valor
- Chaves fabricadas que sobrescrevem parâmetros críticos

Sanitização obrigatória antes do parse:

```typescript
function sanitizeField(value: string): string {
  return value
    .replace(/[<>"']/g, '')          // XSS em campos exibidos na UI
    .replace(/[\x00-\x08\x0b-\x1f]/g, '') // caracteres de controle
    .trim()
    .slice(0, 500);                  // tamanho máximo por campo
}
```

---

## Handoff para Outras Skills

| Entrega | Destinatário |
|---------|-------------|
| Dicionário de parâmetros do módulo (Voc, Isc, Vmp, NCelS, RSerie...) | `validador-pan` |
| Dicionário de parâmetros do inversor (Vmin_mpp, Vmax_mpp, Vabsmax, Pnom...) | `validador-ond` |
| Parâmetros elétricos do módulo para cálculo de string | `dimensionamento-string` |
| Parâmetros do inversor para seleção e compatibilidade | `compatibilidade-modulos-inversor` |
| Parâmetros do módulo para SDM e simulação TMY | `pv-simulation-engine` |
| Arquivo serializado para download pelo usuário | `the-builder` (endpoint de export) |
