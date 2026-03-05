const http = require('http');

// Configuração do teste
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v2/solar/proposals',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Simula token de autenticação (backend espera req.user populado pelo middleware)
    // NOTA: O middleware exige um token válido. Se falhar, precisaremos desabilitar auth temp ou gerar token.
    'Authorization': 'Bearer test-token' 
  }
};

// Payload INVÁLIDO (Teste de Rejeição)
const invalidPayload = JSON.stringify({
  systemSize: -5, // Inválido (min 0.5)
  location: { city: "A" } // Inválido (min 3 chars)
});

// Payload VÁLIDO (Teste de Sucesso)
const validPayload = JSON.stringify({
  systemSize: 5.5,
  monthlyAvgConsumption: 450,
  location: {
    city: "Manaus",
    state: "AM",
    irradiation: 4.8
  },
  hardware: {
    panelBrand: "canadian",
    panelPower: 550,
    panelCount: 10,
    inverterBrand: "sungrow",
    structureType: "metalica"
  }
});

function sendRequest(payload, label) {
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`\n[${label}] Status Code:`, res.statusCode);
      console.log(`[${label}] Response:`, data.substring(0, 200) + "...");
    });
  });

  req.on('error', (e) => {
    console.error(`[${label}] Failed:`, e.message);
  });

  req.write(payload);
  req.end();
}

// Função para login e obtenção de token
function loginAndTest() {
  const loginPayload = JSON.stringify({ username: "admin", password: "123" });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const req = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.success && response.data.token) {
          const token = response.data.token;
          console.log("\n[LOGIN] Sucesso! Token:", token.substring(0, 15) + "...");
          
          // Atualizar headers com o token real
          options.headers['Authorization'] = `Bearer ${token}`;
          
          // Iniciar testes
          console.log("\n--- TESTE 1: Payload Inválido (Espera 400) ---");
          sendRequest(invalidPayload, "INVALID_TEST");

          console.log("\n--- TESTE 2: Payload Válido (Espera 201) ---");
          sendRequest(validPayload, "VALID_TEST");
        } else {
          console.error("[LOGIN] Falha:", data);
        }
      } catch (e) {
        console.error("[LOGIN] Erro ao parsear resposta:", e);
      }
    });
  });

  req.write(loginPayload);
  req.end();
}

console.log("Iniciando fluxo de testes (Login -> API Solar)...");
loginAndTest();
