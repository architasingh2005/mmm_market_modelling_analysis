import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

// BrowserRouter
// Provides client-side routing context for the React application.
function App() {
  return (
    <BrowserRouter>
      {/* Global Toast Notifications Configured */}
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
