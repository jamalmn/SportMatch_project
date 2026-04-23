import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthSidebar from '../components/auth/AuthSidebar';
import AuthTabs from '../components/auth/AuthTabs';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function AuthPage({ defaultTab = 'login' }) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [visible, setVisible] = useState(true);
  const [pendingTab, setPendingTab] = useState(null);

  useEffect(() => {
    if (!visible && pendingTab) {
      const timer = setTimeout(() => {
        setActiveTab(pendingTab);
        setPendingTab(null);
        setVisible(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [visible, pendingTab]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSwitch = (tab) => {
    if (tab === activeTab) return;
    setVisible(false);
    setPendingTab(tab);
  };

  return (
    <div className="flex min-h-screen bg-sm-gray-50 lg:bg-white">
      <AuthSidebar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 lg:px-12 overflow-y-auto">
        {/* Logo solo visible en mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <span className="text-2xl">⚽</span>
          <span className="font-heading font-bold text-xl text-sm-dark">SportMatch</span>
        </div>

        <div className="w-full max-w-md">
          <AuthTabs activeTab={activeTab} onSwitch={handleSwitch} />

          <div
            className={`transition-all duration-200 ${
              visible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4'
            }`}
          >
            {activeTab === 'login' ? (
              <LoginForm onSwitch={handleSwitch} />
            ) : (
              <RegisterForm onSwitch={handleSwitch} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
