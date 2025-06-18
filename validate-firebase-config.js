#!/usr/bin/env node

/**
 * Script para validar la configuración de Firebase
 * Ejecutar: node validate-firebase-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 Validando configuración de Firebase para Lexicon\n');

// Verificar que existe .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.local.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ No se encontró .env.local');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('💡 Solución:');
    console.log('   1. Copia .env.local.example a .env.local');
    console.log('   2. Edita .env.local con tus credenciales de Firebase');
    console.log('   3. Ejecuta: cp .env.local.example .env.local');
  } else {
    console.log('💡 Crea un archivo .env.local con tus credenciales de Firebase');
  }
  
  console.log('\n📚 Ver guía completa: CONFIGURACION-FIREBASE.md');
  process.exit(1);
}

// Leer variables de entorno
require('dotenv').config({ path: envPath });

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let missingVars = [];
let demoVars = [];

console.log('📋 Verificando variables de entorno:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: No definida`);
    missingVars.push(varName);
  } else if (value.includes('demo-') || value.includes('tu-') || value.includes('XXXX')) {
    console.log(`⚠️  ${varName}: Usando valor de ejemplo`);
    demoVars.push(varName);
  } else {
    console.log(`✅ ${varName}: Configurada`);
  }
});

console.log('\n' + '='.repeat(60));

if (missingVars.length > 0) {
  console.log('\n❌ VARIABLES FALTANTES:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}

if (demoVars.length > 0) {
  console.log('\n⚠️  VARIABLES CON VALORES DE EJEMPLO:');
  demoVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n💡 Necesitas reemplazar estos valores con credenciales reales de Firebase');
}

if (missingVars.length === 0 && demoVars.length === 0) {
  console.log('\n🎉 ¡Configuración de Firebase completa!');
  console.log('\n✅ Todas las variables están configuradas correctamente');
  console.log('✅ Puedes ejecutar: npm run dev');
} else {
  console.log('\n🔧 ACCIONES REQUERIDAS:');
  console.log('   1. Ve a Firebase Console: https://console.firebase.google.com/');
  console.log('   2. Crea/selecciona tu proyecto');
  console.log('   3. Ve a Project Settings → Your apps');
  console.log('   4. Copia las credenciales a .env.local');
  console.log('   5. Reinicia el servidor: npm run dev');
  console.log('\n📚 Guía detallada: CONFIGURACION-FIREBASE.md');
}

console.log('\n' + '='.repeat(60));

// Verificar estructura de archivos de Firebase
const firebaseConfigPath = path.join(process.cwd(), 'src', 'lib', 'firebase.ts');
if (fs.existsSync(firebaseConfigPath)) {
  console.log('✅ Archivo de configuración Firebase encontrado: src/lib/firebase.ts');
} else {
  console.log('❌ No se encontró src/lib/firebase.ts');
}

const serviceFilePath = path.join(process.cwd(), 'src', 'services', 'gameService.ts');
if (fs.existsSync(serviceFilePath)) {
  console.log('✅ Servicio de juego encontrado: src/services/gameService.ts');
} else {
  console.log('❌ No se encontró src/services/gameService.ts');
}

console.log('\n🚀 Siguiente paso: npm run dev');
