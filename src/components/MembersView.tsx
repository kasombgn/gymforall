import React, { useState } from 'react';
import { Member, DisciplineType, MembershipType, AttendanceRecord, PaymentTransaction, CompetitionRecord, GymUser, GymSettings } from '../types/gym';
import { formatShortBaht, formatThaiDate, getMemberMedalStats } from '../utils/storage';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  HeartHandshake, 
  Calendar, 
  Clock, 
  Phone, 
  Dumbbell, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  Star, 
  FileText,
  Edit2,
  Trash2,
  QrCode,
  Trophy,
  Award,
  Medal,
  Swords,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { MemberCardModal } from './MemberCardModal';
import { CompetitionModal } from './CompetitionModal';
import { ImportMembersModal } from './ImportMembersModal';

interface MembersViewProps {
  members: Member[];
  attendance: AttendanceRecord[];
  payments: PaymentTransaction[];
  competitions?: CompetitionRecord[];
  onAddMember: (member: Omit<Member, 'id' | 'totalSessionsAttended'>) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onImportMembers?: (imported: Member[], mode: 'merge' | 'append' | 'skip') => void;
  onOpenCheckInForMember: (memberId: string) => void;
  onOpenPaymentForMember: (member: Member) => void;
  onViewReceipt: (transaction: PaymentTransaction) => void;
  onAddCompetition?: (record: Omit<CompetitionRecord, 'id' | 'createdAt'>) => void;
  onUpdateCompetition?: (record: CompetitionRecord) => void;
  onDeleteCompetition?: (recordId: string) => void;
  currentUser?: GymUser;
  settings?: GymSettings;
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

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  attendance,
  payments,
  competitions = [],
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onImportMembers,
  onOpenCheckInForMember,
  onOpenPaymentForMember,
  onViewReceipt,
  onAddCompetition,
  onUpdateCompetition,
  onDeleteCompetition,
  currentUser = {
    id: 'u-1',
    email: 'sudtheerug@gmail.com',
    name: 'Sudtheerug',
    role: 'admin',
    createdAt: new Date().toISOString(),
    status: 'active'
  },
  settings
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [cardModalMember, setCardModalMember] = useState<Member | null>(null);
  const [isImportCSVModalOpen, setIsImportCSVModalOpen] = useState<boolean>(false);

  // Competition Modal state
  const [isCompModalOpen, setIsCompModalOpen] = useState<boolean>(false);
  const [editingComp, setEditingComp] = useState<CompetitionRecord | null>(null);
  const [compPreselectedMemberId, setCompPreselectedMemberId] = useState<string | undefined>(undefined);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmergency, setFormEmergency] = useState('');
  const [formType, setFormType] = useState<MembershipType>('paid_monthly');
  const [formDiscipline, setFormDiscipline] = useState<DisciplineType>('Muay Thai');
  const [formBeltOrLevel, setFormBeltOrLevel] = useState('ระดับพื้นฐาน');
  const [formJoinDate, setFormJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpireDate, setFormExpireDate] = useState('');
  const [formRemainingSessions, setFormRemainingSessions] = useState<number>(10);
  const [formSocialReason, setFormSocialReason] = useState('');
  const [formWeight, setFormWeight] = useState<number | undefined>(65);
  const [formHeight, setFormHeight] = useState<number | undefined>(170);
  const [formNotes, setFormNotes] = useState('');

  // Members with competition records count
  const competitorMemberIds = new Set(competitions.map(c => c.memberId));

  // Filter members
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'paid_monthly') return m.type === 'paid_monthly';
    if (filterType === 'paid_per_session') return m.type === 'paid_per_session';
    if (filterType === 'free_community') return m.type === 'free_community';
    if (filterType === 'expired') return m.status === 'expired';
    if (filterType === 'competitors') return competitorMemberIds.has(m.id);
    return true;
  });

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormNickname('');
    setFormPhone('');
    setFormEmergency('');
    setFormType('paid_monthly');
    setFormDiscipline('Muay Thai');
    setFormBeltOrLevel('ระดับพื้นฐาน');
    setFormJoinDate(new Date().toISOString().split('T')[0]);
    
    // Auto set expire 30 days from now for monthly
    const exp = new Date();
    exp.setDate(exp.getDate() + 30);
    setFormExpireDate(exp.toISOString().split('T')[0]);
    setFormRemainingSessions(10);
    setFormSocialReason('');
    setFormWeight(65);
    setFormHeight(170);
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormNickname(m.nickname);
    setFormPhone(m.phone);
    setFormEmergency(m.emergencyContact);
    setFormType(m.type);
    setFormDiscipline(m.discipline);
    setFormBeltOrLevel(m.beltOrLevel);
    setFormJoinDate(m.joinDate);
    setFormExpireDate(m.expireDate || '');
    setFormRemainingSessions(m.remainingSessions ?? 10);
    setFormSocialReason(m.socialProgramReason || '');
    setFormWeight(m.weightKg);
    setFormHeight(m.heightCm);
    setFormNotes(m.notes || '');
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      const updated: Member = {
        ...editingMember,
        name: formName,
        nickname: formNickname,
        phone: formPhone,
        emergencyContact: formEmergency,
        type: formType,
        discipline: formDiscipline,
        beltOrLevel: formBeltOrLevel,
        joinDate: formJoinDate,
        expireDate: formType === 'paid_monthly' ? formExpireDate : undefined,
        remainingSessions: formType === 'paid_per_session' ? Number(formRemainingSessions) : undefined,
        socialProgramReason: formType === 'free_community' ? formSocialReason : undefined,
        weightKg: formWeight ? Number(formWeight) : undefined,
        heightCm: formHeight ? Number(formHeight) : undefined,
        notes: formNotes
      };
      onUpdateMember(updated);
      if (selectedMember?.id === updated.id) {
        setSelectedMember(updated);
      }
    } else {
      const nextCode = `NS-${String(members.length + 1).padStart(3, '0')}`;
      onAddMember({
        memberCode: nextCode,
        name: formName,
        nickname: formNickname,
        phone: formPhone,
        emergencyContact: formEmergency,
        type: formType,
        status: 'active',
        discipline: formDiscipline,
        beltOrLevel: formBeltOrLevel,
        joinDate: formJoinDate,
        expireDate: formType === 'paid_monthly' ? formExpireDate : undefined,
        remainingSessions: formType === 'paid_per_session' ? Number(formRemainingSessions) : undefined,
        socialProgramReason: formType === 'free_community' ? formSocialReason : undefined,
        weightKg: formWeight ? Number(formWeight) : undefined,
        heightCm: formHeight ? Number(formHeight) : undefined,
        notes: formNotes
      });
    }
    setIsAddModalOpen(false);
  };

  // Competition handlers
  const handleOpenAddCompetition = (memId?: string) => {
    setEditingComp(null);
    setCompPreselectedMemberId(memId || selectedMember?.id);
    setIsCompModalOpen(true);
  };

  const handleOpenEditCompetition = (rec: CompetitionRecord) => {
    setEditingComp(rec);
    setCompPreselectedMemberId(rec.memberId);
    setIsCompModalOpen(true);
  };

  const handleSaveCompetitionRecord = (record: Omit<CompetitionRecord, 'id' | 'createdAt'>, recordId?: string) => {
    if (recordId) {
      if (onUpdateCompetition) {
        onUpdateCompetition({
          ...record,
          id: recordId
        });
      }
    } else {
      if (onAddCompetition) {
        onAddCompetition(record);
      }
    }
  };

  // Get member-specific records
  const memberAttendance = selectedMember ? attendance.filter(a => a.memberId === selectedMember.id) : [];
  const memberPayments = selectedMember ? payments.filter(p => p.memberId === selectedMember.id) : [];
  const memberCompetitions = selectedMember ? competitions.filter(c => c.memberId === selectedMember.id) : [];
  const selectedMemberMedals = selectedMember ? getMemberMedalStats(competitions, selectedMember.id) : null;

  return (
    <div className="space-y-6 pb-12" id="members-view-container">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center">
            <Users className="w-6 h-6 mr-2 text-amber-400" />
            ระบบทะเบียนสมาชิกโรงยิม (Members)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            จัดการข้อมูลสมาชิกรายเดือน รายครั้ง และสมาชิกทุนฟรีเพื่อสังคม (CSR) พร้อมเหรียญรางวัลและประวัติการแข่งขัน
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsImportCSVModalOpen(true)}
            className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm transition-all active:scale-95"
            id="import-members-csv-top-btn"
            title="นำเข้าข้อมูลสมาชิกผ่านไฟล์ CSV พร้อมมีแม่แบบให้ดาวน์โหลด"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-400" />
            นำเข้า CSV
          </button>

          <button
            onClick={() => handleOpenAddCompetition()}
            className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm transition-all active:scale-95"
            id="add-competition-top-btn"
            title="บันทึกผลการแข่งขันและเหรียญรางวัล"
          >
            <Trophy className="w-4 h-4 mr-1.5 text-amber-400" />
            บันทึกผลแข่งขัน & เหรียญ
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
            id="add-member-top-btn"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            ลงทะเบียนสมาชิกใหม่
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {[
            { id: 'all', label: `ทั้งหมด (${members.length})` },
            { id: 'paid_monthly', label: `รายเดือน (${members.filter(m => m.type === 'paid_monthly').length})` },
            { id: 'paid_per_session', label: `รายครั้ง/คูปอง (${members.filter(m => m.type === 'paid_per_session').length})` },
            { id: 'free_community', label: `ฟรีเพื่อสังคม (${members.filter(m => m.type === 'free_community').length})` },
            { id: 'competitors', label: `🏆 นักกีฬาแข่งขัน (${competitorMemberIds.size})` },
            { id: 'expired', label: `หมดอายุ (${members.filter(m => m.status === 'expired').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, ชื่อเล่น, รหัส, เบอร์โทร..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="members-list-grid">
        {filteredMembers.map((member) => {
          const isExpired = member.status === 'expired';
          return (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl relative flex flex-col justify-between ${
                isExpired ? 'border-red-800/40 hover:border-red-700' : 'border-slate-800 hover:border-slate-700'
              }`}
              id={`member-card-${member.id}`}
            >
              <div>
                {/* Card Top: Code & Badge */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {member.memberCode}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCardModalMember(member);
                      }}
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/50 transition-colors"
                      title="พิมพ์บัตรสมาชิก & QR Code สำหรับเช็คอิน"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {member.type === 'free_community' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/50">
                      <HeartHandshake className="w-3 h-3 mr-1" /> ฟรีเพื่อสังคม (CSR)
                    </span>
                  ) : member.type === 'paid_per_session' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/50">
                      <Clock className="w-3 h-3 mr-1" /> รายครั้ง ({member.remainingSessions ?? 0} ครั้ง)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                      <CheckCircle className="w-3 h-3 mr-1" /> รายเดือน
                    </span>
                  )}
                </div>

                {/* Name & Discipline */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400">
                      {member.name} {member.nickname && <span className="text-slate-400">({member.nickname})</span>}
                    </h3>
                    <p className="text-xs font-medium text-amber-400/90 mt-0.5">{member.discipline}</p>
                    <p className="text-[11px] text-slate-400">{member.beltOrLevel}</p>
                  </div>
                  
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                    {member.nickname ? member.nickname.charAt(0) : member.name.charAt(0)}
                  </div>
                </div>

                {/* Status and dates */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>เข้าซ้อมสะสม:</span>
                    <span className="font-semibold text-white">{member.totalSessionsAttended} ครั้ง</span>
                  </div>

                  {member.type === 'paid_monthly' && member.expireDate && (
                    <div className="flex justify-between">
                      <span>หมดอายุ:</span>
                      <span className={`font-semibold ${isExpired ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                        {formatThaiDate(member.expireDate)}
                        {isExpired && ' (หมดอายุแล้ว)'}
                      </span>
                    </div>
                  )}

                  {member.type === 'paid_per_session' && (
                    <div className="flex justify-between">
                      <span>สิทธิ์คงเหลือ:</span>
                      <span className="font-semibold text-amber-400">{member.remainingSessions ?? 0} ครั้ง</span>
                    </div>
                  )}

                  {member.type === 'free_community' && member.socialProgramReason && (
                    <p className="text-[11px] text-purple-300 italic line-clamp-1">
                      {member.socialProgramReason}
                    </p>
                  )}

                  {/* Cumulative Medals on card */}
                  {(() => {
                    const stats = getMemberMedalStats(competitions, member.id);
                    if (stats.total === 0) return null;
                    return (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-amber-400 font-semibold flex items-center">
                          <Trophy className="w-3.5 h-3.5 mr-1 text-amber-400" />
                          เหรียญรางวัล:
                        </span>
                        <div className="flex items-center space-x-1.5 font-bold font-mono text-xs">
                          <span className="inline-flex items-center text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30" title={`เหรียญทอง ${stats.gold} เหรียญ`}>
                            🥇 {stats.gold}
                          </span>
                          <span className="inline-flex items-center text-slate-200 bg-slate-400/10 px-1.5 py-0.5 rounded border border-slate-400/30" title={`เหรียญเงิน ${stats.silver} เหรียญ`}>
                            🥈 {stats.silver}
                          </span>
                          <span className="inline-flex items-center text-amber-500 bg-amber-700/10 px-1.5 py-0.5 rounded border border-amber-700/30" title={`เหรียญทองแดง ${stats.bronze} เหรียญ`}>
                            🥉 {stats.bronze}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Card Footer Quick Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardModalMember(member);
                  }}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition-all active:scale-95"
                  title="พิมพ์บัตรสมาชิก & สร้าง QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1" />
                  บัตรสมาชิก & QR
                </button>

                <span className="inline-flex items-center text-slate-300 hover:text-amber-400 font-semibold text-xs">
                  ดูประวัติ & รายละเอียด <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Details Modal (Detailed Training History & Payment History) */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" id="member-detail-backdrop">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" id="member-detail-dialog">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg font-bold">
                  {selectedMember.nickname ? selectedMember.nickname.charAt(0) : selectedMember.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedMember.name} {selectedMember.nickname && `(${selectedMember.nickname})`}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {selectedMember.memberCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedMember.discipline} • {selectedMember.beltOrLevel}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCardModalMember(selectedMember)}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                  title="พิมพ์บัตรสมาชิกพร้อม QR Code"
                >
                  <QrCode className="w-4 h-4 mr-1.5 text-amber-400" />
                  พิมพ์บัตรสมาชิก & QR
                </button>
                <button
                  onClick={() => openEditModal(selectedMember)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="แก้ไขข้อมูลสมาชิก"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`ต้องการลบข้อมูลสมาชิก ${selectedMember.name} ใช่หรือไม่?`)) {
                      onDeleteMember(selectedMember.id);
                      setSelectedMember(null);
                    }
                  }}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                  title="ลบสมาชิก"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Member Quick Bio Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">เบอร์โทรศัพท์</span>
                  <span className="font-medium text-white">{selectedMember.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ติดต่อฉุกเฉิน</span>
                  <span className="font-medium text-white">{selectedMember.emergencyContact || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">น้ำหนัก / ส่วนสูง</span>
                  <span className="font-medium text-white">
                    {selectedMember.weightKg ? `${selectedMember.weightKg} kg` : '-'} / {selectedMember.heightCm ? `${selectedMember.heightCm} cm` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันที่เริ่มฝึก</span>
                  <span className="font-medium text-white">{formatThaiDate(selectedMember.joinDate)}</span>
                </div>
              </div>

              {/* Free Social Box */}
              {selectedMember.type === 'free_community' && (
                <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs space-y-1">
                  <div className="flex items-center text-purple-300 font-bold">
                    <HeartHandshake className="w-4 h-4 mr-1.5" />
                    โครงการศิลปะการต่อสู้เพื่อสังคม (CSR Free Scholarship)
                  </div>
                  <p className="text-slate-300">{selectedMember.socialProgramReason}</p>
                </div>
              )}

              {/* Action Buttons for this member */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    const memId = selectedMember.id;
                    setSelectedMember(null);
                    onOpenCheckInForMember(memId);
                  }}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                >
                  <Dumbbell className="w-3.5 h-3.5 mr-1.5" />
                  เช็คอินเข้าเรียน
                </button>

                <button
                  onClick={() => {
                    const mem = selectedMember;
                    setSelectedMember(null);
                    onOpenPaymentForMember(mem);
                  }}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  ต่ออายุ / รับชำระเงิน
                </button>

                <button
                  onClick={() => {
                    setCardModalMember(selectedMember);
                  }}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 shadow-sm transition-all"
                  id="view-member-card-modal-btn"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5" />
                  บัตรสมาชิก & QR Code
                </button>

                <button
                  onClick={() => handleOpenAddCompetition(selectedMember.id)}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm transition-all"
                  id="record-comp-member-detail-btn"
                >
                  <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  + บันทึกผลการแข่งขัน & เหรียญ
                </button>
              </div>

              {/* Section: Competition History & Accolades */}
              <div className="space-y-4" id="member-competitions-section">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Trophy className="w-4 h-4 mr-1.5 text-amber-400" />
                    ประวัติการแข่งขันและเหรียญรางวัลสะสม ({memberCompetitions.length} รายการ)
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenAddCompetition(selectedMember.id)}
                    className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    เพิ่มผลการแข่งขัน
                  </button>
                </div>

                {/* 3 Medal Highlights KPIs */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {/* Gold */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-slate-900 border border-amber-500/40 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-2xl sm:text-3xl mb-0.5">🥇</span>
                    <span className="text-lg sm:text-2xl font-black font-mono text-amber-300">
                      {selectedMemberMedals?.gold ?? 0}
                    </span>
                    <span className="text-[11px] font-bold text-amber-400 mt-0.5">เหรียญทอง</span>
                    <span className="text-[9px] text-amber-300/70 hidden sm:inline">ชนะเลิศอันดับ 1</span>
                  </div>

                  {/* Silver */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-slate-400/20 via-slate-500/10 to-slate-900 border border-slate-400/40 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-2xl sm:text-3xl mb-0.5">🥈</span>
                    <span className="text-lg sm:text-2xl font-black font-mono text-slate-100">
                      {selectedMemberMedals?.silver ?? 0}
                    </span>
                    <span className="text-[11px] font-bold text-slate-200 mt-0.5">เหรียญเงิน</span>
                    <span className="text-[9px] text-slate-400 hidden sm:inline">รองชนะเลิศอันดับ 1</span>
                  </div>

                  {/* Bronze */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-br from-amber-800/30 via-amber-900/10 to-slate-900 border border-amber-700/40 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-2xl sm:text-3xl mb-0.5">🥉</span>
                    <span className="text-lg sm:text-2xl font-black font-mono text-amber-400">
                      {selectedMemberMedals?.bronze ?? 0}
                    </span>
                    <span className="text-[11px] font-bold text-amber-500 mt-0.5">เหรียญทองแดง</span>
                    <span className="text-[9px] text-amber-600/80 hidden sm:inline">อันดับ 3</span>
                  </div>
                </div>

                {/* Competition Records List */}
                {memberCompetitions.length === 0 ? (
                  <div className="p-6 text-center bg-slate-800/30 border border-dashed border-slate-800 rounded-xl space-y-2">
                    <Trophy className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs text-slate-400">
                      ยังไม่มีประวัติการแข่งขันสำหรับสมาชิกท่านนี้
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddCompetition(selectedMember.id)}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      บันทึกผลการแข่งขันนัดแรก
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {memberCompetitions.map((comp) => {
                      const isGold = comp.medal === 'gold';
                      const isSilver = comp.medal === 'silver';
                      const isBronze = comp.medal === 'bronze';
                      const isParticipant = comp.medal === 'participant';

                      return (
                        <div
                          key={comp.id}
                          className={`p-3.5 rounded-xl border text-xs transition-all ${
                            isGold
                              ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                              : isSilver
                              ? 'bg-slate-800/60 border-slate-400/30'
                              : isBronze
                              ? 'bg-amber-900/15 border-amber-700/30'
                              : 'bg-slate-800/40 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xl bg-slate-900/80 border border-slate-700 shadow-inner">
                                {isGold && '🥇'}
                                {isSilver && '🥈'}
                                {isBronze && '🥉'}
                                {isParticipant && '🎖️'}
                                {comp.medal === 'none' && '🥋'}
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center flex-wrap gap-1.5">
                                  <span className="font-bold text-white text-sm">
                                    {comp.tournamentName}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    ({formatThaiDate(comp.date)})
                                  </span>
                                </div>

                                <div className="flex items-center flex-wrap gap-2 text-[11px]">
                                  <span className="text-amber-400 font-semibold">
                                    {comp.discipline}
                                  </span>
                                  {comp.division && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-slate-300">รุ่น: {comp.division}</span>
                                    </>
                                  )}
                                  {comp.awardTitle && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className={`font-bold ${isGold ? 'text-amber-300' : isSilver ? 'text-slate-200' : 'text-amber-500'}`}>
                                        {comp.awardTitle}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {(comp.matchResult || comp.opponent) && (
                                  <div className="text-[11px] text-slate-300 flex items-center space-x-1.5 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-800">
                                    <Swords className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>
                                      {comp.matchResult && <strong className="text-white font-medium">{comp.matchResult}</strong>}
                                      {comp.opponent && <span className="text-slate-400"> (พบ: {comp.opponent})</span>}
                                    </span>
                                  </div>
                                )}

                                {comp.location && (
                                  <p className="text-[11px] text-slate-400 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                                    {comp.location}
                                  </p>
                                )}

                                {comp.notes && (
                                  <p className="text-[11px] text-slate-300 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
                                    "{comp.notes}"
                                  </p>
                                )}

                                {comp.recordedBy && (
                                  <p className="text-[10px] text-slate-500 pt-0.5">
                                    บันทึกข้อมูลโดย: {comp.recordedBy}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions (Edit / Delete) */}
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCompetition(comp)}
                                className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 transition-colors"
                                title="แก้ไขผลการแข่งขัน"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`ยืนยันการลบผลการแข่งขัน "${comp.tournamentName}" หรือไม่?`)) {
                                    onDeleteCompetition?.(comp.id);
                                  }
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                                title="ลบข้อมูลการแข่งขัน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 1: Attendance & Training History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Dumbbell className="w-4 h-4 mr-1.5 text-amber-400" />
                    ประวัติการเข้าเรียน ({memberAttendance.length} ครั้ง)
                  </h4>
                </div>

                {memberAttendance.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">ยังไม่มีประวัติการเช็คอินเข้าเรียน</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {memberAttendance.map((att) => (
                      <div key={att.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 text-xs flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white">{att.sessionTitle || att.discipline}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-amber-400">โค้ช: {att.coachName}</span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            เวลา: {att.timeSlot} • {formatThaiDate(att.date)}
                          </p>
                          {att.trainingNotes && (
                            <p className="text-slate-300 text-[11px] italic mt-1 bg-slate-900/60 p-1.5 rounded">
                              "{att.trainingNotes}"
                            </p>
                          )}
                        </div>
                        <div className="flex text-amber-400 space-x-0.5 shrink-0 ml-2">
                          {Array.from({ length: att.performanceRating || 4 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Payment History & Receipts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <CreditCard className="w-4 h-4 mr-1.5 text-emerald-400" />
                    ประวัติการชำระเงิน & ใบเสร็จ ({memberPayments.length} รายการ)
                  </h4>
                </div>

                {memberPayments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">ยังไม่มีประวัติการชำระเงิน</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {memberPayments.map((pay) => (
                      <div key={pay.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white">{pay.planName}</span>
                            <span className="font-mono text-amber-400 text-[11px]">({pay.receiptNo})</span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            วันที่: {formatThaiDate(pay.date)} • ผู้รับ: {pay.collectedBy}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-emerald-400 text-sm font-mono">
                            {formatShortBaht(pay.amount)}
                          </span>
                          <button
                            onClick={() => onViewReceipt(pay)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          >
                            พิมพ์ใบเสร็จ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <h3 className="text-base font-bold text-white">
                {editingMember ? 'แก้ไขข้อมูลสมาชิก' : 'ลงทะเบียนสมาชิกใหม่'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น สมชาย นักสู้ใจเด็ด"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ชื่อเล่น *</label>
                  <input
                    type="text"
                    required
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    placeholder="เช่น ชาย, บอย, แพรว"
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
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">เบอร์ติดต่อฉุกเฉิน</label>
                  <input
                    type="text"
                    value={formEmergency}
                    onChange={(e) => setFormEmergency(e.target.value)}
                    placeholder="08X-XXX-XXXX (ผู้ปกครอง/ญาติ)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Membership Type selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ประเภทสมาชิก *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'paid_monthly', label: 'รายเดือน (Monthly)' },
                    { id: 'paid_per_session', label: 'รายครั้ง (Punch Pass)' },
                    { id: 'free_community', label: 'ฟรี-เพื่อสังคม (CSR)' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormType(t.id as MembershipType)}
                      className={`py-2 px-2 rounded-xl text-center font-medium border transition-all ${
                        formType === t.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic inputs based on membership type */}
              {formType === 'paid_monthly' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">วันหมดอายุสมาชิก (30 วัน)</label>
                  <input
                    type="date"
                    value={formExpireDate}
                    onChange={(e) => setFormExpireDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              {formType === 'paid_per_session' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">จำนวนครั้งฝึกซ้อมเริ่มต้น</label>
                  <input
                    type="number"
                    value={formRemainingSessions}
                    onChange={(e) => setFormRemainingSessions(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              {formType === 'free_community' && (
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">เหตุผลรับทุนกิจกรรมเพื่อสังคม (CSR)</label>
                  <input
                    type="text"
                    value={formSocialReason}
                    onChange={(e) => setFormSocialReason(e.target.value)}
                    placeholder="เช่น ทุนเยาวชนชุมชนท้องถิ่น โครงการกีฬาต้านยาเสพติด"
                    className="w-full bg-slate-800 border border-purple-800/60 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              {/* Discipline and Belt */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">วิชาการต่อสู้หลัก</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">ระดับ / สาย</label>
                  <input
                    type="text"
                    value={formBeltOrLevel}
                    onChange={(e) => setFormBeltOrLevel(e.target.value)}
                    placeholder="เช่น ระดับพื้นฐาน, สายขาว, สายน้ำเงิน"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Physical stats */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">น้ำหนักตัว (กก.)</label>
                  <input
                    type="number"
                    value={formWeight || ''}
                    onChange={(e) => setFormWeight(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="เช่น 65"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ส่วนสูง (ซม.)</label>
                  <input
                    type="number"
                    value={formHeight || ''}
                    onChange={(e) => setFormHeight(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="เช่น 175"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">หมายเหตุ / เป้าหมายการฝึก</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="เช่น ต้องการลดน้ำหนัก หรือเตรียมตัวขึ้นชกสมัครเล่น"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  {editingMember ? 'บันทึกการแก้ไข' : 'ยืนยันลงทะเบียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Card & QR Code Modal */}
      <MemberCardModal
        isOpen={!!cardModalMember}
        onClose={() => setCardModalMember(null)}
        member={cardModalMember}
        competitions={competitions}
        settings={settings}
      />

      {/* Competition Record & Medal Modal */}
      <CompetitionModal
        isOpen={isCompModalOpen}
        onClose={() => {
          setIsCompModalOpen(false);
          setEditingComp(null);
          setCompPreselectedMemberId(undefined);
        }}
        onSave={handleSaveCompetitionRecord}
        members={members}
        initialRecord={editingComp}
        preselectedMemberId={compPreselectedMemberId}
        currentUser={currentUser}
      />

      {/* CSV Member Import Modal */}
      <ImportMembersModal
        isOpen={isImportCSVModalOpen}
        onClose={() => setIsImportCSVModalOpen(false)}
        existingMembers={members}
        onImportSuccess={(imported, mode) => {
          if (onImportMembers) {
            onImportMembers(imported, mode);
          }
        }}
      />

    </div>
  );
};
