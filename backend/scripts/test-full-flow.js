const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Iniciando Teste Completo de Login...');

// 1. Iniciar Backend
console.log('📦 Iniciando servidor backend...');
const server = spawn('node', ['src/index.js'], { cwd: __dirname + '/../', env: process.env });

server.stdout.on('data', (data) => {
  console.log(`[SERVER]: ${data}`);
  if (data.toString().includes('NEXUS rodando')) {
    console.log('✅ Servidor detectado online!');
    runLoginTest();
  }
});

server.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR]: ${data}`);
});

function runLoginTest() {
  console.log('🔑 Tentando login...');
  
  const data = JSON.stringify({
    email: 'admin@neonorte.com',
    password: 'admin123'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('RESPOSTA:', body);
      
      if (res.statusCode === 200) {
        console.log('🎉 SUCESSO! Login realizado e token recebido.');
      } else {
        console.log('❌ FALHA NO LOGIN.');
      }
      
      // Cleanup
      server.kill();
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Erro no request: ${e.message}`);
    server.kill();
    process.exit(1);
  });

  req.write(data);
  req.end();
}

// Timeout de segurança (15s)
setTimeout(() => {
  console.log('⏰ Timeout! Servidor demorou demais.');
  server.kill();
  process.exit(1);
}, 15000);
