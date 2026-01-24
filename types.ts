
export type UserRole = 'CLIENT' | 'MASTER_ADMIN' | 'PROFESSIONAL_ADMIN' | 'ADMIN' | 'PROFESSIONAL';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  professionalId?: string;
  zenaro_credits: number;
  tierId: string;
  referralCode: string;
  referredBy?: string;
  profilePic?: string;
  preferences?: {
    eyeShape: string;
    lashStyle: string;
    curl: string;
    thickness: string;
  };
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  avatar: string;
  active: boolean;
  specialties: string[];
  rating: number;
  email?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  points_reward?: number;
  imageUrl?: string;
  category?: string;
  professionalIds?: string[];
  isPopular?: boolean;
  active?: boolean;
  carePremium?: string;
  biosafety?: string;
  features?: { title: string; description: string; icon?: string }[];
}

export interface Appointment {
  id: string;
  user_id: string;
  professional_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  client_name?: string;
  service_name?: string;
  professional_name?: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string;
  amount: number;
  date: string;
  user_id: string;
  appointment_id?: string;
  status?: string;
  is_recurring?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  read: boolean;
  created_at: string;
}

export interface Story {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  duration: number;
  active: boolean;
  created_at: string;
  expires_at: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  role?: UserRole[];
  order: number;
  linkedSection?: 'BOOKING' | 'PROFILE' | 'HISTORY';
}

export interface Tip {
  id: string;
  title: string;
  content: string;
  type: 'PRE_CARE' | 'POST_CARE';
  professional_id?: string | null;
  service_ids: string[];
  active: boolean;
  linked_category?: string | null;
  icon?: string;
  created_at?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'GENERAL' | 'BOOKING' | 'AFTERCARE' | 'PRICING';
  display_order: number;
  active: boolean;
  created_at?: string;
}

export type LoyaltyTierName = 'Select' | 'Prime' | 'Signature' | 'Privé';

export interface LoyaltyTier {
  id: string;
  name: LoyaltyTierName;
  minPoints: number;
  color: string;
  icon: string;
  perks: string[];
}

export interface LoyaltyConfig {
  referralPoints: number;
  pointsEnabled: boolean;
}

export const LOYALTY_PROGRAM_NAME = "JZ Privé Club";
export interface FeedPost {
  id: string;
  type: 'image' | 'video';
  image_url: string;
  caption?: string;
  category?: string;
  service_link_id?: string;
  active: boolean;
  created_at?: string;
}
