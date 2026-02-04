import React, { useState } from 'react';
import { useLocalStorage } from '../contexts/LocalStorageContext';

const DataCenter = () => {
  const { exportData, importData } = useLocalStorage();
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const handleExport = async () => {
    try {
      setIsBusy(true);
      setErrorMessage('');
      const payload = await exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `solltema-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();

      URL.revokeObjectURL(url);
      setStatusMessage('Yedek dosyası indirildi.');
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Dışa aktarım başarısız oldu.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsBusy(true);
      setStatusMessage('');
      setErrorMessage('');

      const text = await file.text();
      const payload = JSON.parse(text);
      await importData(payload);
      setStatusMessage('İçe aktarma tamamlandı.');
    } catch (error) {
      console.error('Import error:', error);
      setErrorMessage('İçe aktarma sırasında hata oluştu.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="page-grid">
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2>Veri Merkezi</h2>
        <p className="muted">
          Profilini, puanlarını ve içerik geçmişini dışa aktarabilir veya geri yükleyebilirsin.
        </p>
      </div>

      <div className="panel">
        <h3>Yedek Al</h3>
        <p className="muted">
          Tüm içerik verilerini ve tercihlerini JSON dosyası olarak indir.
        </p>
        <button onClick={handleExport} disabled={isBusy}>
          {isBusy ? 'Hazırlanıyor...' : 'Dışa Aktar'}
        </button>
      </div>

      <div className="panel">
        <h3>Yedekten Geri Yükle</h3>
        <p className="muted">
          Daha önce aldığın JSON dosyasını yükleyerek verilerini geri getir.
        </p>
        <label className="file-input">
          JSON Dosyası Seç
          <input type="file" accept="application/json" onChange={handleImport} disabled={isBusy} />
        </label>
      </div>

      {(statusMessage || errorMessage) && (
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          {statusMessage && <p className="success-message">{statusMessage}</p>}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default DataCenter;
