// Función de debugging para el localStorage del timer
// Ejecutar en la consola del navegador para diagnosticar problemas

window.debugTimerStorage = function() {
  console.log('🔍 DEBUG: Timer Storage Analysis');
  console.log('================================');
  
  const timerKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('timeElapsed_')) {
      timerKeys.push(key);
    }
  }
  
  if (timerKeys.length === 0) {
    console.log('✅ No timer data found in localStorage');
    return;
  }
  
  console.log(`📊 Found ${timerKeys.length} timer entries:`);
  timerKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const parts = key.split('_');
    console.log(`  🔑 ${key}`);
    console.log(`    └─ Room: ${parts[1]}, Round: ${parts[2]}, User: ${parts[3]}`);
    console.log(`    └─ Time Elapsed: ${value}s`);
  });
  
  console.log('================================');
};

window.clearAllTimerStorage = function() {
  console.log('🧹 Clearing all timer storage...');
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('timeElapsed_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`✅ Removed ${keysToRemove.length} timer entries`);
};

console.log('🛠️ Timer Debug Tools loaded!');
console.log('Use window.debugTimerStorage() to inspect timer data');
console.log('Use window.clearAllTimerStorage() to clear all timer data');
