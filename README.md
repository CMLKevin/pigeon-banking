# Agon

A modern, minimalistic payment system for the Stoneworks Minecraft server, built with React and Node.js.

## ⚠️ IMPORTANT USAGE NOTICE

**This code is publicly available for viewing and learning purposes ONLY.**

**You MAY NOT deploy or use this software without explicit written permission from the copyright holder.**

See the [LICENSE](LICENSE) file for complete terms and conditions.

---

## Features

- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- 💰 **Dual Currency System** - Agon and Game Chips
- 🔄 **Currency Swap** - Exchange currencies at 1:1 ratio
- 💸 **Peer-to-Peer Payments** - Send payments to other users
- 📊 **Transaction History** - Track all your transactions
- 👥 **User Directory** - Browse and search all registered users
- 🏪 **Auction House** - Buy and sell Minecraft items with secure escrow system
- 👑 **Admin Panel** - Comprehensive user management, analytics, and auction monitoring
- 🎟️ **Invite System** - One-time use invite codes for controlled user registration
- 🎨 **Modern UI** - Professional, minimalistic design inspired by Phantom wallet

### Auction Fees

- A 5% commission fee is applied to completed auctions. Upon buyer confirmation, the fee is automatically deducted from the final price and transferred to an admin account; the remaining 95% is released to the seller. Both net payout and commission are recorded as separate transactions for transparency.

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js
- Express
- PostgreSQL (Replit-compatible, Neon serverless)
- JWT Authentication
- bcrypt

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (automatically provisioned on Replit)

### Installation

1. **Clone the repository**
   ```bash
   cd Agon
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=3001
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   ```
   
   **Note**: On Replit, `DATABASE_URL` is automatically set when you provision a PostgreSQL database.

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 3001) and frontend client (port 3000).

   Alternatively, you can start them separately:
   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

5. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## Deployment

### Replit Deployment (Recommended)

This application is fully optimized for deployment on Replit with PostgreSQL support.

**See [REPLIT_DEPLOYMENT.md](REPLIT_DEPLOYMENT.md) for complete deployment instructions.**

Key features:
- ✅ Automatic PostgreSQL provisioning (Neon serverless)
- ✅ Pre-configured connection pooling for serverless architecture
- ✅ Automatic schema initialization
- ✅ Built-in retry logic for cold starts
- ✅ SSL-secured database connections
- ✅ Graceful shutdown handling

### Other Deployment Options

For deployment guides to other platforms, see:
- [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) - General deployment guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed deployment options

## Project Structure

```
Agon/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Main application pages
│   │   ├── services/     # API service layer
│   │   ├── context/      # React context (Auth)
│   │   ├── utils/        # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                # Express backend
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Authentication middleware
│   │   └── server.js     # Main server file
│   ├── database.db       # SQLite database (auto-generated)
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create a new user account (requires invite code)
- `POST /api/auth/login` - Login to an existing account
- `GET /api/auth/profile` - Get current user profile (protected)

### Wallet
- `GET /api/wallet` - Get wallet balances (protected)
- `POST /api/wallet/swap` - Swap between currencies (protected)

### Payments
- `POST /api/payment/send` - Send payment to another user (protected)
- `GET /api/payment/transactions` - Get transaction history (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/search` - Search users by username (protected)

### Admin (Admin Only)
- `GET /api/admin/users` - Get all users with detailed stats
- `POST /api/admin/users/:id/toggle-disabled` - Enable/disable user account
- `POST /api/admin/users/:id/toggle-admin` - Promote/demote admin status
- `GET /api/admin/metrics` - Get system-wide metrics, analytics, and auction stats
- `GET /api/admin/activity` - Get activity logs
- `GET /api/admin/invite-codes` - Get all invite codes
- `POST /api/admin/invite-codes` - Create custom invite code
- `POST /api/admin/invite-codes/generate` - Generate random invite code
- `DELETE /api/admin/invite-codes/:id` - Delete unused invite code

### Auction House
- `GET /api/auctions` - Get all auctions (with filters for status: active/ended/completed)
- `GET /api/auctions/:id` - Get detailed auction information with bid history
- `POST /api/auctions` - Create a new auction listing
- `POST /api/auctions/:id/bid` - Place a bid on an auction (with automatic escrow)
- `POST /api/auctions/:id/confirm-delivery` - Confirm item delivery and release payment
- `GET /api/auctions/my-auctions` - Get your auction listings
- `GET /api/auctions/my-bids` - Get auctions you've bid on
- `DELETE /api/auctions/:id` - Cancel an auction (only if no bids)

## Usage

### Creating an Account

1. Navigate to the signup page
2. Enter your Minecraft username and a valid invite code
3. Create a password
4. You'll receive 100 Agon and 100 Game Chips as a welcome bonus

### Sending Payments

1. Go to the "Send" page
2. Select a recipient from the dropdown
3. Choose the currency (Agon or Game Chips)
4. Enter the amount and an optional description
5. Click "Send Payment"

### Swapping Currency

1. Go to the "Swap" page
2. Select the currency you want to swap from
3. Select the currency you want to receive
4. Enter the amount
5. Click "Swap Currency"

Currency swaps occur at a 1:1 ratio.

### Admin Panel (Admin Only)

1. Access the admin panel via `/admin/login`
2. View system metrics, user statistics, and transaction analytics
3. Manage users (enable/disable, promote to admin)
4. Create and manage invite codes
5. Monitor all user activity through detailed logs

### Viewing Users

1. Go to the "Users" page
2. Browse all registered users
3. Use the search bar to find specific users
4. Click "Send Payment" next to any user to quickly send them funds

### Using the Auction House

**Creating an Auction:**
1. Navigate to the Auction House
2. Click "Create Auction"
3. Enter item details (name, description, rarity, durability)
4. Set a starting price in Agon
5. Choose auction duration (in days)
6. Submit the auction

**Bidding on Items:**
1. Browse active auctions
2. Click on an item to view details
3. Enter your bid amount (must be higher than current bid)
4. Your Agon will be held in secure escrow
5. If outbid, your funds are automatically refunded

**Completing a Sale:**
1. When the auction ends, the highest bidder wins
2. Deliver the item to the winner in-game
3. Winner confirms receipt by clicking "Confirm Delivery"
4. Escrowed funds are released to the seller

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique Minecraft username
- `password` - Hashed password
- `created_at` - Account creation timestamp

### Wallets Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `agon` - Agon balance
- `stoneworks_dollar` - Game Chips balance
- `agon_escrow` - Agon held in escrow for active bids

### Transactions Table
- `id` - Primary key
- `from_user_id` - Sender user ID
- `to_user_id` - Recipient user ID (null for swaps)
- `transaction_type` - Type: 'payment' or 'swap'
- `currency` - Currency used
- `amount` - Transaction amount
- `description` - Optional description
- `created_at` - Transaction timestamp

### Activity Logs Table
- `id` - Primary key
- `user_id` - User who performed the action
- `action` - Action type
- `metadata` - JSON metadata about the action
- `created_at` - Action timestamp

### Invite Codes Table
- `id` - Primary key
- `code` - Unique invite code
- `created_by` - Admin user who created it
- `used_by` - User who used it (null if unused)
- `is_used` - Boolean flag
- `created_at` - Creation timestamp
- `used_at` - Usage timestamp

### Auctions Table
- `id` - Primary key
- `seller_id` - Foreign key to users table
- `item_name` - Name of the item being sold
- `item_description` - Detailed description
- `rarity` - Item rarity tier
- `durability` - Item durability percentage
- `starting_price` - Initial bid price in Agon
- `current_bid` - Current highest bid
- `highest_bidder_id` - Foreign key to users table
- `end_date` - Auction end timestamp
- `status` - Auction status (active/ended/completed/cancelled)
- `created_at` - Creation timestamp
- `completed_at` - Completion timestamp

### Bids Table
- `id` - Primary key
- `auction_id` - Foreign key to auctions table
- `bidder_id` - Foreign key to users table
- `amount` - Bid amount in Agon
- `is_active` - Whether this bid is still active
- `created_at` - Bid timestamp

## Future Enhancements

Agon is designed with modularity in mind. Planned future features include:

- 📈 **Stock Market** - Trade virtual stocks with Agon
- 💵 **Bonds** - Purchase and trade bonds
- 🏦 **Loans** - Borrow and lend between users
- 📱 **Mobile App** - Native mobile application
- 🔗 **Minecraft Integration** - Direct integration with Minecraft server
- 🔔 **Notifications** - Real-time transaction notifications
- 👥 **User Profiles** - Enhanced user profiles with avatars
- 🎁 **Gift Cards** - Create and redeem gift cards
- 🔒 **Two-Factor Authentication** - Enhanced security

## Development

### Building for Production

```bash
npm run build
```

This will create optimized production builds in the `client/dist` directory.

### Running in Production

```bash
npm start
```

This will start the production server on port 3001.

## Security Notes

⚠️ **Important**: Before deploying to production:

1. Change the `JWT_SECRET` in your `.env` file to a strong, random string
2. Use environment variables for all sensitive configuration
3. Enable HTTPS/SSL
4. Implement rate limiting
5. Add input sanitization
6. Set up proper CORS policies
7. Use a production-grade database (PostgreSQL, MySQL)
8. Implement proper logging and monitoring

## License

**All Rights Reserved** - Copyright (c) 2025 Kevin Lin

This source code is made publicly available for **viewing and learning purposes ONLY**.

**Deployment, use, or modification for any purpose other than learning is strictly prohibited without explicit written permission from the copyright holder.**

See the [LICENSE](LICENSE) file for complete terms and conditions.

## Permission Requests

To request permission to deploy or use this software, please open an issue in the repository with your use case. Permission must be granted explicitly in writing by the copyright holder.

## Support

For issues, questions, or feature requests, please create an issue in the repository.

---

Built with ❤️ for the Stoneworks Minecraft Server

