# LetraLingo

LetraLingo es una aplicación diseñada para acompañar la enseñanza del alfabeto a adultos, incorporando módulos de escritura, escucha y lectura.

![Demo GIF](public/demo_video.gif)

## Descripción

## Características

- **Reconocimiento de Letras**: Sistema de IA que identifica y valida dibujos de letras con alta precisión -**Seguimiento de Progreso**: Visualización del avance por cada módulo y letra del alfabeto

## Tecnologías Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS, Redux
- **Backend**: Node.js, Express
- **IA/ML**: ML5.js
- **Base de Datos**: MySQL
- **Otros**: AWS Polly (texto a voz)

## Estructura de Proyecto

```
alfabetizacion/
│
├── backend/                 # Servidor backend
│   ├── db.js                # Configuración de base de datos
│   └── server.js             # Servidor Express
│
├── public/                  # Recursos estáticos
│   └── Logo_CCAR.png        # Logo de la aplicación
│
├── src/                     # Código fuente frontend
│   ├── components/          # Componentes reutilizables
│   │   └── BottomNav.tsx    # Componente de navegación inferior
│   │
│   ├── pages/               # Componentes de página
│   │   ├── landingPage/
│   │   ├── menuPage/
│   │   ├── testPage/
│   │   ├── readingTestPage/
│   │   ├── writingTestPage/
│   │   └── ... (otras páginas)
│   │
│   ├── store/               # Gestión de estado con Redux
│   │   ├── features/        # Slices de Redux
│   │   ├── hooks.ts         # Hooks personalizados de Redux
│   │   └── index.ts         # Configuración del store
│   │
│   ├── App.tsx              # Configuración de rutas
│   └── main.tsx             # Punto de entrada de la aplicación
│
├── .env                     # Variables de entorno
├── package.json             # Dependencias y scripts
└── vite.config.ts           # Configuración de Vite
```

## Configuración e Instalación

### Requisitos Previos

- Node.js (versión 18 o superior)
- npm (versión 9 o superior)
- MySQL (versión 8 o superior)

### Variables de Etorno

Crea un archivo `.env` en el directorio raíz con las siguientes variables:

```
# Credenciales de AWS
VITE_AWS_REGION=tu-region
VITE_AWS_ACCESS_KEY_ID=tu-access-key
VITE_AWS_SECRET_ACCESS_KEY=tu-secret-key

# Configuración de base de datos
DB_HOST=localhost
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_NAME=alphabetization
```

### Configuración de la Base de Datos

1. Crea una base de datos MySQL llamada `alphabetization`
2. Ejecuta el script SQL ubicado en `/sql/schema.sql` para crear las tablas necesarias
3. Opcionalmente, carga los datos iniciales con el script `/sql/seed.sql`

### Pasos de Instalación

Clona el repositorio: `git clone https://github.com/tu-usuario/LetraLingo.git`
Instala las dependencias: `npm install`
Configura el archivo `.env` como se indicó anteriormente
Inicia el servidor de desarrollo: `npm run dev`
Para producción, compila el proyecto: `npm run build`

## Uso

1. Modo Escuchar:

- Escucha la pronunciación de una letra
- Selecciona la letra correcta
- Practica tu comprensión auditiva

2. Modo Escribir:

- Dibuja la letra mostrada en el lienzo
- Sistema de IA verifica tu escritura
- Mejora tu trazo de letras

3. Modo Leer:

- Pronuncia la letra mostrada
- Sistema de reconocimiento de voz valida tu pronunciación

## Puntos de Acceso API

- `GET /api/listening_progress`: Obtiene el progreso del modo escucha por letra
- `POST /api/session`: Registra una nueva sesión de prueba
- `GET /api/user/progress`: Obtiene el progreso general del usuario
- `POST /api/writing/validate`: Valida un dibujo de letra
