# MediCore Platform

Plataforma SaaS médica — Next.js + TypeScript + Tailwind + SQLite

## Inicio Rápido (Windows)

```
Doble clic en start.bat
```

## Inicio Manual

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Stack
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: SQLite (better-sqlite3) — se crea sola
- **Auth**: JWT + bcrypt + httpOnly cookies
- **Suscripción**: $3 USD/año + trial 3 días por módulo

## Estructura
```
medicore/
├── app/
│   ├── api/auth/       → login, register, logout, me
│   ├── api/subscriptions/ → status, subscribe
│   ├── api/trials/     → activar trial, verificar acceso
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx        → Landing (server component)
├── components/
│   ├── LandingClient.tsx → Catálogo + auth + modals
│   └── modules/
│       └── NalsMonitor.tsx → Monitor de reanimación
├── lib/
│   ├── auth.ts         → JWT helpers
│   ├── db.ts           → SQLite setup
│   └── modules.ts      → Catálogo de módulos
├── types/
│   └── index.ts
├── package.json
├── next.config.js
├── tailwind.config.ts
└── start.bat
```

## Agregar Módulos Nuevos
1. Crear componente en `components/modules/NuevoModulo.tsx`
2. Agregarlo a `lib/modules.ts` con status `active`
3. Importarlo en `components/LandingClient.tsx` y agregar case en el render
