# Replit Deployment Checklist

This checklist ensures your deployment succeeds on Replit. Follow these steps **before** clicking "Deploy".

## ✅ Pre-Deployment Checklist

### 1. Provision PostgreSQL Database

- [ ] Open **Tools** → **PostgreSQL** (or click Database icon)
- [ ] Click **Create Database**
- [ ] Verify `DATABASE_URL` appears in **Secrets** (lock icon 🔒)

### 2. Configure Deployment Secrets

⚠️ **CRITICAL**: Secrets from the workspace Secrets pane do NOT automatically copy to Deployments.

Go to **Deployments** → Your deployment → **Configuration** tab → **Secrets** section:

#### Required Database Secrets:
- [ ] **`DATABASE_URL`** - Your full PostgreSQL connection string
  ```
  Format: postgresql://user:password@your-db-host.neon.tech:5432/your-database
  ```
  Copy this from your workspace Secrets pane.

- [ ] **`PGHOST`** - Database hostname (e.g., `your-db-host.neon.tech`)
- [ ] **`PGUSER`** - Database username
- [ ] **`PGPASSWORD`** - Database password
- [ ] **`PGDATABASE`** - Database name (optional, included in DATABASE_URL)

#### Required Application Secrets:
- [ ] **`JWT_SECRET`** - Random string for JWT tokens
  ```
  Generate: openssl rand -base64 32
  Example: your-random-secret-string-change-this-in-production
  ```

#### Optional Environment Variables:
- [ ] **`PORT`** - Server port (default: 3001, auto-configured)
- [ ] **`NODE_ENV`** - Already set to "production" in .replit file

### 3. Verify Port Configuration

The `.replit` file should have:
```toml
[[ports]]
localPort = 3001
externalPort = 80
```
✅ This is already configured in your project.

### 4. Check Connection Timeout Settings

The `.replit` file should have:
```toml
[deployment.env]
NODE_ENV = "production"
PGCONNECT_TIMEOUT = "30"
```
✅ This is already configured to handle serverless cold starts.

## 🚀 Deploy

After completing the checklist:

1. Click **Deploy** button in Replit
2. Wait for build to complete (3-5 minutes)
3. First connection may take 10-15 seconds (database cold start)
4. Subsequent requests will be instant

## 🔍 Troubleshooting

### Error: "getaddrinfo EAI_AGAIN helium"
**Cause**: `DATABASE_URL` is not set or pointing to wrong host  
**Fix**: Add correct `DATABASE_URL` to **Deployment Secrets** (not just workspace Secrets)

### Error: "Failed to connect to PostgreSQL database"
**Causes**:
1. Database not provisioned
2. `DATABASE_URL` missing from Deployment secrets
3. Connection timeout too short

**Fix**:
1. Provision database from Tools → PostgreSQL
2. Copy all database secrets to Deployment → Configuration → Secrets
3. Verify `PGCONNECT_TIMEOUT = "30"` in deployment.env

### Error: "The deployment failed because the application failed to open a port in time"
**Causes**:
1. Database connection taking too long (cold start)
2. Wrong port configuration
3. Missing required secrets

**Fix**:
1. Ensure `PGCONNECT_TIMEOUT = "30"` is set
2. Verify port configuration: `localPort = 3001`, `externalPort = 80`
3. Check all required secrets are in Deployment → Configuration → Secrets

### Error: "SESSION_SECRET" or "JWT_SECRET" missing
**Cause**: JWT secret not configured  
**Fix**: Add `JWT_SECRET` to Deployment Secrets with a random string

## 📝 Common Mistakes

1. ❌ **Only adding secrets to workspace Secrets**
   - ✅ Secrets must be added to **both** workspace Secrets AND Deployment → Configuration → Secrets

2. ❌ **Using development DATABASE_URL in production**
   - ✅ Each Repl has its own DATABASE_URL when you provision PostgreSQL

3. ❌ **Not waiting for database cold start**
   - ✅ First deployment connection can take 10-15 seconds; be patient

4. ❌ **Forgetting to add JWT_SECRET**
   - ✅ Always add JWT_SECRET to Deployment secrets for authentication to work

## 🔐 Security Notes

- **Never commit** `DATABASE_URL` or `JWT_SECRET` to Git
- Keep all secrets in Replit's Secrets manager
- Use strong random strings for `JWT_SECRET`
- Production DATABASE_URL should be different from development

## 📖 More Information

See [REPLIT_DEPLOYMENT.md](REPLIT_DEPLOYMENT.md) for detailed deployment guide.

