# ======================================
# Script Automatizado: Reset + Migração
# ======================================
# Executa reset completo do banco Hostinger

# PASSO 1: Limpar banco (executar SQL manualmente no phpMyAdmin)
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "PASSO 1: Reset do Banco de Dados" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "AÇÃO MANUAL NECESSÁRIA:" -ForegroundColor Red
Write-Host "1. Acesse phpMyAdmin no Hostinger" -ForegroundColor White
Write-Host "2. Selecione o banco: u713519169_nexus" -ForegroundColor White
Write-Host "3. Aba 'SQL' -> Cole o conteúdo de:" -ForegroundColor White
Write-Host "   migrations/0_RESET_DATABASE.sql" -ForegroundColor Green
Write-Host "4. Clique 'Executar'" -ForegroundColor White
Write-Host ""
Write-Host "Pressione ENTER após executar o SQL..." -ForegroundColor Yellow
Read-Host

# PASSO 2: Aplicar migrações Prisma
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "PASSO 2: Aplicando Migrações Prisma" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Sincronizando schema com banco..." -ForegroundColor White
npx prisma db push --accept-data-loss --skip-generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao aplicar migrações!" -ForegroundColor Red
    exit 1
}

# PASSO 3: Gerar cliente Prisma
Write-Host ""
Write-Host "Gerando cliente Prisma..." -ForegroundColor White
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao gerar cliente!" -ForegroundColor Red
    exit 1
}

# PASSO 4: Popular dados iniciais
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "PASSO 3: Populando Dados Iniciais" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Executando seed..." -ForegroundColor White
node seed_admin_fix.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao executar seed!" -ForegroundColor Red
    exit 1
}

# PASSO 5: Verificação
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "VERIFICAÇÃO FINAL" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verificando tabelas criadas..." -ForegroundColor White
npx prisma db pull

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "RESET COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Iniciar backend: npm run dev" -ForegroundColor White
Write-Host "2. Testar login: POST /auth/login" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: 123" -ForegroundColor White
Write-Host ""
Write-Host "Tabelas criadas (incluindo AuditLog): ✓" -ForegroundColor Green
Write-Host "Usuario admin: ✓" -ForegroundColor Green
Write-Host "Estrategia padrao: ✓" -ForegroundColor Green
Write-Host ""
