const http = require('http');

const data = JSON.stringify({
  email: 'admin@neonorte.com',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', body);
    if (res.statusCode === 200) {
      console.log('✅ LOGIN SUCESSO! Token recebido.');
    } else {
      console.log('❌ LOGIN FALHOU.');
    }
  });
});

req.on('error', (e) => {
  console.error(`problema na requisição: ${e.message}`);
});

req.write(data);
req.end();
