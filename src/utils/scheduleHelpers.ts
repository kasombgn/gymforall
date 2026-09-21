import { DisciplineType } from '../types/gym';

export interface DayOption {
  day: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  label: string;
  short: string;
  en: string;
}

export const DAY_OPTIONS: DayOption[] = [
  { day: 1, label: 'จันทร์', short: 'จ.', en: 'Mon' },
  { day: 2, label: 'อังคาร', short: 'อ.', en: 'Tue' },
  { day: 3, label: 'พุธ', short: 'พ.', en: 'Wed' },
  { day: 4, label: 'พฤหัสบดี', short: 'พฤ.', en: 'Thu' },
  { day: 5, label: 'ศุกร์', short: 'ศ.', en: 'Fri' },
  { day: 6, label: 'เสาร์', short: 'ส.', en: 'Sat' },
  { day: 0, label: 'อาทิตย์', short: 'อา.', en: 'Sun' },
];

export interface ClassSchedulePreset {
  id: string;
  title: string;
  discipline: DisciplineType;
  startTime: string;
  endTime: string;
  capacity: number;
  location: string;
  selectedDays: number[];
  description: string;
}

export const POPULAR_CLASS_PRESETS: ClassSchedulePreset[] = [
  {
    id: 'muay-thai-evening',
    title: 'มวยไทยรอบเย็น (Evening Muay Thai)',
    discipline: 'Muay Thai',
    startTime: '17:00',
    endTime: '18:30',
    capacity: 16,
    location: 'เวทีมวยหลัก 1',
    selectedDays: [1, 3, 5], // จันทร์, พุธ, ศุกร์
    description: 'วอร์มอัพ สเต็ปเท้า ล่อเป้า เตะกระสอบ และซ้อมปล้ำกอดคอตีเข่า'
  },
  {
    id: 'bjj-evening',
    title: 'Brazilian Jiu-Jitsu (BJJ Gi & No-Gi)',
    discipline: 'Brazilian Jiu-Jitsu (BJJ)',
    startTime: '18:30',
    endTime: '20:00',
    capacity: 14,
    location: 'เบาะ BJJ โซน A',
    selectedDays: [2, 4, 6], // อังคาร, พฤหัส, เสาร์
    description: 'Drills เทคนิคการควบคุม Guard Pass, Submissions และ Free Sparring'
  },
  {
    id: 'boxing-morning',
    title: 'มวยสากล Boxing ปรับสเต็ป & คาร์ดิโอเช้า',
    discipline: 'Boxing',
    startTime: '07:30',
    endTime: '09:00',
    capacity: 12,
    location: 'โซนกระสอบทราย & ฟิตเนส',
    selectedDays: [1, 2, 3, 4, 5], // จันทร์ - ศุกร์
    description: 'พื้นฐาน Footwork, ปล่อยหมัด 1-2 คอมโบ และออกกำลังกายเพิ่มความทนทาน'
  },
  {
    id: 'mma-afternoon',
    title: 'MMA Pro & Fighter Training Camp',
    discipline: 'MMA (Mixed Martial Arts)',
    startTime: '15:30',
    endTime: '17:00',
    capacity: 10,
    location: 'กรงแปดเหลี่ยม MMA Cage',
    selectedDays: [1, 3, 5], // จันทร์, พุธ, ศุกร์
    description: 'Cage work, Takedown defense, Wall-walk และ Ground and Pound'
  },
  {
    id: 'kids-weekend',
    title: 'Kids Martial Arts ศิลปะการต่อสู้เยาวชน',
    discipline: 'Kids Martial Arts',
    startTime: '10:00',
    endTime: '11:30',
    capacity: 15,
    location: 'เบาะฝึกโซนเด็ก',
    selectedDays: [6, 0], // เสาร์, อาทิตย์
    description: 'ฝึกการทรงตัว วินัย ป้องกันตัว และสร้างความมั่นใจสำหรับเด็ก 6-14 ปี'
  }
];

/**
 * Calculates real calendar dates for repeating schedules
 */
export function computeRecurringDates(
  startDateStr: string,
  selectedDays: number[], // 0 = Sun, 1 = Mon, ..., 6 = Sat
  durationWeeks: number,
  customEndDateStr?: string,
  endMode: 'weeks' | 'date' = 'weeks'
): string[] {
  if (!startDateStr || selectedDays.length === 0) return [];

  const dates: string[] = [];
  const [startY, startM, startD] = startDateStr.split('-').map(Number);
  const start = new Date(startY, startM - 1, startD, 0, 0, 0);

  let end: Date;
  if (endMode === 'date' && customEndDateStr) {
    const [endY, endM, endD] = customEndDateStr.split('-').map(Number);
    end = new Date(endY, endM - 1, endD, 23, 59, 59);
  } else {
    end = new Date(start);
    end.setDate(end.getDate() + (durationWeeks * 7));
  }

  // Iterate from start to end
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon, ...
    if (selectedDays.includes(dayOfWeek)) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Summarize selected days in Thai
 */
export function formatSelectedDaysSummary(selectedDays: number[]): string {
  if (selectedDays.length === 0) return 'ยังไม่ได้เลือกวัน';
  if (selectedDays.length === 7) return 'ทุกวัน (จันทร์ - อาทิตย์)';
  
  const isWeekdays = selectedDays.length === 5 && 
    [1, 2, 3, 4, 5].every(d => selectedDays.includes(d));
  if (isWeekdays) return 'ทุกวันธรรมดา (จันทร์ - ศุกร์)';

  const isWeekends = selectedDays.length === 2 && 
    selectedDays.includes(6) && selectedDays.includes(0);
  if (isWeekends) return 'เฉพาะเสาร์ - อาทิตย์';

  const isMWF = selectedDays.length === 3 &&
    selectedDays.includes(1) && selectedDays.includes(3) && selectedDays.includes(5);
  if (isMWF) return 'ทุกวัน จันทร์, พุธ, ศุกร์';

  const isTTS = selectedDays.length === 3 &&
    selectedDays.includes(2) && selectedDays.includes(4) && selectedDays.includes(6);
  if (isTTS) return 'ทุกวัน อังคาร, พฤหัสบดี, เสาร์';

  // Sort by Mon (1) to Sun (0)
  const sorted = [...selectedDays].sort((a, b) => {
    const normA = a === 0 ? 7 : a;
    const normB = b === 0 ? 7 : b;
    return normA - normB;
  });

  return sorted.map(d => DAY_OPTIONS.find(opt => opt.day === d)?.short || '').join(', ');
}
