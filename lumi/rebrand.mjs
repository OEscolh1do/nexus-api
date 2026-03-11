import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const searchPaths = [
    'index.html',
    'package.json',
    'README.md',
    'src',
    'docs',
];

const extensions = ['.ts', '.tsx', '.json', '.html', '.md', '.sql'];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const stat = fs.statSync(dir);
    if (stat.isFile()) {
        if (extensions.some(ext => dir.endsWith(ext))) {
            return [dir];
        } else {
            return [];
        }
    }

    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (extensions.some(ext => file.endsWith(ext))) {
                results.push(file);
            }
        }
    });
    return results;
}

const allFiles = searchPaths.flatMap(p => walk(path.join(__dirname, p)));

let changedCount = 0;

for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Replace exact cases
    content = content.replace(/SolarFlow/g, 'Lumi');
    content = content.replace(/solarflow/g, 'lumi');
    content = content.replace(/SOLARFLOW/g, 'LUMI');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
        changedCount++;
    }
}

console.log(`Rebrand complete. Updated ${changedCount} files.`);
