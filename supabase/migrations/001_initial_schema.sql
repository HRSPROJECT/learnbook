-- User profiles extending auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  country TEXT,
  education_level TEXT CHECK (education_level IN ('school', 'college')),
  board TEXT,
  class_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning context per user
CREATE TABLE IF NOT EXISTS learning_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_date DATE,
  daily_available_time INTEGER DEFAULT 120,
  weak_topics TEXT[] DEFAULT '{}',
  strong_topics TEXT[] DEFAULT '{}',
  learning_style TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Syllabus chapters
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  board TEXT NOT NULL,
  class_grade TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  chapter_order INTEGER DEFAULT 0,
  importance_weight DECIMAL DEFAULT 0.5,
  prerequisites TEXT[] DEFAULT '{}',
  concepts JSONB DEFAULT '[]',
  estimated_hours DECIMAL DEFAULT 5,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'revision')),
  completion_percentage INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  last_studied TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Daily tasks
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  chapter_id UUID,
  task_date DATE NOT NULL,
  task_type TEXT CHECK (task_type IN ('study', 'revision', 'practice')),
  task_description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  time_slot TEXT,
  completed BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roadmap items
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  learning_context_id UUID REFERENCES learning_context(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_milestone BOOLEAN DEFAULT FALSE,
  is_revision BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for learning_context
CREATE POLICY "Users can view own learning context" ON learning_context
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own learning context" ON learning_context
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for daily_tasks
CREATE POLICY "Users can view own tasks" ON daily_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks" ON daily_tasks
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for roadmap_items
CREATE POLICY "Users can view own roadmap" ON roadmap_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own roadmap" ON roadmap_items
  FOR ALL USING (auth.uid() = user_id);

-- Chapters are public read
CREATE POLICY "Chapters are viewable by everyone" ON chapters
  FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_context_user ON learning_context(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_user ON roadmap_items(user_id);
