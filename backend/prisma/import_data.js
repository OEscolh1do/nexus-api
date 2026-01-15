// /backend/prisma/import_data.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Função para ler e limpar CSV
function readCSV(filename) {
    const filePath = path.join(__dirname, 'dados', filename);
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Erro: Arquivo não encontrado em: ${filePath}`);
        return [];
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // Divide por linhas e remove linhas vazias
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // Remove o cabeçalho (primeira linha)
    lines.shift(); 

    return lines;
}

// Função para limpar números (ex: "2,58" vira 2.58)
function cleanNumber(value) {
    if (!value) return 0;
    // Remove R$, espaços, e troca vírgula por ponto
    let clean = value.toString().replace('R$', '').trim().replace(',', '.');
    return parseFloat(clean) || 0;
}

async function main() {
    console.log("🚀 Iniciando importação massiva de dados...");

    // --- 1. IMPORTAR MÓDULOS (Planilha2.csv renomeada para modulos.csv) ---
    const modulosLines = readCSV('modulos.csv');
    console.log(`📄 Lendo ${modulosLines.length} módulos...`);

    for (const line of modulosLines) {
        // Ajuste aqui conforme a ordem das colunas do seu CSV
        // Exemplo esperado: Fabricante;Modelo;Potência;Eficiência;Área;Peso
        const cols = line.split(';'); 
        
        if (cols.length < 5) continue; // Pula linhas quebradas

        const manufacturer = cols[0]?.trim() || 'Genérico';
        const model = cols[1]?.trim() || 'Modelo Desconhecido';
        const power = cleanNumber(cols[2]);     // W
        const efficiency = cleanNumber(cols[3]) / 100; // % para decimal
        const area = cleanNumber(cols[4]);      // m²
        const weight = cleanNumber(cols[5]);    // kg

        if (model && power > 0) {
            await prisma.solarPanel.upsert({
                where: { model: model },
                update: { manufacturer, power, efficiency, area, weight }, // Atualiza se já existir
                create: { manufacturer, model, power, efficiency, area, weight }
            });
        }
    }
    console.log("✅ Módulos importados com sucesso!");

    // --- 2. IMPORTAR INVERSORES (Inversores.csv renomeado) ---
    const inversoresLines = readCSV('inversores.csv');
    console.log(`📄 Lendo ${inversoresLines.length} inversores...`);

    for (const line of inversoresLines) {
        // Ajuste aqui conforme a ordem das colunas do seu CSV
        // Exemplo esperado: Fabricante;Modelo;Potência;Tensão;MPPT
        const cols = line.split(';');

        if (cols.length < 3) continue;

        const manufacturer = cols[0]?.trim() || 'Genérico';
        const model = cols[1]?.trim() || 'Inversor Padrão';
        const power = cleanNumber(cols[2]);     // kW
        const voltage = cleanNumber(cols[3]);   // V (ex: 220)
        const mpptCount = cleanNumber(cols[4]); // Qtd

        if (model && power > 0) {
            await prisma.inverter.upsert({
                where: { model: model },
                update: { manufacturer, power, voltage: parseInt(voltage), mpptCount: parseInt(mpptCount) },
                create: { manufacturer, model, power, voltage: parseInt(voltage), mpptCount: parseInt(mpptCount) }
            });
        }
    }
    console.log("✅ Inversores importados com sucesso!");
}

main()
  .catch(e => {
    console.error("❌ Erro fatal na importação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });