import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { GymUser, Coach } from '../types/gym';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GymUser;
  users: GymUser[];
  coaches: Coach[];
  onSelectUser: (user: GymUser) => void;
  onAddNewUserEmail?: (email: string, role: 'admin' | 'coach', coachId?: string) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  coaches,
  onSelectUser,
  onAddNewUserEmail
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const email = customEmail.trim().toLowerCase();
    if (!email) return;

    if (!email.includes('@')) {
      setErrorMessage('กรุณาระบุที่อยู่อีเมลที่ถูกต้อง เช่น yourname@gmail.com');
      return;
    }

    // Check if user is registered in the system
    const matched = users.find(u => u.email.toLowerCase() === email);
    if (matched) {
      if (matched.status === 'suspended') {
        setErrorMessage('บัญชีนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบยิม');
        return;
      }
      onSelectUser(matched);
      setSuccessNotice(`เข้าสู่ระบบในชื่อ ${matched.name} สำเร็จ!`);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMessage(
        `ไม่พบบัญชี Google (${email}) ในระบบที่ได้รับอนุญาตสิทธิ์ หากท่านเป็นโค้ชหรือเจ้าหน้าที่ใหม่ กรุณาติดต่อ Admin เพื่อเพิ่มสิทธิ์การเข้าใช้งาน`
      );
    }
  };

  const handleQuickSelect = (user: GymUser) => {
    onSelectUser(user);
    setSuccessNotice(`สลับไปใช้บัญชี: ${user.name} (${user.role === 'admin' ? 'ผู้ดูแลระบบ Admin' : 'โค้ช Coach'})`);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const getCoachDetails = (coachId?: string) => {
    if (!coachId) return null;
    return coaches.find(c => c.id === coachId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="google-auth-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            {/* Google G Logo SVG */}
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md p-2 shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
                เข้าสู่ระบบด้วย Google Account
              </h3>
              <p className="text-xs text-slate-400">
                ระบบจัดการสิทธิ์และป้องกันการสวมสิทธิ์โค้ช NAKSOO GYM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            id="close-google-auth-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Current Signed In Status */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center font-bold text-white">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'โค้ช (Coach)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-800/40">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ล็อกอินอยู่
            </span>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Quick Account Switcher (For easy testing of roles) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span>เลือกสลับบัญชี Google ที่ลงทะเบียนไว้:</span>
              <span className="text-[10px] text-slate-400 font-normal">คลิกเพื่อทดสอบสิทธิ์ Admin / Coach</span>
            </label>
            <div className="space-y-2">
              {users.map(user => {
                const isCurrent = user.id === currentUser.id;
                const coach = getCoachDetails(user.coachId);

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickSelect(user)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all group ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                            {user.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            user.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                        {coach && (
                          <p className="text-[10px] text-amber-400/80 mt-0.5">
                            🥋 ผูกกับโค้ช: {coach.name} ({coach.nickname})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isCurrent ? (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-1 rounded-md">
                          ใช้งานอยู่
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 group-hover:text-white flex items-center">
                          สลับใช้ <ArrowRight className="w-3 h-3 ml-1" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form: Sign in with other Google email */}
          <form onSubmit={handleCustomEmailLogin} className="pt-2 border-t border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              หรือเข้าสู่ระบบด้วย Google Email อื่น:
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="เช่น yourname@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 shrink-0 flex items-center"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" /> ล็อกอิน
              </button>
            </div>
          </form>

          {/* Policy & Security Notice */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center text-amber-400 font-bold">
              <Lock className="w-3 h-3 mr-1" /> นโยบายความปลอดภัยของระบบ:
            </div>
            <p>
              • <strong>ผู้ดูแลระบบ (Admin)</strong>: สามารถเข้าถึงได้ทุกหน้า รวมถึงค่าใช้จ่ายยิม การตั้งค่าสิทธิ์ และสำรองข้อมูล
            </p>
            <p>
              • <strong>โค้ชผู้สอน (Coach)</strong>: เมนูค่าใช้จ่ายยิมและจัดการสิทธิ์จะถูกซ่อนอัตโนมัติ เมื่อเช็คอินเข้าเรียน ระบบจะล็อกชื่อโค้ชผู้สอนเป็นชื่อของท่านโดยอัตโนมัติ เพื่อป้องกันการลงชื่อผิดและการโกงค่าสอน
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
