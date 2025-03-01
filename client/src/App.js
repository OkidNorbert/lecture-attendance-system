import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <Router>
        {/* Your existing routes and components */}
      </Router>
    </NotificationProvider>
  );
} 