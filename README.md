# Solltema - Öğrenen Öneri Motoru

Bu demo, kullanıcıların puanlamaları üzerinden beğeni profili çıkaran ve buna göre dizi/film önerileri sunan basit bir web uygulamasıdır. İçerikler puanlandıkça etiket ağırlıkları güncellenir ve öneri listesi yeniden hesaplanır.

## Özellikler
- Kişiye özel beğeni profili (etiket ağırlıkları)
- Puanlamaya göre otomatik güncellenen öneriler
- Basit içerik kataloğu ve öneri skoru görünümü

## Kurulum

```bash
npm install
npm start
```

Uygulama çalıştığında `http://localhost:3000` adresinden erişebilirsiniz.

## API
- `GET /api/content` içerik kataloğu
- `GET /api/profile` beğeni profili
- `POST /api/ratings` içerik puanlama (`{ contentId, rating }`)
- `GET /api/recommendations` kişiye özel öneriler
