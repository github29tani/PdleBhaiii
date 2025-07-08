-- Insert test ads
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
(
  'Study Materials 20% Off',
  'Get exclusive discount on premium study materials',
  'https://placehold.co/600x400/png?text=Study+Materials',
  'https://example.com/promo/study-materials',
  'banner',
  'active',
  '{"Mathematics", "Physics"}',
  '{"Class 11", "Class 12"}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days'
),
(
  'Online Tutoring Available',
  'Expert tutors for all subjects',
  'https://placehold.co/600x400/png?text=Online+Tutoring',
  'https://example.com/tutoring',
  'banner',
  'active',
  '{"Chemistry", "Biology"}',
  '{"Class 11", "Class 12"}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days'
),
(
  'Learn Digital Marketing with Google Ads',
  'Master online advertising and boost your career with Google Ads certification',
  'https://placehold.co/600x400/232323/FFA500?text=Google+Ads+Certification',
  'https://skillshop.exceedlms.com/student/catalog/browse',
  'banner',
  'active',
  '{}',  -- Show for all subjects
  '{}',  -- Show for all classes
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days'
);
