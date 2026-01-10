-- Add course_program column to user_profiles table for college students
-- This stores the specific degree/course like "B.Sc Computer Science", "B.Com", etc.

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS course_program TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.course_program IS 'Specific degree or course program for college students (e.g., B.Sc CS, B.E. IT)';
