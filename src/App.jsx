import React, { useMemo, useState } from 'react';
import { LocalStorageProvider, useLocalStorage } from './contexts/LocalStorageContext';
import HomePage from './pages/HomePage';
import AIRecommendations from './pages/AIRecommendations';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import DataCenter from './pages/DataCenter';
import './App.css';

const AppContent = () => {
  const { loading, user } = useLocalStorage();
  const [activePage, setActivePage] = useState('Gösterge');

  const pages = useMemo(
    () => [
      { key: 'Gösterge', label: 'Gösterge', component: <HomePage /> },
      { key: 'Keşif', label: 'Keşif', component: <SearchPage /> },
      { key: 'Öneriler', label: 'Öneriler', component: <AIRecommendations /> },
      { key: 'Kütüphane', label: 'Kütüphane', component: <ProfilePage /> },
      { key: 'Veri Merkezi', label: 'Veri Merkezi', component: <DataCenter /> },
    ],
    []
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  const active = pages.find((page) => page.key === activePage) || pages[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Solltema</p>
          <h1>Film & Dizi</h1>
          <p className="muted">Kişisel keşif merkezine hoş geldin.</p>
        </div>
        <nav className="nav-list">
          {pages.map((page) => (
            <button
              key={page.key}
              className={page.key === activePage ? 'nav-button active' : 'nav-button'}
              onClick={() => setActivePage(page.key)}
            >
              {page.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="muted">Aktif Profil</span>
          <strong>{user?.displayName || 'Kullanıcı'}</strong>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Yeni Deneyim</p>
            <h2>{active.label}</h2>
          </div>
          <div className="topbar-actions">
            <button className="secondary">Bildirimler</button>
            <button>Yeni Öneri</button>
          </div>
        </header>

        <main className="page">{active.component}</main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <LocalStorageProvider>
      <AppContent />
    </LocalStorageProvider>
  );
};

export default App;
