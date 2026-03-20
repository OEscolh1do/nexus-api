// Native fetch in Node 22

async function testSecurity() {
  const BASE_URL = 'http://localhost:3001';
  console.log('🛡️  Iniciando Verificação de Segurança Nexus...');

  // 1. Test Universal Create (Should be BLOCKED 405)
  try {
      console.log('\nTeste 1: Tentativa de Universal CRUD (POST /api/v2/users)...');
      const res = await fetch(`${BASE_URL}/api/v2/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake-token' },
          body: JSON.stringify({ username: 'hacker', password: '123' })
      });
      
      if (res.status === 405) {
          console.log('✅ SUCESSO: Rota bloqueada (405 Method Not Allowed).');
      } else {
          console.error(`❌ FALHA: Rota retornou ${res.status}. Esperado: 405.`);
      }
  } catch (e) {
      console.error('Erro de conexão:', e.message);
  }

  // 2. Test IAM Login (Should be Active)
  try {
      console.log('\nTeste 2: IAM Login (Validação Zod)...');
      const res = await fetch(`${BASE_URL}/api/v2/iam/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin' }) // Falta password
      });

      const data = await res.json();
      
      if (res.status === 400 && data.error === 'Erro de validação') {
           console.log('✅ SUCESSO: Zod rejeitou payload inválido corretamente.');
      } else {
           console.log(`⚠️ ALERTA: Retorno inesperado: ${res.status}`, data);
      }
  } catch (e) {
      console.error('Erro de conexão:', e.message);
  }
}

testSecurity();
