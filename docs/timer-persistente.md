# Timer Persistente y Auto-navegación - Documentación

## Funcionalidades Implementadas

### 1. **Timer Persistente por Usuario**

Cada usuario tiene su propio timer que se guarda en localStorage y persiste a través de recargas de página.

**Clave de almacenamiento:** `timeElapsed_${roomId}_${roundNumber}_${userId}`

**Comportamiento:**
- El tiempo transcurrido se guarda cada segundo
- Al recargar la página, se recupera el tiempo guardado
- Si el tiempo ya se agotó, navega automáticamente a review
- Se limpia automáticamente al completar acciones

### 2. **Auto-navegación a Review**

**Casos de navegación automática:**
1. **Tiempo agotado**: Envía palabras automáticamente y navega a review
2. **Envío manual**: Después de enviar palabras manualmente, navega a review
3. **Recarga después de tiempo agotado**: Si al recargar el tiempo ya se agotó, va directo a review

### 3. **Limpieza de Datos**

**Se limpia el tiempo guardado en:**
- Al enviar palabras manualmente
- Al llegar a la página de espera (wait)
- Al cambiar de ronda

## Flujo de Usuario

```
1. Usuario entra a la página de juego
   ↓
2. Se verifica si hay tiempo guardado
   ↓
3a. Si hay tiempo guardado y no se agotó
   → Continúa con el tiempo restante
   ↓
3b. Si hay tiempo guardado y ya se agotó
   → Navega directamente a review
   ↓
4. Usuario juega normalmente
   ↓
5a. Tiempo se agota
   → Auto-envío + navegación a review
   ↓
5b. Usuario envía manualmente
   → Navegación a review después de 500ms
   ↓
6. En página de review/wait
   → Limpia tiempo guardado
```

## Implementación Técnica

### Archivos Modificados:

1. **RealtimeGamePage.tsx**
   - Agregado timer persistente
   - Auto-navegación en timeout y envío manual
   - Recuperación de tiempo guardado al cargar

2. **RealtimeWaitPage.tsx**
   - Limpieza automática del tiempo guardado

3. **gameService.ts**
   - Funciones utilitarias para manejo de localStorage
   - `clearRoundTime()` y `clearAllRoomTimes()`

### Funciones Clave:

```typescript
// Limpiar tiempo de un usuario en una ronda específica
GameService.clearRoundTime(roomId, roundNumber, userId);

// Limpiar todos los tiempos de una sala
GameService.clearAllRoomTimes(roomId);
```

## Ventajas

1. **Experiencia de usuario mejorada**: No se pierde el progreso al recargar
2. **Navegación fluida**: Transiciones automáticas sin intervención manual
3. **Gestión de estado robusta**: El tiempo se mantiene sincronizado
4. **Limpieza automática**: No se acumulan datos obsoletos

## Configuración

No requiere configuración adicional. Las funcionalidades están activas automáticamente en:
- Páginas de juego (`/rooms/[roomId]/play`)
- Páginas de espera (`/rooms/[roomId]/round/[roundNumber]/wait`)

El sistema es compatible con:
- Recargas de página
- Navegación del navegador (back/forward)
- Múltiples tabs (cada una maneja su propio estado)
