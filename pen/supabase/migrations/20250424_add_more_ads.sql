-- Insert more diverse ads
INSERT INTO ads (
  title,
  description,
  image_url,
  target_url,
  placement,
  status,
  target_subjects,
  target_classes,
  start_date,
  end_date
) VALUES
-- Subject-specific ads
(
  'Physics Crash Course',
  'Master physics concepts with our intensive crash course. Perfect for board exam preparation!',
  'https://placehold.co/600x400/232323/FFA500?text=Physics+Course',
  'https://example.com/physics-crash-course',
  'banner',
  'active',
  '{Physics}',
  '{Class 11, Class 12}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '60 days'
),
(
  'Chemistry Lab Simulations',
  'Experience virtual chemistry experiments. Safe, interactive, and educational!',
  'https://placehold.co/600x400/232323/00FF00?text=Chemistry+Lab',
  'https://example.com/chemistry-lab',
  'interstitial',
  'active',
  '{Chemistry}',
  '{Class 9, Class 10, Class 11, Class 12}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '90 days'
),
-- Class-specific ads
(
  'Class 10 Board Exam Guide',
  'Comprehensive study material for Class 10 board exams. All subjects covered!',
  'https://placehold.co/600x400/232323/FF00FF?text=Board+Exam+Guide',
  'https://example.com/class10-guide',
  'banner',
  'active',
  '{Mathematics, Science, English}',
  '{Class 10}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '120 days'
),
-- General educational tools
(
  'StudyTimer Pro',
  'Smart study timer with Pomodoro technique. Boost your productivity!',
  'https://placehold.co/600x400/232323/00FFFF?text=Study+Timer',
  'https://example.com/study-timer',
  'interstitial',
  'active',
  '{}',  -- Show for all subjects
  '{}',  -- Show for all classes
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days'
),
-- Study materials
(
  'Premium Notes Collection',
  'Access thousands of curated notes from top students',
  'https://placehold.co/600x400/232323/FFFF00?text=Premium+Notes',
  'https://example.com/premium-notes',
  'banner',
  'active',
  '{}',  -- Show for all subjects
  '{}',  -- Show for all classes
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '180 days'
),
-- Test preparation
(
  'Mock Test Series',
  'Practice with our comprehensive mock test series. Real exam environment!',
  'https://placehold.co/600x400/232323/FF0000?text=Mock+Tests',
  'https://example.com/mock-tests',
  'interstitial',
  'active',
  '{Mathematics, Physics, Chemistry}',
  '{Class 11, Class 12}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '90 days'
);
