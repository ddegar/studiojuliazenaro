
export type UserRole = 'CLIENT' | 'MASTER_ADMIN' | 'PROFESSIONAL_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  professionalId?: string;
  lashPoints: number;
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
  category: string;
  imageUrl: string;
  isPopular?: boolean;
  active: boolean;
  professionalIds: string[];
  pointsReward: number;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NOSHOW' | 'BLOCKED';

export interface Appointment {
  id: string;
  userId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  professionalId: string;
  professionalName: string;
  price: number;
  pointsAwarded?: boolean;
  createdBy: 'CLIENT' | 'ADMIN';
  notes?: string;
}

export type PointSource = 'SERVICE' | 'REFERRAL' | 'CHECKIN' | 'SOCIAL_SHARE' | 'ADMIN_ADJUST';

export interface PointTransaction {
  id: string;
  clientId: string;
  serviceId?: string;
  appointmentId?: string;
  pointsEarned: number;
  date: string;
  source: PointSource;
  description: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'WITHDRAWAL';
export type TransactionCategory = 'SERVICE' | 'SUPPLY' | 'RENT' | 'MARKETING' | 'PERSONAL' | 'TAXES';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  title: string;
  date: string;
  professionalId?: string;
  appointmentId?: string;
  isStudioWide: boolean;
}

export interface ProfessionalFinanceSummary {
  professionalId: string;
  professionalName: string;
  grossRevenue: number;
  expenses: number;
  withdrawals: number;
  netBalance: number;
  appointmentCount: number;
  marketShare?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'GENERAL' | 'BOOKING' | 'AFTERCARE' | 'PRICING';
  active: boolean;
  order: number;
  linkedSection?: 'BOOKING' | 'PROFILE' | 'HISTORY';
}

export interface Tip {
  id: string;
  title: string;
  content: string;
  type: 'PRE_CARE' | 'POST_CARE';
  serviceIds: string[];
  active: boolean;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  icon: string;
  perks: string[];
}

export interface LoyaltyConfig {
  referralPoints: number;
  pointsEnabled: boolean;
}
