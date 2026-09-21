import React, { useState, useEffect } from 'react';
import { CompetitionRecord, Member, MedalType, DisciplineType, GymUser } from '../types/gym';
import { 
  Trophy, 
  Award, 
  Calendar, 
  X, 
  MapPin, 
  Swords, 
  FileText, 
  Check, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface CompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<CompetitionRecord, 'id' | 'createdAt'>, recordId?: string) => void;
  members: Member[];
  initialRecord?: CompetitionRecord | null;
  preselectedMemberId?: string;
  currentUser: GymUser;
}

const DISCIPLINES: DisciplineType[] = [
  'Muay Thai',
  'Brazilian Jiu-Jitsu (BJJ)',
  'Boxing',
  'MMA (Mixed Martial Arts)',
  'Wrestling & Grappling',
  'Kids Martial Arts'
];

export const CompetitionModal: React.FC<CompetitionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  members,
  initialRecord,
  preselectedMemberId,
  currentUser
}) => {
  const [memberId, setMemberId] = useState<string>('');
  const [tournamentName, setTournamentName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [discipline, setDiscipline] = useState<string>('Muay Thai');
  const [division, setDivision] = useState<string>('');
  const [medal, setMedal] = useState<MedalType>('gold');
  const [awardTitle, setAwardTitle] = useState<string>('');
  const [opponent, setOpponent] = useState<string>('');
  const [matchResult, setMatchResult] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialRecord) {
      setMemberId(initialRecord.memberId);
      setTournamentName(initialRecord.tournamentName);
      setDate(initialRecord.date);
      setDiscipline(initialRecord.discipline);
      setDivision(initialRecord.division || '');
      setMedal(initialRecord.medal);
      setAwardTitle(initialRecord.awardTitle || '');
      setOpponent(initialRecord.opponent || '');
      setMatchResult(initialRecord.matchResult || '');
      setLocation(initialRecord.location || '');
      setNotes(initialRecord.notes || '');
    } else {
      setMemberId(preselectedMemberId || (members[0]?.id ?? ''));
      setTournamentName('');
      setDate(new Date().toISOString().split('T')[0]);
      setDiscipline('Muay Thai');
      setDivision('');
      setMedal('gold');
      setAwardTitle('ชนะเลิศเหรียญทอง');
      setOpponent('');
      setMatchResult('');
      setLocation('');
      setNotes('');
    }
    setError('');
  }, [initialRecord, preselectedMemberId, members, isOpen]);

  // When medal changes, suggest default award title if empty or default
  const handleMedalChange = (newMedal: MedalType) => {
    setMedal(newMedal);
    if (!initialRecord) {
      if (newMedal === 'gold') setAwardTitle('ชนะเลิศเหรียญทอง (Champion)');
      else if (newMedal === 'silver') setAwardTitle('รองชนะเลิศอันดับ 1 เหรียญเงิน (1st Runner-up)');
      else if (newMedal === 'bronze') setAwardTitle('อันดับ 3 เหรียญทองแดง (Bronze Medalist)');
      else if (newMedal === 'participant') setAwardTitle('เกียรติบัตรเข้าร่วมการแข่งขัน / รางวัลพิเศษ');
      else setAwardTitle('เข้าร่วมการแข่งขัน');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      setError('กรุณาเลือกสมาชิก/นักกีฬา');
      return;
    }
    if (!tournamentName.trim()) {
      setError('กรุณาระบุชื่อการแข่งขัน');
      return;
    }
    if (!date) {
      setError('กรุณาระบุวันที่แข่งขัน');
      return;
    }

    const selectedMember = members.find(m => m.id === memberId);

    onSave({
      memberId,
      memberName: selectedMember ? `${selectedMember.name} (${selectedMember.nickname})` : '',
      tournamentName: tournamentName.trim(),
      date,
      discipline,
      division: division.trim(),
      medal,
      awardTitle: awardTitle.trim(),
      opponent: opponent.trim(),
      matchResult: matchResult.trim(),
      location: location.trim(),
      notes: notes.trim(),
      recordedBy: currentUser.name
    }, initialRecord?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" id="competition-modal-backdrop">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" id="competition-modal-dialog">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialRecord ? 'แก้ไขประวัติการแข่งขัน' : 'บันทึกประวัติการแข่งขัน & เหรียญรางวัล'}
              </h3>
              <p className="text-xs text-slate-400">
                สะสมเกียรติประวัติ เหรียญรางวัล และผลการแข่งขันของสมาชิก
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-xs text-red-300 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              สมาชิก / นักกีฬา *
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              disabled={!!preselectedMemberId && !initialRecord}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-75"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.nickname}) - {m.memberCode} [{m.discipline}]
                </option>
              ))}
            </select>
          </div>

          {/* Medal Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              เหรียญรางวัลที่ได้รับ *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Gold Medal */}
              <button
                type="button"
                onClick={() => handleMedalChange('gold')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  medal === 'gold'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl mb-1">🥇</span>
                <span className="font-bold text-xs">เหรียญทอง</span>
                <span className="text-[10px] text-amber-400/90 font-mono">ชนะเลิศอันดับ 1</span>
              </button>

              {/* Silver Medal */}
              <button
                type="button"
                onClick={() => handleMedalChange('silver')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  medal === 'silver'
                    ? 'bg-slate-300/20 border-slate-300 text-slate-100 ring-2 ring-slate-300/40 shadow-md shadow-slate-300/20'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl mb-1">🥈</span>
                <span className="font-bold text-xs">เหรียญเงิน</span>
                <span className="text-[10px] text-slate-300 font-mono">รองชนะเลิศอันดับ 1</span>
              </button>

              {/* Bronze Medal */}
              <button
                type="button"
                onClick={() => handleMedalChange('bronze')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  medal === 'bronze'
                    ? 'bg-amber-700/30 border-amber-600 text-amber-200 ring-2 ring-amber-600/40 shadow-md shadow-amber-700/20'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl mb-1">🥉</span>
                <span className="font-bold text-xs">เหรียญทองแดง</span>
                <span className="text-[10px] text-amber-500/90 font-mono">อันดับ 3</span>
              </button>

              {/* Participant / Other */}
              <button
                type="button"
                onClick={() => handleMedalChange('participant')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  medal === 'participant'
                    ? 'bg-purple-950/50 border-purple-400 text-purple-200 ring-2 ring-purple-400/40'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl mb-1">🎖️</span>
                <span className="font-bold text-xs">เกียรติบัตร / พิเศษ</span>
                <span className="text-[10px] text-purple-300 font-mono">รางวัลพิเศษ</span>
              </button>
            </div>
          </div>

          {/* Tournament Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ชื่อรายการแข่งขัน / ทัวร์นาเมนต์ *
            </label>
            <input
              type="text"
              required
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="เช่น ศึกมวยไทยสมัครเล่นชิงแชมป์ประเทศไทย 2026, Thailand BJJ Open"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Award Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ชื่อรางวัล / ผลการแข่งขันอย่างเป็นทางการ
            </label>
            <input
              type="text"
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              placeholder="เช่น ชนะเลิศเหรียญทองรุ่นเวลเตอร์เวท, นักชกดุเดือดประจำทัวร์นาเมนต์"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Date, Discipline, Division */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                วันที่แข่งขัน *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ประเภทกีฬา
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {DISCIPLINES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                รุ่น / พิกัดน้ำหนัก
              </label>
              <input
                type="text"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="เช่น ไม่เกิน 68 กก. / สายขาว"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Match Result & Opponent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ผลการชก / การแข่งขัน
              </label>
              <input
                type="text"
                value={matchResult}
                onChange={(e) => setMatchResult(e.target.value)}
                placeholder="เช่น ชนะน็อก TKO ยก 2, ชนะคะแนน 30-27, ชนะ Submission (Armbar)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                คู่ชก / คู่แข่งขันรอบชิง
              </label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="เช่น เดชา เกียรติชัย (ค่ายสิงห์มวยไทย)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Location / Stadium */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              สถานที่แข่งขัน / สนามแข่งขัน
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น อาคารกีฬานิมิบุตร, สนามมวยเวิลด์สยาม, ศูนย์กีฬาเยาวชนฯ"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              บันทึกรายละเอียด / ข้อแนะนำการพัฒนา
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="บันทึกข้อสังเกต ฟอร์มการชก หรือเทคนิคที่ควรฝึกซ้อมเพิ่มเติม..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center"
            >
              <Check className="w-4 h-4 mr-1.5" />
              {initialRecord ? 'บันทึกการแก้ไข' : 'บันทึกประวัติการแข่งขัน'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
