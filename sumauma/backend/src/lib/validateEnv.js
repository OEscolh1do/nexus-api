const REQUIRED = [
  'JWT_SECRET',
  'LOGTO_ENDPOINT',
  'LOGTO_JWKS_URI',
  'LOGTO_M2M_CLIENT_ID',
  'LOGTO_M2M_CLIENT_SECRET',
  'LOGTO_M2M_RESOURCE',
  'KURUPIRA_INTERNAL_URL',
];

const PRODUCTION_ONLY = [
  'M2M_SERVICE_TOKEN', // legado — deve ser removido após migração Logto M2M
];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[sumauma] Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}\n` +
      'Copie o .env.example e preencha os valores antes de iniciar.'
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const legacyPresent = PRODUCTION_ONLY.filter((key) => process.env[key]);
    if (legacyPresent.length > 0) {
      console.warn(
        `[sumauma] Variáveis legadas ainda presentes em produção: ${legacyPresent.join(', ')} — remova após confirmar Logto M2M ativo`
      );
    }
  }
}

module.exports = validateEnv;
