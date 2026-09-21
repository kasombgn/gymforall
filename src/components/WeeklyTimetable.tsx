import React, { useState } from 'react';
import { TrainingClassSession, Coach, DisciplineType, GymUser } from '../types/gym';
import { DAY_OPTIONS } from '../utils/scheduleHelpers';
import { 
  Clock, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  Plus, 
  Repeat, 
  X, 
  Filter
} from 'lucide-react';

interface WeeklyTimetableProps {
  classes: TrainingClassSession[];
  coaches: Coach[];
  onOpenAddClassForDay: (dayNumber: number) => void;
  onOpenCheckInForClass: (session: TrainingClassSession) => void;
  onPromptDelete: (cls: TrainingClassSession) => void;
  currentUser?: GymUser;
}

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  classes,
  coaches,
  onOpenAddClassForDay,
  onOpenCheckInForClass,
  onPromptDelete,
  currentUser
}) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedCoachId, setSelectedCoachId] = useState<string>('all');

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    if (selectedDiscipline !== 'all' && cls.discipline !== selectedDiscipline) return false;
    if (selectedCoachId !== 'all' && cls.coachId !== selectedCoachId) return false;
    return true;
  });

  // Helper to extract day of week from YYYY-MM-DD
  const getDayOfWeek = (dateStr: string): number => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDay(); // 0 = Sun, 1 = Mon...
  };

  // Group by day of week (Monday 1 to Sunday 0)
  // To avoid duplicate representation for multiple recurring instances of the exact same regular schedule,
  // we can group unique time slots or display the scheduled classes
  const getClassesForDay = (dayNum: number) => {
    // Collect all classes falling on this day of week
    const dayClasses = filteredClasses.filter(c => getDayOfWeek(c.date) === dayNum);
    
    // Sort by startTime
    return dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Discipline list for filtering
  const allDisciplines = Array.from(new Set(classes.map(c => c.discipline)));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5" id="weekly-timetable-view">
      
      {/* Top Controls & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-2"></span>
            ตารางเรียนประจำสัปดาห์ (Weekly Master Timetable)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ภาพรวมผังคลาสเรียนและเวลาสอนตลอดทั้ง 7 วันของค่ายฝึก
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">ทุกวิชาการต่อสู้</option>
              {allDisciplines.map(d => (
                <option key={d} value={d} className="bg-slate-900">{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">โค้ชทั้งหมด</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.name} ({c.nickname})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 7 Columns Grid for Monday -> Sunday */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAY_OPTIONS.map((dayOpt) => {
          const dayClasses = getClassesForDay(dayOpt.day);
          const isWeekend = dayOpt.day === 6 || dayOpt.day === 0;

          // Deduplicate classes with same title, time, and coach to show clean recurring schedule
          // while tracking how many dates they run
          const uniqueSlotMap = new Map<string, { cls: TrainingClassSession; count: number; dates: string[] }>();
          
          dayClasses.forEach(item => {
            const key = `${item.title}-${item.startTime}-${item.endTime}-${item.coachId}`;
            const existing = uniqueSlotMap.get(key);
            if (existing) {
              existing.count += 1;
              existing.dates.push(item.date);
            } else {
              uniqueSlotMap.set(key, { cls: item, count: 1, dates: [item.date] });
            }
          });

          const slots = Array.from(uniqueSlotMap.values());

          return (
            <div 
              key={`day-col-${dayOpt.day}`}
              className={`flex flex-col rounded-xl border p-3 min-h-[340px] ${
                isWeekend 
                  ? 'bg-slate-950/60 border-slate-800/80' 
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div>
                  <span className={`text-sm font-bold ${
                    dayOpt.day === 0 ? 'text-red-400' :
                    dayOpt.day === 6 ? 'text-amber-400' :
                    'text-white'
                  }`}>
                    {dayOpt.label}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase ml-1.5">
                    ({dayOpt.en})
                  </span>
                </div>

                <button
                  onClick={() => onOpenAddClassForDay(dayOpt.day)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                  title={`เพิ่มคลาสในวัน${dayOpt.label}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slot Items */}
              <div className="space-y-2.5 flex-1">
                {slots.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-center text-slate-600">
                    <Clock className="w-5 h-5 mb-1.5 opacity-30" />
                    <span className="text-[11px]">ไม่มีคลาสในวัน{dayOpt.short}</span>
                  </div>
                ) : (
                  slots.map(({ cls, count }) => (
                    <div
                      key={`slot-${cls.id}`}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 transition-all text-xs space-y-1.5 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-white text-xs leading-tight">
                          {cls.title}
                        </span>
                        {cls.recurrenceId && (
                          <span 
                            className="shrink-0 ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center"
                            title="คลาสประจำตามตาราง (Recurring)"
                          >
                            <Repeat className="w-2.5 h-2.5 mr-0.5" />
                            {count} คลาส
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-[11px] font-mono text-amber-300 font-semibold">
                        <Clock className="w-3 h-3 mr-1 text-slate-400" />
                        {cls.startTime} - {cls.endTime}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                        <span className="truncate max-w-[100px] text-slate-300 font-medium">
                          {cls.coachName}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {cls.location}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => onOpenCheckInForClass(cls)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        >
                          เช็คอิน
                        </button>
                        
                        <button
                          onClick={() => onPromptDelete(cls)}
                          className="text-slate-500 hover:text-red-400 p-0.5 transition-colors"
                          title="ลบคลาสนี้"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Day footer count */}
              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-center">
                รวม {slots.length} ช่วงเวลา
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
