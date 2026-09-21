import React, { useState } from 'react';
import { ExpenseRecord, ExpenseCategory, Coach } from '../types/gym';
import { formatShortBaht, formatThaiDate } from '../utils/storage';
import { 
  Receipt, 
  Plus, 
  Search, 
  DollarSign, 
  Building2, 
  Zap, 
  ShieldAlert, 
  Wrench, 
  Megaphone, 
  HelpCircle,
  X,
  Trash2
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  coaches: Coach[];
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'voucherNo'>) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; icon: React.ReactNode; color: string }> = {
  coach_salary: { label: 'เงินเดือนโค้ชประจำ', icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-amber-400' },
  coach_hourly: { label: 'ค่าสอนโค้ชพาร์ทไทม์', icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-yellow-400' },
  rent: { label: 'ค่าเช่าสถานที่โรงยิม', icon: <Building2 className="w-3.5 h-3.5" />, color: 'text-blue-400' },
  utilities: { label: 'ค่าน้ำ-ค่าไฟฟ้า', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-cyan-400' },
  equipment: { label: 'อุปกรณ์ฝึกซ้อม & นวม/กระสอบ', icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
  maintenance: { label: 'บำรุงรักษา & สุขอนามัยเบาะ', icon: <Wrench className="w-3.5 h-3.5" />, color: 'text-indigo-400' },
  marketing: { label: 'การตลาด & โฆษณา', icon: <Megaphone className="w-3.5 h-3.5" />, color: 'text-pink-400' },
  other: { label: 'ค่าใช้จ่ายเบ็ดเตล็ด', icon: <HelpCircle className="w-3.5 h-3.5" />, color: 'text-slate-400' }
};

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  coaches,
  onAddExpense,
  onDeleteExpense
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('utilities');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'card'>('transfer');
  const [approvedBy, setApprovedBy] = useState('ผู้จัดการยิม');
  const [note, setNote] = useState('');

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Coach expenses total
  const coachExpensesTotal = expenses
    .filter(e => e.category === 'coach_salary' || e.category === 'coach_hourly')
    .reduce((acc, e) => acc + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.coachName && e.coachName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    return true;
  });

  const handleCategoryChange = (cat: ExpenseCategory) => {
    setCategory(cat);
    if (cat === 'coach_salary' || cat === 'coach_hourly') {
      const firstCoach = coaches[0];
      if (firstCoach) {
        setSelectedCoachId(firstCoach.id);
        if (cat === 'coach_salary') {
          setTitle(`เงินเดือนโค้ช ${firstCoach.name}`);
          setAmount(firstCoach.monthlySalary || 25000);
        } else {
          setTitle(`ค่าสอนพาร์ทไทม์ โค้ช ${firstCoach.name}`);
          setAmount((firstCoach.hourlyRate || 500) * 10);
        }
      }
    } else if (cat === 'rent') {
      setTitle('ค่าเช่าสถานที่โรงยิม ประจำเดือน');
      setAmount(35000);
    } else if (cat === 'utilities') {
      setTitle('ค่าไฟฟ้านครหลวง & ค่าน้ำประปา');
      setAmount(6500);
    } else if (cat === 'equipment') {
      setTitle('ซื้อนวมซ้อม มงคล ผ้าพันมือ และอุปกรณ์เปลี่ยนทดแทน');
      setAmount(8000);
    }
  };

  const handleCoachChange = (cId: string) => {
    setSelectedCoachId(cId);
    const coach = coaches.find(c => c.id === cId);
    if (coach) {
      if (category === 'coach_salary') {
        setTitle(`เงินเดือน ${coach.name}`);
        setAmount(coach.monthlySalary || 25000);
      } else {
        setTitle(`ค่าสอนพาร์ทไทม์ ${coach.name}`);
        setAmount(coach.hourlyRate || 500);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coach = coaches.find(c => c.id === selectedCoachId);

    onAddExpense({
      category,
      title,
      amount: Number(amount),
      date: expenseDate,
      coachId: (category === 'coach_salary' || category === 'coach_hourly') ? coach?.id : undefined,
      coachName: (category === 'coach_salary' || category === 'coach_hourly') ? coach?.name : undefined,
      paymentMethod,
      approvedBy,
      note: note || undefined
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12" id="expenses-view-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center">
            <Receipt className="w-6 h-6 mr-2 text-red-400" />
            ระบบบันทึกค่าใช้จ่ายโรงยิม (Gym Expenses)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            บันทึกต้นทุนดำเนินงาน ค่าจ้างโค้ช ค่าเช่า ค่าน้ำไฟ อุปกรณ์ และออกใบสำคัญจ่าย
          </p>
        </div>

        <button
          onClick={() => {
            handleCategoryChange('utilities');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-all active:scale-95"
          id="add-expense-btn"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          บันทึกรายจ่ายใหม่
        </button>
      </div>

      {/* Summary Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400">รายจ่ายรวมทั้งหมด</span>
          <p className="text-2xl font-black text-red-400 font-mono mt-1">
            {formatShortBaht(totalExpenseAmount)}
          </p>
          <span className="text-[11px] text-slate-500">{expenses.length} รายการ</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400">ค่าจ้างโค้ช & ครูฝึกรวม</span>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            {formatShortBaht(coachExpensesTotal)}
          </p>
          <span className="text-[11px] text-slate-400">
            {Math.round((coachExpensesTotal / (totalExpenseAmount || 1)) * 100)}% ของค่าใช้จ่ายยิม
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400">ค่าสถานที่ ค่าน้ำไฟ & อุปกรณ์</span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {formatShortBaht(totalExpenseAmount - coachExpensesTotal)}
          </p>
          <span className="text-[11px] text-slate-500">ต้นทุนสิ่งอำนวยความสะดวก</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            หมวดหมู่ทั้งหมด
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterCategory(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                filterCategory === key
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{value.label}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อรายการ, โค้ช, หรือเลขใบสำคัญ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">เลขที่ใบสำคัญจ่าย</th>
                <th className="px-5 py-3.5">วันที่</th>
                <th className="px-5 py-3.5">หมวดหมู่</th>
                <th className="px-5 py-3.5">รายการรายจ่าย</th>
                <th className="px-5 py-3.5">วิธีจ่าย</th>
                <th className="px-5 py-3.5 text-right">จำนวนเงิน</th>
                <th className="px-5 py-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    ไม่พบรายการรายจ่ายที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-400">
                        {exp.voucherNo}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {formatThaiDate(exp.date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center space-x-1 font-semibold ${catInfo.color}`}>
                          {catInfo.icon}
                          <span>{catInfo.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-white">{exp.title}</p>
                        {exp.coachName && (
                          <span className="text-[11px] text-amber-400 block">
                            จ่ายให้: {exp.coachName}
                          </span>
                        )}
                        {exp.note && (
                          <span className="text-[10px] text-slate-400 italic block">{exp.note}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
                          {exp.paymentMethod === 'transfer' ? 'โอนเงิน' :
                           exp.paymentMethod === 'cash' ? 'เงินสด' : 'บัตร'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-red-400">
                        -{formatShortBaht(exp.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`ต้องการลบรายการรายจ่าย "${exp.title}" ใช่หรือไม่?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <h3 className="text-base font-bold text-white flex items-center">
                <Receipt className="w-4 h-4 mr-2 text-red-400" />
                บันทึกรายจ่ายโรงยิม & ค่าจ้างโค้ช
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Category selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">หมวดหมู่รายจ่าย *</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  required
                >
                  {Object.entries(CATEGORY_MAP).map(([catKey, catVal]) => (
                    <option key={catKey} value={catKey}>
                      {catVal.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* If Coach Salary / Hourly selected, show Coach selection */}
              {(category === 'coach_salary' || category === 'coach_hourly') && (
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">เลือกโค้ช / ครูฝึกสอน *</label>
                  <select
                    value={selectedCoachId}
                    onChange={(e) => handleCoachChange(e.target.value)}
                    className="w-full bg-slate-800 border border-amber-500/50 rounded-xl px-3 py-2.5 text-white"
                    required
                  >
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.employmentType === 'full_time' ? 'ประจำ' : 'พาร์ทไทม์'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Expense Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อรายการ / วัตถุประสงค์การจ่าย *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ค่าเช่าตึกยิม, เงินเดือนครูมวย, ค่าไฟ, ซื้อนวมใหม่"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">จำนวนเงิน (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-red-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">วันที่จ่ายเงิน *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Method and Approver */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">วิธีการชำระเงิน *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="transfer">โอนเงินธนาคาร</option>
                    <option value="cash">เงินสด</option>
                    <option value="card">บัตรเครดิต</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ผู้อนุมัติจ่าย *</label>
                  <input
                    type="text"
                    required
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">บันทึกเพิ่มเติม / เลขที่ใบกำกับภาษี</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น โอนผ่านบัญชี กสิกรไทย หรือจ่ายเงินสดหน้าร้าน"
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
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-md"
                >
                  บันทึกรายจ่าย
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
