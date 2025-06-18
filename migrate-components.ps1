# Script de Migración de Componentes Restantes
# Lexicon - Sistema Multijugador en Tiempo Real

Write-Host "🚀 Iniciando migración de componentes restantes a sistema multijugador..." -ForegroundColor Green

# Crear backups de archivos originales
Write-Host "📁 Creando backups de archivos originales..." -ForegroundColor Yellow

$reviewPath = "src/app/rooms/[roomId]/round/[roundNumber]/review/page.tsx"
$waitPath = "src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx"
$resultsPath = "src/app/rooms/[roomId]/results/page.tsx"

if (Test-Path $reviewPath) {
    Copy-Item $reviewPath "src/app/rooms/[roomId]/round/[roundNumber]/review/page-original.tsx"
    Write-Host "✅ Backup creado: review/page-original.tsx" -ForegroundColor Green
}

if (Test-Path $waitPath) {
    Copy-Item $waitPath "src/app/rooms/[roomId]/round/[roundNumber]/wait/page-original.tsx"
    Write-Host "✅ Backup creado: wait/page-original.tsx" -ForegroundColor Green
}

if (Test-Path $resultsPath) {
    Copy-Item $resultsPath "src/app/rooms/[roomId]/results/page-original.tsx"
    Write-Host "✅ Backup creado: results/page-original.tsx" -ForegroundColor Green
}

# Reemplazar con versiones en tiempo real
Write-Host "🔄 Reemplazando con versiones en tiempo real..." -ForegroundColor Yellow

$reviewNewPath = "src/app/rooms/[roomId]/round/[roundNumber]/review/page-new.tsx"
$waitNewPath = "src/app/rooms/[roomId]/round/[roundNumber]/wait/page-new.tsx"
$resultsNewPath = "src/app/rooms/[roomId]/results/page-new.tsx"

if (Test-Path $reviewNewPath) {
    Copy-Item $reviewNewPath $reviewPath
    Write-Host "✅ Migrado: review/page.tsx" -ForegroundColor Green
}

if (Test-Path $waitNewPath) {
    Copy-Item $waitNewPath $waitPath
    Write-Host "✅ Migrado: wait/page.tsx" -ForegroundColor Green
}

if (Test-Path $resultsNewPath) {
    Copy-Item $resultsNewPath $resultsPath
    Write-Host "✅ Migrado: results/page.tsx" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Migración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen de cambios:" -ForegroundColor Cyan
Write-Host "   • Páginas migradas a sistema en tiempo real con Firebase Firestore"
Write-Host "   • Eliminada dependencia de localStorage"
Write-Host "   • Implementada sincronización automática entre dispositivos"
Write-Host "   • Agregadas notificaciones en tiempo real"
Write-Host ""
Write-Host "🔍 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Probar el flujo completo del juego"
Write-Host "   2. Verificar sincronización multi-dispositivo"
Write-Host "   3. Validar persistencia de datos"
Write-Host "   4. Revisar funcionalidad de admin"
Write-Host ""
Write-Host "📚 Documentación:" -ForegroundColor Cyan
Write-Host "   • MIGRACION-COMPONENTES-RESTANTES.md - Guía detallada"
Write-Host "   • IMPLEMENTACION-MULTIJUGADOR.md - Documentación técnica"
Write-Host ""
