const fs = require('fs');
const path = require('path');

const targetStr = 'http://localhost:3001';
const replacement = '${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}';

// Simple recursive walk
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
files.push('vite.config.ts');
let count = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes(targetStr)) {

        // Replace 'http://localhost:3001...' with `...`
        content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, '\\`http://localhost:3001$1\\`');
        // Replace "http://localhost:3001..." with `...`
        content = content.replace(/"http:\/\/localhost:3001([^"]*)"/g, '\\`http://localhost:3001$1\\`');

        // Now replace http://localhost:3001
        content = content.replace(/http:\/\/localhost:3001/g, replacement);

        fs.writeFileSync(f, content, 'utf8');
        count++;
        console.log('Fixed', f);
    }
});
console.log('Total files updated:', count);
