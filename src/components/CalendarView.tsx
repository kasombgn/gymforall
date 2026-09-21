import React, { useState, useEffect } from 'react';
import { TrainingClassSession, AttendanceRecord, Coach, Member, DisciplineType, GymUser } from '../types/gym';
import { formatThaiDate } from '../utils/storage';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Users, 
  Clock, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  HeartHandshake, 
  Sparkles, 
  X,
  Dumbbell,
  Lock
} from 'lucide-react';

interface CalendarViewProps {
  classes: TrainingClassSession[];
  attendance: AttendanceRecord[];
  coaches: Coach[];
  members: Member[];
  onAddClass: (session: Omit<TrainingClassSession, 'id' | 'enrolledMemberIds'>) => void;
  onOpenCheckInForClass: (session: TrainingClassSession) => void;
  onDeleteClass: (classId: string) => void;
  currentUser?: GymUser;
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

export const CalendarView: React.FC<CalendarViewProps> = ({
  classes,
  attendance,
  coaches,
  members,
  onAddClass,
  onOpenCheckInForClass,
  onDeleteClass,
  currentUser
}) => {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 0-indexed: 8 is September
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-09-20');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState<boolean>(false);

  const initialCoachId = currentUser?.role === 'coach' && currentUser.coachId
    ? currentUser.coachId
    : coaches[0]?.id || '';

  // Form states for new class schedule
  const [formTitle, setFormTitle] = useState('');
  const [formDiscipline, setFormDiscipline] = useState<DisciplineType>('Muay Thai');
  const [formCoachId, setFormCoachId] = useState(initialCoachId);
  const [formDate, setFormDate] = useState('2026-09-20');
  const [formStartTime, setFormStartTime] = useState('17:00');
  const [formEndTime, setFormEndTime] = useState('18:30');
  const [formCapacity, setFormCapacity] = useState<number>(15);
  const [formLocation, setFormLocation] = useState('เวทีมวยหลัก 1');
  const [formIsSocial, setFormIsSocial] = useState(false);
  const [formDescription, setFormDescription] = useState('');

  // Synchronize coachId when modal opens or user changes
  useEffect(() => {
    if (currentUser?.role === 'coach' && currentUser.coachId) {
      setFormCoachId(currentUser.coachId);
    }
  }, [currentUser, isAddClassModalOpen]);

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const openAddModal = (dateStr?: string) => {
    const targetDate = dateStr || selectedDateStr;
    setFormDate(targetDate);
    setFormTitle('มวยไทยรอบเย็น (Evening Muay Thai)');
    setFormDiscipline('Muay Thai');
    setFormCoachId(coaches[0]?.id || '');
    setFormStartTime('17:00');
    setFormEndTime('18:30');
    setFormCapacity(15);
    setFormLocation('เวทีมวยหลัก 1');
    setFormIsSocial(false);
    setFormDescription('');
    setIsAddClassModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coach = coaches.find(c => c.id === formCoachId);

    onAddClass({
      title: formTitle,
      discipline: formDiscipline,
      coachId: formCoachId,
      coachName: coach?.name || 'โค้ชประจำ',
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      maxCapacity: Number(formCapacity),
      isSocialProgram: formIsSocial,
      location: formLocation,
      description: formDescription || undefined
    });

    setIsAddClassModalOpen(false);
  };

  // Selected date data
  const dayClasses = classes.filter(c => c.date === selectedDateStr);
  const dayAttendance = attendance.filter(a => a.date === selectedDateStr);

  return (
    <div className="space-y-6 pb-12" id="calendar-view-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center">
            <CalendarIcon className="w-6 h-6 mr-2 text-amber-400" />
            ปฏิทินกิจกรรมการฝึกสอน & ยอดผู้เรียนรายวัน
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            ตารางคลาสฝึกศิลปะการต่อสู้ ครูผู้สอน สถานที่ฝึก และยอดผู้เข้าเรียนในแต่ละวัน
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
          id="add-class-schedule-btn"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          เพิ่มตารางคลาสฝึกซ้อม
        </button>
      </div>

      {/* Main Grid: Calendar on Left, Selected Day Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Monthly Calendar (7 cols on large screens) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          
          {/* Calendar Navigation Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {monthNamesThai[currentMonth]} {currentYear + 543}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {currentYear}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => {
                  setCurrentYear(2026);
                  setCurrentMonth(8);
                  setSelectedDateStr('2026-09-20');
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                วันนี้
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 pb-2">
            <span className="text-red-400">อา.</span>
            <span>จ.</span>
            <span>อ.</span>
            <span>พ.</span>
            <span>พฤ.</span>
            <span>ศ.</span>
            <span className="text-amber-400">ส.</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank padding cells before day 1 */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-20 sm:h-24 bg-slate-950/40 rounded-xl border border-transparent opacity-30" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === '2026-09-20';

              // Get day count
              const dayAttendeeCount = attendance.filter(a => a.date === dateStr).length;
              const scheduledClasses = classes.filter(c => c.date === dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 sm:h-24 p-1.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                      : isToday
                      ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-800/30 border-slate-800/70 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                  id={`calendar-cell-${dateStr}`}
                >
                  {/* Day number & Today marker */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${
                      isSelected ? 'text-amber-400' : isToday ? 'text-white' : 'text-slate-300'
                    }`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="วันนี้" />
                    )}
                  </div>

                  {/* Badges for Attendees & Classes */}
                  <div className="space-y-1">
                    {dayAttendeeCount > 0 && (
                      <div className="px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/50 text-[10px] font-bold text-emerald-300 truncate text-center">
                        ผู้เรียน {dayAttendeeCount} คน
                      </div>
                    )}

                    {scheduledClasses.length > 0 && (
                      <div className="space-y-0.5 hidden sm:block">
                        {scheduledClasses.slice(0, 1).map(c => (
                          <div 
                            key={c.id} 
                            className={`text-[9px] px-1 py-0.2 rounded truncate ${
                              c.isSocialProgram ? 'bg-purple-900/60 text-purple-200' : 'bg-slate-700/60 text-slate-300'
                            }`}
                          >
                            {c.startTime} {c.title.split(' ')[0]}
                          </div>
                        ))}
                        {scheduledClasses.length > 1 && (
                          <span className="text-[9px] text-slate-400 block text-right font-medium">
                            +{scheduledClasses.length - 1} คลาส
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right: Selected Date Breakdown & Actions (5 cols on large screens) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Header Card for Selected Date */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  รายละเอียดประจำวัน
                </span>
                <h3 className="text-lg font-bold text-white">
                  {formatThaiDate(selectedDateStr)}
                </h3>
              </div>

              <button
                onClick={() => openAddModal(selectedDateStr)}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                id="add-class-to-selected-day-btn"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-amber-400" />
                เพิ่มคลาสวันนี้
              </button>
            </div>

            {/* Daily stats tally */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-400 block">ยอดผู้เข้าเรียนวันนี้</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-xl font-bold font-mono text-emerald-400">{dayAttendance.length}</span>
                  <span className="text-slate-400">คน</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <span className="text-slate-400 block">คลาสที่เปิดสอน</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-xl font-bold font-mono text-amber-400">{dayClasses.length}</span>
                  <span className="text-slate-400">รอบ</span>
                </div>
              </div>
            </div>

            {/* Classes Scheduled for Today */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                คลาสการฝึกสอนในวันนี้ ({dayClasses.length})
              </h4>

              {dayClasses.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  ไม่มีคลาสเรียนที่กำหนดไว้ในวันที่นี้
                </div>
              ) : (
                <div className="space-y-3">
                  {dayClasses.map((cls) => (
                    <div 
                      key={cls.id}
                      className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{cls.title}</span>
                            {cls.isSocialProgram && (
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-purple-900 text-purple-200">
                                ฟรีเพื่อสังคม (CSR)
                              </span>
                            )}
                          </div>
                          <span className="text-amber-400 font-medium block mt-0.5">{cls.discipline}</span>
                        </div>

                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {cls.startTime} - {cls.endTime}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                        <div className="flex items-center space-x-1">
                          <UserCheck className="w-3 h-3 text-slate-500" />
                          <span>โค้ช: <strong className="text-slate-200">{cls.coachName}</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{cls.location}</span>
                        </div>
                      </div>

                      {cls.description && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-1.5 rounded">
                          {cls.description}
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-slate-700/50">
                        <span className="text-[11px] text-slate-400">
                          ความจุ: {cls.maxCapacity} คน
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onOpenCheckInForClass(cls)}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            เช็คอินเข้าเรียน
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`ต้องการลบคลาส "${cls.title}" ใช่หรือไม่?`)) {
                                onDeleteClass(cls.id);
                              }
                            }}
                            className="p-1 rounded text-slate-500 hover:text-red-400"
                            title="ลบคลาสนี้"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students who checked in on this date */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                รายชื่อผู้เช็คอินเข้าเรียนวันนี้ ({dayAttendance.length})
              </h4>

              {dayAttendance.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">ยังไม่มีการเช็คอินในวันนี้</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {dayAttendance.map((att) => (
                    <div 
                      key={att.id}
                      className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-semibold text-white">{att.memberName}</span>
                        {att.memberNickname && <span className="text-slate-400 text-[11px]"> ({att.memberNickname})</span>}
                        <span className="text-slate-400 text-[11px] block">{att.timeSlot} • {att.discipline}</span>
                      </div>
                      <span className="text-amber-400 text-[11px] font-medium">
                        โค้ช {att.coachName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Add Class Schedule Modal */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <h3 className="text-base font-bold text-white flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-amber-400" />
                เพิ่มตารางคลาสฝึกซ้อมใหม่ในปฏิทิน
              </h3>
              <button onClick={() => setIsAddClassModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อคลาสการฝึกสอน *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="เช่น มวยไทยรอบเย็น, BJJ No-Gi Sparring, ซ้อมชกสากล"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">วิชาการต่อสู้ *</label>
                  <select
                    value={formDiscipline}
                    onChange={(e) => setFormDiscipline(e.target.value as DisciplineType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {DISCIPLINES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold text-xs">โค้ชผู้ฝึกสอน *</label>
                    {currentUser?.role === 'coach' && (
                      <span className="text-[10px] text-cyan-400 font-bold flex items-center bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                        <Lock className="w-2.5 h-2.5 mr-0.5" /> ล็อกชื่อตามสิทธิ์
                      </span>
                    )}
                  </div>

                  {currentUser?.role === 'coach' ? (
                    <div>
                      <div className="w-full bg-slate-950 border border-cyan-500/60 rounded-xl px-3 py-2 text-white flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                          <span className="font-bold text-xs text-cyan-300 truncate">
                            {coaches.find(c => c.id === formCoachId)?.name || 'โค้ชประจำตัว'} ({coaches.find(c => c.id === formCoachId)?.nickname || ''})
                          </span>
                        </div>
                        <span className="text-[10px] text-cyan-400/80 font-mono shrink-0 ml-1">
                          🔒 ล็อก
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        * ป้องกันการสร้างคลาสในนามโค้ชท่านอื่น
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formCoachId}
                      onChange={(e) => setFormCoachId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {coaches.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.nickname})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">วันที่สอน *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">เวลาเริ่ม *</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">เวลาสิ้นสุด *</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">สถานที่ฝึก / โซนยิม *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="เช่น เวทีมวย 1, เบาะ BJJ, กรง MMA"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ความจุผู้เรียนสูงสุด (คน)</label>
                  <input
                    type="number"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Social program toggle */}
              <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-purple-200 block">คลาสฟรีเพื่อสังคม (CSR Scholarship)</span>
                  <span className="text-[11px] text-purple-300">เปิดสอนฟรีสำหรับเด็กเยาวชนและผู้ได้รับทุนยิม</span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsSocial}
                  onChange={(e) => setFormIsSocial(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">คำอธิบายคลาส / เทคนิคที่ฝึก</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="เช่น ฝึกสเต็ปเท้า วอร์มอัพ ล่อเป้า และซ้อมปล้ำกอดคอตีเข่า..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  บันทึกลงปฏิทิน
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
