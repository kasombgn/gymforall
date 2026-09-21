import React, { useState, useRef } from 'react';
import { Member } from '../types/gym';
import { 
  downloadMemberCSVTemplate, 
  parseMembersFromCSV, 
  CSVParseResult,
  formatThaiDate 
} from '../utils/storage';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  HelpCircle,
  Users,
  ShieldCheck,
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  onImportSuccess: (importedMembers: Member[], mode: 'merge' | 'append' | 'skip') => void;
}

export const ImportMembersModal: React.FC<ImportMembersModalProps> = ({
  isOpen,
  onClose,
  existingMembers,
  onImportSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'merge' | 'append' | 'skip'>('merge');
  const [searchPreview, setSearchPreview] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    downloadMemberCSVTemplate();
  };

  const handleProcessFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      alert('กรุณาเลือกไฟล์นามสกุล .csv หรือ .txt');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseMembersFromCSV(text, existingMembers);
        setParseResult(result);
      } catch (err: any) {
        setParseResult({
          validMembers: [],
          errors: [{ row: 0, message: err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ CSV' }],
          warnings: [],
          totalRows: 0
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      alert('ไม่สามารถอ่านไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
      setIsProcessing(false);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setParseResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validMembers.length === 0) return;
    onImportSuccess(parseResult.validMembers, importMode);
    onClose();
  };

  // Filter preview list
  const filteredMembers = parseResult?.validMembers.filter(m => {
    if (!searchPreview) return true;
    const q = searchPreview.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.memberCode.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.discipline.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
      id="import-members-csv-modal"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
                นำเข้าข้อมูลสมาชิกผ่านไฟล์ CSV (Import Members CSV)
              </h3>
              <p className="text-xs text-slate-400">
                นำเข้ารายชื่อสมาชิกหลายคนพร้อมกันในครั้งเดียว รองรับไฟล์จาก Excel และ Google Sheets
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            id="close-import-members-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Step 1: Download Template Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
                  ขั้นตอนที่ 1
                </span>
                <h4 className="font-bold text-white text-sm">ดาวน์โหลดไฟล์แม่แบบ (CSV Template)</h4>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                ดาวน์โหลดไฟล์ตัวอย่างที่มีคอลัมน์มาตรฐานครบถ้วน (รองรับภาษาไทยใน Microsoft Excel และ Google Sheets อย่างสมบูรณ์)
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all active:scale-95 text-xs"
                id="download-template-csv-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                ดาวน์โหลดไฟล์ Template (.csv)
              </button>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="ดูคำแนะนำคอลัมน์"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Optional Column Guide accordion */}
          {showInstructions && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-slate-300 animate-fadeIn">
              <h5 className="font-bold text-white flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-400" />
                รายละเอียดคอลัมน์ในไฟล์ Template
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-amber-400 block">รหัสสมาชิก</strong>
                  <span>เช่น NS-101 (หากเว้นว่าง ระบบจะรันต่อให้อัตโนมัติ)</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-emerald-400 block">ชื่อ-นามสกุล *</strong>
                  <span>จำเป็นต้องระบุ เช่น สมชาย ใจเด็ด</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-amber-400 block">ประเภทสมาชิก</strong>
                  <span>ระบุ: <code>รายเดือน</code>, <code>รายครั้ง</code> หรือ <code>ฟรีเพื่อสังคม</code></span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-amber-400 block">วิชาการต่อสู้</strong>
                  <span>Muay Thai, BJJ, Boxing, MMA, Wrestling, Kids Martial Arts</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-amber-400 block">วันที่สมัคร & วันหมดอายุ</strong>
                  <span>รูปแบบ <code>YYYY-MM-DD</code> เช่น 2026-03-01</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <strong className="text-amber-400 block">จำนวนครั้งคงเหลือ</strong>
                  <span>ตัวเลขจำนวนครั้ง สำหรับสมาชิกรายครั้ง/คูปอง</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: File Upload Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                  ขั้นตอนที่ 2
                </span>
                <span className="font-bold text-white text-sm">เลือกหรือลากไฟล์ CSV ที่กรอกข้อมูลแล้ว</span>
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  เปลี่ยนไฟล์
                </button>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-800/40'
              }`}
              id="csv-dropzone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.txt"
                className="hidden"
                id="members-csv-file-input"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">
                      ขนาดไฟล์: {(selectedFile.size / 1024).toFixed(1)} KB • คลิกเพื่อเลือกไฟล์ใหม่
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
                    <Upload className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ CSV มาวางที่นี่
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      รองรับไฟล์ .csv จาก Microsoft Excel, Google Sheets, LibreOffice
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Parse Result & Interactive Preview */}
          {parseResult && (
            <div className="space-y-3 pt-2">
              
              {/* Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                    พบในไฟล์: <strong>{parseResult.totalRows} แถว</strong>
                  </span>
                  
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-semibold text-xs flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    พร้อมนำเข้า: <strong>{parseResult.validMembers.length} คน</strong>
                  </span>

                  {parseResult.warnings.length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 font-semibold text-xs flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                      คำเตือน/แจ้งเตือน: <strong>{parseResult.warnings.length} รายการ</strong>
                    </span>
                  )}

                  {parseResult.errors.length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800 text-red-300 font-semibold text-xs flex items-center">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                      ข้อมูลไม่สมบูรณ์: <strong>{parseResult.errors.length} แถว</strong>
                    </span>
                  )}
                </div>

                {/* Search in preview */}
                {parseResult.validMembers.length > 5 && (
                  <div className="w-full sm:w-48">
                    <input
                      type="text"
                      placeholder="ค้นหาในตาราง..."
                      value={searchPreview}
                      onChange={(e) => setSearchPreview(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                )}
              </div>

              {/* Errors list if any */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl space-y-1 text-red-300 text-xs">
                  <span className="font-bold flex items-center text-red-400">
                    <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                    แถวที่ไม่สามารถนำเข้าได้ ({parseResult.errors.length} รายการ):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-300/90 pl-1 max-h-24 overflow-y-auto">
                    {parseResult.errors.map((err, i) => (
                      <li key={i}>
                        แถวที่ {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings list if any */}
              {parseResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-1 text-amber-300 text-xs">
                  <span className="font-bold flex items-center text-amber-400">
                    <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                    ข้อสังเกตและการปรับค่าอัตโนมัติ ({parseResult.warnings.length} รายการ):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/90 pl-1 max-h-24 overflow-y-auto">
                    {parseResult.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>
                        แถวที่ {w.row} {w.name ? `(${w.name})` : ''}: {w.message}
                      </li>
                    ))}
                    {parseResult.warnings.length > 5 && (
                      <li className="text-slate-400 list-none pt-0.5">
                        ...และอีก {parseResult.warnings.length - 5} รายการ
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              {parseResult.validMembers.length > 0 && (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                      พรีวิวรายชื่อสมาชิกที่จะนำเข้า ({filteredMembers.length} คน)
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-left text-[11px] text-slate-300 whitespace-nowrap">
                      <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">รหัส</th>
                          <th className="py-2 px-3">ชื่อ-นามสกุล</th>
                          <th className="py-2 px-3">ชื่อเล่น</th>
                          <th className="py-2 px-3">เบอร์โทรศัพท์</th>
                          <th className="py-2 px-3">ประเภทสมาชิก</th>
                          <th className="py-2 px-3">วิชา / ระดับสาย</th>
                          <th className="py-2 px-3">วันสมัคร / วันหมดอายุ</th>
                          <th className="py-2 px-3">คงเหลือ</th>
                          <th className="py-2 px-3">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredMembers.map((m, idx) => {
                          const isDuplicate = existingMembers.some(
                            ex => ex.memberCode.toLowerCase() === m.memberCode.toLowerCase()
                          );
                          return (
                            <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2 px-3 font-mono font-bold text-amber-400">
                                {m.memberCode}
                                {isDuplicate && (
                                  <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    ซ้ำเดิม
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-semibold text-white">
                                {m.name}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{m.nickname || '-'}</td>
                              <td className="py-2 px-3 font-mono">{m.phone || '-'}</td>
                              <td className="py-2 px-3">
                                {m.type === 'paid_monthly' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    รายเดือน
                                  </span>
                                )}
                                {m.type === 'paid_per_session' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    รายครั้ง ({m.remainingSessions} ครั้ง)
                                  </span>
                                )}
                                {m.type === 'free_community' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    ฟรีเพื่อสังคม
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <div>
                                  <span className="text-slate-200">{m.discipline}</span>
                                  {m.beltOrLevel && (
                                    <span className="text-[10px] text-slate-500 block">{m.beltOrLevel}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-mono text-slate-300">{m.joinDate}</span>
                                {m.expireDate && (
                                  <span className="block font-mono text-[10px] text-slate-500">
                                    ถึง {m.expireDate}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {m.remainingSessions !== undefined ? `${m.remainingSessions} ครั้ง` : '-'}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  m.status === 'active' 
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-red-400 bg-red-500/10'
                                }`}>
                                  {m.status === 'active' ? 'ปกติ' : 'หมดอายุ'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 4: Import Mode Option */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <span className="font-bold text-white text-xs block">
                  ตัวเลือกการจัดการเมื่อพบรหัสสมาชิกที่ซ้ำกับข้อมูลเดิม:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'merge'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 mr-2 text-amber-500"
                    />
                    <div>
                      <strong className="text-xs block text-slate-200">อัปเดตข้อมูลเดิม (แนะนำ)</strong>
                      <span className="text-[10px] text-slate-400">ถ้าพบรหัสซ้ำ ให้อัปเดตข้อมูลสมาชิกเดิม</span>
                    </div>
                  </label>

                  <label className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'skip'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'skip'}
                      onChange={() => setImportMode('skip')}
                      className="mt-0.5 mr-2 text-amber-500"
                    />
                    <div>
                      <strong className="text-xs block text-slate-200">ข้ามรายการที่ซ้ำ</strong>
                      <span className="text-[10px] text-slate-400">นำเข้าเฉพาะสมาชิกรหัสใหม่เท่านั้น</span>
                    </div>
                  </label>

                  <label className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                    importMode === 'append'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 mr-2 text-amber-500"
                    />
                    <div>
                      <strong className="text-xs block text-slate-200">สร้างใหม่ทั้งหมด</strong>
                      <span className="text-[10px] text-slate-400">สร้างเป็นสมาชิกใหม่อีกคนเสมอ</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-800/80 shrink-0">
          <div className="text-slate-400 text-xs">
            {parseResult && parseResult.validMembers.length > 0 ? (
              <span className="text-emerald-400 font-semibold">
                พร้อมนำเข้าสมาชิก {parseResult.validMembers.length} คน
              </span>
            ) : (
              <span>กรุณาเลือกไฟล์ CSV เพื่อดูข้อมูลตัวอย่างก่อนนำเข้า</span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 font-semibold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!parseResult || parseResult.validMembers.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold shadow-md transition-all active:scale-95 flex items-center"
              id="confirm-import-csv-btn"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              ยืนยันนำเข้าข้อมูลสมาชิก ({parseResult?.validMembers.length || 0} คน)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
