import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './components/auth/AdminRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './hooks/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import { GenreThemeProvider } from './styles/GenreThemeContext';
import { AdminUsersView } from './views/AdminUsersView';
import { ChangePasswordView } from './views/ChangePasswordView';
import { HomeView } from './views/HomeView';
import { ListDetailView } from './views/ListDetailView';
import { LoginView } from './views/LoginView';
import { NotFoundView } from './views/NotFoundView';
import { PersonProfileView } from './views/PersonProfileView';
import { SeriesProfileView } from './views/SeriesProfileView';
import { WatchlistView } from './views/WatchlistView';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/series/:id" element={<SeriesProfileView />} />
      <Route path="/people/:id" element={<PersonProfileView />} />
      <Route path="/account/password" element={<ProtectedRoute><ChangePasswordView /></ProtectedRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsersView /></AdminRoute>} />
      <Route path="/watchlist" element={<ProtectedRoute><WatchlistView /></ProtectedRoute>} />
      <Route path="/watchlist/:listId" element={<ProtectedRoute><ListDetailView /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundView />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <GenreThemeProvider>
          <BrowserRouter>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
          </BrowserRouter>
        </GenreThemeProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;
