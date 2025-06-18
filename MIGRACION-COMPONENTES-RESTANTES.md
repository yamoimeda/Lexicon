# Migración de Componentes Restantes a Sistema Multijugador

## Resumen de Migración Completada

Se han migrado exitosamente los siguientes componentes al sistema multijugador en tiempo real basado en Firebase Firestore:

### ✅ Componentes Migrados:
1. **Lobby** - `src/app/rooms/[roomId]/lobby/page.tsx`
   - Migrado a `RealtimeLobby.tsx` usando `useGameRoom` hook
   - Sincronización automática de jugadores
   - Notificaciones en tiempo real

2. **Página de Juego** - `src/app/rooms/[roomId]/play/page.tsx`
   - Migrado a `RealtimeGamePage.tsx`
   - Envío de palabras en tiempo real
   - Sincronización de estado de ronda

3. **Creación de Salas** - `src/components/room/CreateRoomForm.tsx`
   - Actualizado para crear salas en Firestore
   - Configuración de admin y jugadores

### 🔄 Componentes Pendientes de Migración:

#### 1. Página de Revisión - `src/app/rooms/[roomId]/round/[roundNumber]/review/page.tsx`

**Cambios necesarios:**
- Reemplazar `localStorage` con `useGameRoom` hook
- Usar `GameService.finalizeRound()` para calcular puntuaciones
- Implementar validación AI en tiempo real
- Sincronizar validaciones entre admin y jugadores

**Código de migración:**
```typescript
// Reemplazar imports
import { useGameRoom } from '@/hooks/useGameRoom';
import { GameService, Player, Room, RoundData, PlayerSubmission } from '@/services/gameService';

// Reemplazar estado local
const { room, currentRound, loading, error } = useGameRoom(roomId);

// Reemplazar localStorage con datos de Firestore
// Antes:
const settingsRaw = localStorage.getItem(`room-${roomId}-settings`);

// Después:
const isCurrentUserAdmin = room?.settings.admin === username;
const categories = room?.settings.categories || [];

// Reemplazar finalización de puntuaciones
// Antes:
localStorage.setItem(`room-${roomId}-players`, JSON.stringify(updatedPlayers));

// Después:
await GameService.finalizeRound(roomId, roundNumber, playerRoundScores);
```

#### 2. Página de Espera - `src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx`

**Cambios necesarios:**
- Usar `useGameRoom` para obtener jugadores y puntuaciones actuales
- Implementar actualización automática cuando admin avanza ronda
- Usar `GameService.updateRoomSettings()` para próxima ronda

**Código de migración:**
```typescript
// Reemplazar imports
import { useGameRoom } from '@/hooks/useGameRoom';
import { GameService } from '@/services/gameService';

// Reemplazar estado local
const { room, currentRound, loading, error } = useGameRoom(roomId);

// Obtener puntuación de ronda actual
const playerScore = currentRound?.playerScores[username];

// Reemplazar función de siguiente ronda
const handleNextRound = async () => {
  if (!room) return;
  
  const nextRoundNumber = room.settings.currentRound + 1;
  await GameService.updateRoomSettings(roomId, {
    currentRound: nextRoundNumber,
    gameStatus: 'playing'
  });
  
  router.push(\`/rooms/\${roomId}/play\`);
};
```

#### 3. Página de Resultados - `src/app/rooms/[roomId]/results/page.tsx`

**Cambios necesarios:**
- Usar `useGameRoom` para obtener jugadores y puntuaciones finales
- Eliminar dependencia de `localStorage`
- Sincronización automática de resultados

**Código de migración:**
```typescript
// Reemplazar imports
import { useGameRoom } from '@/hooks/useGameRoom';
import { Player } from '@/services/gameService';

// Reemplazar estado local
const { room, loading, error } = useGameRoom(roomId);

// Procesar resultados desde Firestore
useEffect(() => {
  if (!room || loading) return;

  const sortedPlayers = [...room.players].sort((a: Player, b: Player) => b.score - a.score);
  const rankedPlayers = sortedPlayers.map((player: Player, index: number) => ({
    id: player.id,
    name: player.name,
    score: player.score,
    rank: index + 1,
  }));
  setResults(rankedPlayers);
}, [room, loading]);
```

## Pasos para Completar la Migración

### 1. Migrar Página de Revisión

```bash
# Hacer backup del archivo original
cp src/app/rooms/[roomId]/round/[roundNumber]/review/page.tsx src/app/rooms/[roomId]/round/[roundNumber]/review/page-original.tsx

# Reemplazar con versión en tiempo real
cp src/app/rooms/[roomId]/round/[roundNumber]/review/page-new.tsx src/app/rooms/[roomId]/round/[roundNumber]/review/page.tsx
```

### 2. Migrar Página de Espera

```bash
# Hacer backup
cp src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx src/app/rooms/[roomId]/round/[roundNumber]/wait/page-original.tsx

# Reemplazar con versión en tiempo real
cp src/app/rooms/[roomId]/round/[roundNumber]/wait/page-new.tsx src/app/rooms/[roomId]/round/[roundNumber]/wait/page.tsx
```

### 3. Migrar Página de Resultados

```bash
# Hacer backup
cp src/app/rooms/[roomId]/results/page.tsx src/app/rooms/[roomId]/results/page-original.tsx

# Reemplazar con versión en tiempo real
cp src/app/rooms/[roomId]/results/page-new.tsx src/app/rooms/[roomId]/results/page.tsx
```

## Funcionalidades del Sistema Multijugador

### Características Implementadas:
- ✅ Sincronización en tiempo real de salas y jugadores
- ✅ Creación y unión a salas vía Firestore
- ✅ Sistema de rondas con estados persistentes
- ✅ Envío de palabras en tiempo real
- ✅ Notificaciones y actualizaciones automáticas
- ✅ Manejo de roles (admin/jugador)

### Características Pendientes de Implementar:
- 🔄 Validación AI distribuida para palabras
- 🔄 Sistema de puntuación en tiempo real
- 🔄 Manejo de desconexiones de jugadores
- 🔄 Reglas de seguridad avanzadas en Firestore

## Verificación de la Migración

Después de completar la migración, verificar:

1. **Flujo completo del juego:**
   - Crear sala → Lobby → Juego → Revisión → Espera → Resultados

2. **Sincronización multi-dispositivo:**
   - Abrir la misma sala en múltiples navegadores
   - Verificar que los cambios se reflejen en tiempo real

3. **Persistencia de datos:**
   - Refrescar páginas y verificar que el estado se mantiene
   - Los datos deben venir de Firestore, no de localStorage

4. **Funcionalidad de admin:**
   - Solo el admin puede avanzar rondas
   - Finalización de puntuaciones funciona correctamente

## Archivos Clave del Sistema

### Servicios:
- `src/services/gameService.ts` - API para interactuar con Firestore
- `src/lib/firebase.ts` - Configuración de Firebase

### Hooks:
- `src/hooks/useGameRoom.ts` - Hook principal para salas en tiempo real

### Componentes:
- `src/components/room/CreateRoomForm.tsx` - Creación de salas
- `src/app/rooms/[roomId]/lobby/RealtimeLobby.tsx` - Lobby en tiempo real
- `src/app/rooms/[roomId]/play/RealtimeGamePage.tsx` - Juego en tiempo real

### Documentación:
- `IMPLEMENTACION-MULTIJUGADOR.md` - Guía técnica completa
- `README.md` - Información general del proyecto

La migración del sistema a multijugador en tiempo real está prácticamente completa. Los archivos de migración han sido creados y están listos para ser activados siguiendo los pasos documentados arriba.
