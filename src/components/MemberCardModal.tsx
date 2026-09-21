import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Member, CompetitionRecord, GymSettings } from '../types/gym';
import { formatThaiDate, getMemberMedalStats } from '../utils/storage';
import { GymLogo, DEFAULT_GYM_SETTINGS } from './GymLogo';
import { 
  X, 
  Printer, 
  Download, 
  QrCode, 
  Shield, 
  Sparkles, 
  HeartHandshake, 
  Phone, 
  Calendar, 
  Flame,
  CheckCircle2,
  Trophy
} from 'lucide-react';

interface MemberCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  competitions?: CompetitionRecord[];
  settings?: GymSettings;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({
  isOpen,
  onClose,
  member,
  competitions = [],
  settings = DEFAULT_GYM_SETTINGS
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);
  const medalStats = member ? getMemberMedalStats(competitions, member.id) : null;

  useEffect(() => {
    if (member) {
      // The QR code contains member code e.g. "NS-001" (with prefix for universal gym scanning)
      QRCode.toDataURL(member.memberCode, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `QR_${member.memberCode}_${member.name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs" id="member-card-modal-backdrop">
      
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-member-badge, #printable-member-badge * {
            visibility: visible;
          }
          #printable-member-badge {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 340px;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: 1px solid #333 !important;
            page-break-inside: avoid;
            background: #0f172a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header (No-print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80 no-print">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">บัตรสมาชิก & QR Code เช็คอิน</h3>
              <p className="text-xs text-slate-400">สำหรับสแกนเข้าเรียน หรือพิมพ์เป็นบัตรพกพา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container with Badge Preview */}
        <div className="p-6 overflow-y-auto flex flex-col items-center justify-center space-y-6">
          
          {/* Printable Card Badge */}
          <div 
            ref={cardRef}
            id="printable-member-badge"
            className="w-full max-w-[340px] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 p-5 shadow-2xl relative overflow-hidden text-white flex flex-col items-center"
          >
            {/* Top gold bar glow */}
            <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-red-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Header: Gym Brand */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <GymLogo settings={settings} size="sm" />
                <div>
                  <h4 className="font-extrabold text-sm tracking-wider uppercase text-white font-mono">
                    {settings.appName} {settings.appNameHighlight}
                  </h4>
                  <p className="text-[9px] text-amber-400 tracking-widest uppercase">
                    {settings.tagline || 'Martial Arts Academy'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {member.memberCode}
              </span>
            </div>

            {/* Member Photo & Basic Info */}
            <div className="w-full flex items-center space-x-3 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/30 to-red-500/30 border-2 border-amber-500/50 shadow-md flex items-center justify-center font-black text-2xl text-amber-400 shrink-0">
                {member.nickname ? member.nickname.charAt(0) : member.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-white truncate">
                  {member.name}
                </h3>
                <p className="text-xs text-amber-400 font-medium">
                  ชื่อเล่น: {member.nickname || '-'}
                </p>
                <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-300">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold truncate">
                    {member.discipline}
                  </span>
                  {member.beltOrLevel && (
                    <span className="text-[10px] text-slate-400">
                      • {member.beltOrLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-slate-800 flex flex-col items-center justify-center my-1 w-52 h-52">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt={`QR Code for ${member.memberCode}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  กำลังสร้าง QR...
                </div>
              )}
            </div>

            {/* Member Code Label underneath QR */}
            <div className="mt-2 text-center">
              <span className="font-mono text-sm font-black tracking-widest text-amber-400">
                {member.memberCode}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                สแกนรหัสนี้ที่เคาน์เตอร์เพื่อเช็คอินเข้าเรียน
              </p>
            </div>

            {/* Membership Details Footer */}
            <div className="w-full mt-4 pt-3 border-t border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">ประเภทสมาชิก:</span>
                <span className={`font-bold ${
                  member.type === 'free_community' ? 'text-purple-400' :
                  member.type === 'paid_per_session' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {member.type === 'free_community' ? 'ทุนเพื่อสังคม (ฟรี CSR)' :
                   member.type === 'paid_per_session' ? 'คูปองฝึกซ้อมรายครั้ง' : 'สมาชิกรายเดือน'}
                </span>
              </div>

              {member.type === 'paid_per_session' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">สิทธิ์คงเหลือ:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {member.remainingSessions ?? 0} ครั้ง
                  </span>
                </div>
              )}

              {member.type === 'paid_monthly' && member.expireDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">หมดอายุ:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {formatThaiDate(member.expireDate)}
                  </span>
                </div>
              )}

              {member.emergencyContact && (
                <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400">
                  <span>ติดต่อฉุกเฉิน:</span>
                  <span className="font-mono text-slate-300">{member.emergencyContact}</span>
                </div>
              )}

              {/* Medals and Competition Accolades */}
              {medalStats && (medalStats.gold > 0 || medalStats.silver > 0 || medalStats.bronze > 0) && (
                <div className="w-full mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px]">
                  <span className="text-amber-400 font-semibold flex items-center">
                    <Trophy className="w-3 h-3 mr-1 text-amber-400" /> ผลงานสะสม:
                  </span>
                  <div className="flex items-center space-x-2 font-mono font-bold">
                    <span className="inline-flex items-center text-amber-300" title="เหรียญทอง">
                      🥇 {medalStats.gold}
                    </span>
                    <span className="inline-flex items-center text-slate-200" title="เหรียญเงิน">
                      🥈 {medalStats.silver}
                    </span>
                    <span className="inline-flex items-center text-amber-500" title="เหรียญทองแดง">
                      🥉 {medalStats.bronze}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Action buttons (No-print) */}
          <div className="w-full flex flex-col sm:flex-row gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
              id="print-member-card-btn"
            >
              <Printer className="w-4 h-4 mr-2" />
              พิมพ์บัตรสมาชิก
            </button>

            <button
              onClick={handleDownloadQR}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              id="download-qr-image-btn"
            >
              <Download className="w-4 h-4 mr-2 text-emerald-400" />
              บันทึกรูป QR Code (ส่งให้ นร.)
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center no-print">
            💡 ทิป: สามารถส่งภาพ QR Code ให้นักเรียนบันทึกลงในโทรศัพท์มือถือ หรือปริ้นท์เป็นบัตรคล้องคอสำหรับยิงเช็คอินเข้าเรียนได้ทันที
          </p>

        </div>

      </div>
    </div>
  );
};
