const fs = require('fs');
const glob = require('glob');

const files = glob.sync('d:/Repositório_Pessoal/SaaS Projects/Neonorte/Neonorte/kurupira/frontend/src/**/*.{ts,tsx}');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix 1: replace arr.reduce((acc, m) => acc + m.quantity, 0) -> arr.length
    content = content.replace(/(\w+)\.reduce\s*\(\s*\([^,]+,\s*[^\)]+\)\s*=>\s*[^\s]+\s*\+\s*[^\.]+\.(?:quantity\|\|0|quantity|\(quantity\s*\|\|\s*0\))\s*,\s*0\s*\)/g, '$1.length');

    // Fix 2: replace arr.reduce((acc, m) => acc + (m.power * m.quantity), 0) -> arr.reduce((acc, m) => acc + m.power, 0)
    content = content.replace(/m\.(power|area|weight|voc)\s*\*\s*m\.quantity/g, 'm.$1');
    content = content.replace(/m\.quantity\s*\*\s*m\.(power|area|weight|voc)/g, 'm.$1');
    
    // Fix limits or defaults: ((m.area || 2) * m.quantity) -> (m.area || 2)
    content = content.replace(/\(\(m\.(power|area|weight|voc)\s*\|\|\s*[\d\.]+\)\s*\*\s*m\.quantity\)/g, '(m.$1 || 0)');

    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});
