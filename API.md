# PhantomPay API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are returned from `/auth/signup` and `/auth/login` endpoints.

---

## Endpoints

### Authentication

#### POST /auth/signup

Create a new user account.

**Request Body:**
```json
{
  "username": "string (3-16 characters, required)",
  "password": "string (min 6 characters, required)"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "username"
  }
}
```

**Errors:**
- 400: Username already exists / Invalid input
- 500: Internal server error

---

#### POST /auth/login

Login to an existing account.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "username"
  }
}
```

**Errors:**
- 401: Invalid username or password
- 500: Internal server error

---

#### GET /auth/profile

Get the current user's profile. **[Protected]**

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "username",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "wallet": {
    "phantom_coin": 1000.00,
    "stoneworks_dollar": 1000.00
  }
}
```

**Errors:**
- 401: Access token required
- 403: Invalid or expired token
- 404: User not found

---

### Wallet

#### GET /wallet

Get wallet balances. **[Protected]**

**Response (200):**
```json
{
  "wallet": {
    "id": 1,
    "user_id": 1,
    "phantom_coin": 1000.00,
    "stoneworks_dollar": 1000.00
  }
}
```

**Errors:**
- 401: Access token required
- 403: Invalid or expired token
- 404: Wallet not found

---

#### POST /wallet/swap

Swap between currencies at 1:1 ratio. **[Protected]**

**Request Body:**
```json
{
  "fromCurrency": "phantom_coin | stoneworks_dollar",
  "toCurrency": "phantom_coin | stoneworks_dollar",
  "amount": 100.00
}
```

**Response (200):**
```json
{
  "message": "Swap successful",
  "wallet": {
    "id": 1,
    "user_id": 1,
    "phantom_coin": 900.00,
    "stoneworks_dollar": 1100.00
  }
}
```

**Errors:**
- 400: Invalid input / Insufficient balance / Same currency
- 401: Access token required
- 403: Invalid or expired token
- 404: Wallet not found

---

### Payments

#### POST /payment/send

Send payment to another user. **[Protected]**

**Request Body:**
```json
{
  "recipientUsername": "string (required)",
  "currency": "phantom_coin | stoneworks_dollar",
  "amount": 50.00,
  "description": "string (optional)"
}
```

**Response (200):**
```json
{
  "message": "Payment sent successfully",
  "transaction": {
    "id": 1,
    "recipient": "recipient_username",
    "currency": "phantom_coin",
    "amount": 50.00
  },
  "wallet": {
    "id": 1,
    "user_id": 1,
    "phantom_coin": 950.00,
    "stoneworks_dollar": 1000.00
  }
}
```

**Errors:**
- 400: Invalid input / Insufficient balance / Cannot send to yourself
- 401: Access token required
- 403: Invalid or expired token
- 404: Recipient not found / Wallet not found

---

#### GET /payment/transactions

Get transaction history. **[Protected]**

**Query Parameters:**
- `limit` (optional, default: 50): Number of transactions to return
- `offset` (optional, default: 0): Number of transactions to skip

**Response (200):**
```json
{
  "transactions": [
    {
      "id": 1,
      "from_user_id": 1,
      "to_user_id": 2,
      "transaction_type": "payment",
      "currency": "phantom_coin",
      "amount": 50.00,
      "description": "Payment to user2",
      "created_at": "2024-01-01T00:00:00.000Z",
      "from_username": "user1",
      "to_username": "user2"
    },
    {
      "id": 2,
      "from_user_id": 1,
      "to_user_id": null,
      "transaction_type": "swap",
      "currency": "phantom_coin",
      "amount": 100.00,
      "description": "Swapped 100 phantom_coin to stoneworks_dollar",
      "created_at": "2024-01-01T00:00:00.000Z",
      "from_username": "user1",
      "to_username": null
    }
  ]
}
```

**Errors:**
- 401: Access token required
- 403: Invalid or expired token

---

### Users

#### GET /users

Get all users (excluding current user). **[Protected]**

**Response (200):**
```json
{
  "users": [
    {
      "id": 2,
      "username": "user2",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "username": "user3",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors:**
- 401: Access token required
- 403: Invalid or expired token

---

#### GET /users/search

Search users by username. **[Protected]**

**Query Parameters:**
- `query` (required): Search string

**Response (200):**
```json
{
  "users": [
    {
      "id": 2,
      "username": "user2",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors:**
- 400: Search query is required
- 401: Access token required
- 403: Invalid or expired token

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

## Currency Types

- `phantom_coin`: PhantomCoin (PC)
- `stoneworks_dollar`: Game Chips (GC)

## Transaction Types

- `payment`: Transfer from one user to another
- `swap`: Currency exchange

## Rate Limiting

Currently not implemented. Recommended for production deployment.

## Authentication Token

- Tokens expire after 7 days
- Store the token securely in localStorage or sessionStorage
- Include the token in all protected API requests

## Example Usage with JavaScript

```javascript
// Signup
const signup = async (username, password) => {
  const response = await fetch('http://localhost:3001/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};

// Get wallet (with authentication)
const getWallet = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3001/api/wallet', {
    headers: { 
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Send payment
const sendPayment = async (recipientUsername, currency, amount) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3001/api/payment/send', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ recipientUsername, currency, amount })
  });
  return response.json();
};
```

## WebSocket Support

Not currently implemented. Future enhancement for real-time notifications.

## Pagination

Currently only transaction history supports pagination via `limit` and `offset` parameters.

## Future API Endpoints

Planned for future releases:

- `/api/stocks` - Stock market operations
- `/api/bonds` - Bond purchasing and trading
- `/api/loans` - Loan management
- `/api/notifications` - User notifications
- `/api/profile` - Extended user profiles
- `/api/admin` - Administrative operations

