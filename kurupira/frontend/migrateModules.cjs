const fs = require('fs');
const path = require('path');

const modulePath = path.join(__dirname, 'src', 'data', 'equipment', 'modules.ts');
let content = fs.readFileSync(modulePath, 'utf8');

const arrayStart = content.indexOf('[');
const arrayEnd = content.lastIndexOf(']');
const jsonString = content.substring(arrayStart, arrayEnd + 1);

let oldArray;
try {
  // eval needs parenthesis to treat it as an array expression instead of block
  oldArray = eval('(' + jsonString + ')');
} catch (e) {
  console.error('Failed to parse array:', e);
  process.exit(1);
}

const newArray = oldArray.map((item, i) => {
    let widthMm = 1000, heightMm = 2000, depthMm = 35;
    if (item['Dimensões (mm)']) {
        const parts = item['Dimensões (mm)'].split('x').map(Number);
        if (parts.length === 3) {
            heightMm = parts[0];
            widthMm = parts[1];
            depthMm = parts[2];
        } else if (parts.length === 2) {
            heightMm = parts[0];
            widthMm = parts[1];
        }
    }

    let eff = item['ƞ Módulo'] || item['Eficiência'] || 0.17;
    if (eff < 1) eff = eff * 100;

    return {
        id: 'mod-' + (item['Fabricante'] || 'unk').toLowerCase() + '-' + (item['Potência'] || '0') + '-' + i,
        manufacturer: item['Fabricante'] || 'Unknown',
        model: item['Modelo'] || 'Unknown',
        electrical: {
            pmax: item['Potência'] || 0,
            vmp: item['Vmáx'] || 0,
            imp: item['Imáx'] || 0,
            voc: item['Voc/Vca'] || 0,
            isc: item['Isc/Icc'] || 0,
            efficiency: Number(eff.toFixed(2)),
            tempCoeffVoc: item['Coef. Temperatura/°C'] || -0.29,
        },
        physical: {
            widthMm,
            heightMm,
            depthMm,
            weightKg: item['Peso'] || 20,
            cells: item['Número de células'] || 72,
        }
    };
});

const newContent = `import { moduleDatabaseSchema } from '../../core/schemas/moduleSchema';

export const MODULE_DB = moduleDatabaseSchema.parse(
${JSON.stringify(newArray, null, 4)}
);
`;

fs.writeFileSync(modulePath, newContent);
console.log(`Modules migration completed. Mapped ${newArray.length} items to nested schemas.`);
