// Ejemplo práctico: ¿Qué pasa si dos personas usan el mismo nombre?

/* 
ESCENARIO: Dos jugadores llamados "Juan" quieren jugar

1. JUAN #1 crea una sala:
   - Nombre: "Juan"
   - ID único generado: "juan_1732123456_789" 
   - Se guarda en localStorage: userId_room123_Juan = "juan_1732123456_789"
   - En Firebase aparece como:
     {
       id: "juan_1732123456_789",
       name: "Juan", 
       score: 0
     }

2. JUAN #2 se une a la sala:
   - Nombre: "Juan" 
   - ID único generado: "juan_1732123567_321"
   - Se guarda en localStorage: userId_room123_Juan = "juan_1732123567_321" 
   - Como ya hay otro "Juan", generateDisplayName() genera: "Juan (2)"
   - En Firebase aparece como:
     {
       id: "juan_1732123567_321", 
       name: "Juan (2)",
       score: 0
     }

3. RESULTADO EN LA UI:
   - Jugador 1: "Juan" (admin)
   - Jugador 2: "Juan (2)"
   - Ambos pueden jugar sin conflictos
   - Cada uno mantiene su progreso por separado
   - Las respuestas de cada uno se guardan con su ID único

4. SI SE RECONECTAN:
   - Cada navegador tiene su ID único guardado en localStorage
   - Se reconectan automáticamente con el mismo ID
   - No hay pérdida de progreso

5. VENTAJAS:
   ✅ No hay sobrescritura de datos entre usuarios con mismo nombre
   ✅ Cada usuario mantiene su identidad única 
   ✅ La UI muestra nombres distintos para evitar confusión
   ✅ Sistema robusto ante reconexiones
   
6. QUE PASA SI HAY MÁS DUPLICADOS:
   - "Juan" (original)
   - "Juan (2)" 
   - "Juan (3)"
   - "Juan (4)"
   - etc.
*/

import { generateUniqueUserId, generateDisplayName, isUsernameAvailable } from '@/utils/userUtils';

// Simulación de lo que pasa:
function simulateUsersWithSameName() {
  const existingPlayers: any[] = [];
  
  // Juan #1 crea la sala
  const juan1Id = generateUniqueUserId("Juan");
  const juan1 = {
    id: juan1Id,
    name: "Juan", // Nombre original
    score: 0
  };
  existingPlayers.push(juan1);
  console.log("👑 Juan #1 (creador):", juan1);
  
  // Juan #2 se une 
  const juan2Id = generateUniqueUserId("Juan");
  const juan2DisplayName = generateDisplayName("Juan", existingPlayers);
  const juan2 = {
    id: juan2Id,
    name: juan2DisplayName, // "Juan (2)"
    score: 0
  };
  existingPlayers.push(juan2);
  console.log("🎮 Juan #2:", juan2);
  
  // Juan #3 se une
  const juan3Id = generateUniqueUserId("Juan"); 
  const juan3DisplayName = generateDisplayName("Juan", existingPlayers);
  const juan3 = {
    id: juan3Id,
    name: juan3DisplayName, // "Juan (3)"
    score: 0
  };
  existingPlayers.push(juan3);
  console.log("🎮 Juan #3:", juan3);
  
  console.log("\n📋 Lista final de jugadores:");
  existingPlayers.forEach((player, index) => {
    console.log(`${index + 1}. ${player.name} (ID: ${player.id})`);
  });
  
  return existingPlayers;
}

// Ejecutar simulación
simulateUsersWithSameName();
