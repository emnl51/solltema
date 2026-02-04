/*
  # Film ve Dizi Öneri Uygulaması - Veritabanı Şeması

  1. Yeni Tablolar
    - `profiles`
      - Kullanıcı profil bilgileri
      - auth.users ile 1:1 ilişki
      - `id` (uuid, primary key)
      - `user_id` (uuid, auth.users referansı)
      - `display_name` (text)
      - `avatar_url` (text)
      - `bio` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contents`
      - Film ve dizi verileri (OMDb'den)
      - `id` (uuid, primary key)
      - `imdb_id` (text, unique)
      - `title` (text)
      - `year` (text)
      - `type` (text: movie, series, episode)
      - `genre` (text)
      - `director` (text)
      - `actors` (text)
      - `plot` (text)
      - `poster` (text)
      - `imdb_rating` (numeric)
      - `runtime` (text)
      - `language` (text)
      - `country` (text)
      - `awards` (text)
      - `metadata` (jsonb - tüm OMDb response)
      - `created_at` (timestamptz)
    
    - `ratings`
      - Kullanıcı beğenileri ve puanları
      - `id` (uuid, primary key)
      - `user_id` (uuid, profiles referansı)
      - `content_id` (uuid, contents referansı)
      - `rating` (numeric: 0-10)
      - `review` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `watch_history`
      - İzleme geçmişi
      - `id` (uuid, primary key)
      - `user_id` (uuid, profiles referansı)
      - `content_id` (uuid, contents referansı)
      - `watched_at` (timestamptz)
      - `watch_duration` (integer - dakika)
      - `completed` (boolean)
    
    - `user_preferences`
      - Kullanıcı tercih analizi sonuçları
      - `id` (uuid, primary key)
      - `user_id` (uuid, profiles referansı)
      - `favorite_genres` (jsonb - tür ve yüzde dağılımı)
      - `favorite_actors` (jsonb - oyuncu ve sayı)
      - `favorite_directors` (jsonb - yönetmen ve sayı)
      - `average_rating` (numeric)
      - `total_watched` (integer)
      - `updated_at` (timestamptz)

  2. Güvenlik
    - Tüm tablolar için RLS etkinleştirildi
    - Kullanıcılar sadece kendi verilerine erişebilir
    - Contents tablosu herkese açık okuma
*/

-- Profiles tablosu
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Contents tablosu (filmler ve diziler)
CREATE TABLE IF NOT EXISTS contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imdb_id text UNIQUE NOT NULL,
  title text NOT NULL,
  year text DEFAULT '',
  type text DEFAULT 'movie',
  genre text DEFAULT '',
  director text DEFAULT '',
  actors text DEFAULT '',
  plot text DEFAULT '',
  poster text DEFAULT '',
  imdb_rating numeric DEFAULT 0,
  runtime text DEFAULT '',
  language text DEFAULT '',
  country text DEFAULT '',
  awards text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contents"
  ON contents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contents"
  ON contents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ratings tablosu
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 0 AND rating <= 10),
  review text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Watch history tablosu
CREATE TABLE IF NOT EXISTS watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
  watched_at timestamptz DEFAULT now(),
  watch_duration integer DEFAULT 0,
  completed boolean DEFAULT false
);

ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch history"
  ON watch_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch history"
  ON watch_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history"
  ON watch_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User preferences tablosu
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  favorite_genres jsonb DEFAULT '{}'::jsonb,
  favorite_actors jsonb DEFAULT '{}'::jsonb,
  favorite_directors jsonb DEFAULT '{}'::jsonb,
  average_rating numeric DEFAULT 0,
  total_watched integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_contents_imdb_id ON contents(imdb_id);
CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_content_id ON ratings(content_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_content_id ON watch_history(content_id);

-- Trigger fonksiyonu: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();