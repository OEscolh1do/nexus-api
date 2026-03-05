import fs from 'fs';
import path from 'path';

const targetStr = 'http://localhost:3001';
const replacement = '${import.meta.env.VITE_API_BASE_URL || \\'http://localhost:3001\\'}';

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
        // If it's already inside a template literal (e.g. `http://localhost:3001/api/...`), we can just substitute it.
        // If it's a string 'http://localhost:3001' or "http://localhost:3001", replacing it with `${...}` might break string literals if they are not converted to template literals (`...`).
        // Actually, `VITE_API_BASE_URL` should ideally be just a single string to use. But some files use simple strings.
        // Let's do a smarter replace. 
        // Just replace "http://localhost:3001" with import.meta.env.VITE_API_BASE_URL
        // Wait, some use backticks: `http://localhost:3001/api/v2...`
        // Replacing `http://localhost:3001` with `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}` inside backticks works perfectly.
        // If it's inside single or double quotes, it will become a literal string. So we need to change single/double quotes to backticks!

        // Convert 'http://localhost... ' to `http://localhost... `
        content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, '\\`http://localhost:3001$1\\`');
        content = content.replace(/"http:\/\/localhost:3001([^"]*)"/g, '\\`http://localhost:3001$1\\`');

        // Now replace http://localhost:3001 with the env var
        content = content.replace(/http:\/\/localhost:3001/g, replacement);

        fs.writeFileSync(f, content, 'utf8');
        count++;
        console.log('Fixed', f);
    }
});
console.log('Total files updated:', count);
