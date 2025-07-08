-- Update function to handle target with profiles table
CREATE OR REPLACE FUNCTION distribute_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_classes text[];
  target_subjects text[];
  target_boards text[];
  target_languages text[];
BEGIN
  -- Handle null or empty target
  IF NEW.target IS NULL THEN
    NEW.target := '{}'::jsonb;
  END IF;

  -- Extract arrays from jsonb
  target_classes := ARRAY(
    SELECT jsonb_array_elements_text(CASE 
      WHEN NEW.target->'classes' IS NULL OR NEW.target->'classes' = 'null'::jsonb 
      THEN '[]'::jsonb 
      ELSE NEW.target->'classes' 
    END)
  )::text[];
  
  target_subjects := ARRAY(
    SELECT jsonb_array_elements_text(CASE 
      WHEN NEW.target->'subjects' IS NULL OR NEW.target->'subjects' = 'null'::jsonb 
      THEN '[]'::jsonb 
      ELSE NEW.target->'subjects' 
    END)
  )::text[];
  
  target_boards := ARRAY(
    SELECT jsonb_array_elements_text(CASE 
      WHEN NEW.target->'boards' IS NULL OR NEW.target->'boards' = 'null'::jsonb 
      THEN '[]'::jsonb 
      ELSE NEW.target->'boards' 
    END)
  )::text[];
  
  target_languages := ARRAY(
    SELECT jsonb_array_elements_text(CASE 
      WHEN NEW.target->'languages' IS NULL OR NEW.target->'languages' = 'null'::jsonb 
      THEN '[]'::jsonb 
      ELSE NEW.target->'languages' 
    END)
  )::text[];

  -- Insert into notification_recipients for matching users
  INSERT INTO notification_recipients (notification_id, user_id)
  SELECT 
    NEW.id,
    p.id
  FROM profiles p
  WHERE 
    -- If no classes selected OR user's class matches
    (array_length(target_classes, 1) IS NULL OR 
     EXISTS (
       SELECT 1 FROM jsonb_array_elements_text(p.metadata->'class') class
       WHERE class = ANY(target_classes)
     ))
    AND
    -- If no subjects selected OR user's subjects match
    (array_length(target_subjects, 1) IS NULL OR 
     EXISTS (
       SELECT 1 FROM jsonb_array_elements_text(p.metadata->'subjects') subject
       WHERE subject = ANY(target_subjects)
     ))
    AND
    -- If no boards selected OR user's board matches
    (array_length(target_boards, 1) IS NULL OR 
     EXISTS (
       SELECT 1 FROM jsonb_array_elements_text(p.metadata->'board') board
       WHERE board = ANY(target_boards)
     ))
    AND
    -- If no languages selected OR user's languages match
    (array_length(target_languages, 1) IS NULL OR 
     EXISTS (
       SELECT 1 FROM jsonb_array_elements_text(p.metadata->'languages') lang
       WHERE lang = ANY(target_languages)
     ));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
