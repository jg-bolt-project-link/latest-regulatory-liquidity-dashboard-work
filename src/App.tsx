import { useEffect } from 'react';
import { MainApp } from './components/MainApp';
import { AuthProvider } from './contexts/AuthContext';
import { validateDashboardUI } from './utils/uiValidator';

function App() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        validateDashboardUI().then(results => {
          const failures = results.filter(r => !r.passed);
          if (failures.length > 0) {
            console.warn('⚠️  UI Validation Issues Found:', failures);
          } else {
            console.log('✅ All UI validations passed');
          }
        });
      }, 2000);
    }
  }, []);

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
