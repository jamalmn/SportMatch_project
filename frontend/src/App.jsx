import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/auth"       element={<AuthPage defaultTab="login" />} />
          <Route path="/login"      element={<AuthPage defaultTab="login" />} />
          <Route path="/register"   element={<AuthPage defaultTab="register" />} />
          <Route path="/dashboard"         element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/events"            element={<PrivateRoute><EventsPage /></PrivateRoute>} />
          <Route path="/events/create"     element={<PrivateRoute><CreateEventPage /></PrivateRoute>} />
          <Route path="/events/:id"        element={<PrivateRoute><EventDetailPage /></PrivateRoute>} />
          <Route path="/events/:id/edit"   element={<PrivateRoute><EditEventPage /></PrivateRoute>} />
          <Route path="/profile"           element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/profile/:id"       element={<PrivateRoute><PublicProfilePage /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
