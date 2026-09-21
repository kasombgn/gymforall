import React, { useState, useEffect } from 'react';
import { 
  GymDatabase, 
  Member, 
  Coach, 
  PaymentTransaction, 
  ExpenseRecord, 
  AttendanceRecord, 
  TrainingClassSession,
  GymUser,
  CompetitionRecord,
  GymSettings
} from './types/gym';
import { loadGymData, saveGymData, loadCurrentUser, saveCurrentUser } from './utils/storage';
import { Navbar, TabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MembersView } from './components/MembersView';
import { CoachesView } from './components/CoachesView';
import { BillingView } from './components/BillingView';
import { ExpensesView } from './components/ExpensesView';
import { CalendarView } from './components/CalendarView';
import { UsersManagementView } from './components/UsersManagementView';
import { CheckInModal } from './components/CheckInModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ImportExportModal } from './components/ImportExportModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { GymBrandingModal } from './components/GymBrandingModal';
import { DEFAULT_GYM_SETTINGS } from './components/GymLogo';

export default function App() {
  const [gymData, setGymData] = useState<GymDatabase>(() => loadGymData());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // User Authentication & Role state
  const [currentUser, setCurrentUser] = useState<GymUser>(() => loadCurrentUser(gymData.users));
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);

  // Gym Branding Modal state
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

  // Modals state
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInMemberId, setCheckInMemberId] = useState<string | undefined>(undefined);
  
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceiptTxn, setSelectedReceiptTxn] = useState<PaymentTransaction | null>(null);

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Preselected member for payment
  const [billingPreselectedMember, setBillingPreselectedMember] = useState<Member | null>(null);

  // Sync document title with gym brand name
  useEffect(() => {
    const gymName = gymData.settings?.appName || 'NAKSOO COMBAT';
    document.title = `${gymName} - ระบบบริหารโรงยิม`;
  }, [gymData.settings?.appName]);

  // Synchronize database to localStorage whenever data changes
  const updateGymDatabase = (updater: (prev: GymDatabase) => GymDatabase) => {
    setGymData(prev => {
      const next = updater(prev);
      saveGymData(next);
      return next;
    });
  };

  // Gym Branding & Settings Handler
  const handleSaveSettings = (newSettings: GymSettings) => {
    updateGymDatabase(prev => ({
      ...prev,
      settings: newSettings
    }));
  };

  // User Authentication & Role Handlers
  const handleSwitchUser = (user: GymUser) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    // If switched user is a coach and currently on a restricted admin page, redirect to dashboard
    if (user.role === 'coach' && (activeTab === 'expenses' || activeTab === 'users_settings' || activeTab === 'coaches')) {
      setActiveTab('dashboard');
    }
  };

  const handleAddUser = (newUserData: Omit<GymUser, 'id' | 'createdAt'>) => {
    updateGymDatabase(prev => {
      const newUser: GymUser = {
        ...newUserData,
        id: `u-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      return {
        ...prev,
        users: [...(prev.users || []), newUser]
      };
    });
  };

  const handleUpdateUser = (updatedUser: GymUser) => {
    updateGymDatabase(prev => ({
      ...prev,
      users: (prev.users || []).map(u => u.id === updatedUser.id ? updatedUser : u)
    }));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      saveCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    updateGymDatabase(prev => ({
      ...prev,
      users: (prev.users || []).filter(u => u.id !== userId)
    }));
  };

  // 1. Members Handlers
  const handleAddMember = (newMemberData: Omit<Member, 'id' | 'totalSessionsAttended'>) => {
    updateGymDatabase(prev => {
      const newMember: Member = {
        ...newMemberData,
        id: `m-${Date.now()}`,
        totalSessionsAttended: 0
      };
      return {
        ...prev,
        members: [newMember, ...prev.members]
      };
    });
  };

  const handleUpdateMember = (updatedMember: Member) => {
    updateGymDatabase(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === updatedMember.id ? updatedMember : m)
    }));
  };

  const handleDeleteMember = (memberId: string) => {
    updateGymDatabase(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }));
  };

  // 2. Coaches Handlers
  const handleAddCoach = (newCoachData: Omit<Coach, 'id'>) => {
    updateGymDatabase(prev => {
      const newCoach: Coach = {
        ...newCoachData,
        id: `c-${Date.now()}`
      };
      return {
        ...prev,
        coaches: [...prev.coaches, newCoach]
      };
    });
  };

  const handleUpdateCoach = (updatedCoach: Coach) => {
    updateGymDatabase(prev => ({
      ...prev,
      coaches: prev.coaches.map(c => c.id === updatedCoach.id ? updatedCoach : c)
    }));
  };

  const handleDeleteCoach = (coachId: string) => {
    updateGymDatabase(prev => ({
      ...prev,
      coaches: prev.coaches.filter(c => c.id !== coachId)
    }));
  };

  const handlePayCoach = (coach: Coach, amount: number, note: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const voucherNo = `EXP-${todayStr.replace(/-/g, '')}-${String(gymData.expenses.length + 1).padStart(2, '0')}`;
    
    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      voucherNo,
      category: coach.employmentType === 'full_time' ? 'coach_salary' : 'coach_hourly',
      title: coach.employmentType === 'full_time'
        ? `เงินเดือน ${coach.name} (${coach.nickname})`
        : `ค่าสอนพาร์ทไทม์ ${coach.name}`,
      amount,
      date: todayStr,
      coachId: coach.id,
      coachName: coach.name,
      paymentMethod: 'transfer',
      approvedBy: 'ผู้จัดการยิม',
      note
    };

    updateGymDatabase(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses]
    }));

    alert(`บันทึกจ่ายค่าจ้างให้ ${coach.name} จำนวน ฿${amount.toLocaleString()} เรียบร้อยแล้ว (บันทึกลงในระบบรายจ่ายยิม)`);
  };

  // 3. Billing & Payments Handlers
  const handleAddPayment = (
    newPaymentData: Omit<PaymentTransaction, 'id' | 'receiptNo'>,
    updatedMemberData?: { expireDate?: string; addSessions?: number; memberId: string }
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const receiptNo = `REC-${todayStr.replace(/-/g, '')}-${String(gymData.payments.length + 1).padStart(2, '0')}`;

    const newPayment: PaymentTransaction = {
      ...newPaymentData,
      id: `pay-${Date.now()}`,
      receiptNo
    };

    updateGymDatabase(prev => {
      let updatedMembers = [...prev.members];
      if (updatedMemberData) {
        updatedMembers = updatedMembers.map(m => {
          if (m.id === updatedMemberData.memberId) {
            return {
              ...m,
              status: 'active',
              expireDate: updatedMemberData.expireDate || m.expireDate,
              remainingSessions: updatedMemberData.addSessions 
                ? (m.remainingSessions || 0) + updatedMemberData.addSessions 
                : m.remainingSessions
            };
          }
          return m;
        });
      }

      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        members: updatedMembers
      };
    });

    // Auto open receipt preview
    setSelectedReceiptTxn(newPayment);
    setIsReceiptOpen(true);
  };

  // 4. Expenses Handlers
  const handleAddExpense = (newExpData: Omit<ExpenseRecord, 'id' | 'voucherNo'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const voucherNo = `EXP-${todayStr.replace(/-/g, '')}-${String(gymData.expenses.length + 1).padStart(2, '0')}`;

    const newExpense: ExpenseRecord = {
      ...newExpData,
      id: `exp-${Date.now()}`,
      voucherNo
    };

    updateGymDatabase(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses]
    }));
  };

  const handleDeleteExpense = (expenseId: string) => {
    updateGymDatabase(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== expenseId)
    }));
  };

  // 5. Training Classes & Schedules
  const handleAddClass = (classData: Omit<TrainingClassSession, 'id' | 'enrolledMemberIds'>) => {
    const newClass: TrainingClassSession = {
      ...classData,
      id: `cls-${Date.now()}`,
      enrolledMemberIds: []
    };

    updateGymDatabase(prev => ({
      ...prev,
      classes: [...prev.classes, newClass]
    }));
  };

  const handleDeleteClass = (classId: string) => {
    updateGymDatabase(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== classId)
    }));
  };

  // 6. Attendance & Check-in
  const handleSaveAttendance = (recordData: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: `att-${Date.now()}`
    };

    updateGymDatabase(prev => {
      // Update member's attended count and deduct punch session if applicable
      const updatedMembers = prev.members.map(m => {
        if (m.id === recordData.memberId) {
          const newRemaining = m.type === 'paid_per_session' && m.remainingSessions !== undefined
            ? Math.max(0, m.remainingSessions - 1)
            : m.remainingSessions;

          return {
            ...m,
            totalSessionsAttended: m.totalSessionsAttended + 1,
            remainingSessions: newRemaining
          };
        }
        return m;
      });

      return {
        ...prev,
        attendance: [newRecord, ...prev.attendance],
        members: updatedMembers
      };
    });
  };

  // 7. Competition & Tournament Medal Handlers
  const handleAddCompetition = (newRecordData: Omit<CompetitionRecord, 'id' | 'createdAt'>) => {
    updateGymDatabase(prev => {
      const newRecord: CompetitionRecord = {
        ...newRecordData,
        id: `comp-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      return {
        ...prev,
        competitions: [newRecord, ...(prev.competitions || [])]
      };
    });
  };

  const handleUpdateCompetition = (updatedRecord: CompetitionRecord) => {
    updateGymDatabase(prev => ({
      ...prev,
      competitions: (prev.competitions || []).map(c => c.id === updatedRecord.id ? updatedRecord : c)
    }));
  };

  const handleDeleteCompetition = (recordId: string) => {
    updateGymDatabase(prev => ({
      ...prev,
      competitions: (prev.competitions || []).filter(c => c.id !== recordId)
    }));
  };

  // Quick action triggers
  const handleOpenCheckIn = (memberId?: string) => {
    setCheckInMemberId(memberId);
    setIsCheckInOpen(true);
  };

  const handleOpenPaymentForMember = (member: Member) => {
    setBillingPreselectedMember(member);
    setActiveTab('billing');
  };

  const handleViewReceipt = (txn: PaymentTransaction) => {
    setSelectedReceiptTxn(txn);
    setIsReceiptOpen(true);
  };

  // Count today's attendees
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendanceCount = gymData.attendance.filter(a => a.date === todayStr).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenQuickCheckIn={() => handleOpenCheckIn()}
        todayAttendanceCount={todayAttendanceCount}
        currentUser={currentUser}
        coaches={gymData.coaches}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        settings={gymData.settings || DEFAULT_GYM_SETTINGS}
        onOpenBrandingSettings={() => setIsBrandingModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            gymData={gymData}
            onNavigateTab={setActiveTab}
            onOpenCheckIn={() => handleOpenCheckIn()}
            onOpenNewPayment={() => {
              setBillingPreselectedMember(null);
              setActiveTab('billing');
            }}
            onOpenNewExpense={() => {
              if (currentUser.role === 'admin') {
                setActiveTab('expenses');
              }
            }}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            members={gymData.members}
            attendance={gymData.attendance}
            payments={gymData.payments}
            competitions={gymData.competitions || []}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onOpenCheckInForMember={(mId) => handleOpenCheckIn(mId)}
            onOpenPaymentForMember={handleOpenPaymentForMember}
            onViewReceipt={handleViewReceipt}
            onAddCompetition={handleAddCompetition}
            onUpdateCompetition={handleUpdateCompetition}
            onDeleteCompetition={handleDeleteCompetition}
            currentUser={currentUser}
            settings={gymData.settings || DEFAULT_GYM_SETTINGS}
          />
        )}

        {activeTab === 'coaches' && (
          currentUser.role === 'admin' ? (
            <CoachesView
              coaches={gymData.coaches}
              attendance={gymData.attendance}
              expenses={gymData.expenses}
              onAddCoach={handleAddCoach}
              onUpdateCoach={handleUpdateCoach}
              onDeleteCoach={handleDeleteCoach}
              onPayCoach={handlePayCoach}
            />
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto mt-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                <span className="text-xl">🔒</span>
              </div>
              <p className="text-amber-400 font-bold text-base">การเข้าถึงถูกจำกัด (เฉพาะผู้ดูแลระบบ Admin)</p>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                เมนูโค้ช & ครูฝึกและสัญญาค่าจ้างอนุญาตเฉพาะบัญชีผู้ดูแลระบบ (Admin) เท่านั้น เพื่อป้องกันการแก้ไขค่าตอบแทนหรือข้อมูลสัญญาของตนเอง
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
              >
                กลับไปหน้าแดชบอร์ด
              </button>
            </div>
          )
        )}

        {activeTab === 'billing' && (
          <BillingView
            payments={gymData.payments}
            members={gymData.members}
            onAddPayment={handleAddPayment}
            onViewReceipt={handleViewReceipt}
            preselectedMember={billingPreselectedMember}
          />
        )}

        {activeTab === 'expenses' && (
          currentUser.role === 'admin' ? (
            <ExpensesView
              expenses={gymData.expenses}
              coaches={gymData.coaches}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-amber-400 font-bold text-base">การเข้าถึงถูกจำกัด (เฉพาะผู้ดูแลระบบ Admin)</p>
              <p className="text-slate-400 text-xs mt-1">
                เมนูค่าใช้จ่ายยิมอนุญาตเฉพาะบัญชีผู้ดูแลระบบเท่านั้น
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                กลับไปหน้าแดชบอร์ด
              </button>
            </div>
          )
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            classes={gymData.classes}
            attendance={gymData.attendance}
            coaches={gymData.coaches}
            members={gymData.members}
            onAddClass={handleAddClass}
            onOpenCheckInForClass={(cls) => handleOpenCheckIn()}
            onDeleteClass={handleDeleteClass}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'users_settings' && (
          currentUser.role === 'admin' ? (
            <UsersManagementView
              users={gymData.users || []}
              coaches={gymData.coaches}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              settings={gymData.settings || DEFAULT_GYM_SETTINGS}
              onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
            />
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-amber-400 font-bold text-base">การเข้าถึงถูกจำกัด (เฉพาะผู้ดูแลระบบ Admin)</p>
              <p className="text-slate-400 text-xs mt-1">
                เมนูจัดการสิทธิ์และผู้ใช้งานอนุญาตเฉพาะ Admin เท่านั้น
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                กลับไปหน้าแดชบอร์ด
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {gymData.settings?.appName || 'NAKSOO COMBAT'} {gymData.settings?.appNameHighlight || ''} — {gymData.settings?.tagline || 'ระบบบริหารโรงยิมและฝึกสอนศิลปะการต่อสู้'}
          </span>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>สมาชิกทั้งหมด: {gymData.members.length} คน</span>
            <span>•</span>
            <span>โค้ช: {gymData.coaches.length} ท่าน</span>
            <span>•</span>
            <span>บันทึกการฝึก: {gymData.attendance.length} ครั้ง</span>
          </div>
        </div>
      </footer>

      {/* Check-in Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setCheckInMemberId(undefined);
        }}
        members={gymData.members}
        coaches={gymData.coaches}
        classes={gymData.classes}
        onSaveAttendance={handleSaveAttendance}
        preselectedMemberId={checkInMemberId}
        currentUser={currentUser}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedReceiptTxn(null);
        }}
        transaction={selectedReceiptTxn}
        settings={gymData.settings || DEFAULT_GYM_SETTINGS}
      />

      {/* Import / Export File Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        gymData={gymData}
        onDataUpdated={(newData) => {
          setGymData(newData);
          saveGymData(newData);
        }}
      />

      {/* Google Account Authentication & Role Switcher Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        currentUser={currentUser}
        users={gymData.users || []}
        coaches={gymData.coaches}
        onSelectUser={handleSwitchUser}
      />

      {/* Gym Branding & Logo Customization Modal */}
      <GymBrandingModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        settings={gymData.settings || DEFAULT_GYM_SETTINGS}
        onSaveSettings={handleSaveSettings}
      />

    </div>
  );
}
