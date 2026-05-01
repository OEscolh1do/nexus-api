import fs from 'fs';
const content = fs.readFileSync('d:/Repositório_Pessoal/SaaS Projects/Neonorte/Kurupira-Iaca/kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/SiteCanvasView.tsx', 'utf8');

const count = (char) => content.split(char).length - 1;

console.log('{ count:', count('{'));
console.log('} count:', count('}'));
console.log('( count:', count('('));
console.log(') count:', count(')'));
console.log('[ count:', count('['));
console.log('] count:', count(']'));
