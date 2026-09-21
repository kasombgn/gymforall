import React, { useRef, useState } from 'react';
import { GymDatabase } from '../types/gym';
import { 
  exportDataAsJSON, 
  importDataFromJSON, 
  exportMembersToCSV, 
  exportFinancialsToCSV, 
  exportAttendanceToCSV, 
  resetToInitialData 
} from '../utils/storage';
import { 
  X, 
  Download, 
  Upload, 
  FileText, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Coins, 
  CalendarCheck 
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymData: GymDatabase;
  onDataUpdated: (newData: GymDatabase) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  gymData,
  onDataUpdated
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
  };

  const handleExportJSON = () => {
    exportDataAsJSON(gymData);
    showSuccess('ส่งออกไฟล์สำรองข้อมูล JSON สำเร็จแล้ว');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importDataFromJSON(file);
      onDataUpdated(imported);
      showSuccess(`นำเข้าข้อมูลสำเร็จ! พบสมาชิก ${imported.members.length} คน, โค้ช ${imported.coaches.length} คน`);
    } catch (err: any) {
      showError(err.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ JSON');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลเป็นชุดข้อมูลตัวอย่างเริ่มต้นใช่หรือไม่?')) {
      const reset = resetToInitialData();
      onDataUpdated(reset);
      showSuccess('รีเซ็ตข้อมูลระบบเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs" id="import-export-modal-backdrop">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden" id="import-export-modal-dialog">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">จัดการข้อมูล นำเข้า / ส่งออกไฟล์</h3>
              <p className="text-xs text-slate-400">สำรองข้อมูลระบบและส่งออกรายงานในรูปแบบ JSON และ CSV (Excel)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition-colors"
            id="close-import-export-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Messages */}
          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Full System Backup (JSON) */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-amber-400" />
              สำรองและกู้คืนฐานข้อมูลทั้งระบบ (Full JSON Backup)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              เหมาะสำหรับการย้ายเครื่อง ย้ายเบราว์เซอร์ หรือบันทึกข้อมูลทุกส่วน (สมาชิก, โค้ช, รายรับ-รายจ่าย, การเช็คอิน, ปฏิทิน) ไว้อย่างปลอดภัย
            </p>
            
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all active:scale-95"
                id="export-json-btn"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                ดาวน์โหลดไฟล์สำรอง (JSON)
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
                id="import-json-file-input"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
                id="import-json-trigger-btn"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                เลือกไฟล์กู้คืน (นำเข้า JSON)
              </button>
            </div>
          </div>

          {/* Section 2: CSV Export for Spreadsheets (Excel) */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-emerald-400" />
              ส่งออกรายงานแยกประเภท (CSV สำหรับ Excel & Google Sheets)
            </h4>
            <p className="text-xs text-slate-400">
              ไฟล์ CSV รองรับภาษาไทยสมบูรณ์ (UTF-8 with BOM) เปิดใน Excel ได้ทันทีโดยไม่เพี้ยน
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={() => {
                  exportMembersToCSV(gymData.members);
                  showSuccess('ส่งออกไฟล์ CSV รายชื่อสมาชิกสำเร็จแล้ว');
                }}
                className="flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
                id="export-members-csv-btn"
              >
                <Users className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                รายชื่อสมาชิก (.csv)
              </button>

              <button
                onClick={() => {
                  exportFinancialsToCSV(gymData.payments, gymData.expenses);
                  showSuccess('ส่งออกไฟล์ CSV รายรับ-รายจ่ายสำเร็จแล้ว');
                }}
                className="flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
                id="export-financials-csv-btn"
              >
                <Coins className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                รายรับ-รายจ่าย (.csv)
              </button>

              <button
                onClick={() => {
                  exportAttendanceToCSV(gymData.attendance);
                  showSuccess('ส่งออกไฟล์ CSV ประวัติการฝึกซ้อมสำเร็จแล้ว');
                }}
                className="flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
                id="export-attendance-csv-btn"
              >
                <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                ประวัติเข้าซ้อม (.csv)
              </button>
            </div>
          </div>

          {/* Section 3: Reset demo data */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-xs text-slate-400">ต้องการทดสอบข้อมูลใหม่หรือย้อนกลับค่าเริ่มต้น?</span>
            <button
              onClick={handleReset}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
              id="reset-demo-data-btn"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              โหลดข้อมูลตัวอย่างเริ่มต้น
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
