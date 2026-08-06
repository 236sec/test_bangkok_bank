import { createBrowserRouter } from 'react-router';
import App from './App';
import Auth0Provider from './auth/Auth0Provider';
import { ErrorProvider, ErrorSnackbar } from './error';
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
      { index: true, element: <div>Dashboard</div> },
      { path: 'collections', element: <div>Collections</div> },
      { path: 'bookmarks', element: <div>Bookmarks</div> },
      { path: 'all', element: <div>All</div> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);

export default router;
