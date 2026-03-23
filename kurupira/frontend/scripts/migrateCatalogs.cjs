const fs = require('fs');
const path = require('path');

function parseDimensions(dimStr) {
    if (!dimStr) return { w: 1000, h: 2000, d: 35 };
    const parts = dimStr.toLowerCase().split('x');
    if (parts.length === 3) {
        return { h: parseFloat(parts[0]), w: parseFloat(parts[1]), d: parseFloat(parts[2]) };
    }
    return { w: 1000, h: 2000, d: 35 };
}

// ---------------- MODULES -----------------------
const modulesPath = path.join(__dirname, '../src/data/equipment/modules.ts');
const mContent = fs.readFileSync(modulesPath, 'utf-8');
const mMatch = mContent.match(/export const MODULE_DB = moduleDatabaseSchema.parse\(\[([\s\S]*?)\]\)/);

if (mMatch) {
    const arr = eval('[' + mMatch[1] + ']');
    const newArr = arr.map((m) => {
        const slug = (m.Fabricante + '-' + m.Modelo).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const dims = parseDimensions(m['Dimensões (mm)']);
        return {
            id: slug,
            manufacturer: m.Fabricante,
            model: m.Modelo,
            electrical: {
                pmax: m['Potência'],
                voc: m['Voc/Vca'],
                vmp: m['Vmáx'],
                isc: m['Isc/Icc'],
                imp: m['Imáx'],
                efficiency: m['ƞ Módulo'],
                tempCoeffVoc: m['Coef. Temperatura/°C'],
                maxFuseRating: m['Máx. Corr. Fusível (série)']
            },
            physical: {
                widthMm: dims.w,
                heightMm: dims.h,
                depthMm: dims.d,
                weightKg: m.Peso,
                cells: m['Número de células']
            }
        };
    });
    const newContent = "import { moduleDatabaseSchema } from '../../core/schemas/moduleSchema';\n\n" +
        "export const MODULE_DB = moduleDatabaseSchema.parse(" + JSON.stringify(newArr, null, 4) + ");\n";
    fs.writeFileSync(modulesPath, newContent);
    console.log('Migrated modules.ts');
}

// ---------------- INVERTERS -----------------------
const invertersPath = path.join(__dirname, '../src/modules/engineering/constants/inverters.ts');
const iContent = fs.readFileSync(invertersPath, 'utf-8');
const iMatch = iContent.match(/export const INVERTER_CATALOG = inverterCatalogSchema.parse\(\[([\s\S]*?)\]\)/);

if (iMatch) {
    const arr = eval('[' + iMatch[1] + ']');
    const newArr = arr.map((inv) => {
        // If it already has nested mppts, skip or adapt
        if (inv.mppts && Array.isArray(inv.mppts)) return inv;
        
        // Old structure: inv.mppts was a number. Let's create an array of MPPTSpecSchema
        const mpptsCount = typeof inv.mppts === 'number' ? inv.mppts : 2;
        const generatedMppts = [];
        for(let i=1; i<=mpptsCount; i++) {
            generatedMppts.push({
                mpptId: i,
                maxInputVoltage: inv.maxInputVoltage || 600,
                minMpptVoltage: inv.minMpptVoltage || 80,
                maxMpptVoltage: inv.maxMpptVoltage || 550,
                maxCurrentPerMPPT: inv.maxIscPerMppt || 15,
                stringsAllowed: 1
            });
        }
        
        return {
            id: inv.id,
            manufacturer: inv.manufacturer,
            model: inv.model,
            nominalPowerW: inv.powerAc || 5000,
            maxDCPowerW: (inv.powerAc || 5000) * 1.3,
            mppts: generatedMppts,
            efficiency: {
                euro: inv.efficiency || 97.5
            }
        };
    });
    const newContent = "import { inverterCatalogSchema } from '@/core/schemas/inverterSchema';\n\n" +
        "export const INVERTER_CATALOG = inverterCatalogSchema.parse(" + JSON.stringify(newArr, null, 4) + ");\n";
    fs.writeFileSync(invertersPath, newContent);
    console.log('Migrated inverters.ts');
}
