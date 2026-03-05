# Script de Limpeza - Remoção de Arquivos Consolidados
# Scaffold v3.0 - Otimização para 9 Anexos

Write-Host "🧹 Iniciando limpeza de arquivos consolidados..." -ForegroundColor Cyan
Write-Host ""

$baseDir = "c:\Users\Neonorte Tecnologia\Documents\Meus Projetos\Neonorte\Neonorte\prompts_unified\00_META\scaffold\modules"

# Lista de arquivos a serem removidos
$filesToRemove = @(
    "$baseDir\domain_specialists\business_specialist.md",
    "$baseDir\domain_specialists\devops_specialist.md",
    "$baseDir\feedback_loop.md",
    "$baseDir\metrics.md",
    "$baseDir\versioning.md"
)

Write-Host "📋 Arquivos a serem removidos:" -ForegroundColor Yellow
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (não encontrado)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Deseja continuar? (S/N)"

if ($confirmation -eq 'S' -or $confirmation -eq 's') {
    Write-Host ""
    Write-Host "🗑️  Removendo arquivos..." -ForegroundColor Cyan
    
    $removedCount = 0
    foreach ($file in $filesToRemove) {
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-Host "  ✓ Removido: $(Split-Path $file -Leaf)" -ForegroundColor Green
            $removedCount++
        }
    }
    
    Write-Host ""
    Write-Host "✅ Limpeza concluída! $removedCount arquivo(s) removido(s)." -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Nova estrutura:" -ForegroundColor Cyan
    Write-Host "  • 9 módulos anexáveis" -ForegroundColor White
    Write-Host "  • 2 módulos consolidados criados:" -ForegroundColor White
    Write-Host "    - specialists_business_devops.md" -ForegroundColor Yellow
    Write-Host "    - learning_system.md" -ForegroundColor Yellow
    
} else {
    Write-Host ""
    Write-Host "❌ Operação cancelada." -ForegroundColor Yellow
}

Write-Host ""
