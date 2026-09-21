export type MembershipType = 'paid_monthly' | 'paid_per_session' | 'free_community';

export type DisciplineType = 
  | 'Muay Thai'
  | 'Brazilian Jiu-Jitsu (BJJ)'
  | 'Boxing'
  | 'MMA (Mixed Martial Arts)'
  | 'Wrestling & Grappling'
  | 'Kids Martial Arts'
  | 'All-Access Pass';

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  nickname: string;
  phone: string;
  emergencyContact: string;
  type: MembershipType;
  status: 'active' | 'expired' | 'suspended';
  discipline: DisciplineType;
  beltOrLevel: string;
  joinDate: string; // YYYY-MM-DD
  expireDate?: string; // YYYY-MM-DD
  remainingSessions?: number;
  totalSessionsAttended: number;
  socialProgramReason?: string; // e.g. ทุนเยาวชนชุมชน, โครงการต้านยาเสพติด
  weightKg?: number;
  heightCm?: number;
  notes?: string;
  avatarSeed?: string;
}

export interface Coach {
  id: string;
  coachCode: string;
  name: string;
  nickname: string;
  phone: string;
  employmentType: 'full_time' | 'part_time';
  disciplines: DisciplineType[];
  monthlySalary?: number; // For full-time
  hourlyRate?: number; // For part-time per class/hr
  status: 'active' | 'on_leave';
  achievements?: string;
  joinDate: string;
  bankAccount?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberNickname?: string;
  memberType: MembershipType;
  discipline: DisciplineType;
  coachId: string;
  coachName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  sessionId?: string;
  sessionTitle?: string;
  trainingNotes?: string;
  techniqueFocus?: string;
  performanceRating?: number; // 1-5
}

export interface PaymentTransaction {
  id: string;
  receiptNo: string;
  memberId: string;
  memberName: string;
  memberType: MembershipType;
  paymentType: 'monthly' | 'per_session' | 'free_scholarship';
  planName: string;
  amount: number;
  paymentMethod: 'transfer_promptpay' | 'cash' | 'credit_card' | 'free_csr';
  date: string; // YYYY-MM-DD
  referenceNumber?: string;
  note?: string;
  collectedBy: string;
}

export type ExpenseCategory = 
  | 'coach_salary'
  | 'coach_hourly'
  | 'rent'
  | 'utilities'
  | 'equipment'
  | 'maintenance'
  | 'marketing'
  | 'other';

export interface ExpenseRecord {
  id: string;
  voucherNo: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  coachId?: string;
  coachName?: string;
  paymentMethod: 'transfer' | 'cash' | 'card';
  note?: string;
  approvedBy: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly_days' | 'weekdays' | 'weekends';

export interface TrainingClassSession {
  id: string;
  title: string;
  discipline: DisciplineType;
  coachId: string;
  coachName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "17:00"
  endTime: string; // e.g. "18:30"
  maxCapacity: number;
  enrolledMemberIds: string[];
  isSocialProgram?: boolean;
  location: string;
  description?: string;
  recurrenceId?: string; // Grouping ID for recurring series
  recurrencePattern?: string; // e.g. "ทุกวัน จ., พ., ศ. (17:00 - 18:30)"
  isRecurring?: boolean;
}

export type MedalType = 'gold' | 'silver' | 'bronze' | 'participant' | 'none';

export interface CompetitionRecord {
  id: string;
  memberId: string;
  memberName?: string;
  tournamentName: string; // ชื่อการแข่งขัน เช่น "ชิงแชมป์มวยไทยสมัครเล่น 2026", "Bangkok BJJ Open"
  date: string; // วันที่แข่งขัน YYYY-MM-DD
  discipline: DisciplineType | string; // e.g. Muay Thai, BJJ, Boxing, MMA, Wrestling
  division?: string; // รุ่น/พิกัดน้ำหนัก เช่น "รุ่นน้ำหนักไม่เกิน 68 กก.", "สายขาว ประชาชนทั่วไป"
  medal: MedalType; // 'gold' | 'silver' | 'bronze' | 'participant' | 'none'
  awardTitle?: string; // e.g. "ชนะเลิศเหรียญทอง", "รองชนะเลิศอันดับ 1", "นักชกดุเดือดประจำทัวร์นาเมนต์"
  opponent?: string; // คู่แข่งขัน
  matchResult?: string; // เช่น ชนะน็อคยก 2, ชนะคะแนนเอกฉันท์ 30-27, ชนะ Submission (Triangle Choke)
  location?: string; // สนามแข่ง/สถานที่
  notes?: string;
  recordedBy?: string; // บันทึกโดยใคร
  createdAt?: string;
}

export type UserRole = 'admin' | 'coach';

export type PresetLogoIcon = 
  | 'dumbbell' 
  | 'flame' 
  | 'shield' 
  | 'trophy' 
  | 'swords' 
  | 'zap' 
  | 'crown'
  | 'target';

export type LogoTheme = 
  | 'amber_red' 
  | 'red_black' 
  | 'emerald_amber' 
  | 'blue_cyan' 
  | 'purple_rose' 
  | 'gold_luxury'
  | 'carbon_dark';

export interface GymSettings {
  appName: string; // e.g. "NAKSOO COMBAT"
  appNameHighlight?: string; // e.g. "COMBAT"
  tagline: string; // e.g. "ยิมศิลปะการต่อสู้"
  subDescription: string; // e.g. "ระบบบริหารโรงยิมและค่ายฝึกสอนครบวงจร"
  logoType: 'preset_icon' | 'custom_image';
  presetIcon: PresetLogoIcon;
  logoTheme: LogoTheme;
  customLogoUrl?: string; // Data URL (Base64) or Image URL
  phone?: string; // e.g. "02-999-8888"
  address?: string; // e.g. "อาคารนวมทอง สุขุมวิท กรุงเทพฯ"
}

export interface GymUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  coachId?: string; // Links to Coach.id if role === 'coach'
  photoUrl?: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'suspended';
}

export interface GymDatabase {
  members: Member[];
  coaches: Coach[];
  attendance: AttendanceRecord[];
  payments: PaymentTransaction[];
  expenses: ExpenseRecord[];
  classes: TrainingClassSession[];
  users: GymUser[];
  competitions: CompetitionRecord[];
  settings?: GymSettings;
  lastUpdated: string;
}

