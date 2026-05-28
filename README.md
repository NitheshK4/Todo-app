# TodoPro Enterprise 🚀

> Full-stack Todo app with AES-256 encryption, MFA, JWT+OAuth, Redis, Razorpay, Docker & Kubernetes.

---

## 📁 Project Structure

```
Todo/
├── frontend/          # React 18 + Vite
├── backend/           # Node.js + Express
├── k8s/               # Kubernetes manifests
├── docker-compose.yml # Local dev with all services
└── README.md
```

---

## 🛠️ STEP-BY-STEP SETUP

### ✅ Step 1 — Install Prerequisites

Install these tools first (one-time):

| Tool | Install Command |
|------|----------------|
| Node.js 20 | https://nodejs.org |
| Docker Desktop | https://docker.com |
| PostgreSQL | via Docker (no manual install needed) |

---

### ✅ Step 2 — Create Environment File

```bash
cd /Users/nitheshkumar/Documents/Todo/backend
cp .env.example .env
```

Open `.env` and fill in these values:

```
# Generate a random encryption key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secrets (run twice for 2 different secrets):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### ✅ Step 3 — Get API Keys

#### Razorpay (Payment Gateway):
1. Go to https://dashboard.razorpay.com
2. Sign up (free)
3. Go to **Settings → API Keys → Generate Test Key**
4. Copy `Key ID` → `RAZORPAY_KEY_ID` in `.env`
5. Copy `Key Secret` → `RAZORPAY_KEY_SECRET` in `.env`

#### Google OAuth:
1. Go to https://console.cloud.google.com
2. Create a new project → **APIs & Services → Credentials**
3. Click **Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add redirect URI: `http://localhost:5000/api/auth/oauth/google/callback`
6. Copy Client ID and Secret to `.env`

---

### ✅ Step 4 — Run with Docker (Easiest!)

This starts **everything** (backend, frontend, PostgreSQL, Redis) automatically:

```bash
cd /Users/nitheshkumar/Documents/Todo

# Start all services
docker compose up --build

# Stop all services
docker compose down
```

Then open: **http://localhost:3000**

---

### ✅ Step 5 — OR Run Locally (Without Docker)

#### Start PostgreSQL & Redis with Docker:
```bash
docker run -d --name todo_postgres -e POSTGRES_DB=todo_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -p 5432:5432 postgres:16-alpine
docker run -d --name todo_redis -p 6379:6379 redis:7-alpine
```

#### Start Backend:
```bash
cd /Users/nitheshkumar/Documents/Todo/backend
npm install
npm run dev
# ✅ Server at http://localhost:5000
```

#### Start Frontend (new terminal):
```bash
cd /Users/nitheshkumar/Documents/Todo/frontend
npm install
npm run dev
# ✅ App at http://localhost:3000
```

---

### ✅ Step 6 — Test the App

1. **Register**: http://localhost:3000/register
2. **Login**: http://localhost:3000/login
3. **Dashboard**: Create todos (they're AES-256 encrypted in DB)
4. **Enable MFA**: Click "Enable MFA" banner → scan QR with Google Authenticator
5. **Upgrade plan**: http://localhost:3000/pricing → use Razorpay test card
6. **Google OAuth**: Click "Sign in with Google" on login page

#### Test Razorpay (Test Mode):
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
OTP: 1234 (for test mode)
```

---

### ✅ Step 7 — Deploy with Kubernetes

```bash
# 1. Edit k8s/secrets.yaml with real values

# 2. Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# 3. Check everything is running
kubectl get pods -n todo-app
kubectl get services -n todo-app

# 4. Forward ports to test locally
kubectl port-forward svc/backend 5000:5000 -n todo-app
kubectl port-forward svc/frontend 3000:80 -n todo-app
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt (12 rounds) |
| JWT tokens | Access (15min) + Refresh (7 days) |
| Token blacklisting | Redis on logout |
| MFA | TOTP via speakeasy (Google Authenticator) |
| MFA secret storage | AES-256-GCM encrypted in DB |
| Todo content | AES-256-GCM field-level encryption |
| Brute force protection | Redis login attempt counter (10 tries / 15min) |
| Rate limiting | 10 auth req/15min, 100 API req/min |
| Google OAuth | passport-google-oauth20 |
| Payment verification | HMAC-SHA256 signature |

---

## 🌐 API Reference

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login (returns MFA temp token if MFA enabled)
POST   /api/auth/refresh           Refresh access token
POST   /api/auth/logout            Logout + blacklist token
GET    /api/auth/me                Get current user
GET    /api/auth/oauth/google      Google OAuth redirect

POST   /api/mfa/setup              Generate QR code (requires login)
POST   /api/mfa/verify-setup       Enable MFA (requires login)
POST   /api/mfa/verify-login       Complete login with TOTP code
POST   /api/mfa/disable            Disable MFA (requires login + TOTP)

GET    /api/todos                  Get all todos (with Redis cache)
POST   /api/todos                  Create todo (AES encrypted)
PUT    /api/todos/:id              Update todo
DELETE /api/todos/:id              Delete todo

GET    /api/payment/plans          Get available plans
POST   /api/payment/create-order   Create Razorpay order
POST   /api/payment/verify         Verify payment signature
GET    /api/payment/history        Payment history
```

---

## 🐳 Docker Commands

```bash
# Build and start
docker compose up --build -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

---

## 📞 Need Help?

If you get stuck at any step:
1. Check `docker compose logs backend` for backend errors
2. Make sure `.env` has all values filled in
3. Verify Razorpay keys are in test mode
4. For MFA issues: time sync your phone

#end

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
