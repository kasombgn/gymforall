import React from 'react';
import { 
  Dumbbell, 
  Users, 
  UserCheck, 
  CreditCard, 
  Receipt, 
  Calendar as CalendarIcon, 
  FileSpreadsheet, 
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
  QrCode,
  ShieldCheck,
  Settings,
  ChevronDown,
  Palette,
  Edit3
} from 'lucide-react';
import { GymUser, Coach, GymSettings } from '../types/gym';
import { GymLogo, DEFAULT_GYM_SETTINGS } from './GymLogo';

export type TabType = 'dashboard' | 'members' | 'coaches' | 'billing' | 'expenses' | 'calendar' | 'users_settings';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenImportExport: () => void;
  onOpenQuickCheckIn: () => void;
  todayAttendanceCount: number;
  currentUser: GymUser;
  coaches: Coach[];
  onOpenGoogleAuth: () => void;
  settings?: GymSettings;
  onOpenBrandingSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenImportExport,
  onOpenQuickCheckIn,
  todayAttendanceCount,
  currentUser,
  coaches,
  onOpenGoogleAuth,
  settings = DEFAULT_GYM_SETTINGS,
  onOpenBrandingSettings
}) => {
  const linkedCoach = currentUser.coachId ? coaches.find(c => c.id === currentUser.coachId) : null;

  // Base navigation items
  const allNavItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string; roleRestricted?: 'admin' }[] = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'members', label: 'สมาชิก', icon: <Users className="w-4 h-4" /> },
    { 
      id: 'coaches', 
      label: 'โค้ช & ครูฝึก', 
      icon: <UserCheck className="w-4 h-4" />,
      roleRestricted: 'admin' // Admin only: ป้องกันโค้ชแก้ไขเงินเดือนและค่าจ้างตัวเอง
    },
    { id: 'billing', label: 'รับชำระเงิน', icon: <CreditCard className="w-4 h-4" /> },
    { 
      id: 'expenses', 
      label: 'ค่าใช้จ่ายยิม', 
      icon: <Receipt className="w-4 h-4" />,
      roleRestricted: 'admin' // Admin only
    },
    { 
      id: 'calendar', 
      label: 'ปฏิทินฝึกซ้อม', 
      icon: <CalendarIcon className="w-4 h-4" />,
      badge: todayAttendanceCount > 0 ? `${todayAttendanceCount} คนวันนี้` : undefined 
    },
    {
      id: 'users_settings',
      label: 'ตั้งค่า & สิทธิ์ผู้ใช้',
      icon: <Settings className="w-4 h-4" />,
      roleRestricted: 'admin' // Admin only
    }
  ];

  // Filter items based on user role: if coach, hide 'expenses' and 'users_settings'
  const navItems = allNavItems.filter(item => {
    if (item.roleRestricted === 'admin' && currentUser.role !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg" id="app-main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Gym Brand Identity */}
          <div className="flex items-center space-x-3 group">
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setActiveTab('dashboard')}
              id="brand-logo-button"
            >
              <GymLogo settings={settings} size="md" className="group-hover:scale-105 transition-transform duration-200" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
                    {settings.appName || 'NAKSOO'}{' '}
                    {settings.appNameHighlight && (
                      <span className="text-amber-400">{settings.appNameHighlight}</span>
                    )}
                  </span>
                  {settings.tagline && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Sparkles className="w-3 h-3 mr-1" /> {settings.tagline}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{settings.subDescription || 'ระบบบริหารโรงยิมและค่ายฝึกสอนครบวงจร'}</p>
              </div>
            </div>

            {/* Quick Edit Branding button for Admin */}
            {currentUser.role === 'admin' && onOpenBrandingSettings && (
              <button
                type="button"
                onClick={onOpenBrandingSettings}
                className="hidden md:inline-flex p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                title="เปลี่ยนชื่อโรงยิมและโลโก้ (Change App Name & Logo)"
                id="edit-branding-quick-btn"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions & Google Account */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenQuickCheckIn}
              id="quick-checkin-header-btn"
              className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/40 transition-all hover:shadow-emerald-600/50 active:scale-95"
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              <span>สแกน QR / เช็คอิน</span>
            </button>

            {/* Admin only: file backup & restore */}
            {currentUser.role === 'admin' && (
              <button
                onClick={onOpenImportExport}
                id="import-export-header-btn"
                className="inline-flex items-center px-3 py-2 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
                title="นำเข้าและส่งออกข้อมูล (JSON, CSV)"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-amber-400" />
                <span className="hidden lg:inline">นำเข้า/ส่งออก</span>
                <span className="lg:hidden">ไฟล์</span>
              </button>
            )}

            {/* Google Account Profile Button */}
            <button
              onClick={onOpenGoogleAuth}
              id="google-account-header-btn"
              className="inline-flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800 transition-all shadow-sm group"
              title="จัดการบัญชี Google / สลับสิทธิ์ผู้ใช้"
            >
              {/* Google G SVG */}
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-xs">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>

              {/* User Name & Role Pill */}
              <div className="text-left hidden sm:block max-w-[130px] md:max-w-[170px]">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-white truncate block">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {currentUser.role === 'coach' && linkedCoach
                    ? `🥋 ${linkedCoach.nickname}`
                    : currentUser.email}
                </p>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 border-t border-slate-800/80 no-scrollbar" id="nav-tabs-container">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 relative ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

