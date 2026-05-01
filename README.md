# Claim Penjualan - Sales Claim Management System

Sistem manajemen claim penjualan dengan fitur import Excel, crew management, group/zoning, dan scoring harian.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Database**: Prisma ORM (SQLite untuk dev, Neon PostgreSQL untuk production)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Fitur

- 📊 **Dashboard** — Import data Excel, lihat data penjualan dengan paginasi 40/halaman
- 👥 **Crew Management** — CRUD crew dengan PIN, foto, ID Karyawan, dan grup
- 🏢 **Group/Zoning** — Kelompokkan crew, atur target bulanan (nominal) & alokasi mingguan (persentase)
- 🏆 **Scoring Harian** — Ranking crew: Total Settle, Qty, Basket Size, Price Point
- 🔒 **PIN Lock** — Halaman management dilindungi PIN admin
- ✅ **Multi-select** — Claim penjualan massal untuk beberapa data sekaligus
- 🔍 **Searchbox Crew** — Pencarian crew saat assign penjualan

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm/bun package manager

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/claim-penjualan.git
cd claim-penjualan

# Install dependencies
bun install

# Setup environment
cp .env.example .env

# Setup database
bun run db:push:dev

# Start development server
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Default Admin PIN

```
PIN: 1234
```

Ubah via environment variable `ADMIN_PIN`.

## Deployment ke Vercel + Neon

### 1. Buat database Neon

Daftar di [neon.tech](https://neon.tech) dan buat project baru. Salin connection string.

### 2. Switch schema ke PostgreSQL

```bash
bun run db:switch:neon
bun run db:generate
```

### 3. Set environment variables di Vercel

```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
ADMIN_PIN=your-secure-pin
```

### 4. Deploy

```bash
vercel deploy
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run lint` | Run ESLint |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push:dev` | Push schema to DB (dev only) |
| `bun run db:migrate:dev` | Create migration (dev) |
| `bun run db:migrate:deploy` | Apply migrations (production) |
| `bun run db:studio` | Open Prisma Studio |
| `bun run db:reset:local` | Reset local database ⚠️ |
| `bun run db:switch:neon` | Switch schema to Neon PostgreSQL |

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # SQLite schema (default)
│   └── schema.neon.prisma     # PostgreSQL schema (Neon)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/verify-pin/   # PIN verification
│   │   │   ├── crews/             # Crew CRUD
│   │   │   ├── groups/            # Group CRUD
│   │   │   ├── sales/             # Sales data & import
│   │   │   └── scoring/           # Scoring calculations
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main page with navigation
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── navbar.tsx             # Sidebar + mobile nav
│   │   ├── dashboard-view.tsx     # Sales data & import
│   │   ├── crew-view.tsx          # Crew management
│   │   ├── group-view.tsx         # Group management
│   │   ├── scoring-view.tsx       # Daily scoring
│   │   ├── pin-lock.tsx           # PIN lock overlay
│   │   ├── add-crew-dialog.tsx    # Add/edit crew dialog
│   │   └── add-group-dialog.tsx   # Add/edit group dialog
│   ├── hooks/
│   │   └── use-pin-lock.ts        # PIN lock state hook
│   └── lib/
│       ├── db.ts                  # Prisma client (dual-backend)
│       └── utils.ts
├── .env.example
├── vercel.json
└── package.json
```

## License

MIT
