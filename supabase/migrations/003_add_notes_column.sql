-- Add notes column to subject_chapters to store AI-generated notes
-- This prevents regenerating notes every time a chapter is viewed

ALTER TABLE subject_chapters 
ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT NULL;

-- The notes column stores the AI summary in JSON format:
-- {
--   "overview": "...",
--   "keyPoints": [...],
--   "formulas": [...],
--   "importantTerms": [...],
--   "examTips": [...],
--   "commonMistakes": [...],
--   "practiceQuestions": [...],
--   "generated_at": "..."
-- }

COMMENT ON COLUMN subject_chapters.notes IS 'AI-generated study notes stored as JSON';
