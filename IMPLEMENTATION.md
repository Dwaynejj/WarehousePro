# WarehousePro — Requirements & Implementation Plan

Capstone reference: [WarehousePro](https://github.com/Omarionn-x64/WarehousePro) · BIT 268 · Group 73

---

## 1. What the project must do

| Area | Requirement |
|---|---|
| Core algorithm | Given a start bin (e.g. `PACK-01`) and pick-list bins, return an optimized visit order and total walking distance |
| Path model | Warehouse graph respects aisles (no cutting through shelves); Dijkstra for pairwise shortest paths |
| Route heuristic | Nearest-neighbor construction + 2-opt improvement (TSP-style) |
| Persistence | Zones, aisles, bins, orders, route history in Postgres (Supabase) or H2 for local demos |
| Picker app | Sign in → see assigned/pending orders → optimize route → confirm picks → complete order |
| Admin portal | Manage layout/orders, view history & analytics — **not** open for public self-registration |
| Capstone story | Algorithmic thinking + DB + REST + practical warehouse productivity |

### Backend APIs already present

- `POST /api/routes/optimize`
- `GET /api/routes/history`
- `GET /api/routes/analytics`
- `GET|POST /api/orders`, `PATCH .../pick`, `PATCH .../complete`
- CRUD: `/api/warehouse`, `/api/zones`, `/api/aisles`, `/api/bins`

Auth endpoints are **not** on Spring yet. The app uses Supabase Auth for sessions/roles until Spring Security lands.

---

## 2. Recommended architecture

```text
┌─────────────────────┐     ┌──────────────────────┐
│  Picker app         │     │  Admin portal        │
│  (Expo RN)          │     │  (Expo RN, separate  │
│  signup + signin    │     │   route tree)        │
│  role=picker only   │     │  signin only; invite │
└─────────┬───────────┘     └──────────┬───────────┘
          │  JWT (Supabase)            │
          └────────────┬───────────────┘
                       ▼
          ┌────────────────────────┐
          │ Spring Boot API :8080  │
          │ optimize / orders /    │
          │ history / analytics    │
          └────────────┬───────────┘
                       ▼
                 PostgreSQL / H2
```

### Why separate admin from picker

1. **Different jobs** — pickers need a fast queue → map → confirm loop; admins need create-order, history, layout, analytics.
2. **Different risk** — admin capabilities must not be reachable by “choose Admin on signup.”
3. **Clear demo story** — two entry points: public worker app vs staff portal.

### Admin account policy (locked down)

| Channel | Allowed? |
|---|---|
| Public onboarding / role-select / “Sign up as admin” | **No** |
| Picker self-signup | Yes (`role=picker` forced server-side in metadata) |
| Admin sign-in (`/admin/signin`) | Yes, existing admin accounts only |
| Admin invite (`/admin/invite`) | Yes, **only** with `EXPO_PUBLIC_ADMIN_INVITE_CODE` — not linked from public UI |
| Supabase Dashboard / service role | Yes (seed first manager for demos) |

Presentation guards (`RequireAdmin`) stop accidental access. Real enforcement still needs backend JWT verification later (see §4).

---

## 3. Frontend build order (smallest demoable increments)

1. **API client + types** — wire `EXPO_PUBLIC_API_BASE_URL` (LAN IP for devices).
2. **Picker home → route** — list orders / fallback pick list → `POST /optimize` → ordered bins + distance.
3. **Pick confirm → complete** — local + `PATCH` order endpoints.
4. **Admin portal** — analytics + create order + history (guarded).
5. **Auth** — picker signup/signin; admin signin + invite; role-based redirects.
6. **Polish** — warehouse SVG map pan/zoom, error/offline states, EAS build.

Do **not** block the demo on Spring Security or a full layout editor.

---

## 4. Backend next steps (suggested, not blocking UI)

1. **Spring Security + JWT** validating Supabase (or own) tokens on `/api/**`.
2. Role claims: `picker` vs `admin`; reject admin signup on any public API.
3. Extend optimize response with per-leg path nodes for an accurate map (see `picker-home-technical-plan.md` Option A).
4. Assign orders to pickers (`assignedTo`) when multi-user demos matter.

Until then: keep API open for local demos; treat Supabase role metadata as UI routing only.

---

## 5. Local runbook

```bash
# Backend (H2 sample data)
cd backend && mvn spring-boot:run

# Frontend
cd frontend
# set EXPO_PUBLIC_API_BASE_URL to your LAN IP, not localhost, for a physical device
npx expo start -c
```

- Picker: onboarding → Create account / Sign in → Home → Route  
- Admin: open `/admin/signin` (or use Invite once with the invite code) → Dashboard  

---

## 6. Folder map (frontend)

```text
frontend/
  app/
    (auth)/          picker onboarding, signup, signin
    (picker)/        home, route, settings
    (admin)/         dashboard, orders, history, settings  (RequireAdmin)
    admin/           signin + invite (outside tab shell)
  components/        shared UI (map, fields, RequireAdmin)
  lib/               api client, supabase, role helpers
  store/             active order, ephemeral UI state
  types/             API contracts
```
