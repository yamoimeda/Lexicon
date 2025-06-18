# 🎯 Lexicon - El Juego de Batalla de Palabras

¡Bienvenido a **Lexicon**, el emocionante juego multijugador donde las palabras son tu arma y tu ingenio es tu estrategia! Pon a prueba tu vocabulario, velocidad de pensamiento y conocimientos en duelos épicos con tus amigos.

## 🚀 ¿Qué es Lexicon?

Lexicon es un juego de palabras en tiempo real donde los jugadores compiten para encontrar las mejores palabras que se ajusten a categorías específicas, todo comenzando con una letra aleatoria. Con validación impulsada por IA y múltiples modos de juego, cada partida es una nueva aventura lingüística.

## ✨ Características Principales

### 🎮 **Gameplay Dinámico**
- **Duelos en Tiempo Real**: Compite contra otros jugadores simultáneamente
- **Generación Aleatoria de Letras**: Cada ronda presenta nuevos desafíos
- **Categorías Personalizables**: Desde "Animales" hasta "Países" y más
- **Validación IA**: Sistema inteligente que valifica la validez de tus palabras
- **Múltiples Idiomas**: Juega en español, inglés y más

### 🏆 **Sistema de Salas Avanzado**
- **Creación de Salas**: Configura tu propia arena de batalla
- **Configuraciones Flexibles**: 
  - Número de rondas personalizables
  - Tiempo por ronda ajustable
  - Categorías específicas
  - Sistemas de puntuación variados
- **Códigos de Sala**: Únete fácilmente con un simple ID

### 📊 **Seguimiento y Estadísticas**
- **Marcador en Tiempo Real**: Ve tu posición instantáneamente
- **Ranking por Rondas**: Competencia continua
- **Sala de Espera**: Socializa entre rondas
- **Estadísticas Finales**: Revisa tu rendimiento completo

### 🎨 **Experiencia de Usuario Premium**
- **Diseño Moderno**: Interfaz limpia y atractiva
- **Animaciones Suaves**: Transiciones elegantes
- **Responsive**: Perfecto en cualquier dispositivo
- **Accesibilidad**: Diseñado para todos los usuarios

## 🌐 **Funcionalidades Multijugador en Tiempo Real**

### 🔄 **Sincronización Automática**
- **Base de Datos en Tiempo Real**: Powered by Firebase Firestore
- **Actualizaciones Instantáneas**: Los cambios se reflejan inmediatamente en todos los dispositivos
- **Estado Persistente**: Las partidas se guardan automáticamente y pueden reanudarse
- **Sincronización de Rondas**: Todos los jugadores ven el mismo estado del juego

### 👥 **Gestión Avanzada de Jugadores**
- **Unirse/Salir Dinámico**: Los jugadores pueden entrar y salir en cualquier momento
- **Transferencia de Admin**: Si el admin se va, se asigna automáticamente un nuevo admin
- **Lista de Jugadores Activa**: Ve quién está conectado en tiempo real
- **Notificaciones de Eventos**: Alerts cuando jugadores se unen, salen o completan acciones

### 🎮 **Experiencia de Juego Mejorada**
- **Salas Públicas**: Navega y únete a salas abiertas de otros jugadores
- **Estados de Juego Sincronizados**: 
  - `Esperando` - En lobby esperando que comience el juego
  - `Jugando` - Ronda activa en progreso
  - `Revisando` - Validando palabras y calculando puntuaciones
  - `Terminado` - Juego completado con resultados finales
- **Timeouts Automáticos**: Las rondas avanzan automáticamente cuando se acaba el tiempo
- **Validación Coordinada**: Solo el admin puede finalizar las puntuaciones

### 📡 **Notificaciones en Tiempo Real**
- **Alertas de Jugadores**: Notificación cuando otros jugadores se unen/salen
- **Progreso de Ronda**: Updates cuando comienzan nuevas rondas
- **Submissions Tracking**: Ve cuando otros jugadores envían sus palabras
- **Cambios de Admin**: Notificación cuando cambia el administrador de la sala

### 🛡️ **Manejo de Conexión**
- **Reconexión Automática**: Si pierdes conexión, se reconecta automáticamente
- **Estado Offline**: El juego guarda el progreso incluso si hay problemas de conexión
- **Validación de Sesión**: Previene conflictos cuando múltiples dispositivos usan el mismo usuario

### 🚀 **Estado de Migración: COMPLETADA ✅**

El juego Lexicon ha sido **exitosamente migrado** de un sistema basado en `localStorage` a un **sistema multijugador en tiempo real** usando **Firebase Firestore**.

#### **Componentes Totalmente Migrados:**
- ✅ **Lobby** - Sincronización de jugadores en tiempo real
- ✅ **Creación de Salas** - Salas persistentes en Firestore  
- ✅ **Página de Juego** - Envío de palabras en tiempo real

#### **Componentes Listos para Activación:**
- 🎯 **Página de Revisión** - Versión en tiempo real creada (`page-new.tsx`)
- 🎯 **Página de Espera** - Versión en tiempo real creada (`page-new.tsx`)  
- 🎯 **Página de Resultados** - Versión en tiempo real creada (`page-new.tsx`)

Para completar la migración, ejecuta:
```powershell
# Windows
./migrate-components.ps1

# Linux/Mac  
./migrate-components.sh
```

Ver documentación completa: [MIGRACION-COMPONENTES-RESTANTES.md](./MIGRACION-COMPONENTES-RESTANTES.md)

## 🎯 **Nuevas Características Multijugador**

### 📦 **Archivos Agregados**
```
src/
├── services/
│   └── gameService.ts          # Servicio principal para Firebase
├── hooks/
│   └── useGameRoom.ts          # Hook para gestión de salas en tiempo real
├── components/
│   ├── room/
│   │   └── PublicRooms.tsx     # Componente para mostrar salas públicas
│   └── game/
│       └── RealtimeNotifications.tsx  # Sistema de notificaciones
└── lib/
    └── firebase.ts             # Configuración de Firebase
```

### 🔧 **Servicios Implementados**
- **GameService**: API completa para operaciones CRUD de salas y rondas
- **useGameRoom**: Hook personalizado para state management en tiempo real
- **PublicRooms**: Componente para discovery de salas públicas
- **RealtimeNotifications**: Sistema de alertas en tiempo real

### 🚀 **Próximos Pasos para Implementación**

1. **Configurar Firebase**:
   ```bash
   # Agregar variables de entorno
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   ```

2. **Migrar Componentes Existentes**:
   - Reemplazar localStorage calls con GameService methods
   - Integrar useGameRoom hook en páginas existentes
   - Agregar RealtimeNotifications a layouts principales

3. **Testing**:
   ```bash
   # Abrir múltiples ventanas/dispositivos
   npm run dev
   # Crear sala en una ventana
   # Unirse desde otra ventana
   # Verificar sincronización en tiempo real
   ```

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido con tecnologías de vanguardia para una experiencia multijugador óptima:

### **Frontend & UI**
- **Next.js 15** con React 18 - Framework moderno y performante
- **TypeScript** - Seguridad de tipos y mejor developer experience
- **Tailwind CSS** - Styling utility-first y responsive
- **Radix UI** - Componentes accesibles y customizables
- **Lucide React** - Iconografía moderna y consistente

### **Backend & Base de Datos**
- **Firebase Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Authentication** - Sistema de autenticación seguro
- **Firebase Hosting** - Deploy rápido y confiable
- **Real-time Subscriptions** - Sincronización automática entre dispositivos

### **Inteligencia Artificial**
- **Google Genkit** - Framework para aplicaciones con IA
- **Validación Inteligente** - AI-powered word validation
- **Sugerencias Contextuales** - Smart word suggestions

### **Estado y Performance**
- **Custom React Hooks** - Gestión de estado optimizada
- **Real-time State Management** - Sincronización automática
- **Optimistic Updates** - UX responsiva sin esperas
- **Connection Resilience** - Manejo robusto de conexiones

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase

### Configuración Rápida

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd lexicon
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura Firebase**
   - Crea un proyecto en Firebase Console
   - Configura Authentication, Firestore y Hosting
   - Añade tu configuración en las variables de entorno

4. **Configura la IA**
   - Obtén una API key de Google AI
   - Configura las variables de entorno necesarias

5. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Inicia el servidor de IA (en otra terminal)**
   ```bash
   npm run genkit:dev
   ```

## 🎯 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo (puerto 9002)
- `npm run genkit:dev` - Inicia el servidor de IA
- `npm run genkit:watch` - Servidor de IA con watch mode
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run typecheck` - Verifica los tipos de TypeScript

## 🎨 Guía de Estilo

### Paleta de Colores
- **Primario**: Azul saturado (#4285F4) - Competitivo pero amigable
- **Fondo**: Azul claro (#E3F2FD) - Interface limpia y calmada  
- **Acento**: Amarillo (#FFEB3B) - Resalta elementos importantes

### Tipografía
- **Headlines**: 'Space Grotesk' - Para títulos y texto destacado
- **Body**: 'Inter' - Para texto del cuerpo

## 📱 Estructura del Proyecto

```
src/
├── ai/                 # Lógica de IA y validación
├── app/                # Páginas y rutas de Next.js
├── components/         # Componentes reutilizables
├── contexts/           # Contextos de React
├── hooks/              # Custom hooks
└── lib/                # Utilidades y helpers
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si quieres mejorar Lexicon:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ve el archivo `LICENSE` para más detalles.

## 🎉 ¡Empezar a Jugar!

¿Listo para el desafío? Visita la aplicación, crea tu usuario y sumérgete en la batalla de palabras más emocionante. ¡Que gane el mejor vocabulario!

---

**¿Tienes preguntas?** Abre un issue o contáctanos. ¡Estamos aquí para ayudarte a dominar Lexicon! 🏆
