# Airbnb Host Platform

A full-stack web application for Airbnb hosts to manage their properties, guests, and provide essential information to visitors.

## Features

### Landing Page
- Hero section with image carousel
- Amenities section
- Location with optional map embed
- Contact information
- Guest reviews
- Dynamic sections (admin-manageable)

### Client Dashboard
- View access key codes
- Instructions for appliances, cleaning, etc.
- Sightseeing recommendations
- Submit reviews

### Admin Panel
- User management (create, edit, delete clients/admins)
- Visit tracking with revenue/cost tracking
- Apartment management
- Key code management
- Hero image management
- Instructions management
- Sightseeing recommendations management
- Review moderation
- Site settings configuration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with httpOnly cookies + bcrypt
- **Styling**: Tailwind CSS (mobile-first)
- **Icons**: Lucide React

## Build & Run Contract

### Prerequisites

- Node.js 18+ (check with `node --version`)
- npm 9+ (check with `npm --version`)

### Quick Start (First Time Setup)

```bash
# 1. Clone and enter directory
git clone git@github.com:chambbert/raama9a.git
cd raama9a

# 2. Copy environment file and configure
cp .env.example .env
# Edit .env: set JWT_SECRET to a secure random value

# 3. One-command setup (installs deps + sets up database)
npm run setup

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### All Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | **First-time setup**: install deps + push DB schema + generate Prisma client |
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production |
| `npm run start` | Start production server (requires build first) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:reset` | **Destructive**: Delete database and recreate |
| `npm run clean` | Remove .next and node_modules |

### Development Workflow

```bash
# Daily development
npm run dev

# Before committing
npm run lint && npm run typecheck

# View/edit database directly
npm run db:studio
```

### Production Deployment

```bash
# Build and start
npm run build && npm run start

# Or with environment variable
NODE_ENV=production npm run build
NODE_ENV=production npm run start
```

### Database Operations

```bash
# After schema changes
npm run db:push

# Reset database (WARNING: deletes all data)
npm run db:reset

# Regenerate Prisma client
npm run db:generate
```

### Environment Variables

Required in `.env`:
- `DATABASE_URL` - Database connection (default: `file:./dev.db` for SQLite)
- `JWT_SECRET` - **Required for production** - generate with `openssl rand -base64 32`

Optional:
- `NEXT_PUBLIC_APP_URL` - App URL (default: `http://localhost:3000`)
- `NODE_ENV` - `development` or `production`

**Never commit `.env` to version control.**

### Creating an Admin User

Since there's no seed data, you'll need to create the first admin user:

1. Register a new account at `/register`
2. Open Prisma Studio to directly modify the user:
```bash
npx prisma studio
```
3. Find your user in the `User` table and change `role` from `CLIENT` to `ADMIN`
4. Refresh your browser and you'll have admin access

Alternatively, you can create an admin via the API using a tool like curl:
```bash
# First register normally, then use Prisma Studio to change the role
```

## Project Structure

```
airbnb-host-platform/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── dashboard/         # Client dashboard
│   │   ├── admin/             # Admin panel
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── landing/           # Landing page components
│   │   ├── dashboard/         # Dashboard components
│   │   └── admin/             # Admin panel components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── validation.ts      # Zod validation schemas
│   │   └── utils.ts           # Helper functions
│   └── types/
│       └── index.ts           # TypeScript types
├── public/
│   └── uploads/               # Uploaded images
└── package.json
```

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/register` | POST | - | Register new client |
| `/api/auth/login` | POST | - | Login |
| `/api/auth/logout` | POST | Auth | Logout |
| `/api/auth/me` | GET | Auth | Get current user |
| `/api/users` | GET/POST | Admin | List/create users |
| `/api/users/[id]` | GET/PUT/DELETE | Admin | User CRUD |
| `/api/apartments` | GET/POST | -/Admin | List/create apartments |
| `/api/apartments/[id]` | GET/PUT/DELETE | -/Admin | Apartment CRUD |
| `/api/visits` | GET/POST | Admin | List/create visits |
| `/api/visits/[id]` | PUT/DELETE | Admin | Visit CRUD |
| `/api/key-codes` | GET/POST | Auth/Admin | Key codes |
| `/api/hero-images` | GET/POST | -/Admin | Hero images |
| `/api/hero-images/[id]` | PUT/DELETE | Admin | Hero image CRUD |
| `/api/instructions` | GET/POST | Auth/Admin | Instructions |
| `/api/instructions/[id]` | PUT/DELETE | Admin | Instruction CRUD |
| `/api/sightseeing` | GET/POST | Auth/Admin | Sightseeing |
| `/api/sightseeing/[id]` | PUT/DELETE | Admin | Sightseeing CRUD |
| `/api/reviews` | GET/POST | -/Auth | Reviews |
| `/api/reviews/[id]` | PUT/DELETE | Admin | Review moderation |
| `/api/sections` | GET/POST | -/Admin | Dynamic sections |
| `/api/sections/[id]` | PUT/DELETE | Admin | Section CRUD |
| `/api/settings` | GET/PUT | -/Admin | Site settings |

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT authentication with httpOnly cookies
- Role-based access control (Admin/Client)
- Input validation with Zod
- XSS protection (input sanitization)
- Prisma for SQL injection prevention
- CSRF protection middleware

## Git Workflow

```bash
# Main branch is protected - always work on feature branches
git checkout -b feature/your-feature-name

# Make changes, then commit
git add <specific-files>
git commit -m "Description of changes"

# Push and create PR
git push -u origin feature/your-feature-name
```

## License

MIT
