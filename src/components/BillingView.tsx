import React, { useState } from 'react';
import { Member, PaymentTransaction, MembershipType } from '../types/gym';
import { formatShortBaht, formatThaiDate } from '../utils/storage';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  CheckCircle2, 
  Clock, 
  HeartHandshake, 
  TrendingUp, 
  ArrowDownRight,
  X,
  FileCheck
} from 'lucide-react';

interface BillingViewProps {
  payments: PaymentTransaction[];
  members: Member[];
  onAddPayment: (payment: Omit<PaymentTransaction, 'id' | 'receiptNo'>, updatedMemberData?: { expireDate?: string; addSessions?: number; memberId: string }) => void;
  onViewReceipt: (transaction: PaymentTransaction) => void;
  preselectedMember?: Member | null;
}

const PRESET_PLANS = [
  { id: 'm_mt', name: 'คอร์สมวยไทย รายเดือน (ไม่จำกัดครั้ง)', amount: 2800, type: 'monthly', addDays: 30 },
  { id: 'm_bjj', name: 'คอร์ส BJJ All-Levels รายเดือน', amount: 3200, type: 'monthly', addDays: 30 },
  { id: 'm_all', name: 'คอร์ส All-Access ผ่านได้ทุกวิชา รายเดือน', amount: 3900, type: 'monthly', addDays: 30 },
  { id: 'd_dropin', name: 'Drop-in รายวัน (Single Pass 1 ครั้ง)', amount: 400, type: 'per_session', addSessions: 1 },
  { id: 'd_10', name: 'บัตรคูปองฝึกซ้อม 10 ครั้ง (Punch Card 10)', amount: 2500, type: 'per_session', addSessions: 10 },
  { id: 'd_5', name: 'บัตรคูปองฝึกซ้อม 5 ครั้ง (Punch Card 5)', amount: 1500, type: 'per_session', addSessions: 5 },
  { id: 'free_csr', name: 'ทุนพัฒนาเยาวชนและสังคม (Free Social CSR)', amount: 0, type: 'free_scholarship', addDays: 90 },
  { id: 'custom', name: 'กำหนดราคาและแพ็กเกจเอง (Custom Plan)', amount: 0, type: 'custom' },
];

export const BillingView: React.FC<BillingViewProps> = ({
  payments,
  members,
  onAddPayment,
  onViewReceipt,
  preselectedMember
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState(preselectedMember?.id || (members[0]?.id ?? ''));
  const [selectedPlanId, setSelectedPlanId] = useState(PRESET_PLANS[0].id);
  const [customPlanName, setCustomPlanName] = useState('');
  const [amount, setAmount] = useState(PRESET_PLANS[0].amount);
  const [paymentMethod, setPaymentMethod] = useState<'transfer_promptpay' | 'cash' | 'credit_card' | 'free_csr'>('transfer_promptpay');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [note, setNote] = useState('');
  const [collectedBy, setCollectedBy] = useState('แอดมินเคาน์เตอร์');

  // Revenue metrics
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const monthlyRevenue = payments.filter(p => p.paymentType === 'monthly').reduce((acc, p) => acc + p.amount, 0);
  const perSessionRevenue = payments.filter(p => p.paymentType === 'per_session').reduce((acc, p) => acc + p.amount, 0);
  const csrCount = payments.filter(p => p.paymentType === 'free_scholarship').length;

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.planName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterMethod !== 'all' && p.paymentMethod !== filterMethod) return false;
    if (filterType !== 'all' && p.paymentType !== filterType) return false;

    return true;
  });

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = PRESET_PLANS.find(p => p.id === planId);
    if (plan) {
      setAmount(plan.amount);
      if (plan.id === 'free_csr') {
        setPaymentMethod('free_csr');
      } else if (paymentMethod === 'free_csr') {
        setPaymentMethod('transfer_promptpay');
      }
    }
  };

  const handleOpenModal = () => {
    if (preselectedMember) {
      setSelectedMemberId(preselectedMember.id);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    const plan = PRESET_PLANS.find(p => p.id === selectedPlanId);
    const planTitle = plan?.id === 'custom' ? customPlanName : (plan?.name || 'แพ็กเกจฝึกซ้อม');
    const paymentType = plan?.type === 'monthly' ? 'monthly' : plan?.type === 'free_scholarship' ? 'free_scholarship' : 'per_session';

    // Calculate renewal data
    let memberUpdate: { expireDate?: string; addSessions?: number; memberId: string } | undefined;

    if (plan?.type === 'monthly') {
      const baseDate = member.expireDate && new Date(member.expireDate) > new Date()
        ? new Date(member.expireDate)
        : new Date();
      baseDate.setDate(baseDate.getDate() + 30);
      memberUpdate = {
        memberId: member.id,
        expireDate: baseDate.toISOString().split('T')[0]
      };
    } else if (plan?.type === 'per_session') {
      memberUpdate = {
        memberId: member.id,
        addSessions: plan.addSessions || 1
      };
    }

    onAddPayment({
      memberId: member.id,
      memberName: member.name,
      memberType: member.type,
      paymentType,
      planName: planTitle,
      amount: Number(amount),
      paymentMethod,
      date: paymentDate,
      referenceNumber: referenceNumber || undefined,
      note: note || undefined,
      collectedBy
    }, memberUpdate);

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12" id="billing-view-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-emerald-400" />
            ระบบเก็บเงิน & บันทึกรายได้ (Billing & Receipts)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            บันทึกการชำระค่าสมาชิกรายเดือน ค่าบริการรายครั้ง และพิมพ์ใบเสร็จรับเงิน
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95"
          id="new-payment-btn"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          บันทึกรับชำระเงินใหม่
        </button>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400">ยอดรายรับทั้งหมด</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatShortBaht(totalRevenue)}
          </p>
          <span className="text-[11px] text-slate-500">รวม {payments.length} รายการ</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400">จากค่าสมาชิกรายเดือน</span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {formatShortBaht(monthlyRevenue)}
          </p>
          <span className="text-[11px] text-emerald-400">
            {Math.round((monthlyRevenue / (totalRevenue || 1)) * 100)}% ของรายได้
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400">จากค่าบริการรายครั้ง / คูปอง</span>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            {formatShortBaht(perSessionRevenue)}
          </p>
          <span className="text-[11px] text-slate-500">Drop-in & Punch Cards</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400">ทุนเพื่อสังคม (ฟรี 0฿)</span>
          <p className="text-2xl font-black text-purple-300 font-mono mt-1">
            {csrCount} <span className="text-xs font-normal text-slate-400">ครั้งที่ออกบัตร</span>
          </p>
          <span className="text-[11px] text-purple-400">โครงการ CSR ประจำยิม</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        <div className="flex flex-wrap gap-2">
          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="all">ประเภท: ทั้งหมด</option>
            <option value="monthly">รายเดือน</option>
            <option value="per_session">รายครั้ง / คูปอง</option>
            <option value="free_scholarship">ทุนเพื่อสังคม</option>
          </select>

          {/* Filter Method */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="all">ช่องทาง: ทั้งหมด</option>
            <option value="transfer_promptpay">PromptPay / โอนเงิน</option>
            <option value="cash">เงินสด</option>
            <option value="credit_card">บัตรเครดิต</option>
            <option value="free_csr">ทุนฟรี CSR</option>
          </select>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, เลขที่ใบเสร็จ, หรือแพ็กเกจ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">เลขที่ใบเสร็จ</th>
                <th className="px-5 py-3.5">วันที่</th>
                <th className="px-5 py-3.5">สมาชิก</th>
                <th className="px-5 py-3.5">รายการแพ็กเกจ</th>
                <th className="px-5 py-3.5">ช่องทางชำระ</th>
                <th className="px-5 py-3.5 text-right">ยอดเงิน</th>
                <th className="px-5 py-3.5 text-center">ใบเสร็จ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    ไม่พบรายการชำระเงินที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400">
                      {p.receiptNo}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {formatThaiDate(p.date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-white block">{p.memberName}</span>
                      <span className="text-[11px] text-slate-400">
                        {p.memberType === 'free_community' ? 'ทุนเพื่อสังคม' : 'สมาชิกทั่วไป'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-200">{p.planName}</span>
                      {p.note && <span className="block text-[10px] text-slate-500 italic">{p.note}</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
                        {p.paymentMethod === 'transfer_promptpay' ? 'PromptPay' :
                         p.paymentMethod === 'credit_card' ? 'บัตรเครดิต' :
                         p.paymentMethod === 'cash' ? 'เงินสด' : 'ทุนเพื่อสังคม (ฟรี)'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-emerald-400">
                      {formatShortBaht(p.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onViewReceipt(p)}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-[11px] font-semibold"
                        title="ดูและพิมพ์ใบเสร็จ"
                      >
                        <Printer className="w-3 h-3 mr-1 text-amber-400" />
                        พิมพ์
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
              <h3 className="text-base font-bold text-white flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-emerald-400" />
                บันทึกการรับชำระเงินค่าสมาชิก
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Member Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">เลือกสมาชิก *</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  required
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.memberCode} - {m.name} ({m.nickname}) • {m.discipline}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preset Packages */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">เลือกแพ็กเกจ / หลักสูตร *</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {PRESET_PLANS.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                        selectedPlanId === plan.id
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-xs">{plan.name}</p>
                        <span className="text-[10px] text-slate-400">
                          {plan.type === 'monthly' ? 'ต่ออายุสมาชิก 30 วัน' :
                           plan.type === 'per_session' ? `เพิ่มสิทธิ์ซ้อม ${plan.addSessions} ครั้ง` :
                           plan.type === 'free_scholarship' ? 'ไม่มีค่าใช้จ่าย (ทุน CSR)' : 'ระบุยอดเอง'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {plan.amount === 0 && plan.id === 'free_csr' ? '0 บาท (ฟรี)' : formatShortBaht(plan.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlanId === 'custom' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ระบุชื่อแพ็กเกจเอง</label>
                  <input
                    type="text"
                    required
                    value={customPlanName}
                    onChange={(e) => setCustomPlanName(e.target.value)}
                    placeholder="เช่น คอร์สมวยไทยเวทเทรนนิ่งส่วนตัว 5 ครั้ง"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">จำนวนเงินที่ต้องชำระ (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">วันที่ชำระ *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ช่องทางการชำระเงิน *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'transfer_promptpay', label: 'PromptPay' },
                    { id: 'cash', label: 'เงินสด' },
                    { id: 'credit_card', label: 'บัตรเครดิต' },
                    { id: 'free_csr', label: 'ทุนฟรี CSR' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-xl text-center border font-medium transition-all ${
                        paymentMethod === m.id
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference & Note */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">เลขอ้างอิง / สลิปโอนเงิน</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="เช่น TXN-998811"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ผู้รับเงิน / เจ้าหน้าที่</label>
                  <input
                    type="text"
                    value={collectedBy}
                    onChange={(e) => setCollectedBy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ต่ออายุโปรโมชั่นเดือนเกิด หรือผ่อนชำระงวดที่ 1"
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  บันทึกรับเงิน & ออกใบเสร็จ
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
