import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { GamesPage } from './pages/GamesPage';
import { WalletPage } from './pages/WalletPage';
import { DepositPage } from './pages/DepositPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReferralPage } from './pages/ReferralPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/games" element={<GamesPage />} />
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/deposit" element={<DepositPage />} />
      <Route path="/withdraw" element={<WithdrawPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/referral" element={<ReferralPage />} />
    </Routes>
  );
}
