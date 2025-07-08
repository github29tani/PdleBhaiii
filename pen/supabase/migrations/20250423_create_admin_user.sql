-- Add role column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_id uuid;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'admin@pdlebhaii.com'
    ) THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@pdlebhaii.com',
            crypt('admin123', gen_salt('bf')), 
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO admin_id;

        -- Insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        )
        VALUES (
            admin_id,
            admin_id,
            'admin@pdlebhaii.com',
            jsonb_build_object('sub', admin_id::text, 'email', 'admin@pdlebhaii.com'),
            'email',
            NOW(),
            NOW(),
            NOW()
        );

        -- Add admin role in profiles table
        INSERT INTO public.profiles (
            id,
            username,
            name,
            email,
            bio,
            interests,
            subjects,
            level,
            xp,
            followers,
            following,
            created_at,
            updated_at,
            role
        )
        VALUES (
            admin_id,
            'admin',
            'Admin User',
            'admin@pdlebhaii.com',
            'PdleBhaii System Administrator',
            '{}',
            '{}',
            1,
            0,
            0,
            0,
            NOW(),
            NOW(),
            'admin'
        );
    END IF;
END
$$;
