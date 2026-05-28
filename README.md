# GovExam Pro

Government Exam Practice Platform — UPSC, SSC, Banking, Railways, State PSC

## Quick Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `database/schema.sql` in the SQL Editor
3. Enable Google OAuth in Authentication → Providers
4. Copy your Project URL and anon/service keys

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Visit `http://localhost:3000`

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (bypasses RLS) |
| `GEMINI_API_KEY` | From Google AI Studio |
| `CLOUDINARY_*` | From Cloudinary dashboard |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Backend URL (http://localhost:5000/api) |

## Make a User Admin
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Deployment
- **Frontend** → Vercel (connect GitHub repo, set env vars)
- **Backend** → Render.com (set env vars, use `npm start`)
- **Database** → Already on Supabase
- **Uptime** → Add Render URL to UptimeRobot (ping every 5 min)
