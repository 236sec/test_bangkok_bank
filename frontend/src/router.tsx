import { createBrowserRouter } from 'react-router';
import App from './App';
import Auth0Provider from './auth/Auth0Provider';
import AuthGuard from './auth/AuthGuard';
import { ErrorProvider, ErrorSnackbar } from './error';
import CollectionDetailPage from './pages/CollectionDetailPage';
import CollectionsPage from './pages/CollectionsPage';
import BookmarksPage from './pages/BookmarksPage';
import BookmarkDetailPage from './pages/BookmarkDetailPage';
import ProfilePage from './pages/ProfilePage';

const router = createBrowserRouter([
  {
    path: '/',
    // Auth0Provider must live inside the Router so its `onRedirectCallback`
    // can use `useNavigate` (react-router throws outside Router context).
    element: (
      <Auth0Provider>
        <ErrorProvider>
          <App />
          <ErrorSnackbar />
        </ErrorProvider>
      </Auth0Provider>
    ),
    children: [
      {
        index: true,
        element: (
          <AuthGuard>
            <div>Dashboard</div>
          </AuthGuard>
        ),
      },
      {
        path: 'collections',
        element: (
          <AuthGuard>
            <CollectionsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'collections/:id',
        element: (
          <AuthGuard>
            <CollectionDetailPage />
          </AuthGuard>
        ),
      },
      {
        path: 'bookmarks',
        element: (
          <AuthGuard>
            <BookmarksPage />
          </AuthGuard>
        ),
      },
      {
        path: 'bookmarks/:id',
        element: (
          <AuthGuard>
            <BookmarkDetailPage />
          </AuthGuard>
        ),
      },
      {
        path: 'all',
        element: (
          <AuthGuard>
            <div>All</div>
          </AuthGuard>
        ),
      },
      { path: 'profile', element: <ProfilePage /> },
      // Auth0 redirects back to /callback after login — the SDK processes
      // the code exchange automatically when the component tree mounts.
      { path: 'callback', element: null },
    ],
  },
]);

export default router;
