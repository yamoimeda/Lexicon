# 🔥 Configuración de Firebase para Lexicon

## 📋 Pasos para Configurar Firebase

### 1. **Crear Proyecto en Firebase**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "**Add project**" (Agregar proyecto)
3. Nombre del proyecto: `lexicon-game` (o el que prefieras)
4. **Opcional:** Habilitar Google Analytics (recomendado para métricas)
5. Seleccionar región: `us-central1` (o la más cercana)
6. Haz clic en "**Create project**"

### 2. **Configurar App Web**

1. En el dashboard del proyecto, haz clic en **Web icon** `</>`
2. Nombre de la app: `lexicon-web-app`
3. **✅ Marca:** "Also set up Firebase Hosting for this app" (opcional)
4. Haz clic en "**Register app**"

### 3. **Obtener Credenciales**

Copia la configuración que aparece:

```javascript
// Esta configuración aparecerá en Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "lexicon-game-12345.firebaseapp.com",
  projectId: "lexicon-game-12345",
  storageBucket: "lexicon-game-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

### 4. **Configurar Firestore Database**

1. En el menú lateral, ve a **"Firestore Database"**
2. Haz clic en "**Create database**"
3. **Modo:** Selecciona "**Start in test mode**" (para desarrollo)
4. **Ubicación:** Selecciona la región más cercana (ej: `us-central1`)
5. Haz clic en "**Done**"

### 5. **Configurar Variables de Entorno**

1. **Copia el archivo ejemplo:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edita `.env.local`** con tus credenciales reales:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key-aquí
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
   ```

3. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

## 🔒 Configuración de Seguridad (Firestore Rules)

### Para Desarrollo (Temporal)

Ve a **Firestore Database → Rules** y usa estas reglas temporales:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Acceso completo para desarrollo - CAMBIAR en producción
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Para Producción (Seguro)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de salas públicas
    match /rooms/{roomId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Permitir acceso a rondas si el usuario está en la sala
    match /rooms/{roomId}/rounds/{roundId} {
      allow read, write: if request.auth != null;
    }
    
    // Permitir gestión de usuarios autenticados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🌐 Despliegue en Producción

### Vercel
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. **Settings** → **Environment Variables**
3. Agrega cada variable con sus valores:
   - `NEXT_PUBLIC_FIREBASE_API_KEY` = `tu-api-key`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `tu-dominio`
   - etc.

### Netlify
1. Ve a **Site settings** → **Environment variables**
2. Agrega las mismas variables que en Vercel

### Otros Hosting
Consulta la documentación específica del proveedor para variables de entorno.

## ✅ Verificar Configuración

### 1. **Test de Conexión**

Agrega esta función a cualquier componente para probar:

```typescript
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const testFirebaseConnection = async () => {
  try {
    // Intentar escribir un documento de prueba
    await setDoc(doc(db, 'test', 'connection'), {
      message: 'Firebase está funcionando!',
      timestamp: new Date()
    });
    
    // Intentar leerlo
    const docRef = doc(db, 'test', 'connection');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Firebase conectado:', docSnap.data());
    } else {
      console.log('❌ No se pudo leer el documento');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
};
```

### 2. **Verificar en Network Tab**

1. Abre DevTools → Network
2. Recarga la página
3. Busca requests a `firestore.googleapis.com`
4. Si ves requests exitosos (200), Firebase está conectado

## 🔧 Solución de Problemas

### Error: "Firebase configuration object"
- Verifica que todas las variables de entorno estén definidas
- Reinicia el servidor de desarrollo
- Revisa que el archivo `.env.local` esté en la raíz del proyecto

### Error: "Permission denied" 
- Revisa las reglas de Firestore
- Asegúrate de estar en "test mode" para desarrollo

### Error: "Project not found"
- Verifica el `projectId` en `.env.local`
- Asegúrate de que el proyecto existe en Firebase Console

### Variables no se cargan
- El archivo debe llamarse `.env.local` (no `.env`)
- Las variables deben empezar con `NEXT_PUBLIC_`
- Reinicia completamente el servidor

## 📚 Recursos Adicionales

- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
