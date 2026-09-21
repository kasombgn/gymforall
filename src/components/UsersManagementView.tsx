import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserPlus, 
  Mail, 
  Key, 
  Lock, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ShieldAlert,
  Search,
  Check,
  X,
  Palette,
  Eye,
  Building2
} from 'lucide-react';
import { GymUser, Coach, UserRole, GymSettings } from '../types/gym';
import { formatThaiDate } from '../utils/storage';
import { GymLogo, DEFAULT_GYM_SETTINGS } from './GymLogo';

interface UsersManagementViewProps {
  users: GymUser[];
  coaches: Coach[];
  currentUser: GymUser;
  onAddUser: (newUser: Omit<GymUser, 'id' | 'createdAt'>) => void;
  onUpdateUser: (updatedUser: GymUser) => void;
  onDeleteUser: (userId: string) => void;
  settings?: GymSettings;
  onOpenBrandingModal?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  coaches,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  settings = DEFAULT_GYM_SETTINGS,
  onOpenBrandingModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'coach'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<GymUser | null>(null);

  // Form State
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('coach');
  const [formCoachId, setFormCoachId] = useState<string>(coaches[0]?.id || '');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormEmail('');
    setFormName('');
    setFormRole('coach');
    setFormCoachId(coaches[0]?.id || '');
    setFormStatus('active');
    setFormError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setEditingUser(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: GymUser) => {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormName(user.name);
    setFormRole(user.role);
    setFormCoachId(user.coachId || coaches[0]?.id || '');
    setFormStatus(user.status);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const email = formEmail.trim().toLowerCase();
    const name = formName.trim();

    if (!email || !name) {
      setFormError('กรุณากรอกอีเมลและชื่อผู้ใช้งานให้ครบถ้วน');
      return;
    }

    if (!email.includes('@')) {
      setFormError('กรุณากรอกรูปแบบอีเมล Google ให้ถูกต้อง (เช่น name@gmail.com)');
      return;
    }

    // Check duplicate email
    if (!editingUser) {
      const exists = users.some(u => u.email.toLowerCase() === email);
      if (exists) {
        setFormError('อีเมล Google นี้ได้รับสิทธิ์ในระบบอยู่แล้ว');
        return;
      }

      onAddUser({
        email,
        name,
        role: formRole,
        coachId: formRole === 'coach' ? formCoachId : undefined,
        status: formStatus
      });
    } else {
      const exists = users.some(u => u.email.toLowerCase() === email && u.id !== editingUser.id);
      if (exists) {
        setFormError('อีเมล Google นี้ซ้ำกับบัญชีอื่นในระบบ');
        return;
      }

      onUpdateUser({
        ...editingUser,
        email,
        name,
        role: formRole,
        coachId: formRole === 'coach' ? formCoachId : undefined,
        status: formStatus
      });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getCoach = (coachId?: string) => {
    if (!coachId) return null;
    return coaches.find(c => c.id === coachId);
  };

  return (
    <div className="space-y-6 pb-12" id="users-management-view-container">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> สิทธิ์ผู้ดูแลระบบ (Admin Only)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center">
            <Lock className="w-6 h-6 mr-2 text-amber-400" />
            การตั้งค่าระบบ & สิทธิ์ผู้ใช้งาน (Gym Settings & Roles)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-3xl">
            ปรับแต่งชื่อแอป โลโก้ประจำค่ายมวย และผูกบัญชี Google Account กับบทบาทในโรงยิมเพื่อควบคุมสิทธิ์การเข้าถึงอย่างปลอดภัย
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {onOpenBrandingModal && (
            <button
              onClick={onOpenBrandingModal}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 shadow-md transition-all active:scale-95"
              id="open-branding-settings-btn"
            >
              <Palette className="w-4 h-4 mr-1.5" />
              เปลี่ยนชื่อแอป & โลโก้
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
            id="add-new-user-btn"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            เพิ่มผู้ใช้งาน
          </button>
        </div>
      </div>

      {/* Gym Branding Showcase Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <GymLogo settings={settings} size="lg" className="shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white tracking-wide">
                  {settings.appName} {settings.appNameHighlight}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {settings.tagline || 'ค่ายมวย & โรงยิม'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{settings.subDescription || 'ระบบบริหารโรงยิมและค่ายฝึกสอนครบวงจร'}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2">
                <span>📞 โทร: {settings.phone || '02-999-8888'}</span>
                <span>📍 ที่อยู่: {settings.address || 'อาคารนวมทอง สุขุมวิท กรุงเทพฯ'}</span>
                <span>🏷️ รูปแบบโลโก้: {settings.logoType === 'custom_image' ? 'รูปภาพกำหนดเอง' : 'ไอคอนสัญลักษณ์'}</span>
              </div>
            </div>
          </div>

          {onOpenBrandingModal && (
            <button
              onClick={onOpenBrandingModal}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              แก้ไขข้อมูล & สลับโลโก้
            </button>
          )}
        </div>
      </div>

      {/* Security Rule Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-300">สิทธิ์ผู้ดูแลระบบ (Admin)</h4>
            <p className="text-slate-400">
              เข้าถึงได้ทุกหน้าในระบบ: ดูรายรับ-รายจ่ายยิม, จัดการสัญญาโค้ช, จัดการสิทธิ์ผู้ใช้งาน, สำรอง/กู้คืนข้อมูล และสามารถเลือกบันทึกในนามโค้ชท่านใดก็ได้
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-cyan-300">สิทธิ์โค้ชผู้สอน (Coach)</h4>
            <p className="text-slate-400">
              ระบบจะซ่อนเมนูค่าใช้จ่ายยิมและจัดการสิทธิ์อัตโนมัติ และเมื่อทำการเช็คอินเข้าเรียน ระบบจะ<strong>ล็อกชื่อโค้ชประจำตัว</strong>ตามบัญชี Google ของท่าน เพื่อความโปร่งใส ป้องกันการใส่ชื่อผิด และป้องกันการทุจริตค่าสอน
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ Google Email..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">บทบาท:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                roleFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ทั้งหมด ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                roleFilter === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin ({users.filter(u => u.role === 'admin').length})
            </button>
            <button
              onClick={() => setRoleFilter('coach')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                roleFilter === 'coach' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Coach ({users.filter(u => u.role === 'coach').length})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">ผู้ใช้งาน (Google Account)</th>
                <th className="py-3.5 px-4">บทบาท (Role)</th>
                <th className="py-3.5 px-4">ผูกกับโปรไฟล์โค้ชในระบบ</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((user) => {
                const isCurrent = user.id === currentUser.id;
                const coach = getCoach(user.coachId);

                return (
                  <tr key={user.id} className={`hover:bg-slate-800/40 transition-colors ${isCurrent ? 'bg-amber-500/5' : ''}`}>
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-amber-400 shrink-0">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">{user.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.2 rounded-full">
                                คุณ (ใช้งานอยู่)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-mono mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3.5 px-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> ผู้ดูแลระบบ (Admin)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          <UserCheck className="w-3.5 h-3.5 mr-1" /> โค้ชผู้สอน (Coach)
                        </span>
                      )}
                    </td>

                    {/* Linked Coach Profile */}
                    <td className="py-3.5 px-4">
                      {user.role === 'coach' ? (
                        coach ? (
                          <div className="inline-flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-bold text-white">{coach.name}</span>
                            <span className="text-slate-400">({coach.nickname})</span>
                            <span className="text-[10px] text-amber-400 font-mono ml-1">🔒 ล็อกชื่อสอน</span>
                          </div>
                        ) : (
                          <span className="text-red-400 text-xs flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> ยังไม่ได้ผูกโปรไฟล์โค้ช
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500 text-xs">
                          เข้าถึงได้ทุกโค้ชและทุกฟังก์ชัน
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ใช้งานปกติ
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-400 text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" /> ระงับการใช้งาน
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="แก้ไขสิทธิ์"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        {/* Prevent deleting own current admin account */}
                        {!isCurrent && (
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบสิทธิ์การเข้าใช้งานของ ${user.name} (${user.email}) หรือไม่?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/40 transition-colors"
                            title="ลบสิทธิ์ผู้ใช้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-base text-white flex items-center">
                <Key className="w-4 h-4 mr-2 text-amber-400" />
                {editingUser ? 'แก้ไขสิทธิ์ผู้ใช้งาน Google' : 'เพิ่มสิทธิ์ผู้ใช้งาน Google Account ใหม่'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Google Email ของผู้ใช้ *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="เช่น trainer.somchai@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ชื่อ-นามสกุล / ชื่อแสดงในระบบ *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น โค้ชสมชาย ชายชาญ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  บทบาทและสิทธิ์การเข้าถึง (Role) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`p-3 rounded-xl border text-left flex flex-col space-y-1 transition-all ${
                      formRole === 'admin'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs">ผู้ดูแลระบบ (Admin)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">เข้าถึงได้ทุกหน้าในยิม</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('coach')}
                    className={`p-3 rounded-xl border text-left flex flex-col space-y-1 transition-all ${
                      formRole === 'coach'
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs">โค้ชผู้สอน (Coach)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">ซ่อนงบประมาณ & ล็อกชื่อสอน</span>
                  </button>
                </div>
              </div>

              {/* If Coach role: Select linked Coach */}
              {formRole === 'coach' && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-cyan-400 flex items-center">
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    ผูกกับโปรไฟล์โค้ชในระบบ (ล็อกชื่อสอน) *
                  </label>
                  <select
                    value={formCoachId}
                    onChange={(e) => setFormCoachId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  >
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.nickname}) — {c.disciplines.join(', ')}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    เมื่อเข้าสู่ระบบด้วย Google อีเมลนี้ การเช็คอินคลาสเรียนจะล็อกเป็นชื่อโค้ชท่านนี้โดยอัตโนมัติ เพื่อป้องกันการลงชื่อผิดและป้องกันการโกงค่าสอน
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  สถานะการอนุญาต
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="active">ใช้งานปกติ (Active)</option>
                  <option value="suspended">ระงับการเข้าใช้งานชั่วคราว (Suspended)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {editingUser ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มผู้ใช้งาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
