# PhantomPay Quick Setup Guide

This guide will help you get PhantomPay up and running in minutes.

## Step-by-Step Setup

### 1. Install Dependencies

From the root directory, run:

```bash
npm run install:all
```

This will install dependencies for the root project, client, and server.

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory with the following content:

```env
PORT=3001
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

**Important**: Change `JWT_SECRET` to a strong, random string for production use.

### 3. Start the Application

Run both servers simultaneously:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend client on http://localhost:3000

### 4. Create Your First Account

1. Open http://localhost:3000 in your browser
2. Click "Sign Up"
3. Enter your Minecraft username and create a password
4. You'll automatically be logged in with 1,000 PC and 1,000 SW$

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

1. Change the frontend port in `client/vite.config.js`
2. Change the backend port in `server/.env`

### Dependencies Installation Failed

Try installing dependencies manually:

```bash
# Root
npm install

# Client
cd client
npm install

# Server
cd ../server
npm install
```

### Database Issues

The SQLite database is automatically created on first run. If you encounter issues:

1. Delete `server/database.db`
2. Restart the server
3. The database will be recreated automatically

## Common Commands

```bash
# Install all dependencies
npm run install:all

# Start both servers (development)
npm run dev

# Start only the backend
npm run server

# Start only the frontend
npm run client

# Build frontend for production
npm run build

# Start production server
npm start
```

## Default User Credentials

There are no default users. You need to create an account through the signup page.

Each new user receives:
- 1,000 PhantomCoin
- 1,000 Game Chips

## Testing the Application

1. Create at least 2 user accounts (use different browsers or incognito mode)
2. Send a payment from one user to another
3. Try swapping currencies
4. View transaction history on the dashboard
5. Browse users on the Users page

## Production Deployment Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Set NODE_ENV to "production"
- [ ] Use a production database (PostgreSQL recommended)
- [ ] Enable HTTPS
- [ ] Set up proper CORS policies
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
- [ ] Set up automated backups
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up SSL certificates

## Need Help?

If you encounter any issues:

1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify environment variables are set correctly
4. Make sure both servers are running
5. Check the README.md for more detailed information

## API Testing

You can test the API using tools like Postman or curl:

```bash
# Health check
curl http://localhost:3001/health

# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

Happy payments! 🎉

