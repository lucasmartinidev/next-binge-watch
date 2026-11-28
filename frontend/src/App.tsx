import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { I18nProvider } from './i18n/I18nContext';
import { GenreThemeProvider } from './styles/GenreThemeContext';
import { HomeView } from './views/HomeView';
import { ListDetailView } from './views/ListDetailView';
import { NotFoundView } from './views/NotFoundView';
import { PersonProfileView } from './views/PersonProfileView';
import { SeriesProfileView } from './views/SeriesProfileView';
import { WatchlistView } from './views/WatchlistView';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/series/:id" element={<SeriesProfileView />} />
      <Route path="/people/:id" element={<PersonProfileView />} />
      <Route path="/watchlist" element={<WatchlistView />} />
      <Route path="/watchlist/:listId" element={<ListDetailView />} />
      <Route path="*" element={<NotFoundView />} />
    </Routes>
  );
}

function App() {
  return (
    <I18nProvider>
      <GenreThemeProvider>
        <BrowserRouter>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </BrowserRouter>
      </GenreThemeProvider>
    </I18nProvider>
  );
}

export default App;
