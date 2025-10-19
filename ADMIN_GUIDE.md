# Pigeon Banking Admin Panel Guide

## Overview

The Pigeon Banking Admin Panel provides comprehensive system monitoring and user management capabilities. The panel features a beautiful dark-themed UI with gradient accents and smooth animations.

## Access

### Admin Login

There are two ways to access the admin panel:

1. **Dedicated Admin Login**: Visit `/admin/login` for a specialized admin login page
2. **Regular Login**: Log in through the regular login page - if your account has admin privileges, you'll see an "Admin" link in the navigation bar

### Creating an Admin User

To grant admin privileges to a user:

```bash
# Using SQLite CLI
cd server
sqlite3 database.db "UPDATE users SET is_admin = 1 WHERE username = 'YourUsername';"
```

## Features

### 1. Dashboard Analytics

The admin dashboard displays comprehensive system metrics:

#### Key Metrics Cards
- **Total Users**: Shows total users, disabled count, and admin count
- **Total Transactions**: Displays total transactions, broken down by payments and swaps
- **Payment Volume**: Total payment volume with average transaction amount
- **Currency Supply**: Total Stoneworks Dollars ($) and Game Chips in circulation

#### Charts & Visualizations
- **Payment Volume (14 days)**: Line chart showing daily transaction volume trends
- **User Growth (14 days)**: Line chart tracking new user signups per day
- **Activity (Last 24h)**: Bar chart of most common user actions in the past 24 hours
- **Top Users**: List of most active users by transaction count with balances

#### Recent Activity
- **Recent Transactions**: Table showing latest system transactions with type, sender, receiver, amount, and timestamp
- **Activity Log**: Real-time feed of user actions including logins, payments, swaps, and admin actions

### 2. User Management

The User Management table provides full control over user accounts:

#### User Information Displayed
- Avatar with first letter of username
- Username
- Stoneworks Dollars ($) balance
- Game Chips balance
- Transaction count
- Role (Admin/User)
- Status (Active/Disabled)

#### Admin Actions
- **Disable/Enable User**: Prevent or restore user access to the system
  - Disabled users cannot log in or perform any actions
  - Existing sessions are terminated on next API call
- **Make Admin/Revoke Admin**: Grant or remove admin privileges
  - Admin users can access the admin panel
  - Changes take effect on next login

### 3. Activity Tracking

All key user actions are automatically logged:

- **User Actions Tracked**:
  - `swap`: Currency swaps between Stoneworks Dollars and Game Chips
  - `payment_sent`: Outgoing payments
  - `payment_received`: Incoming payments
  - `admin_toggle_disabled`: Admin enabling/disabling users
  - `admin_toggle_admin`: Admin granting/revoking admin rights

- **Log Information**:
  - User who performed the action
  - Action type
  - Timestamp
  - Metadata (JSON-encoded details)

### 4. Security Features

- **Admin-Only Access**: All admin routes require authentication and admin privileges
- **Real-time Permission Checks**: User status (disabled/admin) is verified on every API request
- **Session Management**: Disabled users are immediately blocked from making requests
- **Audit Trail**: All admin actions are logged for accountability

## API Endpoints

### Admin Routes (`/api/admin/*`)

All routes require authentication and admin privileges.

#### Get All Users with Stats
```
GET /api/admin/users
```
Returns all users with wallet balances and transaction counts.

#### Toggle User Disabled Status
```
POST /api/admin/users/:id/toggle-disabled
```
Enable or disable a user account.

#### Toggle User Admin Status
```
POST /api/admin/users/:id/toggle-admin
```
Grant or revoke admin privileges.

#### Get System Metrics
```
GET /api/admin/metrics
```
Returns comprehensive system analytics:
- Total counts (users, transactions, etc.)
- Activity breakdown (last 24 hours)
- Volume by day (last 14 days)
- User growth (last 14 days)
- Top users by activity
- Recent transactions

#### Get Activity Logs
```
GET /api/admin/activity?limit=50&offset=0
```
Returns paginated activity logs with user information.

## Database Schema

### New Tables

#### `activity_logs`
```sql
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Modified Tables

#### `users` (new columns)
- `is_admin INTEGER DEFAULT 0`: Admin flag (0 = regular user, 1 = admin)
- `disabled INTEGER DEFAULT 0`: Account status (0 = active, 1 = disabled)

## UI/UX Design

### Color Palette
The admin panel uses the Phantom dark theme:

- **Background**: Dark gradients (#1A1B23 to #0F1015)
- **Cards**: Semi-transparent dark backgrounds with backdrop blur
- **Primary Accent**: Purple gradient (#AB9FF2 to #78F5E6)
- **Success**: Green (#4ADE80)
- **Error**: Red (#EF4444)
- **Text**: White primary (#FFFFFF), gray secondary/tertiary

### Components
- **Gradient Cards**: Semi-transparent cards with glow effects on hover
- **Interactive Tables**: Smooth hover states and transitions
- **Line Charts**: SVG-based charts with gradient fills and animations
- **Bar Charts**: Gradient-filled progress bars with smooth animations
- **Status Badges**: Color-coded pills for roles and statuses

### Animations
- Fade in: Page load animation
- Slide up: Card entrance animation
- Scale in: Button and form animations
- Hover effects: Scale and glow transforms
- Pulse glow: Breathing glow effect on special elements

## Best Practices

### For Administrators

1. **Regular Monitoring**: Check the dashboard daily for unusual activity
2. **User Management**: Disable compromised accounts immediately
3. **Activity Review**: Review the activity log for suspicious patterns
4. **Admin Privileges**: Only grant admin rights to trusted users
5. **Balance Monitoring**: Watch for unusual balance changes or transaction patterns

### Security Recommendations

1. **Strong Passwords**: Require admin accounts to use strong, unique passwords
2. **Limited Admin Access**: Keep the number of admin accounts to a minimum
3. **Regular Audits**: Review admin actions in the activity log regularly
4. **Immediate Response**: Act quickly on suspicious activity
5. **Database Backups**: Regularly backup the database

## Troubleshooting

### Admin Link Not Showing
- Ensure you've set `is_admin = 1` in the database for your user
- Log out and log back in to refresh your token
- Check browser console for any errors

### Permission Denied
- Verify your account has `is_admin = 1` in the database
- Ensure you're logged in with the correct account
- Check that your account is not disabled

### Charts Not Displaying
- Charts require transaction history to display properly
- With limited data, charts may appear empty or show minimal information
- The system needs at least a few transactions for meaningful visualizations

### Activity Not Logging
- Ensure the `activity_logs` table exists in the database
- Restart the server if you recently applied database migrations
- Check server logs for any errors

## Future Enhancements

Potential features for future versions:

- **Advanced Analytics**: More detailed charts and trend analysis
- **Export Functionality**: CSV/JSON export of users, transactions, and activity
- **Email Notifications**: Alerts for suspicious activity
- **Role-Based Access**: Multiple admin levels (viewer, moderator, superadmin)
- **Bulk Actions**: Select and manage multiple users at once
- **Search & Filters**: Advanced filtering for users and transactions
- **Custom Alerts**: Set thresholds for automatic notifications
- **User Notes**: Add administrative notes to user accounts

## Support

For issues or questions about the admin panel:

1. Check this guide first
2. Review the activity log for clues
3. Check server logs for errors
4. Verify database schema is up to date
5. Ensure all dependencies are properly installed

---

**Note**: The admin panel is a powerful tool. Use admin privileges responsibly and always maintain an audit trail of administrative actions.

