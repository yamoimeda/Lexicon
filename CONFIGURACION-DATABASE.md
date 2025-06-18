# 🎯 Configuración Recomendada de Firebase para Lexicon

## 📝 Nombres Sugeridos para el Proyecto

### Opción 1: Simple y Directo
```
Project ID: lexicon-game
Project Name: Lexicon Game
```

### Opción 2: Con Tu Identificación
```
Project ID: lexicon-game-tuapellido
Project Name: Lexicon Game - Tu Nombre
```

### Opción 3: Para Desarrollo/Producción
```
Development:
Project ID: lexicon-dev-tuapellido
Project Name: Lexicon Dev

Production:
Project ID: lexicon-prod-tuapellido  
Project Name: Lexicon Production
```

## 🏗️ Configuración de Firestore

### 1. **Crear la Base de Datos**
- Ve a Firebase Console → Firestore Database
- Clic en "Create database"
- **Modo:** "Start in test mode" (para desarrollo)
- **Ubicación:** us-central1 (recomendada para latencia)

### 2. **No Necesitas Crear Colecciones Manualmente**
El código de Lexicon creará automáticamente:
- ✅ Colección `rooms` cuando se cree la primera sala
- ✅ Subcolección `rounds` cuando comience la primera ronda
- ✅ Documentos de jugadores cuando se unan

### 3. **Variables de Entorno Resultantes**
```env
# Ejemplo con project ID: lexicon-game-ymena
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lexicon-game-ymena
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lexicon-game-ymena.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lexicon-game-ymena.appspot.com
# ... otras variables
```

## 🔒 Reglas de Seguridad Firestore

### Para Desarrollo (Temporal)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Acceso completo para desarrollo
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Para Producción (Recomendado)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de salas públicas
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Permitir acceso a rondas
    match /rooms/{roomId}/rounds/{roundId} {
      allow read, write: if true; // Para jugadores sin auth
    }
  }
}
```

## 🎮 Estructura de Datos del Juego

### Documento de Sala (`rooms/roomId`)
```typescript
{
  settings: {
    roomName: "Sala de Juan",
    numberOfRounds: 3,
    timePerRound: 60,
    categories: ["Animales", "Países", "Comida"],
    language: "es",
    admin: "juan_1732123456_789",
    currentRound: 1,
    gameStatus: "playing"
  },
  players: [
    {
      id: "juan_1732123456_789",
      name: "Juan",
      score: 15,
      joinedAt: "2024-11-20T..."
    },
    {
      id: "maria_1732123567_321", 
      name: "Maria",
      score: 18,
      joinedAt: "2024-11-20T..."
    }
  ],
  createdAt: "2024-11-20T...",
  updatedAt: "2024-11-20T..."
}
```

### Documento de Ronda (`rooms/roomId/rounds/round-1`)
```typescript
{
  roundNumber: 1,
  letter: "A",
  category: "Animales",
  startTime: "2024-11-20T10:00:00Z",
  endTime: "2024-11-20T10:01:00Z",
  status: "completed",
  submissions: {
    "juan_1732123456_789": {
      word: "Araña",
      submittedAt: "2024-11-20T10:00:45Z",
      isValid: true,
      points: 5
    },
    "maria_1732123567_321": {
      word: "Antílope", 
      submittedAt: "2024-11-20T10:00:30Z",
      isValid: true,
      points: 7
    }
  }
}
```

## ✅ Pasos de Configuración

1. **Crear Proyecto Firebase**
   - Nombre sugerido: `lexicon-game-[tuapellido]`
   - Habilitar Google Analytics (opcional)

2. **Configurar Firestore**
   - Modo: Test mode (desarrollo)
   - Región: us-central1

3. **Obtener Credenciales**
   - Project Settings → Your apps → Web app
   - Copiar firebaseConfig

4. **Configurar .env.local**
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=lexicon-game-tuapellido
   # ... otras variables
   ```

5. **Validar Configuración**
   ```bash
   npm run firebase:validate
   ```

6. **Ejecutar Proyecto**
   ```bash
   npm run dev
   ```

## 🎯 Resultado Final

- ✅ **Base de datos:** Firestore (default)
- ✅ **Proyecto:** lexicon-game-[tuidentificador]
- ✅ **Colecciones:** Se crean automáticamente
- ✅ **Estructura:** Optimizada para el juego multijugador
- ✅ **Escalabilidad:** Soporta miles de jugadores simultáneos
