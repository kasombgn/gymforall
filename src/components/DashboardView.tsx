import React from 'react';
import { GymDatabase, Member, PaymentTransaction, AttendanceRecord, GymUser } from '../types/gym';
import { formatShortBaht, formatThaiDate } from '../utils/storage';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  HeartHandshake, 
  CalendarCheck, 
  CreditCard, 
  Receipt, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles, 
  Star,
  Activity,
  Plus,
  QrCode,
  Calendar as CalendarIcon,
  Clock,
  UserCheck
} from 'lucide-react';

interface DashboardViewProps {
  gymData: GymDatabase;
  onNavigateTab: (tab: any) => void;
  onOpenCheckIn: () => void;
  onOpenNewPayment: () => void;
  onOpenNewExpense: () => void;
  currentUser?: GymUser;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  gymData,
  onNavigateTab,
  onOpenCheckIn,
  onOpenNewPayment,
  onOpenNewExpense,
  currentUser
}) => {
  const isCoach = currentUser?.role === 'coach';
  const { members, coaches, payments, expenses, attendance, classes } = gymData;

  // Calculate Real-time Financials
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Member statistics
  const activeMembers = members.filter(m => m.status === 'active');
  const paidMembersCount = activeMembers.filter(m => m.type === 'paid_monthly' || m.type === 'paid_per_session').length;
  const freeCommunityMembersCount = activeMembers.filter(m => m.type === 'free_community').length;

  // Today's Check-ins
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr);

  // Discipline Breakdown
  const disciplineCounts: Record<string, number> = {};
  members.forEach(m => {
    disciplineCounts[m.discipline] = (disciplineCounts[m.discipline] || 0) + 1;
  });

  // Recent 5 attendance
  const recentAttendance = [...attendance].slice(0, 5);

  // Recent 5 payments
  const recentPayments = [...payments].slice(0, 5);

  return (
    <div className="space-y-6 pb-12" id="dashboard-view-container">
      
      {/* Welcome Banner / Overview header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-3 h-3 mr-1" /> สรุปผลการดำเนินงานโรงยิมแบบเรียลไทม์
            </span>
            <span className="text-xs text-slate-400">• อัปเดตล่าสุด {formatThaiDate(todayStr)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            ภาพรวมธุรกิจ & ระบบฝึกซ้อมศิลปะการต่อสู้
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            ติดตามยอดรายรับ-รายจ่าย สมาชิกรายเดือน/รายครั้ง กิจกรรมเพื่อสังคม (CSR) และสถิติการเข้าฝึกซ้อมอย่างโปร่งใส
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onOpenCheckIn}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95"
            id="dash-quick-checkin-btn"
          >
            <QrCode className="w-4 h-4 mr-1.5" />
            สแกน QR เช็คอินเข้าเรียน
          </button>
          <button
            onClick={onOpenNewPayment}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all active:scale-95"
            id="dash-quick-payment-btn"
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            รับชำระเงิน
          </button>
          {!isCoach && (
            <button
              onClick={onOpenNewExpense}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              id="dash-quick-expense-btn"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              บันทึกรายจ่าย
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        
        {!isCoach ? (
          <>
            {/* Total Revenue */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">ยอดรายรับรวม (Revenue)</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {formatShortBaht(totalRevenue)}
                </div>
                <p className="text-xs text-emerald-400 mt-1 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  จาก {payments.length} รายการที่บันทึก
                </p>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">ยอดรายจ่ายรวม (Expenses)</span>
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {formatShortBaht(totalExpenses)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  รวมค่าจ้างโค้ช, ค่าเช่า, ค่าน้ำไฟ & อุปกรณ์
                </p>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">กำไรสุทธิ (Net Balance)</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  netProfit >= 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl sm:text-3xl font-black font-mono ${
                  netProfit >= 0 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {formatShortBaht(netProfit)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {netProfit >= 0 ? 'สถานะการเงินดำเนินงานเป็นบวก' : 'รายจ่ายสูงกว่ารายรับ'}
                </p>
              </div>
            </div>

            {/* Total Members & CSR Split */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">สมาชิกที่กำลังใช้งาน (Active)</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {activeMembers.length} <span className="text-sm font-normal text-slate-400">คน</span>
                </div>
                <div className="flex items-center space-x-2 mt-1 text-xs">
                  <span className="text-emerald-400 font-semibold">{paidMembersCount} จ่ายเงิน</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-purple-400 font-semibold flex items-center">
                    <HeartHandshake className="w-3 h-3 mr-0.5 inline" /> {freeCommunityMembersCount} ทุนเพื่อสังคม
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Coach View KPI 1: Today Attendance */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">ผู้เรียนเข้าซ้อมวันนี้</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {todayAttendance.length} <span className="text-sm font-normal text-slate-400">คน</span>
                </div>
                <p className="text-xs text-emerald-400 mt-1">
                  เช็คอินเข้าฝึกซ้อมวันนี้
                </p>
              </div>
            </div>

            {/* Coach View KPI 2: Active Members */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">สมาชิกที่กำลังใช้งาน (Active)</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {activeMembers.length} <span className="text-sm font-normal text-slate-400">คน</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  สมาชิกที่สถานะปกติพร้อมเข้าซ้อม
                </p>
              </div>
            </div>

            {/* Coach View KPI 3: CSR Community */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">นักเรียนโครงการเพื่อสังคม</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
                  {freeCommunityMembersCount} <span className="text-sm font-normal text-slate-400">คน</span>
                </div>
                <p className="text-xs text-purple-400 mt-1">
                  ทุนเรียนฟรีเพื่อสังคม & เยาวชน
                </p>
              </div>
            </div>

            {/* Coach View KPI 4: Total Sessions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">บันทึกการฝึกซ้อมสะสม</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {attendance.length} <span className="text-sm font-normal text-slate-400">ครั้ง</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ประวัติการฝึกซ้อมในระบบยิม
                </p>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Championship Accolades & Medals Banner */}
      {(() => {
        const competitions = gymData.competitions || [];
        const goldCount = competitions.filter(c => c.medal === 'gold').length;
        const silverCount = competitions.filter(c => c.medal === 'silver').length;
        const bronzeCount = competitions.filter(c => c.medal === 'bronze').length;

        return (
          <div 
            onClick={() => onNavigateTab('members')}
            className="cursor-pointer bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-xl group"
            id="dashboard-championship-medals-banner"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 text-2xl shadow-inner group-hover:scale-105 transition-transform">
                🏆
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    เกียรติประวัติ & เหรียญรางวัลโรงยิม (Championship Accolades)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {competitions.length} การแข่งขัน
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ผลงานการแข่งขันของสมาชิกและนักกีฬาค่ายมวย ทั้งระดับสมัครเล่นและระดับอาชีพ
                </p>
              </div>
            </div>

            {/* Medal Badges */}
            <div className="flex items-center space-x-3 sm:space-x-4 bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
              <div className="flex items-center space-x-1.5" title="เหรียญทอง">
                <span className="text-lg">🥇</span>
                <span className="font-mono font-black text-base text-amber-300">{goldCount}</span>
                <span className="text-[11px] text-amber-400 font-semibold hidden md:inline">ทอง</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center space-x-1.5" title="เหรียญเงิน">
                <span className="text-lg">🥈</span>
                <span className="font-mono font-black text-base text-slate-200">{silverCount}</span>
                <span className="text-[11px] text-slate-300 font-semibold hidden md:inline">เงิน</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center space-x-1.5" title="เหรียญทองแดง">
                <span className="text-lg">🥉</span>
                <span className="font-mono font-black text-base text-amber-500">{bronzeCount}</span>
                <span className="text-[11px] text-amber-500 font-semibold hidden md:inline">ทองแดง</span>
              </div>
              <span className="text-slate-500 text-xs ml-1 hidden sm:inline">&rarr;</span>
            </div>
          </div>
        );
      })()}

      {/* Second Row: Real-time Attendance & Discipline distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Training Sessions & Check-in Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center">
                <CalendarCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
                ประวัติการเช็คอินเข้าเรียนล่าสุด
              </h3>
              <p className="text-xs text-slate-400">บันทึกการเข้าเรียน ความก้าวหน้า และคะแนนประเมินโดยโค้ช / แอดมิน</p>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              ดูปฏิทินทั้งหมด &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">ยังไม่มีประวัติการเช็คอิน</p>
            ) : (
              recentAttendance.map((att) => (
                <div 
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-sm">
                      {att.memberNickname ? att.memberNickname.charAt(0) : att.memberName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white">{att.memberName}</span>
                        {att.memberNickname && (
                          <span className="text-slate-400">({att.memberNickname})</span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          att.memberType === 'free_community'
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        }`}>
                          {att.memberType === 'free_community' ? 'ฟรี-เพื่อสังคม' : 'สมาชิกจ่ายเงิน'}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5 flex items-center space-x-2 text-[11px]">
                        <span className="text-amber-300">{att.discipline}</span>
                        <span>•</span>
                        <span>ครูฝึก: {att.coachName}</span>
                        <span>•</span>
                        <span>{att.timeSlot}</span>
                      </div>
                      {att.trainingNotes && (
                        <p className="text-[11px] text-slate-400 italic mt-1">"{att.trainingNotes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end text-amber-400 space-x-0.5 mb-1">
                      {Array.from({ length: att.performanceRating || 4 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500">{formatThaiDate(att.date)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Martial Arts Discipline Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center border-b border-slate-800 pb-3 mb-4">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-400" />
              สัดส่วนสมาชิกตามวิชาต่อสู้
            </h3>
            <div className="space-y-3.5">
              {Object.entries(disciplineCounts).map(([discipline, count]) => {
                const percentage = Math.round((count / (members.length || 1)) * 100);
                return (
                  <div key={discipline} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{discipline}</span>
                      <span className="text-slate-400 font-mono">{count} คน ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4">
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs">
              <div className="flex items-center space-x-1.5 text-purple-300 font-semibold mb-1">
                <HeartHandshake className="w-4 h-4" />
                <span>พันธกิจเพื่อสังคม (CSR Impact)</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                มีเยาวชนและผู้เรียนได้รับทุนเรียนฟรี {freeCommunityMembersCount} คน โดยเปิดโอกาสให้เข้าถึงศิลปะการต่อสู้เพื่อสุขภาพและวินัย
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Third Row: Recent Payments Ledger & Expense Ledger preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Payments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center">
                <CreditCard className="w-4 h-4 mr-1.5 text-emerald-400" />
                รายการรับชำระเงินล่าสุด
              </h3>
              <p className="text-xs text-slate-400">ค่าสมาชิกรายเดือนและรายครั้ง</p>
            </div>
            <button
              onClick={() => onNavigateTab('billing')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              ดูทั้งหมด &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentPayments.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{p.memberName}</span>
                    <span className="text-[11px] text-slate-400">• {p.planName}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center space-x-2">
                    <span>{formatThaiDate(p.date)}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">{p.receiptNo}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm font-mono text-emerald-400">
                    +{formatShortBaht(p.amount)}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {p.paymentMethod === 'transfer_promptpay' ? 'PromptPay' :
                     p.paymentMethod === 'credit_card' ? 'บัตรเครดิต' :
                     p.paymentMethod === 'cash' ? 'เงินสด' : 'ทุนเพื่อสังคม'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* If Admin: Recent Expenses & Coach Payouts | If Coach: Upcoming Classes */}
        {!isCoach ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Receipt className="w-4 h-4 mr-1.5 text-red-400" />
                  รายการรายจ่าย & ค่าจ้างโค้ชล่าสุด
                </h3>
                <p className="text-xs text-slate-400">ค่าเงินเดือน, ค่าเช่า, อุปกรณ์ และค่าใช้จ่ายโรงยิม</p>
              </div>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                ดูทั้งหมด &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {expenses.slice(0, 5).map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{e.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {formatThaiDate(e.date)} • ผู้บันทึก: {e.approvedBy}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm font-mono text-red-400">
                      -{formatShortBaht(e.amount)}
                    </span>
                    <span className="block text-[10px] text-slate-400">{e.paymentMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1.5 text-amber-400" />
                  ตารางคลาสฝึกซ้อมประจำวัน
                </h3>
                <p className="text-xs text-slate-400">คลาสเรียนมวยไทย, BJJ, MMA และการฝึกซ้อม</p>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                เปิดตารางเรียน &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {classes.slice(0, 5).map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{c.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {c.discipline.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5 flex items-center space-x-2">
                      <span>โค้ช: {c.coachName}</span>
                      <span>•</span>
                      <span className="text-slate-400">{c.location}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-xs text-slate-200 block">
                      {c.startTime} - {c.endTime}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
