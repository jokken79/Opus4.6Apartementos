# CLAUDE.md — Opus4.6 Apartementos

## Project Overview

**UNS Estate OS** — A property/apartment rental management system for UNS-KIKAKU (ユニバーサル企画株式会社). Built as a single-page React application with client-side localStorage persistence (no backend). The UI is bilingual (Spanish + Japanese).

### What it does
- Manages rental properties, tenant assignments, and employee master data
- Tracks rent collection, billing cycles, and financial metrics (dashboard KPIs)
- Imports data from Excel files (employee lists, rent management sheets)
- Supports pro-rata rent calculation, billing modes (split/fixed), and tenant history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (strict mode) |
| Build | Create React App (react-scripts 5.0.1) |
| Styling | Tailwind CSS 3.4 + custom CSS animations (glassmorphism) |
| Icons | lucide-react |
| Validation | Zod 4 |
| Excel parsing | SheetJS (loaded dynamically from CDN) |
| Testing | Jest + React Testing Library |
| Persistence | localStorage (key: `uns_db_v6_0`) |

## Commands

```bash
npm start          # Dev server on http://localhost:3004
npm run build      # Production build to /build
npm test           # Jest test runner (watch mode)
```

## Project Structure

```
src/
├── App.tsx                    # Main app component (~915 lines, routing + state)
├── App.css                    # Tailwind utilities + custom animations
├── index.tsx                  # React entry point
├── index.css                  # Global styles + Tailwind directives + keyframes
├── components/
│   ├── dashboard/
│   │   └── Dashboard.tsx      # KPI dashboard with financial metrics
│   ├── import/
│   │   └── ImportView.tsx     # Excel import with drag-drop + validation
│   └── properties/
│       └── RentManager.tsx    # Property + tenant CRUD management
├── hooks/
│   ├── useDatabase.ts         # All CRUD operations, localStorage persistence
│   ├── useExcelImport.ts      # Excel file processing + validation
│   └── useNotifications.tsx   # Toast notification system
├── types/
│   └── database.ts            # All TypeScript interfaces (central type definitions)
└── utils/
    └── validators.ts          # Zod schemas + validation functions
```

## Architecture & Conventions

### State Management
- No external state library (no Redux/MobX). State lives in `App.tsx` via `useState` + `useCallback`.
- Data is persisted to `localStorage` through `useDatabase` hook.
- Database schema version is tracked in the stored JSON (`version` field).

### Data Model (key entities)
- **Property** — Rental unit (address, capacity, rent costs, contract dates, billing mode)
- **Tenant** — Employee assigned to a property (rent contribution, parking fee, entry/exit dates, status: active/inactive)
- **Employee** — Master employee record imported from Excel (社員No, name, kana, company)
- **Config** — App settings (company name, closing day for billing: 0/15/20/25)

### Component Patterns
- Functional components only (no class components)
- Custom hooks encapsulate business logic (`useDatabase`, `useExcelImport`, `useNotifications`)
- Components receive data/callbacks via props from `App.tsx`

### Validation
- Zod schemas in `src/utils/validators.ts` for all entities
- Excel row schemas use Japanese field names (半角カナ headers like `ｱﾊﾟｰﾄ`, `住所`, `家賃`)
- `validateDataIntegrity()` checks FK relationships and capacity constraints

### External APIs
- **Zipcloud** (`https://zipcloud.ibsnet.co.jp/api/search`) — Postal code → address auto-fill
- **SheetJS CDN** — Loaded dynamically onto `window.XLSX` for Excel parsing

### Styling Conventions
- Tailwind utility classes are primary
- Custom CSS for animations (fade-in, slide, glassmorphism effects) in `App.css` and `index.css`
- Dark-themed UI with glass-effect panels

## Language & Naming

- **Code comments**: Spanish (e.g., `// Dirección completa formateada`)
- **UI labels**: Mix of Spanish and Japanese depending on context
- **Commit messages**: Bilingual — Spanish descriptions + Japanese feature names (e.g., `feat: 管理機能強化 - 課金モード、日割り計算、社員台帳`)
- **Variable names**: English (camelCase for variables, PascalCase for components/interfaces)
- **Type field names**: English with snake_case (e.g., `rent_cost`, `property_id`, `name_kana`)
- **Excel headers**: Japanese (e.g., `社員No`, `氏名`, `カナ`, `派遣先`)

## Development Guidelines

### When modifying code
1. All types are defined in `src/types/database.ts` — add new interfaces there, not inline
2. Validation schemas live in `src/utils/validators.ts` — keep in sync with type changes
3. Database operations go through `useDatabase` hook — never write to localStorage directly
4. The main `App.tsx` is large (~915 lines); prefer extracting logic into hooks or new components under `src/components/`

### When adding features
- Follow existing hook pattern: create `src/hooks/useFeatureName.ts`
- Add corresponding types to `database.ts`
- Add Zod validation schema to `validators.ts`
- Use `lucide-react` for icons (already imported)
- Use Tailwind classes; avoid adding new CSS unless animation-specific

### Common pitfalls
- `window.XLSX` is loaded dynamically — always check availability before using
- Tenant `status` is `'active' | 'inactive'` — filter by status when counting occupancy
- `closingDay: 0` means end-of-month billing; other values (15, 20, 25) are mid-month
- Property `billing_mode` can be `'split'` (rent divided among tenants) or `'fixed'` (fixed per tenant)
- Japanese postal codes follow `###-####` format

### Testing
- Test framework is set up but coverage is minimal (single placeholder test)
- Run tests with `npm test`
- Use React Testing Library patterns for component tests

## Environment

```
PORT=3004           # Dev server port
BROWSER=none        # Don't auto-open browser on start
```

## Git Workflow

- Feature branches with PRs (e.g., `claude/feature-name-xxxxx`)
- No CI/CD pipeline configured
- No Docker setup — static build deployment
