export type Subscription = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  amount: number;
  billing_date: string;
  renewal_period: string;
  category?: string;
  color?: string;
  logo_url?: string;
  payment_method?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  subscription_id?: string;
  title: string;
  message: string;
  notification_date: string;
  is_read: boolean;
  created_at: string;
};

export type UserSettings = {
  id: string;
  notification_enabled: boolean;
  reminder_days: number;
  theme: string;
  currency: string;
  backup_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  updated_at: string;
  created_at: string;
};