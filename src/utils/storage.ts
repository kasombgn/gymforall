import { GymDatabase, Member, ExpenseRecord, PaymentTransaction, AttendanceRecord, GymUser, CompetitionRecord } from '../types/gym';
import { INITIAL_GYM_DATA } from '../data/initialData';

const STORAGE_KEY = 'naksoo_martial_arts_gym_db_v1';
const AUTH_STORAGE_KEY = 'naksoo_current_auth_user_v1';

export function loadGymData(): GymDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveGymData(INITIAL_GYM_DATA);
      return INITIAL_GYM_DATA;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.members || !parsed.coaches) {
      saveGymData(INITIAL_GYM_DATA);
      return INITIAL_GYM_DATA;
    }

    // Migrate users if missing
    if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
      parsed.users = INITIAL_GYM_DATA.users;
      saveGymData(parsed);
    }

    // Migrate competitions if missing
    if (!parsed.competitions || !Array.isArray(parsed.competitions)) {
      parsed.competitions = INITIAL_GYM_DATA.competitions || [];
      saveGymData(parsed);
    }

    // Migrate settings if missing
    if (!parsed.settings || !parsed.settings.appName) {
      parsed.settings = INITIAL_GYM_DATA.settings;
      saveGymData(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('Error loading gym data from storage:', error);
    return INITIAL_GYM_DATA;
  }
}

export interface MemberMedalStats {
  gold: number;
  silver: number;
  bronze: number;
  participant: number;
  total: number;
  records: CompetitionRecord[];
}

export function getMemberMedalStats(competitions: CompetitionRecord[] = [], memberId: string): MemberMedalStats {
  const records = competitions.filter(c => c.memberId === memberId);
  const gold = records.filter(c => c.medal === 'gold').length;
  const silver = records.filter(c => c.medal === 'silver').length;
  const bronze = records.filter(c => c.medal === 'bronze').length;
  const participant = records.filter(c => c.medal === 'participant').length;
  const total = gold + silver + bronze;

  return {
    gold,
    silver,
    bronze,
    participant,
    total,
    records
  };
}

export function loadCurrentUser(users: GymUser[]): GymUser {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Match by email or ID in fresh user list
      const matched = users.find(u => u.email.toLowerCase() === parsed.email?.toLowerCase());
      if (matched && matched.status === 'active') {
        return matched;
      }
    }
  } catch (err) {
    console.error('Error loading current user from storage:', err);
  }

  // Default to Super Admin (sudtheerug@gmail.com)
  const defaultAdmin = users.find(u => u.email.toLowerCase() === 'sudtheerug@gmail.com') 
    || users.find(u => u.role === 'admin') 
    || users[0];
  
  if (defaultAdmin) {
    saveCurrentUser(defaultAdmin);
    return defaultAdmin;
  }

  return {
    id: 'u-admin-1',
    email: 'sudtheerug@gmail.com',
    name: 'Sudtheerug (Admin/เจ้าของยิม)',
    role: 'admin',
    createdAt: new Date().toISOString(),
    status: 'active'
  };
}

export function saveCurrentUser(user: GymUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      coachId: user.coachId
    }));
  } catch (err) {
    console.error('Error saving current user:', err);
  }
}


export function saveGymData(data: GymDatabase): void {
  try {
    const updated = {
      ...data,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving gym data to storage:', error);
  }
}

export function resetToInitialData(): GymDatabase {
  saveGymData(INITIAL_GYM_DATA);
  return INITIAL_GYM_DATA;
}

// Currency & Date formatters
export function formatBaht(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatShortBaht(amount: number): string {
  return `฿${amount.toLocaleString('th-TH')}`;
}

export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10) + 543; // Buddhist Era
      const monthNames = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${monthNames[monthIdx] || ''} ${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// File Exporting: JSON
export function exportDataAsJSON(data: GymDatabase): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `naksoo_gym_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// File Importing: JSON
export function importDataFromJSON(file: File): Promise<GymDatabase> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.members || !Array.isArray(parsed.members)) {
          throw new Error('รูปแบบไฟล์ไม่ถูกต้อง: ไม่พบข้อมูลสมาชิก');
        }
        resolve(parsed as GymDatabase);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

// CSV Helpers
function triggerCSVDownload(content: string, filename: string): void {
  // Add UTF-8 BOM so Excel opens Thai fonts correctly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMembersToCSV(members: Member[]): void {
  const headers = [
    'รหัสสมาชิก',
    'ชื่อ-นามสกุล',
    'ชื่อเล่น',
    'เบอร์โทรศัพท์',
    'เบอร์ติดต่อฉุกเฉิน',
    'ประเภทสมาชิก',
    'สถานะ',
    'วิชาการต่อสู้',
    'ระดับ/สาย',
    'วันที่สมัคร',
    'วันหมดอายุ',
    'จำนวนครั้งคงเหลือ',
    'เข้าฝึกซ้อมทั้งหมด(ครั้ง)',
    'เหตุผลทุนเพื่อสังคม',
    'หมายเหตุ'
  ];

  const rows = members.map(m => [
    m.memberCode,
    `"${m.name.replace(/"/g, '""')}"`,
    m.nickname,
    m.phone,
    `"${(m.emergencyContact || '').replace(/"/g, '""')}"`,
    m.type === 'paid_monthly' ? 'รายเดือน' : m.type === 'paid_per_session' ? 'รายครั้ง/คูปอง' : 'ฟรี-กิจกรรมเพื่อสังคม',
    m.status === 'active' ? 'กำลังใช้งาน' : m.status === 'expired' ? 'หมดอายุ' : 'ระงับชั่วคราว',
    m.discipline,
    `"${(m.beltOrLevel || '').replace(/"/g, '""')}"`,
    m.joinDate,
    m.expireDate || '-',
    m.remainingSessions ?? '-',
    m.totalSessionsAttended,
    `"${(m.socialProgramReason || '').replace(/"/g, '""')}"`,
    `"${(m.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  triggerCSVDownload(csvContent, `members_list_${dateStr}.csv`);
}

export function exportFinancialsToCSV(payments: PaymentTransaction[], expenses: ExpenseRecord[]): void {
  const paymentHeaders = ['ประเภท', 'เลขที่เอกสาร', 'วันที่', 'รายการ/สมาชิก', 'ประเภทการชำระ', 'จำนวนเงิน (บาท)', 'วิธีชำระ', 'ผู้บันทึก', 'หมายเหตุ'];
  
  const paymentRows = payments.map(p => [
    'รายรับ',
    p.receiptNo,
    p.date,
    `"${p.memberName} (${p.planName})"`,
    p.paymentType === 'monthly' ? 'รายเดือน' : p.paymentType === 'per_session' ? 'รายครั้ง' : 'ทุนเพื่อสังคม (0฿)',
    p.amount,
    p.paymentMethod === 'transfer_promptpay' ? 'โอน/PromptPay' : p.paymentMethod === 'cash' ? 'เงินสด' : p.paymentMethod === 'credit_card' ? 'บัตรเครดิต' : 'โครงการเพื่อสังคม',
    p.collectedBy,
    `"${(p.note || '').replace(/"/g, '""')}"`
  ]);

  const expenseRows = expenses.map(e => [
    'รายจ่าย',
    e.voucherNo,
    e.date,
    `"${e.title}"`,
    e.category,
    e.amount,
    e.paymentMethod,
    e.approvedBy,
    `"${(e.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    paymentHeaders.join(','),
    ...paymentRows.map(r => r.join(',')),
    ...expenseRows.map(r => r.join(','))
  ].join('\r\n');

  const dateStr = new Date().toISOString().split('T')[0];
  triggerCSVDownload(csvContent, `financial_report_${dateStr}.csv`);
}

export function exportAttendanceToCSV(attendance: AttendanceRecord[]): void {
  const headers = ['วันที่', 'เวลา', 'รหัสสมาชิก/ชื่อ', 'ชื่อเล่น', 'ประเภทสมาชิก', 'วิชา', 'คลาส/หัวข้อฝึก', 'โค้ชผู้ฝึกสอน', 'คะแนนประเมิน (1-5)', 'บันทึกการฝึกซ้อม'];
  
  const rows = attendance.map(a => [
    a.date,
    a.timeSlot,
    `"${a.memberName}"`,
    a.memberNickname || '-',
    a.memberType === 'paid_monthly' ? 'รายเดือน' : a.memberType === 'paid_per_session' ? 'รายครั้ง' : 'ฟรีเพื่อสังคม',
    a.discipline,
    `"${(a.sessionTitle || '').replace(/"/g, '""')}"`,
    `"${a.coachName}"`,
    a.performanceRating || '-',
    `"${(a.trainingNotes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  triggerCSVDownload(csvContent, `attendance_logs_${dateStr}.csv`);
}
