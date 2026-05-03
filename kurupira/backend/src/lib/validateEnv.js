const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'LOGTO_ENDPOINT',
  'LOGTO_JWKS_URI',
  'LOGTO_M2M_RESOURCE',
  'DATABASE_URL_SUMAUMA_RO',
];

const PRODUCTION_ONLY = [
  'M2M_SERVICE_TOKEN', // legado — deve ser removido após migração Logto M2M
];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[kurupira] Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}\n` +
      'Copie o .env.example e preencha os valores antes de iniciar.'
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const legacyPresent = PRODUCTION_ONLY.filter((key) => process.env[key]);
    if (legacyPresent.length > 0) {
      console.warn(
        `[kurupira] Variáveis legadas ainda presentes em produção: ${legacyPresent.join(', ')} — remova após confirmar Logto M2M ativo`
      );
    }
  }
}

module.exports = validateEnv;
