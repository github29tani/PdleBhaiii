import { supabase } from './supabase';

// Types
export type AdminRole = {
  id: string;
  name: string;
  description: string;
  permissions: AdminPermission[];
};

export type AdminPermission = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type AppSetting = {
  key: string;
  value: any;
  category: string;
};

export async function setupAdminAccess() {
  try {
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    console.log('Setting up admin access for:', user.email);

    // 2. Create or get Super Admin role
    const { data: roleData, error: roleError } = await supabase
      .from('admin_roles')
      .upsert({
        name: 'Super Admin',
        description: 'Has full access to all admin features'
      }, {
        onConflict: 'admin_roles_name_key'
      })
      .select()
      .single();

    if (roleError) throw roleError;
    console.log('Role setup:', roleData);

    // 3. Create admin permissions
    const permissions = [
      { name: 'manage_users', description: 'Can manage all user accounts' },
      { name: 'manage_content', description: 'Can manage all content' },
      { name: 'manage_settings', description: 'Can modify app settings' },
      { name: 'manage_ads', description: 'Can configure ad settings' },
      { name: 'send_notifications', description: 'Can send push notifications' },
      { name: 'manage_reports', description: 'Can handle content reports' }
    ];

    for (const perm of permissions) {
      const { error: permError } = await supabase
        .from('admin_permissions')
        .upsert({
          role_id: roleData.id,
          name: perm.name,
          description: perm.description,
          enabled: true
        }, {
          onConflict: 'admin_permissions_role_name_key'
        });

      if (permError) throw permError;
    }
    console.log('Permissions setup complete');

    // 4. Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: 'Admin User'
      }, {
        onConflict: 'profiles_email_key'
      });

    if (profileError) throw profileError;
    console.log('Profile setup complete');

    // 5. Assign admin role
    const { error: assignError } = await supabase
      .from('admin_role_assignments')
      .upsert({
        role_id: roleData.id,
        user_id: user.id
      }, {
        onConflict: 'admin_role_assignments_role_user_key'
      });

    if (assignError) throw assignError;
    console.log('Role assignment complete');

    return { success: true };
  } catch (error) {
    console.error('Admin setup error:', error);
    return { success: false, error };
  }
}

export type AdSetting = {
  network: string;
  adType: string;
  adUnitId: string;
  enabled: boolean;
  frequency: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  targetAudience: string;
  scheduledFor: string;
  status: 'draft' | 'scheduled' | 'sent';
  sentCount: number;
  openCount: number;
};

export type TelegramGroup = {
  id: string;
  name: string;
  link: string;
  description: string;
  memberCount: number;
};

export type ContentReport = {
  id: string;
  contentType: string;
  contentId: string;
  reporterId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  resolvedAt?: string;
  resolutionNotes?: string;
};

export type Permission = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type CreateRoleInput = {
  name: string;
  description: string;
  email: string;
  password: string;
  permissions: Permission[];
};

// Admin Roles
export const getAdminRoles = async () => {
  // First get all roles with their permissions
  const { data: roles, error: rolesError } = await supabase
    .from('admin_roles')
    .select(`
      *,
      permissions:admin_permissions(
        id,
        name,
        description,
        enabled
      )
    `);

  if (rolesError) throw rolesError;
  return roles;
};

export async function createAdminRole(input: CreateRoleInput) {
  try {
    // First check if we have permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (!profile?.role_id) throw new Error('No admin role assigned');

    // Create the role through RPC
    const { data, error } = await supabase
      .rpc('create_admin_role', {
        p_name: input.name,
        p_description: input.description,
        p_email: input.email,
        p_password: input.password,
        p_permissions: JSON.stringify(input.permissions)
      });

    if (error) {
      console.error('Error creating role:', error);
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No data returned from create_admin_role');
    }

    return data;
  } catch (error: any) {
    console.error('Error in createAdminRole:', error);
    throw new Error(error.message || 'Failed to create admin role');
  }
}

export const updateAdminRole = async (id: string, role: Partial<AdminRole>) => {
  const { data, error } = await supabase
    .from('admin_roles')
    .update(role)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export async function deleteAdminRole(roleId: string) {
  const { data, error } = await supabase
    .from('admin_roles')
    .delete()
    .eq('id', roleId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const createInitialSuperAdmin = async () => {
  try {
    // First check if we're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Authentication error: ' + authError.message);
    }
    if (!user) throw new Error('Not authenticated');

    console.log('Creating super admin for user:', user.id);

    // Create super admin role
    const { data, error } = await supabase
      .rpc('create_initial_super_admin', {
        p_user_id: user.id
      });

    if (error) {
      console.error('Error creating super admin:', error);
      throw new Error('Failed to create super admin: ' + error.message);
    }

    if (!data) {
      throw new Error('No data returned from create_initial_super_admin');
    }

    console.log('Super admin created successfully:', data);

    // Verify the role was assigned
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error verifying profile:', profileError);
      throw new Error('Failed to verify profile: ' + profileError.message);
    }

    if (!profile?.role_id) {
      throw new Error('Role was not properly assigned to profile');
    }

    return data;
  } catch (error: any) {
    console.error('Error in createInitialSuperAdmin:', error);
    throw error;
  }
};

// App Settings
export const getAppSettings = async () => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*');
  if (error) throw error;
  return data;
};

export const updateAppSetting = async (key: string, value: any) => {
  const { data, error } = await supabase
    .rpc('update_app_setting', {
      p_key: key,
      p_value: value,
      p_user_id: (await supabase.auth.getUser()).data.user?.id
    });
  if (error) throw error;
  return data;
};

// Ad Settings
export const getAdSettings = async () => {
  const { data, error } = await supabase
    .from('ad_settings')
    .select('*');
  if (error) throw error;
  return data;
};

export const updateAdSetting = async (id: string, setting: Partial<AdSetting>) => {
  const { data, error } = await supabase
    .from('ad_settings')
    .update(setting)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Notifications
export const getNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const scheduleNotification = async (notification: Partial<Notification>) => {
  const { data, error } = await supabase
    .rpc('schedule_notification', {
      p_title: notification.title,
      p_message: notification.message,
      p_target: notification.targetAudience,
      p_schedule: notification.scheduledFor,
      p_user_id: (await supabase.auth.getUser()).data.user?.id
    });
  if (error) throw error;
  return data;
};

export const sendNotificationNow = async (notification: Partial<Notification>) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Telegram Groups
export const getTelegramGroups = async () => {
  const { data, error } = await supabase
    .from('telegram_groups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createTelegramGroup = async (group: Partial<TelegramGroup>) => {
  const { data, error } = await supabase
    .from('telegram_groups')
    .insert(group)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateTelegramGroup = async (id: string, group: Partial<TelegramGroup>) => {
  const { data, error } = await supabase
    .from('telegram_groups')
    .update(group)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Content Reports
export const getContentReports = async () => {
  const { data, error } = await supabase
    .from('pending_reports')
    .select('*');
  if (error) throw error;
  return data;
};

export const createContentReport = async (report: Partial<ContentReport>) => {
  const { data, error } = await supabase
    .from('content_reports')
    .insert(report)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const resolveContentReport = async (
  id: string, 
  status: 'resolved' | 'rejected',
  notes?: string
) => {
  const { data, error } = await supabase
    .from('content_reports')
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: (await supabase.auth.getUser()).data.user?.id,
      resolution_notes: notes
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
