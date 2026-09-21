import React, { useState } from 'react';
import { Coach, DisciplineType, ExpenseRecord, AttendanceRecord } from '../types/gym';
import { formatShortBaht, formatThaiDate } from '../utils/storage';
import { 
  UserCheck, 
  Plus, 
  Phone, 
  Award, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Calendar,
  X,
  Edit2,
  Trash2
} from 'lucide-react';

interface CoachesViewProps {
  coaches: Coach[];
  attendance: AttendanceRecord[];
  expenses: ExpenseRecord[];
  onAddCoach: (coach: Omit<Coach, 'id'>) => void;
  onUpdateCoach: (coach: Coach) => void;
  onDeleteCoach: (coachId: string) => void;
  onPayCoach: (coach: Coach, amount: number, note: string) => void;
}

const DISCIPLINES: DisciplineType[] = [
  'Muay Thai',
  'Brazilian Jiu-Jitsu (BJJ)',
  'Boxing',
  'MMA (Mixed Martial Arts)',
  'Wrestling & Grappling',
  'Kids Martial Arts',
  'All-Access Pass'
];

export const CoachesView: React.FC<CoachesViewProps> = ({
  coaches,
  attendance,
  expenses,
  onAddCoach,
  onUpdateCoach,
  onDeleteCoach,
  onPayCoach
}) => {
  const [filterType, setFilterType] = useState<'all' | 'full_time' | 'part_time'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);

  // Quick Pay Modal State
  const [payingCoach, setPayingCoach] = useState<Coach | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNote, setPayNote] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [employmentType, setEmploymentType] = useState<'full_time' | 'part_time'>('full_time');
  const [selectedDisciplines, setSelectedDisciplines] = useState<DisciplineType[]>(['Muay Thai']);
  const [monthlySalary, setMonthlySalary] = useState<number>(25000);
  const [hourlyRate, setHourlyRate] = useState<number>(500);
  const [achievements, setAchievements] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const filteredCoaches = coaches.filter(c => {
    if (filterType === 'all') return true;
    return c.employmentType === filterType;
  });

  const openAddModal = () => {
    setEditingCoach(null);
    setName('');
    setNickname('');
    setPhone('');
    setEmploymentType('full_time');
    setSelectedDisciplines(['Muay Thai']);
    setMonthlySalary(25000);
    setHourlyRate(500);
    setAchievements('');
    setBankAccount('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Coach) => {
    setEditingCoach(c);
    setName(c.name);
    setNickname(c.nickname);
    setPhone(c.phone);
    setEmploymentType(c.employmentType);
    setSelectedDisciplines(c.disciplines);
    setMonthlySalary(c.monthlySalary || 25000);
    setHourlyRate(c.hourlyRate || 500);
    setAchievements(c.achievements || '');
    setBankAccount(c.bankAccount || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoach) {
      onUpdateCoach({
        ...editingCoach,
        name,
        nickname,
        phone,
        employmentType,
        disciplines: selectedDisciplines,
        monthlySalary: employmentType === 'full_time' ? Number(monthlySalary) : undefined,
        hourlyRate: employmentType === 'part_time' ? Number(hourlyRate) : undefined,
        achievements,
        bankAccount
      });
    } else {
      const nextCode = `CR-${String(coaches.length + 1).padStart(2, '0')}`;
      onAddCoach({
        coachCode: nextCode,
        name,
        nickname,
        phone,
        employmentType,
        disciplines: selectedDisciplines,
        monthlySalary: employmentType === 'full_time' ? Number(monthlySalary) : undefined,
        hourlyRate: employmentType === 'part_time' ? Number(hourlyRate) : undefined,
        status: 'active',
        achievements,
        joinDate: new Date().toISOString().split('T')[0],
        bankAccount
      });
    }
    setIsModalOpen(false);
  };

  const handleOpenPay = (c: Coach) => {
    setPayingCoach(c);
    if (c.employmentType === 'full_time') {
      setPayAmount(c.monthlySalary || 25000);
      setPayNote(`เงินเดือนประจำเดือน สำหรับ ${c.name}`);
    } else {
      // Calculate part-time hours from attendance
      const sessions = attendance.filter(a => a.coachId === c.id).length;
      const calculated = (sessions || 1) * (c.hourlyRate || 500);
      setPayAmount(calculated);
      setPayNote(`ค่าสอนพาร์ทไทม์ (${sessions} คลาส x ${c.hourlyRate || 500}฿) สำหรับ ${c.name}`);
    }
  };

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCoach) return;
    onPayCoach(payingCoach, payAmount, payNote);
    setPayingCoach(null);
  };

  const toggleDiscipline = (d: DisciplineType) => {
    if (selectedDisciplines.includes(d)) {
      if (selectedDisciplines.length > 1) {
        setSelectedDisciplines(selectedDisciplines.filter(item => item !== d));
      }
    } else {
      setSelectedDisciplines([...selectedDisciplines, d]);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="coaches-view-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center">
            <UserCheck className="w-6 h-6 mr-2 text-amber-400" />
            ระบบทะเบียนโค้ช & ครูฝึกสอน (Coaches Registry)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            จัดการข้อมูลโค้ชประจำ (Full-time) และพาร์ทไทม์ (Part-time) อัตราค่าจ้าง และการเบิกจ่าย
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
          id="add-coach-btn"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          เพิ่มโค้ช / ครูฝึกใหม่
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          ทั้งหมด ({coaches.length})
        </button>
        <button
          onClick={() => setFilterType('full_time')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'full_time'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          โค้ชประจำ Full-time ({coaches.filter(c => c.employmentType === 'full_time').length})
        </button>
        <button
          onClick={() => setFilterType('part_time')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === 'part_time'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          โค้ชพาร์ทไทม์ Part-time ({coaches.filter(c => c.employmentType === 'part_time').length})
        </button>
      </div>

      {/* Coaches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="coaches-list-grid">
        {filteredCoaches.map((coach) => {
          // Count total classes taught from attendance
          const coachAttendanceRecords = attendance.filter(a => a.coachId === coach.id);
          const sessionsCount = coachAttendanceRecords.length;

          // Coach expenses history
          const coachExpenses = expenses.filter(e => e.coachId === coach.id);
          const totalPaidToCoach = coachExpenses.reduce((acc, curr) => acc + curr.amount, 0);

          return (
            <div
              key={coach.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
              id={`coach-card-${coach.id}`}
            >
              <div>
                {/* Top Badge & Code */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {coach.coachCode}
                  </span>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    coach.employmentType === 'full_time'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                      : 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                  }`}>
                    {coach.employmentType === 'full_time' ? (
                      <>
                        <Briefcase className="w-3 h-3 mr-1" /> ประจำ (Full-time)
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" /> พาร์ทไทม์ (Part-time)
                      </>
                    )}
                  </span>
                </div>

                {/* Name & Title */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {coach.name}
                    </h3>
                    <p className="text-xs text-amber-400 mt-0.5">
                      ชื่อเรียก: <strong className="text-white">{coach.nickname}</strong>
                    </p>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-base">
                    {coach.nickname ? coach.nickname.charAt(0) : coach.name.charAt(0)}
                  </div>
                </div>

                {/* Disciplines Chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {coach.disciplines.map(d => (
                    <span key={d} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Achievements */}
                {coach.achievements && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
                    <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{coach.achievements}</span>
                  </div>
                )}

                {/* Pay Rate Box */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/90">
                  <div>
                    <span className="text-slate-500 block">
                      {coach.employmentType === 'full_time' ? 'ฐานเงินเดือนประจำ' : 'ค่าสอนต่อชั่วโมง/คลาส'}
                    </span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {coach.employmentType === 'full_time' 
                        ? formatShortBaht(coach.monthlySalary || 0) + ' / ด.'
                        : formatShortBaht(coach.hourlyRate || 0) + ' / คลาส'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">สอนไปแล้วในระบบ</span>
                    <span className="text-base font-bold text-white font-mono">
                      {sessionsCount} ครั้ง
                    </span>
                  </div>
                </div>

                {/* Account info */}
                {coach.bankAccount && (
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center">
                    <CreditCard className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    <span>โอนเงิน: {coach.bankAccount}</span>
                  </div>
                )}
              </div>

              {/* Card Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(coach)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="แก้ไขข้อมูลโค้ช"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`ต้องการลบโค้ช ${coach.name} ใช่หรือไม่?`)) {
                        onDeleteCoach(coach.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                    title="ลบข้อมูลโค้ช"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenPay(coach)}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95"
                  id={`pay-coach-btn-${coach.id}`}
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1" />
                  จ่ายค่าจ้าง / บันทึกรายจ่าย
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pay Coach Modal */}
      {payingCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <DollarSign className="w-5 h-5 text-emerald-400 mr-1" />
                บันทึกจ่ายเงินค่าจ้างโค้ช
              </h3>
              <button onClick={() => setPayingCoach(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPay} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <p className="font-bold text-white text-sm">{payingCoach.name} ({payingCoach.nickname})</p>
                <p className="text-slate-400 mt-0.5">
                  ประเภท: {payingCoach.employmentType === 'full_time' ? 'ประจำ (Full-time)' : 'พาร์ทไทม์ (Part-time)'}
                </p>
                {payingCoach.bankAccount && (
                  <p className="text-amber-400 text-[11px] mt-1">บัญชีรับเงิน: {payingCoach.bankAccount}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">จำนวนเงินที่จ่าย (บาท) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-mono font-bold text-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">รายละเอียด / หมายเหตุ *</label>
                <textarea
                  rows={2}
                  required
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingCoach(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  ยืนยันการจ่ายเงิน (ลงรายจ่ายยิม)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Coach Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <h3 className="text-base font-bold text-white">
                {editingCoach ? 'แก้ไขข้อมูลโค้ช' : 'เพิ่มทะเบียนโค้ช / ครูฝึกสอนใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น ครูเดช นักรบไทย"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ชื่อเรียก / ชื่อเล่น *</label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="เช่น ครูเดช, โค้ชก้อง"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">เบอร์โทรศัพท์ *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">เลขที่บัญชีธนาคาร</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="เช่น กสิกรไทย 012-3-45678-9"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">รูปแบบการจ้างงาน *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmploymentType('full_time')}
                    className={`p-2.5 rounded-xl text-center border font-medium transition-all ${
                      employmentType === 'full_time'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    โค้ชประจำ (Full-time)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmploymentType('part_time')}
                    className={`p-2.5 rounded-xl text-center border font-medium transition-all ${
                      employmentType === 'part_time'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    โค้ชพาร์ทไทม์ (Part-time)
                  </button>
                </div>
              </div>

              {/* Salary / Rate */}
              {employmentType === 'full_time' ? (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">เงินเดือนประจำ (บาท/เดือน) *</label>
                  <input
                    type="number"
                    required
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">อัตราค่าสอนต่อชั่วโมง/ต่อคลาส (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              )}

              {/* Disciplines checkbox */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">วิชาที่รับผิดชอบสอน (เลือกได้หลายวิชา)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DISCIPLINES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDiscipline(d)}
                      className={`p-2 rounded-lg text-left text-[11px] border transition-all ${
                        selectedDisciplines.includes(d)
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ผลงาน / ดีกรี / ประสบการณ์</label>
                <textarea
                  rows={2}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="เช่น อดีตแชมป์เวทีมวยราชดำเนิน, BJJ Black Belt จากบราซิล"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  {editingCoach ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มโค้ช'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
