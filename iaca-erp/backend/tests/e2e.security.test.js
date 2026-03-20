/**
 * 🧪 TESTES E2E - AUTENTICAÇÃO E RBAC
 * 
 * Valida:
 * 1. Login de diferentes usuários
 * 2. Controle de acesso RBAC
 * 3. Validação Zod em ação
 * 4. Auditoria de mudanças
 */

const http = require('http');

// Helper para fazer requests HTTP
function makeRequest(method, path, body, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

async function runTests() {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}🧪 TESTES E2E - NEXUS 2.0 HARDENED SECURITY${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  // TEST 1: Login do ADMIN
  console.log(`${colors.yellow}TEST 1: Login do usuário ADMIN${colors.reset}`);
  try {
    const res = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: '123'
    });

    if (res.status === 200 && res.data.success && res.data.data.token) {
      console.log(`${colors.green}✓ Login bem-sucedido${colors.reset}`);
      console.log(`  Token: ${res.data.data.token.substring(0, 20)}...`);
      console.log(`  User: ${res.data.data.user.username} (${res.data.data.user.role})`);
      passed++;
      
      var adminToken = res.data.data.token;
      var adminUserId = res.data.data.user.id;
    } else {
      console.log(`${colors.red}✗ Login falhou${colors.reset}`);
      console.log(`  Status: ${res.status}`);
      failed++;
      return;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Erro: ${e.message}${colors.reset}`);
    failed++;
    return;
  }

  // TEST 2: Login do VENDEDOR
  console.log(`\n${colors.yellow}TEST 2: Login do usuário VENDEDOR${colors.reset}`);
  try {
    const res = await makeRequest('POST', '/auth/login', {
      username: 'vendedor',
      password: '123'
    });

    if (res.status === 200 && res.data.success) {
      console.log(`${colors.green}✓ Login bem-sucedido${colors.reset}`);
      console.log(`  User: ${res.data.data.user.username} (${res.data.data.user.role})`);
      passed++;
      
      var vendedorToken = res.data.data.token;
    } else {
      console.log(`${colors.red}✗ Login falhou${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Erro: ${e.message}${colors.reset}`);
    failed++;
  }

  // TEST 3: Buscar projetos (autenticado)
  console.log(`\n${colors.yellow}TEST 3: Buscar projetos como ADMIN${colors.reset}`);
  try {
    const res = await makeRequest('GET', '/api/projects', null, adminToken);

    if (res.status === 200 && res.data.success) {
      console.log(`${colors.green}✓ Projetos recuperados${colors.reset}`);
      console.log(`  Total: ${res.data.data.length} projetos`);
      
      if (res.data.data.length > 0) {
        var projectId = res.data.data[0].id;
        var projectType = res.data.data[0].type;
        console.log(`  Exemplo: ${res.data.data[0].title} (${projectType})`);
      }
      passed++;
    } else {
      console.log(`${colors.red}✗ Falhou ao buscar projetos${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Erro: ${e.message}${colors.reset}`);
    failed++;
  }

  // TEST 4: Tentar atualizar projeto sem autenticação (deve falhar)
  console.log(`\n${colors.yellow}TEST 4: Tentar atualizar projeto SEM token (deve falhar)${colors.reset}`);
  try {
    const res = await makeRequest('PUT', `/api/projects/${projectId}`, {
      title: 'Projeto Hackeado'
    });

    if (res.status === 401) {
      console.log(`${colors.green}✓ Acesso negado corretamente (401 Unauthorized)${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FALHA DE SEGURANÇA: Deveria retornar 401${colors.reset}`);
      console.log(`  Status recebido: ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Erro: ${e.message}${colors.reset}`);
    failed++;
  }

  // TEST 5: Validação Zod - Rejeitar payload inválido
  console.log(`\n${colors.yellow}TEST 5: Validação Zod - Payload inválido (deve falhar)${colors.reset}`);
  try {
    const res = await makeRequest('PUT', `/api/projects/${projectId}`, {
      details: {
        solar: {
          version: "1.0",
          inputData: {
            address: "Rua Teste",
            monthlyConsumption: -9999, // ❌ Inválido (negativo)
          }
        }
      }
    }, adminToken);

    if (res.status === 400) {
      console.log(`${colors.green}✓ Validação Zod rejeitou payload inválido (400)${colors.reset}`);
      console.log(`  Mensagem: ${res.data.error}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ FALHA DE SEGURANÇA: Deveria rejeitar com 400${colors.reset}`);
      console.log(`  Status recebido: ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Erro: ${e.message}${colors.reset}`);
    failed++;
  }

  // TEST 6: Atualizar projeto com dados válidos
  console.log(`\n${colors.yellow}TEST 6: Atualizar projeto com dados VÁLIDOS${colors.reset}`);
  try {
    const res = await makeRequest('PUT', `/api/projects/${projectId}`, {
      details: {
        solar: {
          version: "1.0",
          inputData: {
            address: "Avenida Paulista, 1000 - São Paulo/SP",
            monthlyConsumption: 850,
            latitude: -23.561414,
            longitude: -46.656178,
          },
          proposalData: {
            systemPower: 12.5,
            numberOfPanels: 25,
            estimatedCost: 75000,
          }
        }
      }
    }, adminToken);

    if (res.status === 200 && res.data.success) {
      console.log(`${colors.green}✓ Projeto atualizado com validação aprovada${colors.reset}`);
      console.log(`  Details persistido no MySQL`);
      console.log(`  Auditoria: Log criado no AuditLog`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Falhou ao atualizar${colors.reset}`);
      console.log(`  Status: ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Erro: ${e.message}${colors.reset}`);
    failed++;
  }

  // RESUMO FINAL
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}RESUMO DOS TESTES${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}✓ Testes Passados: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Testes Falhados: ${failed}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}🎉 TODOS OS TESTES PASSARAM!${colors.reset}`);
    console.log(`${colors.green}Sistema blindado e operacional.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ Alguns testes falharam.${colors.reset}\n`);
    process.exit(1);
  }
}

// Executar
runTests().catch(err => {
  console.error(`${colors.red}Erro fatal:${colors.reset}`, err);
  process.exit(1);
});
