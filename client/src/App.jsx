import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Swap from './pages/Swap';
import Send from './pages/Send';
import Users from './pages/Users';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Auctions from './pages/Auctions';
import CreateAuction from './pages/CreateAuction';
import AuctionDetail from './pages/AuctionDetail';
import Games from './pages/Games';
import CoinFlip from './pages/CoinFlip';
import Blackjack from './pages/Blackjack';
import Plinko from './pages/Plinko';
import PredictionMarkets from './pages/PredictionMarkets';
import PredictionMarketDetail from './pages/PredictionMarketDetail';
import PredictionPortfolio from './pages/PredictionPortfolio';
import PredictionAdmin from './pages/PredictionAdmin';

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
            path="/send"
            element={
              <ProtectedRoute>
                <Send />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
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
            path="/auctions"
            element={
              <ProtectedRoute>
                <Auctions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions/create"
            element={
              <ProtectedRoute>
                <CreateAuction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auctions/:id"
            element={
              <ProtectedRoute>
                <AuctionDetail />
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
            path="/prediction-markets"
            element={
              <ProtectedRoute>
                <PredictionMarkets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prediction-markets/:id"
            element={
              <ProtectedRoute>
                <PredictionMarketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prediction-portfolio"
            element={
              <ProtectedRoute>
                <PredictionPortfolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prediction-admin"
            element={
              <ProtectedRoute>
                <PredictionAdmin />
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

