// src/utils/userUtils.ts
/**
 * Utilidades para manejo de usuarios únicos
 */

// Generar un ID único para el usuario basado en nombre + timestamp + random
export function generateUniqueUserId(username: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const sanitizedName = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${sanitizedName}_${timestamp}_${random}`;
}

// Generar un ID único más corto para mostrar
export function generateShortUserId(username: string): string {
  const random = Math.floor(Math.random() * 9999);
  const sanitizedName = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8);
  return `${sanitizedName}#${random.toString().padStart(4, '0')}`;
}

// Extraer el nombre base de un ID único
export function extractUsernameFromId(userId: string): string {
  if (userId.includes('#')) {
    return userId.split('#')[0];
  }
  if (userId.includes('_')) {
    return userId.split('_')[0];
  }
  return userId;
}

// Verificar si un nombre de usuario ya existe en una sala
export function isUsernameAvailable(players: any[], username: string): boolean {
  return !players.some(player => 
    extractUsernameFromId(player.id).toLowerCase() === username.toLowerCase()
  );
}

// Generar un nombre único para mostrar en la UI
export function generateDisplayName(username: string, existingPlayers: any[]): string {
  const baseUsername = username.trim();
  
  // Si no hay conflicto, usar el nombre tal como está
  if (isUsernameAvailable(existingPlayers, baseUsername)) {
    return baseUsername;
  }
  
  // Si hay conflicto, agregar un número
  let counter = 2;
  let newUsername = `${baseUsername} (${counter})`;
  
  while (!isUsernameAvailable(existingPlayers, newUsername)) {
    counter++;
    newUsername = `${baseUsername} (${counter})`;
  }
  
  return newUsername;
}
