-- User subjects table
CREATE TABLE IF NOT EXISTS user_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subject chapters table
CREATE TABLE IF NOT EXISTS subject_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES user_subjects(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  concepts TEXT[] DEFAULT '{}',
  estimated_hours DECIMAL DEFAULT 5,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'revision')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subjects
CREATE POLICY "Users can view own subjects" ON user_subjects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects" ON user_subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects" ON user_subjects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects" ON user_subjects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for subject_chapters (via subject ownership)
CREATE POLICY "Users can view own subject chapters" ON subject_chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_subjects 
      WHERE user_subjects.id = subject_chapters.subject_id 
      AND user_subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own subject chapters" ON subject_chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_subjects 
      WHERE user_subjects.id = subject_chapters.subject_id 
      AND user_subjects.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subjects_user ON user_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_chapters_subject ON subject_chapters(subject_id);
