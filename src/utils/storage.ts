import { GymDatabase, Member, ExpenseRecord, PaymentTransaction, AttendanceRecord, GymUser, CompetitionRecord, MembershipType, DisciplineType } from '../types/gym';
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

// ==========================================
// Member CSV Template & Import Helpers
// ==========================================

export function downloadMemberCSVTemplate(): void {
  const headers = [
    'รหัสสมาชิก',
    'ชื่อ-นามสกุล',
    'ชื่อเล่น',
    'เบอร์โทรศัพท์',
    'เบอร์ติดต่อฉุกเฉิน',
    'ประเภทสมาชิก',
    'สถานะ',
    'วิชาการต่อสู้',
    'ระดับหรือสาย',
    'วันที่สมัคร',
    'วันหมดอายุ',
    'จำนวนครั้งคงเหลือ',
    'เหตุผลทุนเพื่อสังคม',
    'น้ำหนัก_กก',
    'ส่วนสูง_ซม',
    'หมายเหตุ'
  ];

  const sampleRows = [
    [
      'NS-101',
      'สมชาย ใจเด็ด',
      'ชาย',
      '081-234-5678',
      '089-999-1111 (คุณแม่)',
      'รายเดือน',
      'กำลังใช้งาน',
      'Muay Thai',
      'พื้นฐาน',
      '2026-03-01',
      '2026-04-01',
      '',
      '',
      '68.5',
      '175',
      'เน้นฟิตเนสลดน้ำหนัก'
    ],
    [
      'NS-102',
      'อัครพล พลังสู้',
      'พล',
      '082-345-6789',
      '081-111-2222 (ภรรยา)',
      'รายครั้ง',
      'กำลังใช้งาน',
      'Brazilian Jiu-Jitsu (BJJ)',
      'สายขาว (2 แถบ)',
      '2026-03-05',
      '',
      '10',
      '',
      '74.0',
      '172',
      'ซื้อแพ็กเกจคูปอง 10 ครั้ง'
    ],
    [
      'NS-103',
      'เด็กชายธนากร แสงแก้ว',
      'กร',
      '083-456-7890',
      '084-555-6666 (ครูประจำชั้น)',
      'ฟรีเพื่อสังคม',
      'กำลังใช้งาน',
      'Boxing',
      'นักกีฬารุ่นเยาวชน',
      '2026-02-15',
      '',
      '',
      'ทุนเยาวชนชุมชนรักกีฬาต้านยาเสพติด',
      '52.0',
      '160',
      'เข้าโครงการ CSR ชุมชน'
    ]
  ];

  const csvRows = [
    headers.join(','),
    ...sampleRows.map(row => 
      row.map(field => {
        const str = String(field);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\r\n');
  triggerCSVDownload(csvString, 'members_import_template.csv');
}

export interface CSVParseResult {
  validMembers: Member[];
  errors: { row: number; name?: string; message: string }[];
  warnings: { row: number; name?: string; message: string }[];
  totalRows: number;
}

// Helper to parse individual CSV line respecting quotes
function parseCSVRow(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Clean and normalize dates to YYYY-MM-DD
function normalizeDate(raw: string | undefined | null): string | undefined {
  if (!raw || raw.trim() === '-' || raw.trim() === '') return undefined;
  const clean = raw.trim();

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Attempt Date parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return clean;
}

export function parseMembersFromCSV(
  csvContent: string,
  existingMembers: Member[] = []
): CSVParseResult {
  // Strip UTF-8 BOM if present
  let cleanContent = csvContent.replace(/^\uFEFF/, '').trim();
  if (!cleanContent) {
    return { validMembers: [], errors: [{ row: 0, message: 'ไฟล์ CSV ว่างเปล่า ไม่มีข้อมูล' }], warnings: [], totalRows: 0 };
  }

  const lines = cleanContent.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { validMembers: [], errors: [{ row: 0, message: 'ไฟล์ต้องมีแถวหัวข้อ (Header) และข้อมูลอย่างน้อย 1 แถว' }], warnings: [], totalRows: 0 };
  }

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  const rawHeaders = parseCSVRow(lines[0], delimiter).map(h => h.toLowerCase().replace(/["'\s_-]/g, ''));

  // Header index mapping
  const findHeaderIdx = (patterns: string[]): number => {
    return rawHeaders.findIndex(h => patterns.some(p => h.includes(p)));
  };

  const idxCode = findHeaderIdx(['รหัส', 'code', 'membercode', 'id']);
  const idxName = findHeaderIdx(['ชื่อนามสกุล', 'ชื่อจริง', 'ชื่อ', 'fullname', 'name']);
  const idxNickname = findHeaderIdx(['ชื่อเล่น', 'nickname', 'nick']);
  const idxPhone = findHeaderIdx(['โทรศัพท์', 'เบอร์โทร', 'phone', 'tel', 'mobile']);
  const idxEmergency = findHeaderIdx(['ฉุกเฉิน', 'emergency', 'contact']);
  const idxType = findHeaderIdx(['ประเภท', 'type', 'membershiptype', 'แพ็กเกจ', 'plan']);
  const idxStatus = findHeaderIdx(['สถานะ', 'status']);
  const idxDiscipline = findHeaderIdx(['วิชา', 'discipline', 'sport', 'martial']);
  const idxLevel = findHeaderIdx(['สาย', 'ระดับ', 'belt', 'level', 'rank']);
  const idxJoinDate = findHeaderIdx(['วันที่สมัคร', 'วันสมัคร', 'joindate', 'startdate', 'เริ่ม']);
  const idxExpireDate = findHeaderIdx(['หมดอายุ', 'expire', 'expiredate', 'enddate']);
  const idxSessions = findHeaderIdx(['คงเหลือ', 'ครั้ง', 'session', 'remaining', 'sessions']);
  const idxSocialReason = findHeaderIdx(['ทุน', 'สังคม', 'เหตุผล', 'social', 'csr', 'reason']);
  const idxWeight = findHeaderIdx(['น้ำหนัก', 'weight', 'kg']);
  const idxHeight = findHeaderIdx(['ส่วนสูง', 'height', 'cm']);
  const idxNotes = findHeaderIdx(['หมายเหตุ', 'note', 'notes', 'remark']);

  if (idxName === -1) {
    return {
      validMembers: [],
      errors: [{ row: 1, message: 'ไม่พบคอลัมน์ "ชื่อ-นามสกุล" ในหัวตาราง กรุณาตรวจสอบไฟล์ Template' }],
      warnings: [],
      totalRows: lines.length - 1
    };
  }

  const validMembers: Member[] = [];
  const errors: { row: number; name?: string; message: string }[] = [];
  const warnings: { row: number; name?: string; message: string }[] = [];

  const todayStr = new Date().toISOString().split('T')[0];
  let currentMaxCodeNum = existingMembers.reduce((max, m) => {
    const match = m.memberCode?.match(/NS-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, existingMembers.length);

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const rowNumber = lineIdx + 1;
    const row = parseCSVRow(lines[lineIdx], delimiter);

    // Skip empty lines
    if (row.every(col => !col || col.trim() === '')) {
      continue;
    }

    const name = (idxName !== -1 ? row[idxName] : '').trim();
    if (!name) {
      errors.push({
        row: rowNumber,
        message: 'ไม่พบชื่อ-นามสกุลในแถวนี้ (จำเป็นต้องระบุ)'
      });
      continue;
    }

    const rawCode = (idxCode !== -1 ? row[idxCode] : '').trim();
    let memberCode = rawCode;
    if (!memberCode) {
      currentMaxCodeNum += 1;
      memberCode = `NS-${String(currentMaxCodeNum).padStart(3, '0')}`;
    }

    const nickname = (idxNickname !== -1 ? row[idxNickname] : '').trim();
    const phone = (idxPhone !== -1 ? row[idxPhone] : '').trim();
    const emergencyContact = (idxEmergency !== -1 ? row[idxEmergency] : '').trim();

    // Determine type
    const rawType = (idxType !== -1 ? row[idxType] : '').toLowerCase();
    let type: MembershipType = 'paid_monthly';
    if (rawType.includes('ครั้ง') || rawType.includes('session') || rawType.includes('คูปอง') || rawType.includes('per')) {
      type = 'paid_per_session';
    } else if (rawType.includes('ฟรี') || rawType.includes('สังคม') || rawType.includes('free') || rawType.includes('csr') || rawType.includes('community')) {
      type = 'free_community';
    } else {
      type = 'paid_monthly';
    }

    // Determine status
    const rawStatus = (idxStatus !== -1 ? row[idxStatus] : '').toLowerCase();
    let status: 'active' | 'expired' | 'suspended' = 'active';
    if (rawStatus.includes('หมด') || rawStatus.includes('expire')) {
      status = 'expired';
    } else if (rawStatus.includes('ระงับ') || rawStatus.includes('suspend') || rawStatus.includes('หยุด')) {
      status = 'suspended';
    }

    // Determine discipline
    const rawDiscipline = (idxDiscipline !== -1 ? row[idxDiscipline] : '').toLowerCase();
    let discipline: DisciplineType = 'Muay Thai';
    if (rawDiscipline.includes('bjj') || rawDiscipline.includes('jiu-jitsu') || rawDiscipline.includes('ยิวยิตสู')) {
      discipline = 'Brazilian Jiu-Jitsu (BJJ)';
    } else if (rawDiscipline.includes('box') || rawDiscipline.includes('สากล')) {
      discipline = 'Boxing';
    } else if (rawDiscipline.includes('mma') || rawDiscipline.includes('ผสม')) {
      discipline = 'MMA (Mixed Martial Arts)';
    } else if (rawDiscipline.includes('wrestl') || rawDiscipline.includes('ปล้ำ')) {
      discipline = 'Wrestling & Grappling';
    } else if (rawDiscipline.includes('kid') || rawDiscipline.includes('เด็ก')) {
      discipline = 'Kids Martial Arts';
    } else if (rawDiscipline.includes('all') || rawDiscipline.includes('ทุก') || rawDiscipline.includes('pass')) {
      discipline = 'All-Access Pass';
    } else {
      discipline = 'Muay Thai';
    }

    const beltOrLevel = (idxLevel !== -1 ? row[idxLevel] : '').trim();
    const joinDate = normalizeDate(idxJoinDate !== -1 ? row[idxJoinDate] : '') || todayStr;
    
    // Expire date
    let expireDate = normalizeDate(idxExpireDate !== -1 ? row[idxExpireDate] : undefined);
    if (type === 'paid_monthly' && !expireDate) {
      // Default to 1 month from join date
      try {
        const j = new Date(joinDate);
        j.setMonth(j.getMonth() + 1);
        expireDate = j.toISOString().split('T')[0];
        warnings.push({
          row: rowNumber,
          name,
          message: `ไม่ได้ระบุวันหมดอายุรายเดือน ระบบตั้งให้อัตโนมัติเป็น ${expireDate}`
        });
      } catch {
        expireDate = undefined;
      }
    }

    // Sessions
    const rawSessions = idxSessions !== -1 ? row[idxSessions] : '';
    let remainingSessions = rawSessions && !isNaN(Number(rawSessions)) ? Number(rawSessions) : undefined;
    if (type === 'paid_per_session' && remainingSessions === undefined) {
      remainingSessions = 10;
      warnings.push({
        row: rowNumber,
        name,
        message: 'เป็นสมาชิกลักษณะรายครั้งแต่ไม่ได้ระบุจำนวนครั้ง ระบบตั้งค่าเริ่มต้นเป็น 10 ครั้ง'
      });
    }

    const socialProgramReason = (idxSocialReason !== -1 ? row[idxSocialReason] : '').trim() || undefined;
    if (type === 'free_community' && !socialProgramReason) {
      warnings.push({
        row: rowNumber,
        name,
        message: 'สมาชิกทุนเพื่อสังคมควรมีเหตุผลรับทุน เช่น เยาวชนชุมชน'
      });
    }

    const rawWeight = idxWeight !== -1 ? row[idxWeight] : '';
    const weightKg = rawWeight && !isNaN(Number(rawWeight)) ? Number(rawWeight) : undefined;

    const rawHeight = idxHeight !== -1 ? row[idxHeight] : '';
    const heightCm = rawHeight && !isNaN(Number(rawHeight)) ? Number(rawHeight) : undefined;

    const notes = (idxNotes !== -1 ? row[idxNotes] : '').trim() || undefined;

    // Check duplicate code against existing members
    const existingMatch = existingMembers.find(
      m => m.memberCode.toLowerCase() === memberCode.toLowerCase()
    );
    if (existingMatch) {
      warnings.push({
        row: rowNumber,
        name,
        message: `รหัสสมาชิก ${memberCode} ตรงกับสมาชิกเดิม "${existingMatch.name}" (จะอัปเดตข้อมูลหากเลือกโหมดอัปเดต)`
      });
    }

    validMembers.push({
      id: existingMatch ? existingMatch.id : `mem-csv-${Date.now()}-${lineIdx}`,
      memberCode,
      name,
      nickname: nickname || name.split(' ')[0],
      phone: phone || '-',
      emergencyContact,
      type,
      status,
      discipline,
      beltOrLevel,
      joinDate,
      expireDate,
      remainingSessions,
      totalSessionsAttended: existingMatch ? existingMatch.totalSessionsAttended : 0,
      socialProgramReason,
      weightKg,
      heightCm,
      notes,
      avatarSeed: name
    });
  }

  return {
    validMembers,
    errors,
    warnings,
    totalRows: lines.length - 1
  };
}

export function applyImportMembers(
  existing: Member[], 
  imported: Member[], 
  mode: 'merge' | 'append' | 'skip'
): Member[] {
  if (mode === 'append') {
    let maxCode = existing.reduce((max, m) => {
      const match = m.memberCode?.match(/NS-(\d+)/i);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, existing.length);
    
    const prepared = imported.map((m, idx) => {
      const exists = existing.some(e => e.memberCode.toLowerCase() === m.memberCode.toLowerCase());
      if (exists) {
        maxCode += 1;
        return {
          ...m,
          id: `mem-csv-${Date.now()}-${idx}`,
          memberCode: `NS-${String(maxCode).padStart(3, '0')}`
        };
      }
      return m;
    });
    return [...existing, ...prepared];
  }

  if (mode === 'skip') {
    const existingCodes = new Set(existing.map(m => m.memberCode.toLowerCase()));
    const newOnly = imported.filter(m => !existingCodes.has(m.memberCode.toLowerCase()));
    return [...existing, ...newOnly];
  }

  // mode === 'merge' (default)
  const memberMap = new Map<string, Member>();
  existing.forEach(m => memberMap.set(m.memberCode.toLowerCase(), m));
  
  imported.forEach(m => {
    const key = m.memberCode.toLowerCase();
    const prev = memberMap.get(key);
    if (prev) {
      memberMap.set(key, {
        ...prev,
        ...m,
        id: prev.id, // keep original ID
        totalSessionsAttended: prev.totalSessionsAttended // keep previous attendances
      });
    } else {
      memberMap.set(key, m);
    }
  });

  return Array.from(memberMap.values());
}


