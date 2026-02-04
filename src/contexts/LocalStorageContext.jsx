import React, { createContext, useContext, useEffect, useState } from 'react';

const LocalStorageContext = createContext({});

export const useLocalStorage = () => {
  const context = useContext(LocalStorageContext);
  if (!context) {
    throw new Error('useLocalStorage must be used within LocalStorageProvider');
  }
  return context;
};

const DEFAULT_USER = {
  id: 'local-user',
  displayName: 'Kullanıcı',
};

const DB_NAME = 'MovieAppDB';
const RATINGS_STORE = 'ratings';
const CONTENTS_STORE = 'contents';

let db = null;

const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(RATINGS_STORE)) {
        database.createObjectStore(RATINGS_STORE, { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains(CONTENTS_STORE)) {
        database.createObjectStore(CONTENTS_STORE, { keyPath: 'imdbId' });
      }
    };
  });
};

const saveRating = async (contentId, rating, review) => {
  const database = await initDB();
  const tx = database.transaction([RATINGS_STORE], 'readwrite');
  const store = tx.objectStore(RATINGS_STORE);

  const existing = await new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.find(r => r.contentId === contentId));
    };
  });

  const ratingData = {
    contentId,
    rating,
    review,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(existing && { id: existing.id }),
  };

  return new Promise((resolve, reject) => {
    const request = existing ? store.put(ratingData) : store.add(ratingData);
    request.onsuccess = () => resolve(ratingData);
    request.onerror = () => reject(request.error);
  });
};

const getRatings = async () => {
  const database = await initDB();
  const tx = database.transaction([RATINGS_STORE], 'readonly');
  const store = tx.objectStore(RATINGS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveContent = async (content) => {
  const database = await initDB();
  const tx = database.transaction([CONTENTS_STORE], 'readwrite');
  const store = tx.objectStore(CONTENTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.put(content);
    request.onsuccess = () => resolve(content);
    request.onerror = () => reject(request.error);
  });
};

const getContent = async (imdbId) => {
  const database = await initDB();
  const tx = database.transaction([CONTENTS_STORE], 'readonly');
  const store = tx.objectStore(CONTENTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(imdbId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllContents = async () => {
  const database = await initDB();
  const tx = database.transaction([CONTENTS_STORE], 'readonly');
  const store = tx.objectStore(CONTENTS_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const LocalStorageProvider = ({ children }) => {
  const [user, setUser] = useState(DEFAULT_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();

        const savedUser = localStorage.getItem('movieAppUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const updateUserDisplayName = (displayName) => {
    const updatedUser = { ...user, displayName };
    setUser(updatedUser);
    localStorage.setItem('movieAppUser', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    updateUserDisplayName,
    saveRating,
    getRatings,
    saveContent,
    getContent,
    getAllContents,
  };

  return (
    <LocalStorageContext.Provider value={value}>
      {children}
    </LocalStorageContext.Provider>
  );
};
