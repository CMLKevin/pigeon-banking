# PhantomPay Architecture

## Overview

PhantomPay is built using a modern client-server architecture with a clear separation of concerns, making it easy to extend and maintain.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Pages & Components                   │  │
│  │  Login, Signup, Dashboard, Swap, Send, Users     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Context & State Management             │  │
│  │              (AuthContext)                        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Service Layer (API)                  │  │
│  │     authAPI, walletAPI, paymentAPI, userAPI      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Server (Express.js)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │                 Middleware Layer                  │  │
│  │          CORS, JSON Parser, Auth JWT             │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                  Route Layer                      │  │
│  │    /auth, /wallet, /payment, /users              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Controller Layer                    │  │
│  │  Business Logic, Validation, Error Handling      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                Database Layer                     │  │
│  │           SQLite (better-sqlite3)                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 18**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client

### Directory Structure

```
client/src/
├── components/          # Reusable UI components
│   ├── Button.jsx      # Custom button component
│   ├── Input.jsx       # Form input component
│   ├── Select.jsx      # Dropdown select component
│   ├── Navbar.jsx      # Navigation bar
│   ├── WalletCard.jsx  # Wallet balance display
│   ├── TransactionItem.jsx  # Transaction list item
│   └── ProtectedRoute.jsx   # Route protection wrapper
├── pages/              # Main application pages
│   ├── Login.jsx       # Login page
│   ├── Signup.jsx      # User registration
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Swap.jsx        # Currency swap interface
│   ├── Send.jsx        # Send payment interface
│   └── Users.jsx       # User directory
├── context/            # React Context API
│   └── AuthContext.jsx # Authentication state management
├── services/           # API communication layer
│   └── api.js          # Axios configuration and API endpoints
├── utils/              # Utility functions
│   └── formatters.js   # Currency and date formatting
├── App.jsx             # Main app component with routing
├── main.jsx            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

### Key Design Patterns

1. **Context Pattern**: Used for global authentication state
2. **Service Layer**: Abstraction over API calls
3. **Protected Routes**: HOC for route authentication
4. **Component Composition**: Reusable, composable UI components

### State Management

- **Local State**: React `useState` for component-specific state
- **Global State**: React Context API for authentication
- **Server State**: Fetched and cached in component state

## Backend Architecture

### Technology Stack
- **Node.js**: Runtime environment
- **Express**: Web framework
- **SQLite**: Database (via better-sqlite3)
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing

### Directory Structure

```
server/src/
├── config/
│   └── database.js          # Database initialization and schema
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── walletController.js  # Wallet operations
│   ├── paymentController.js # Payment transactions
│   └── userController.js    # User queries
├── routes/
│   ├── auth.js              # Auth route definitions
│   ├── wallet.js            # Wallet route definitions
│   ├── payment.js           # Payment route definitions
│   └── user.js              # User route definitions
├── middleware/
│   └── auth.js              # JWT authentication middleware
└── server.js                # Express server setup
```

### Layered Architecture

1. **Route Layer**: Defines endpoints and HTTP methods
2. **Middleware Layer**: Authentication, validation, error handling
3. **Controller Layer**: Business logic and data validation
4. **Database Layer**: Direct database operations

### Database Schema

```sql
users
├── id (INTEGER PRIMARY KEY)
├── username (TEXT UNIQUE)
├── password (TEXT)
└── created_at (DATETIME)

wallets
├── id (INTEGER PRIMARY KEY)
├── user_id (INTEGER UNIQUE FK)
├── phantom_coin (REAL)
└── stoneworks_dollar (REAL)

transactions
├── id (INTEGER PRIMARY KEY)
├── from_user_id (INTEGER FK)
├── to_user_id (INTEGER FK, nullable)
├── transaction_type (TEXT)
├── currency (TEXT)
├── amount (REAL)
├── description (TEXT)
└── created_at (DATETIME)
```

### Security Measures

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: Signed with secret key, 7-day expiration
3. **Protected Routes**: Middleware verification
4. **SQL Injection Prevention**: Parameterized queries
5. **CORS**: Configured for cross-origin requests

## Data Flow

### Authentication Flow

```
1. User submits credentials → Frontend
2. Frontend sends POST to /api/auth/login → Backend
3. Backend validates credentials
4. Backend generates JWT token
5. Backend returns token + user data → Frontend
6. Frontend stores token in localStorage
7. Frontend includes token in subsequent requests
```

### Payment Flow

```
1. User initiates payment → Frontend
2. Frontend validates input
3. Frontend sends POST to /api/payment/send → Backend
4. Backend authenticates request (JWT)
5. Backend validates recipient and balance
6. Backend performs database transaction:
   - Deduct from sender
   - Add to recipient
   - Record transaction
7. Backend returns updated wallet → Frontend
8. Frontend updates UI
```

### Currency Swap Flow

```
1. User initiates swap → Frontend
2. Frontend sends POST to /api/wallet/swap → Backend
3. Backend authenticates request (JWT)
4. Backend validates balance
5. Backend updates wallet (1:1 ratio):
   - Decrease fromCurrency
   - Increase toCurrency
6. Backend records transaction
7. Backend returns updated wallet → Frontend
8. Frontend updates UI
```

## Modularity & Extensibility

### Adding New Features

The architecture is designed for easy extension:

#### 1. Adding a New Page
```
1. Create component in client/src/pages/
2. Add route in client/src/App.jsx
3. Add navigation link in client/src/components/Navbar.jsx
```

#### 2. Adding a New API Endpoint
```
1. Create controller in server/src/controllers/
2. Create route in server/src/routes/
3. Register route in server/src/server.js
4. Add API function in client/src/services/api.js
```

#### 3. Adding a New Currency
```
1. Add column to wallets table (database.js)
2. Update wallet operations (walletController.js)
3. Add to currency options in frontend forms
4. Update formatters (formatters.js)
```

### Future Modular Features

The codebase is prepared for:

1. **Stock Market Module**
   - New routes: `/api/stocks`
   - New pages: `StockMarket.jsx`, `Portfolio.jsx`
   - New tables: `stocks`, `stock_transactions`

2. **Bonds Module**
   - New routes: `/api/bonds`
   - New pages: `Bonds.jsx`
   - New tables: `bonds`, `bond_holdings`

3. **Loans Module**
   - New routes: `/api/loans`
   - New pages: `Loans.jsx`, `LoanRequests.jsx`
   - New tables: `loans`, `loan_payments`

## Performance Considerations

### Frontend
- Lazy loading for routes (future enhancement)
- Memoization for expensive computations
- Debounced search inputs
- Optimized re-renders with React best practices

### Backend
- Database indexes on frequently queried columns
- Connection pooling (for production database)
- Caching strategy (future enhancement)
- Database transactions for atomic operations

## Deployment Architecture

### Development
```
Frontend (Vite Dev Server) → http://localhost:5000
Backend (Node.js) → http://localhost:3001
Database (PostgreSQL) → via DATABASE_URL
```

### Production (Recommended)
```
Frontend (Static Files) → CDN/Web Server (nginx)
Backend (Node.js) → Application Server (PM2)
Database → PostgreSQL/MySQL (production-grade)
Load Balancer → Multiple backend instances
SSL/TLS → HTTPS encryption
```

## Testing Strategy

### Frontend (Future)
- Unit tests: Jest + React Testing Library
- E2E tests: Playwright or Cypress
- Component tests: Storybook

### Backend (Future)
- Unit tests: Jest
- Integration tests: Supertest
- API tests: Postman/Newman

## Monitoring & Logging

### Recommended for Production
- Application logs: Winston or Pino
- Error tracking: Sentry
- Performance monitoring: New Relic or Datadog
- Database monitoring: Query performance analysis

## Scalability Considerations

### Horizontal Scaling
- Stateless backend design (JWT tokens)
- Database connection pooling
- Load balancer distribution
- Session management (Redis for production)

### Vertical Scaling
- Database optimization (indexes, query optimization)
- Caching layer (Redis)
- CDN for static assets
- Database replication (read replicas)

## Security Best Practices

1. **Authentication**: JWT with secure secret
2. **Password Storage**: bcrypt hashing
3. **Input Validation**: Server-side validation
4. **SQL Injection**: Parameterized queries
5. **XSS Protection**: React's built-in escaping
6. **HTTPS**: Required for production
7. **Rate Limiting**: Recommended for production
8. **CORS**: Configured appropriately

## Code Style & Conventions

### JavaScript/JSX
- ES6+ syntax
- Functional components with hooks
- Async/await for asynchronous operations
- Consistent naming conventions

### CSS
- Tailwind utility classes
- Responsive design (mobile-first)
- Consistent spacing and colors

### API
- RESTful conventions
- Consistent response formats
- Proper HTTP status codes

## Documentation

- `README.md`: Project overview and setup
- `SETUP.md`: Quick start guide
- `API.md`: Complete API reference
- `ARCHITECTURE.md`: This file
- Inline comments for complex logic

---

This architecture supports the current features while providing a solid foundation for future enhancements like stock markets, bonds, and loans.

