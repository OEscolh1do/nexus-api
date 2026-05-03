const axios = require('axios');

async function testUpload() {
  console.log('--- Iniciando Teste de Upload M2M ---');
  
  try {
    // 1. Testar Health Check do Kurupira
    console.log('1. Testando Health do Kurupira (Porta 3002)...');
    const kurupiraHealth = await axios.get('http://localhost:3002/health');
    console.log('   Kurupira Online:', kurupiraHealth.data);

    // 2. Testar Rota Interna do Kurupira
    console.log('2. Testando Rota Interna do Kurupira...');
    try {
      await axios.post('http://localhost:3002/internal/catalog/modules', {}, {
        headers: { 'X-Service-Token': 'm2m_guardioes_secret_2026!' }
      });
    } catch (err) {
      console.log('   Kurupira Respondeu (esperado erro de validação):', err.response?.status, err.response?.data);
      if (err.response?.status === 404) {
        console.error('   ERRO: A rota /internal/catalog/modules NÃO existe no Kurupira!');
      }
    }

    // 3. Testar Rota do Sumaúma BFF
    console.log('3. Testando Rota do Sumaúma BFF (Porta 3003)...');
    try {
      await axios.post('http://localhost:3003/admin/catalog/modules', {
        filename: 'teste.pan',
        content: 'PVObject_=pvModule\nModel=Teste\nEnd of PVObject pvModule'
      });
    } catch (err) {
      console.log('   Sumaúma Respondeu:', err.response?.status, err.response?.data);
    }

  } catch (error) {
    console.error('ERRO CRÍTICO NO TESTE:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Um dos serviços não está rodando localmente!');
    }
  }
}

testUpload();
