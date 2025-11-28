
# MamaCare Funds

A comprehensive mobile micro-savings platform designed to help users save for healthcare expenses through goal-oriented savings, expense tracking, and financial management.

## 🚀 Features

### User Features
- **User Authentication** - Secure login and registration
- **Wallet Management** - Deposit money and track balance
- **Savings Goals** - Create and manage health-related savings goals
- **Expense Tracking** - Log and categorize healthcare expenses
- **Dashboard** - Overview of savings progress and recent activity

### Admin Features
- **Admin Dashboard** - Platform overview with key metrics
- **User Management** - View and manage all users
- **Reports & Analytics** - Financial reports and transaction analytics
- **Real-time Statistics** - Monitor platform performance

## 🛠 Tech Stack

### Frontend
- **React Native** - Mobile app framework
- **React Native Paper** - UI component library
- **React Navigation** - Navigation handling
- **Axios** - HTTP client for API calls
- **AsyncStorage** - Local data storage

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication tokens
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📱 Screens

### User Screens
- **Login Screen** - User authentication
- **Register Screen** - New user registration
- **Dashboard** - Overview of user's financial status
- **Wallet** - Balance management and transactions
- **Goals** - Savings goals creation and tracking
- **Expenses** - Expense logging and categorization

### Admin Screens
- **Admin Dashboard** - Platform statistics and recent activity
- **User Management** - Complete user list with search functionality
- **Reports & Analytics** - Financial and user activity reports

## 🗄 Database Schema

### Key Tables
- `entitys` - Users and their profiles
- `wallets` - User wallet balances and savings
- `deposits` - Deposit transactions
- `expenses` - Expense records
- `savings_goals` - User savings goals
- `orgs` - Organization data

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- React Native development environment
- iOS Simulator or Android Emulator

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ogaed/care.git
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a PostgreSQL database
   - Update database configuration in `config/database.js`

4. **Environment Variables**
   Create a `.env` file:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/mamacare
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update API configuration**
   - Edit `src/services/api.js`
   - Update `API_BASE_URL` to match your backend server

4. **Start the application**
   ```bash
   npm start
   # or
   expo start
   ```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/deposit` - Make a deposit
- `GET /api/wallet/transactions` - Get transaction history

### Goals
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create new goal
- `POST /api/goals/:id/save` - Add savings to goal

### Expenses
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/summary` - Get expense summary

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/deposits` - Get all deposits
- `GET /api/admin/expenses` - Get all expenses
- `GET /api/admin/users/:id` - Get user details

## 👥 User Roles

### Regular User
- Create and manage personal savings goals
- Track healthcare expenses
- Make deposits to wallet
- View personal financial dashboard

### Admin User
- View platform-wide statistics
- Manage all users
- Access comprehensive reports
- Monitor all transactions

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention
- CORS configuration
- Rate limiting
- Helmet security headers

## 📊 Key Metrics Tracked

### User Metrics
- Total users
- Active users
- New registrations
- User engagement

### Financial Metrics
- Total deposits
- Total expenses
- Average deposit amount
- Net platform balance

### Goals Metrics
- Active savings goals
- Completed goals
- Total savings amount
- Goal success rate

## 🎯 Usage Examples

### Creating a Savings Goal
1. Navigate to Goals screen
2. Click "Create Goal"
3. Set goal name, target amount, and category
4. Start adding savings regularly

### Tracking Expenses
1. Go to Expenses screen
2. Click "Add Expense"
3. Enter amount, category, and description
4. Optionally link to a savings goal

### Admin Monitoring
1. Login as admin user
2. Access Admin Dashboard for overview
3. Use Users tab to manage users
4. Use Reports tab for analytics

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend server is running
   - Verify API_BASE_URL in frontend configuration
   - Ensure CORS is properly configured

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in .env file
   - Ensure database exists and is accessible

3. **Authentication Problems**
   - Clear app cache and restart
   - Check JWT token expiration
   - Verify user credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native community
- React Native Paper for UI components
- Express.js team
- PostgreSQL community

## 📞 Support

For support, please contact edithoga759@gmail.com the development team or create an issue in the repository.

---

**MamaCare Funds** - Empowering health through smart savings 💙