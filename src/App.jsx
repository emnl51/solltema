import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AIRecommendations from './pages/AIRecommendations';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import './App.css';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('Ana Ekran');

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Solltema Film ve Dizi Öneri Asistanı</p>
          <h1>Merhaba, hoş geldin!</h1>
          <p>
            Film ve dizileri keşfet, beğenilerini kaydet ve AI destekli kişisel önerilerini al.
          </p>
        </div>
        <nav className="nav">
          {['Ana Ekran', 'Keşfet', 'AI Önerileri', 'Profil'].map((page) => (
            <button
              key={page}
              className={page === activePage ? 'nav-button active' : 'nav-button'}
              onClick={() => setActivePage(page)}
            >
              {page}
            </button>
          ))}
        </nav>
      </header>

      <main className="page">
        {activePage === 'Ana Ekran' && <HomePage />}
        {activePage === 'Keşfet' && <SearchPage />}
        {activePage === 'AI Önerileri' && <AIRecommendations />}
        {activePage === 'Profil' && <ProfilePage />}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
