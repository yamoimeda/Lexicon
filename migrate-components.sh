#!/bin/bash

# Script de Migración de Componentes Restantes
# Lexicon - Sistema Multijugador en Tiempo Real

echo "🚀 Iniciando migración de componentes restantes a sistema multijugador..."

# Crear backups de archivos originales
echo "📁 Creando backups de archivos originales..."

if [ -f "src/app/rooms/[roomId]/round/[roundNumber]/review/page.tsx" ]; then
    cp "src/app/rooms/[roomId]/round/[roundNumber]/review/page.tsx" "src/app/rooms/[roomId]/round/[roundNumber]/review/page-original.tsx"
    echo "✅ Backup creado: review/page-original.tsx"
fi

if [ -f "src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx" ]; then
    cp "src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx" "src/app/rooms/[roomId]/round/[roundNumber]/wait/page-original.tsx"
    echo "✅ Backup creado: wait/page-original.tsx"
fi

if [ -f "src/app/rooms/[roomId]/results/page.tsx" ]; then
    cp "src/app/rooms/[roomId]/results/page.tsx" "src/app/rooms/[roomId]/results/page-original.tsx"
    echo "✅ Backup creado: results/page-original.tsx"
fi

# Reemplazar con versiones en tiempo real
echo "🔄 Reemplazando con versiones en tiempo real..."

if [ -f "src/app/rooms/[roomId]/round/[roundNumber]/review/page-new.tsx" ]; then
    cp "src/app/rooms/[roomId]/round/[roundNumber]/review/page-new.tsx" "src/app/rooms/[roomId]/round/[roundNumber]/review/page.tsx"
    echo "✅ Migrado: review/page.tsx"
fi

if [ -f "src/app/rooms/[roomId]/round/[roundNumber]/wait/page-new.tsx" ]; then
    cp "src/app/rooms/[roomId]/round/[roundNumber]/wait/page-new.tsx" "src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx"
    echo "✅ Migrado: wait/page.tsx"
fi

if [ -f "src/app/rooms/[roomId]/results/page-new.tsx" ]; then
    cp "src/app/rooms/[roomId]/results/page-new.tsx" "src/app/rooms/[roomId]/results/page.tsx"
    echo "✅ Migrado: results/page.tsx"
fi

echo ""
echo "🎉 Migración completada!"
echo ""
echo "📋 Resumen de cambios:"
echo "   • Páginas migradas a sistema en tiempo real con Firebase Firestore"
echo "   • Eliminada dependencia de localStorage"
echo "   • Implementada sincronización automática entre dispositivos"
echo "   • Agregadas notificaciones en tiempo real"
echo ""
echo "🔍 Próximos pasos:"
echo "   1. Probar el flujo completo del juego"
echo "   2. Verificar sincronización multi-dispositivo"
echo "   3. Validar persistencia de datos"
echo "   4. Revisar funcionalidad de admin"
echo ""
echo "📚 Documentación:"
echo "   • MIGRACION-COMPONENTES-RESTANTES.md - Guía detallada"
echo "   • IMPLEMENTACION-MULTIJUGADOR.md - Documentación técnica"
echo ""
