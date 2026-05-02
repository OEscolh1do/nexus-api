const path = require('path');
const base = path.join(__dirname, '../src');

try {
  console.log('Testando importações...');
  require(path.join(base, 'lib/prismaSumauma'));
  console.log('✅ prismaSumauma carregado');
  require(path.join(base, 'middleware/platformAuth'));
  console.log('✅ platformAuth carregado');
  require(path.join(base, 'lib/permissions'));
  console.log('✅ permissions carregado');
  require(path.join(base, 'routes/operators'));
  console.log('✅ operators router carregado');
  require(path.join(base, 'routes/roles'));
  console.log('✅ roles router carregado');
  require(path.join(base, 'routes/permissions'));
  console.log('✅ permissions router carregado');
  console.log('Todos os módulos carregados com sucesso!');
} catch (err) {
  console.error('ERRO AO CARREGAR MÓDULOS:', err);
  process.exit(1);
}
