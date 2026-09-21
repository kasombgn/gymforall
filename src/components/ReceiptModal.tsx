import React from 'react';
import { PaymentTransaction, GymSettings } from '../types/gym';
import { formatShortBaht, formatThaiDate } from '../utils/storage';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { GymLogo, DEFAULT_GYM_SETTINGS } from './GymLogo';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
  settings?: GymSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  settings = DEFAULT_GYM_SETTINGS
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" id="receipt-modal-backdrop">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden" id="receipt-modal-dialog">
        
        {/* Actions bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-800/80">
          <span className="text-xs font-semibold text-slate-400">ใบเสร็จรับเงินอย่างเป็นทางการ</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              id="print-receipt-btn"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              พิมพ์ / บันทึก PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              id="close-receipt-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 bg-slate-950 text-slate-200 font-sans space-y-5" id="printable-receipt-area">
          
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-800 pb-4">
            <div className="inline-flex items-center justify-center mb-2">
              <GymLogo settings={settings} size="lg" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {settings.appName} {settings.appNameHighlight}
            </h2>
            <p className="text-xs text-slate-400">{settings.tagline || 'ค่ายมวยและโรงเรียนฝึกสอนศิลปะการต่อสู้ครบวงจร'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              โทร. {settings.phone || '02-999-8888'} • {settings.address || 'อาคารนวมทอง สุขุมวิท กรุงเทพฯ'}
            </p>
          </div>

          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-800/60 pb-3">
            <div>
              <span className="text-slate-500 block">เลขที่ใบเสร็จ:</span>
              <span className="font-mono font-bold text-amber-400">{transaction.receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">วันที่ออกใบเสร็จ:</span>
              <span className="font-medium text-slate-300">{formatThaiDate(transaction.date)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">ชื่อสมาชิก/ผู้เรียน:</span>
              <span className="font-bold text-white">{transaction.memberName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">ช่องทางชำระเงิน:</span>
              <span className="font-medium text-slate-300">
                {transaction.paymentMethod === 'transfer_promptpay' ? 'โอนเงิน PromptPay' :
                 transaction.paymentMethod === 'credit_card' ? 'บัตรเครดิต' :
                 transaction.paymentMethod === 'cash' ? 'เงินสด' : 'ทุนเพื่อสังคม (ฟรี CSR)'}
              </span>
            </div>
          </div>

          {/* Line item */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-semibold border-b border-slate-800 pb-1">
              <span>รายการหลักสูตร / แพ็กเกจ</span>
              <span>จำนวนเงิน</span>
            </div>
            <div className="flex justify-between items-start text-sm">
              <div>
                <p className="font-semibold text-white">{transaction.planName}</p>
                <p className="text-xs text-slate-400">
                  ประเภท: {
                    transaction.paymentType === 'monthly' ? 'คอร์สรายเดือน (Monthly Pass)' :
                    transaction.paymentType === 'per_session' ? 'รายครั้ง / คูปองฝึกซ้อม' :
                    'ทุนพัฒนาศักยภาพเพื่อสังคม (CSR Free)'
                  }
                </p>
                {transaction.note && (
                  <p className="text-[11px] text-slate-500 italic mt-0.5">{transaction.note}</p>
                )}
              </div>
              <span className="font-bold text-white text-base">
                {formatShortBaht(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Total & Stamp */}
          <div className="border-t border-dashed border-slate-800 pt-3 space-y-2">
            <div className="flex justify-between items-center text-base font-extrabold text-white">
              <span>ยอดชำระสุทธิ (Total)</span>
              <span className="text-xl text-amber-400">{formatShortBaht(transaction.amount)}</span>
            </div>
            {transaction.referenceNumber && (
              <p className="text-[11px] text-slate-500">
                เลขอ้างอิงทำรายการ: <span className="font-mono text-slate-400">{transaction.referenceNumber}</span>
              </p>
            )}
          </div>

          {/* Digital Signature / Seal */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-900 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-medium">บันทึกผ่านระบบเรียบร้อย</span>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-slate-500">ผู้รับเงิน: </span>
              <span className="text-slate-300 font-medium">{transaction.collectedBy}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
