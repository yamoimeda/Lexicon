# 🚨 Solución: Error "Maximum update depth exceeded"

## 🔍 **Problema Identificado**

Al presionar "Iniciar Juego" aparecía el error:
```
Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
```

## 🎯 **Causa Raíz**

El error se producía por un **bucle infinito** de actualizaciones en el componente `RealtimeLobby`:

### 1. **Problema en useGameRoom Hook**
```typescript
// ❌ ANTES (Problemático)
const joinRoom = useCallback(async () => {
  // ... lógica ...
}, [roomId, username, currentUserId, room]); // 'room' causa el bucle
```

### 2. **Problema en RealtimeLobby Component**
```typescript
// ❌ ANTES (Problemático)
useEffect(() => {
  if (roomId && username) {
    joinRoom(); // Se ejecuta cada vez que joinRoom cambia
  }
}, [roomId, username, joinRoom]); // joinRoom en dependencias
```

### 3. **Ciclo Infinito**
1. `joinRoom` se ejecuta
2. `room` se actualiza (player se une)
3. `joinRoom` se recrea (porque `room` está en sus dependencias)
4. `useEffect` se dispara (porque `joinRoom` cambió)
5. `joinRoom` se ejecuta nuevamente
6. **Bucle infinito** 🔄

## ✅ **Solución Implementada**

### 1. **Arreglar useGameRoom Hook**
```typescript
// ✅ DESPUÉS (Arreglado)
const joinRoom = useCallback(async () => {
  if (!username || !roomId || !currentUserId) return;

  try {
    // Verificar si el usuario ya está en la sala
    if (room && room.players.find((p: Player) => p.id === currentUserId)) {
      return; // Ya está en la sala
    }

    // ... resto de la lógica ...
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to join room');
  }
}, [roomId, username, currentUserId]); // ✅ Removido 'room' de dependencias
```

### 2. **Arreglar RealtimeLobby Component**
```typescript
// ✅ DESPUÉS (Arreglado)
export default function RealtimeLobby({ roomId }: RealtimeLobbyProps) {
  const hasJoined = useRef(false); // ✅ Flag para controlar una sola ejecución

  useEffect(() => {
    if (roomId && username && !hasJoined.current && !loading) {
      hasJoined.current = true; // ✅ Marcar como ejecutado
      joinRoom(); // Ejecutar solo una vez
    }
  }, [roomId, username, loading]); // ✅ Removido joinRoom de dependencias
}
```

## 🔧 **Cambios Realizados**

### Archivo 1: `src/hooks/useGameRoom.ts`
- **Línea 83:** Removido `room` de las dependencias del `useCallback`
- **Razón:** Evitar que `joinRoom` se recree cada vez que la sala se actualiza

### Archivo 2: `src/app/rooms/[roomId]/lobby/RealtimeLobby.tsx`
- **Línea 4:** Agregado `useRef` import
- **Línea 85:** Agregado `hasJoined` ref para controlar ejecución única
- **Línea 97:** Removido `joinRoom` de dependencias del `useEffect`
- **Línea 99:** Agregado check de `hasJoined.current` y `loading`

## 🎮 **Resultado**

- ✅ **Sin bucles infinitos:** La función `joinRoom` ya no se recrea constantemente
- ✅ **Ejecución única:** El auto-join solo ocurre una vez por sesión
- ✅ **Estabilidad:** El componente no entra en ciclos de re-render
- ✅ **Funcionalidad preservada:** Los usuarios aún se unen automáticamente al lobby

## 🧪 **Cómo Probar**

1. **Crear una sala**
2. **Unirse al lobby** (debería aparecer sin problemas)
3. **Presionar "Iniciar Juego"** 
4. **Verificar:** No debe aparecer el error de "Maximum update depth exceeded"

## 📚 **Principios Aplicados**

### 1. **Evitar Dependencias Circulares**
- No incluir estados que cambian como resultado de la función en sus dependencias

### 2. **Controlar Ejecución Única**
- Usar `useRef` para flags que persisten entre renders sin causar re-renders

### 3. **Separar Responsabilidades**
- El hook maneja la lógica de estado
- El componente maneja la lógica de UI y timing

## 🔄 **Flujo Corregido**

```
1. Usuario entra al lobby
   ↓
2. useEffect se ejecuta (solo una vez por hasJoined.current)
   ↓
3. joinRoom() se ejecuta
   ↓
4. Usuario se une a la sala en Firebase
   ↓
5. room state se actualiza
   ↓
6. UI se re-renderiza con la nueva información
   ↓
7. ✅ FIN (sin bucle infinito)
```

Esta solución mantiene toda la funcionalidad mientras elimina completamente el bucle infinito que causaba el error.
