import { createBrowserRouter } from 'react-router';
import App from './App';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <div>Dashboard</div> },
      { path: 'collections', element: <div>Collections</div> },
      { path: 'bookmarks', element: <div>Bookmarks</div> },
      { path: 'all', element: <div>All</div> },
    ],
  },
]);

export default router;
