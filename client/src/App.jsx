import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Swap from './pages/Swap';
import UsersAndPayments from './pages/UsersAndPayments';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Games from './pages/Games';
import CoinFlip from './pages/CoinFlip';
import Blackjack from './pages/Blackjack';
import Plinko from './pages/Plinko';
import Trading from './pages/Trading';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/swap"
            element={
              <ProtectedRoute>
                <Swap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersAndPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/send"
            element={<Navigate to="/users" replace />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <Games />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/coinflip"
            element={
              <ProtectedRoute>
                <CoinFlip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/blackjack"
            element={
              <ProtectedRoute>
                <Blackjack />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/plinko"
            element={
              <ProtectedRoute>
                <Plinko />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crypto"
            element={
              <ProtectedRoute>
                <Trading />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trading"
            element={
              <ProtectedRoute>
                <Trading />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

