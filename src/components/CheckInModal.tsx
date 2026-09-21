import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Member, Coach, AttendanceRecord, TrainingClassSession, GymUser } from '../types/gym';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  UserCheck, 
  Dumbbell, 
  Search, 
  Clock, 
  CalendarCheck, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  QrCode,
  Camera,
  CameraOff,
  Zap,
  Check,
  Lock,
  ShieldAlert
} from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  coaches: Coach[];
  classes: TrainingClassSession[];
  onSaveAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  preselectedMemberId?: string;
  currentUser?: GymUser;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  members,
  coaches,
  classes,
  onSaveAttendance,
  preselectedMemberId,
  currentUser
}) => {
  // Mode: 'qr_scanner' or 'manual_select'
  const [activeMode, setActiveMode] = useState<'qr_scanner' | 'manual_select'>('qr_scanner');

  const [memberId, setMemberId] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('custom');
  const [coachId, setCoachId] = useState<string>('');
  const [recorderRole, setRecorderRole] = useState<'coach' | 'admin'>('admin');
  const [recorderName, setRecorderName] = useState<string>('แอดมินเคาน์เตอร์');

  const [timeSlot, setTimeSlot] = useState<string>('17:00 - 18:30');
  const [sessionTitle, setSessionTitle] = useState<string>('มวยไทยรอบเย็น & ล่อเป้า');
  const [discipline, setDiscipline] = useState<string>('Muay Thai');
  
  // Barcode / QR Gun input
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  // Camera video scanner states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Optional detailed feedback (collapsed by default to reduce friction)
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);
  const [trainingNotes, setTrainingNotes] = useState<string>('');
  const [performanceRating, setPerformanceRating] = useState<number>(4);

  // Play audio chime on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable or blocked by browser
    }
  };

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      if (preselectedMemberId) {
        setMemberId(preselectedMemberId);
        setActiveMode('manual_select');
      } else if (!memberId && members.length > 0) {
        setMemberId(members[0].id);
      }

      // Role enforcement: if logged in as coach, lock coachId and recorder
      if (currentUser?.role === 'coach' && currentUser.coachId) {
        setCoachId(currentUser.coachId);
        setRecorderRole('coach');
        setRecorderName(currentUser.name);
      } else {
        if (!coachId && coaches.length > 0) {
          setCoachId(coaches[0].id);
        }
      }

      // Default class if available
      if (classes.length > 0) {
        const firstClass = classes[0];
        setSelectedClassId(firstClass.id);
        setSessionTitle(firstClass.title);
        setTimeSlot(`${firstClass.startTime} - ${firstClass.endTime}`);
        setDiscipline(firstClass.discipline);
        if (currentUser?.role !== 'coach' && firstClass.coachId) {
          setCoachId(firstClass.coachId);
        }
      }

      // Focus barcode gun input
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 300);
    } else {
      stopCamera();
    }
  }, [isOpen, preselectedMemberId, members, coaches, classes]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        scanQRCodeLoop();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('ไม่สามารถเปิดกล้องได้ (กรุณาอนุญาตการเข้าถึงกล้อง หรือใช้ช่องยิงบาร์โค้ดด้านล่าง)');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleMemberFoundByCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = members.find(m => 
      m.memberCode.toUpperCase() === cleanCode || 
      m.id.toUpperCase() === cleanCode ||
      cleanCode.includes(m.memberCode.toUpperCase())
    );

    if (found) {
      playBeep();
      setMemberId(found.id);
      setScanSuccessMessage(`สแกนพบ: ${found.name} (${found.memberCode}) สำเร็จ!`);
      setTimeout(() => setScanSuccessMessage(null), 3500);
      return true;
    } else {
      setCameraError(`ไม่พบรหัสสมาชิก "${cleanCode}" ในระบบ`);
      return false;
    }
  };

  const scanQRCodeLoop = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(scanQRCodeLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          const success = handleMemberFoundByCode(code.data);
          if (success) {
            // Pause slightly so it doesn't multi-trigger
            stopCamera();
            return;
          }
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanQRCodeLoop);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const success = handleMemberFoundByCode(barcodeInput);
    if (success) {
      setBarcodeInput('');
    }
  };

  if (!isOpen) return null;

  const selectedMember = members.find(m => m.id === memberId);
  const selectedCoach = coaches.find(c => c.id === coachId);

  // Filter members for quick search
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.nickname.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.memberCode.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone.includes(memberSearch)
  );

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    if (classId === 'custom') {
      setSessionTitle('ฝึกซ้อมเดี่ยว / ซ้อมอิสระ');
      setTimeSlot('17:00 - 18:30');
    } else {
      const cls = classes.find(c => c.id === classId);
      if (cls) {
        setSessionTitle(cls.title);
        setTimeSlot(`${cls.startTime} - ${cls.endTime}`);
        setDiscipline(cls.discipline);
        if (cls.coachId) {
          setCoachId(cls.coachId);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedCoach) return;

    const todayStr = new Date().toISOString().split('T')[0];

    onSaveAttendance({
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberNickname: selectedMember.nickname,
      memberType: selectedMember.type,
      discipline: discipline as any || selectedMember.discipline,
      coachId: selectedCoach.id,
      coachName: selectedCoach.name,
      date: todayStr,
      timeSlot,
      sessionTitle,
      trainingNotes: trainingNotes ? `[บันทึกโดย ${recorderRole === 'coach' ? 'โค้ช' : 'แอดมิน'}: ${recorderName}] ${trainingNotes}` : undefined,
      performanceRating
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" id="checkin-modal-backdrop">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]" id="checkin-modal-dialog">
        
        {/* Header - Unified for Coach / Admin */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">เช็คอินเข้าเรียน</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" /> ผู้บันทึก: โค้ช / แอดมิน
                </span>
              </div>
              <p className="text-xs text-slate-400">บันทึกสิทธิ์การเข้าเรียน ตัดรอบคูปอง และประเมินผลการเรียน</p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition-colors"
            id="close-checkin-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs: QR Code Scan vs Manual Dropdown */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveMode('qr_scanner');
              setTimeout(() => barcodeInputRef.current?.focus(), 150);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeMode === 'qr_scanner'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>สแกน QR Code / ยิงบาร์โค้ด</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveMode('manual_select');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeMode === 'manual_select'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>เลือกจากรายชื่อ</span>
          </button>
        </div>

        {/* Streamlined Form for Staff / Coaches */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Staff / Recorder Identity */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-semibold">เจ้าหน้าที่ผู้บันทึก:</span>
            {currentUser?.role === 'coach' ? (
              <div className="flex items-center space-x-1.5 bg-cyan-950/80 border border-cyan-700/60 rounded-lg px-2.5 py-1 text-cyan-300">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span className="font-bold text-[11px]">โค้ชผู้สอน: {currentUser.name}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setRecorderRole('admin');
                      setRecorderName('แอดมินเคาน์เตอร์');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      recorderRole === 'admin'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    แอดมินยิม
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecorderRole('coach');
                      if (selectedCoach) setRecorderName(selectedCoach.name);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      recorderRole === 'coach'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    โค้ชผู้สอน
                  </button>
                </div>
                <input
                  type="text"
                  value={recorderName}
                  onChange={(e) => setRecorderName(e.target.value)}
                  placeholder="ระบุชื่อผู้บันทึก"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] w-28 text-center"
                />
              </div>
            )}
          </div>

          {/* Success Banner when QR scanned */}
          {scanSuccessMessage && (
            <div className="p-3 bg-emerald-950/80 border-2 border-emerald-500 rounded-xl text-emerald-300 flex items-center justify-between animate-bounce">
              <div className="flex items-center space-x-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{scanSuccessMessage}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">BEEP!</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: QR CODE / BARCODE SCANNER MODE                   */}
          {/* ======================================================== */}
          {activeMode === 'qr_scanner' && (
            <div className="space-y-3">
              
              {/* Camera Scanner Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                {isCameraActive ? (
                  <div className="relative w-full max-w-[280px] aspect-4/3 rounded-xl overflow-hidden border-2 border-amber-500 shadow-xl bg-black">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Visual Laser Reticle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-40 h-40 border-2 border-amber-400/80 rounded-xl relative">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">สแกน QR Code จากบัตรสมาชิก</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">ใช้กล้องเว็บแคม หรือเครื่องยิงบาร์โค้ด USB</p>
                    </div>
                  </div>
                )}

                {/* Camera toggle button */}
                <div className="mt-3 flex items-center space-x-2">
                  {isCameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/70 border border-red-800 text-red-300 hover:bg-red-900/80 transition-colors"
                    >
                      <CameraOff className="w-3.5 h-3.5 mr-1.5" />
                      ปิดกล้องสแกน
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
                    >
                      <Camera className="w-4 h-4 mr-1.5" />
                      เปิดกล้องสแกน QR Code
                    </button>
                  )}
                </div>

                {cameraError && (
                  <p className="text-[11px] text-red-400 mt-2 text-center bg-red-950/40 p-2 rounded-lg border border-red-900/60">
                    {cameraError}
                  </p>
                )}
              </div>

              {/* Hardware Barcode Scanner / Manual Quick Code Input */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span className="flex items-center">
                    <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    ช่องรับสัญญาณเครื่องยิง QR / บาร์โค้ด (USB Scanner Gun)
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">พร้อมสแกนอัตโนมัติ</span>
                </label>

                <div className="flex gap-2">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeSubmit(e);
                      }
                    }}
                    placeholder="ยิง QR Code บัตร หรือพิมพ์รหัสสมาชิก (เช่น NS-001)..."
                    className="flex-1 bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2 text-white text-xs font-mono font-bold focus:border-amber-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleBarcodeSubmit}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700"
                  >
                    ค้นหา
                  </button>
                </div>
              </div>

              {/* Quick simulation test buttons for demo */}
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-1">
                  💡 ทดสอบคลิกยิงรหัสตัวอย่างด่วน:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {members.slice(0, 4).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleMemberFoundByCode(m.memberCode)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700 text-[10px] font-mono text-slate-300 transition-colors"
                    >
                      {m.memberCode} ({m.nickname || m.name.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MANUAL SELECT MODE                               */}
          {/* ======================================================== */}
          {activeMode === 'manual_select' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  เลือกผู้เรียนจากรายชื่อ *
                </label>
                <span className="text-[11px] text-slate-400">ค้นหาได้จากชื่อหรือเบอร์</span>
              </div>

              {/* Quick Search filter if many members */}
              {members.length > 5 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="พิมพ์ค้นหาชื่อ, รหัสสมาชิก หรือเบอร์โทร..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 mb-1.5"
                  />
                </div>
              )}

              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium"
                required
                id="checkin-member-select"
              >
                {filteredMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.memberCode} - {m.name} ({m.nickname}) • {
                      m.type === 'paid_monthly' ? 'รายเดือน' :
                      m.type === 'paid_per_session' ? `คูปอง (เหลือ ${m.remainingSessions ?? 0} ครั้ง)` :
                      'ทุนเพื่อสังคม (ฟรี CSR)'
                    }
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanned Member Profile Card */}
          {selectedMember && (
            <div className={`p-3.5 rounded-2xl border-2 text-xs space-y-2 transition-all ${
              selectedMember.type === 'free_community'
                ? 'bg-purple-950/40 border-purple-600/70 text-purple-200'
                : selectedMember.type === 'paid_per_session'
                ? 'bg-amber-950/40 border-amber-500/70 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 shrink-0 text-sm">
                    {selectedMember.nickname ? selectedMember.nickname.charAt(0) : selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">
                      {selectedMember.name} ({selectedMember.nickname})
                    </span>
                    <span className="text-[11px] font-mono text-amber-400">
                      รหัส: {selectedMember.memberCode} • {selectedMember.discipline}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-slate-900 border border-slate-700">
                  {selectedMember.type === 'free_community' ? 'ทุน CSR ฟรี' :
                   selectedMember.type === 'paid_per_session' ? 'บัตรคูปอง' : 'สมาชิกรายเดือน'}
                </span>
              </div>

              {selectedMember.type === 'paid_per_session' && (
                <div className="flex items-center space-x-1.5 pt-1 text-amber-300 font-semibold bg-amber-950/50 p-2 rounded-xl border border-amber-900/60">
                  <Dumbbell className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    สิทธิ์คงเหลือ: <strong>{selectedMember.remainingSessions ?? 0} ครั้ง</strong> (ระบบจะตัด 1 ครั้งอัตโนมัติเมื่อกดเช็คอิน)
                  </span>
                </div>
              )}

              {selectedMember.type === 'paid_monthly' && selectedMember.expireDate && (
                <div className="text-slate-300 bg-emerald-950/50 p-2 rounded-xl border border-emerald-900/60">
                  อายุสมาชิกรายเดือนถึง: <strong className="text-emerald-300">{selectedMember.expireDate}</strong>
                </div>
              )}

              {selectedMember.type === 'free_community' && selectedMember.socialProgramReason && (
                <div className="text-purple-300 italic bg-purple-950/50 p-2 rounded-xl border border-purple-900/60">
                  ทุนเพื่อสังคม: {selectedMember.socialProgramReason} (ไม่เสียค่าใช้จ่าย)
                </div>
              )}

              {selectedMember.status === 'expired' && (
                <div className="flex items-center text-red-400 font-bold p-2 bg-red-950/60 rounded-xl border border-red-800">
                  <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                  สมาชิกนี้หมดอายุแล้ว! กรุณาต่ออายุสมาชิกในระบบรับชำระเงิน
                </div>
              )}
            </div>
          )}

          {/* Fast Class / Session Selection (1-Click Fill) */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px] block">
              เลือกคลาสเรียนประจำวัน *
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => handleClassSelect(cls.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedClassId === cls.id
                      ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate">{cls.title}</span>
                    <span className="text-[10px] text-amber-400 font-mono">{cls.startTime}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span>โค้ช: {cls.coachName}</span>
                    <span>{cls.discipline}</span>
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleClassSelect('custom')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  selectedClassId === 'custom'
                    ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                    : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-semibold text-xs block">ฝึกซ้อมอิสระ / ไพรเวท</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">ระบุคลาสและเวลาเอง</span>
              </button>
            </div>
          </div>

          {/* Coach & Time details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-400 font-semibold text-[11px]">
                  โค้ชผู้สอนในคลาส *
                </label>
                {currentUser?.role === 'coach' && (
                  <span className="text-[10px] text-cyan-400 font-bold flex items-center bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                    <Lock className="w-2.5 h-2.5 mr-0.5" /> ล็อกชื่อตามสิทธิ์
                  </span>
                )}
              </div>

              {currentUser?.role === 'coach' ? (
                <div>
                  <div className="w-full bg-slate-950 border border-cyan-500/60 rounded-xl px-3 py-2 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <span className="font-bold text-xs text-cyan-300 truncate">
                        {selectedCoach ? `${selectedCoach.name} (${selectedCoach.nickname})` : 'โค้ชประจำตัว'}
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-400/80 font-mono shrink-0 ml-1">
                      🔒 ล็อก
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * ล็อกเฉพาะชื่อโค้ชที่ล็อกอิน เพื่อป้องกันใส่ชื่อผิดและป้องกันการโกงค่าสอน
                  </p>
                </div>
              ) : (
                <select
                  value={coachId}
                  onChange={(e) => setCoachId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                  id="checkin-coach-select"
                >
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.nickname})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                ช่วงเวลาเข้าเรียน *
              </label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="เช่น 17:00 - 18:30"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
                id="checkin-timeslot-input"
              />
            </div>
          </div>

          {/* Accordion toggle: Optional Performance evaluation by coach */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowEvaluation(!showEvaluation)}
              className="w-full p-2.5 text-left flex items-center justify-between text-slate-300 hover:text-white transition-colors"
            >
              <span className="flex items-center text-[11px] font-semibold text-slate-400">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                ประเมินความมุ่งมั่น & บันทึกเทคนิคเพิ่มเติม (ไม่บังคับ)
              </span>
              {showEvaluation ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showEvaluation && (
              <div className="p-3 pt-0 border-t border-slate-800/60 space-y-3 mt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    คะแนนประเมินโดยโค้ช:
                  </label>
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPerformanceRating(star)}
                        className={`p-1 rounded-md transition-transform hover:scale-110 ${
                          star <= performanceRating ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                    <span className="text-[11px] text-slate-400 ml-2 font-medium">
                      ({performanceRating === 5 ? 'ยอดเยี่ยม' : performanceRating === 4 ? 'ดีมาก' : performanceRating === 3 ? 'ปานกลาง' : 'เริ่มพัฒนา'})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    เทคนิคที่เน้นในคลาสนี้:
                  </label>
                  <textarea
                    value={trainingNotes}
                    onChange={(e) => setTrainingNotes(e.target.value)}
                    rows={2}
                    placeholder="เช่น ซ้อมเตะตัดขา ป้องกันหมัดแย็ป หรือดักแทงเข่า..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Fast 1-Click submit */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white transition-colors"
              id="cancel-checkin-btn"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-700/30 active:scale-95 transition-all"
              id="submit-checkin-btn"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              บันทึกเช็คอินเข้าเรียน
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
