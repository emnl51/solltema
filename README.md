# Solltema - Film ve Dizi Hibrit Öneri Uygulaması

Modern, AI destekli bir film ve dizi öneri platformu. Kullanıcıların beğenilerine göre kişiselleştirilmiş öneriler sunar, izleme geçmişini takip eder ve profil analizi yapar.

## Özellikler

### 🎬 OMDb API Entegrasyonu
- Gerçek zamanlı film ve dizi araması
- Detaylı içerik bilgileri (afişler, özet, oyuncular, yönetmen, IMDb puanı)
- Film ve dizi türleri filtreleme

### 🤖 AI Destekli Öneriler
- Kullanıcı beğenilerine dayalı hibrit öneri algoritması
- Favori türlere göre ağırlıklandırılmış skorlama
- Oyuncu ve yönetmen tercihlerine göre özelleştirme
- İzleme geçmişine dayalı kişiselleştirme

### 📊 Profil Analizi
- **Tür Analizi**: Beğenilen içeriklerin tür dağılımı ve yüzdelik gösterimi
- **Favori Oyuncular**: En çok karşılaşılan ve beğenilen oyuncular listesi
- **Favori Yönetmenler**: En çok izlenen yönetmenlerin analizi
- Ortalama puan ve izleme istatistikleri

### 💫 Kullanıcı Deneyimi
- Modern, karanlık tema arayüz
- Responsive tasarım (mobil uyumlu)
- Kolay gezinti ve hızlı arama
- Yıldız bazlı puanlama sistemi (1-10)
- Film yorumlama özelliği

### 🔐 Güvenlik
- Supabase Auth ile güvenli kullanıcı yönetimi
- Row Level Security (RLS) politikaları
- Güvenli API proxy (Edge Functions)

## Teknoloji Stack

### Frontend
- **React 18** - Modern UI kütüphanesi
- **Vite** - Hızlı geliştirme ve build aracı
- Modern CSS - Gradient ve glassmorphism efektleri

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL veritabanı
  - Authentication
  - Row Level Security
  - Edge Functions
- **OMDb API** - Film ve dizi veritabanı

### Veritabanı Şeması
- `profiles` - Kullanıcı profilleri
- `contents` - Film ve dizi verileri
- `ratings` - Kullanıcı puanları ve yorumları
- `watch_history` - İzleme geçmişi
- `user_preferences` - Tercih analizi sonuçları

## Kurulum ve Çalıştırma

1. Bağımlılıkları yükle:
```bash
npm install
```

2. Geliştirme sunucusunu başlat:
```bash
npm run dev
```

3. Production build:
```bash
npm run build
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## Sayfa Yapısı

### Ana Ekran
- Kullanıcı istatistikleri özeti
- Son puanlanan içerikler
- Hızlı erişim butonları

### Keşfet
- OMDb API ile film/dizi arama
- Detaylı içerik görüntüleme
- 1-10 arası yıldız puanlama
- Yorum ekleme

### AI Önerileri
- Kişiselleştirilmiş öneri listesi
- Hibrit skorlama algoritması
- Tercih tabanlı filtreleme

### Profil
- Kullanıcı bilgileri düzenleme
- Tür dağılımı grafiği
- En beğenilen oyuncular listesi
- En beğenilen yönetmenler listesi
- Tüm puanlanan içerikler

## Hibrit Öneri Algoritması

Uygulama, çok katmanlı bir skorlama sistemi kullanır:

1. **İçerik Bazlı**: IMDb puanı temel skor olarak kullanılır
2. **Tür Eşleştirme**: Kullanıcının favori türlerine +0.5 ağırlık
3. **Yönetmen Eşleştirme**: Beğenilen yönetmenlere +0.3 ağırlık
4. **Oyuncu Eşleştirme**: Beğenilen oyunculara +0.2 ağırlık
5. **Sıralama**: Toplam AI skoruna göre azalan sıralama

## Güvenlik

Her tablo için RLS politikaları aktif:
- Kullanıcılar sadece kendi verilerini görebilir
- İçerik veritabanı herkese açık okuma
- Puanlar ve izleme geçmişi kullanıcıya özel
- Tercihler otomatik olarak güncellenir
