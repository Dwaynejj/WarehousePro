# WarehousePro Frontend

Expo app for the WarehousePro capstone: a **picker** floor app and a **separate admin portal**.

See the root [README.md](../README.md) for full project status and backend setup.

## What’s in place

- Picker: onboarding → signup/signin → pick queue → optimized route → confirm picks → complete  
- Admin: `/admin/signin` → dashboard, create order, history (no public admin signup)  
- Workflow step guides + API connection banner  
- Typed API helpers against the Spring Boot backend  

## Portals

| Portal | Routes | Signup |
|---|---|---|
| Picker | `(auth)` → `(picker)` home / route / settings | Yes — always `role=picker` |
| Admin | `/admin/signin` → `(admin)` tabs | Invite only (`/admin/invite` + env code) |

### Admin access (not on the picker home screen)

1. Set `EXPO_PUBLIC_ADMIN_INVITE_CODE` in `.env`, then `npx expo start -c`
2. **First account:** open `http://localhost:8081/admin/invite` → invite code + email/password **or Google**
3. **Later:** open `http://localhost:8081/admin/signin` (email/password or Google)

### Google Auth

Picker signup/signin and admin invite/signin all offer **Continue with Google** (Supabase OAuth).  
Enable Google in the Supabase dashboard and add redirect URLs — see root README **Google Auth setup**.

## Run

```bash
cp .env.example .env   # if needed
npm install
npx expo start -c
```

- Web: `http://localhost:8081`  
- Set `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080` for same-machine browser  
- Use a LAN IP for a physical device  

## Structure

```text
app/
  (auth)/       picker onboarding, signup, signin
  (picker)/     home, route, settings
  (admin)/      dashboard, orders, history, settings
  admin/        signin + invite (outside tab shells)
components/     connection-banner, workflow-steps, warehouse-map, …
lib/            client, api/routes, supabase, errors
store/          active order
types/          backend DTO mirrors
```
