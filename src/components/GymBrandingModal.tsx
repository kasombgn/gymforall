import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw, 
  Check, 
  Dumbbell, 
  Flame, 
  Shield, 
  Trophy, 
  Swords, 
  Zap, 
  Crown, 
  Target, 
  Palette, 
  Eye, 
  FileText, 
  QrCode,
  AlertCircle
} from 'lucide-react';
import { GymSettings, PresetLogoIcon, LogoTheme } from '../types/gym';
import { GymLogo, DEFAULT_GYM_SETTINGS } from './GymLogo';

interface GymBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GymSettings;
  onSaveSettings: (newSettings: GymSettings) => void;
}

export const GymBrandingModal: React.FC<GymBrandingModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<GymSettings>({
    ...DEFAULT_GYM_SETTINGS,
    ...settings
  });

  const [activeLogoTab, setActiveLogoTab] = useState<'preset' | 'upload'>('preset');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const presetIcons: { id: PresetLogoIcon; label: string; icon: React.ReactNode }[] = [
    { id: 'dumbbell', label: 'ดัมเบลล์ / ฟิตเนส', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'flame', label: 'เปลวเพลิง / ไฟนักสู้', icon: <Flame className="w-5 h-5 fill-current" /> },
    { id: 'shield', label: 'โล่เกียรติยศ', icon: <Shield className="w-5 h-5" /> },
    { id: 'trophy', label: 'ถ้วยแชมเปียน', icon: <Trophy className="w-5 h-5" /> },
    { id: 'swords', label: 'ดาบไขว้ / ยุทธการ', icon: <Swords className="w-5 h-5" /> },
    { id: 'zap', label: 'สายฟ้า / ความว่องไว', icon: <Zap className="w-5 h-5 fill-current" /> },
    { id: 'crown', label: 'มงกุฎราชันย์', icon: <Crown className="w-5 h-5 fill-current" /> },
    { id: 'target', label: 'เป้าฝึก / ความแม่นยำ', icon: <Target className="w-5 h-5" /> }
  ];

  const colorThemes: { id: LogoTheme; label: string; previewCls: string }[] = [
    { id: 'amber_red', label: 'ส้มทอง-แดงเพลิง (ดั้งเดิม)', previewCls: 'from-amber-500 to-red-600' },
    { id: 'red_black', label: 'แดงเข้ม-ดำคาร์บอน (ดุดัน)', previewCls: 'from-red-600 to-slate-950' },
    { id: 'emerald_amber', label: 'เขียวมรกต-ทอง (สดชื่น)', previewCls: 'from-emerald-500 to-amber-400' },
    { id: 'blue_cyan', label: 'น้ำเงินโอเชียน-ฟ้าสดใส', previewCls: 'from-blue-600 to-cyan-400' },
    { id: 'purple_rose', label: 'ม่วงนีออน-ชมพูโรส', previewCls: 'from-purple-600 to-rose-500' },
    { id: 'gold_luxury', label: 'ทองคำหรูหราพรีเมียม', previewCls: 'from-yellow-300 to-amber-500' },
    { id: 'carbon_dark', label: 'ดำด้านคลาสสิก มินิมอล', previewCls: 'from-slate-800 to-slate-950' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, WebP, SVG)');
      return;
    }

    // Limit size to 2MB to keep localStorage lightweight
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์ภาพต้องไม่เกิน 2MB เพื่อความเร็วในการโหลด');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        logoType: 'custom_image',
        customLogoUrl: result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefault = () => {
    if (window.confirm('คุณต้องการคืนค่าชื่อโรงยิมและโลโก้เป็นค่าเริ่มต้นของระบบใช่หรือไม่?')) {
      setFormData({ ...DEFAULT_GYM_SETTINGS });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.appName.trim()) {
      alert('กรุณาระบุชื่อโรงยิม / แอปพลิเคชัน');
      return;
    }

    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs" id="gym-branding-modal-backdrop">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" id="gym-branding-modal-dialog">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ตั้งค่าชื่อแอป & โลโก้โรงยิม (App Branding)</h3>
              <p className="text-xs text-slate-400">ปรับเปลี่ยนชื่อค่ายฝึกสอน สโลแกน และโลโก้ได้ตามต้องการ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Real-time Preview Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                <Eye className="w-4 h-4" />
                <span>ตัวอย่างการแสดงผลจริงแบบเรียลไทม์ (Live Preview)</span>
              </div>
              <span className="text-[11px] text-slate-500">อัปเดตทันทีทุกจุดในระบบ</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Header Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ตัวอย่างบนแถบนำทาง (Navbar Header)
                </span>
                <div className="flex items-center space-x-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <GymLogo settings={formData} size="md" />
                  <div className="leading-tight">
                    <div className="text-sm font-bold text-white flex items-center space-x-1">
                      <span>{formData.appName || 'ชื่อโรงยิมของคุณ'}</span>
                      {formData.appNameHighlight && (
                        <span className="text-amber-400">{formData.appNameHighlight}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formData.tagline || 'คำขวัญ / ประเภทค่ายฝึกสอน'}</p>
                  </div>
                </div>
              </div>

              {/* Receipt & Badge Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    ตัวอย่างบนหัวบิลใบเสร็จ & บัตรสมาชิก
                  </span>
                  <div className="text-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-center space-x-2.5">
                    <GymLogo settings={formData} size="sm" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">
                        {formData.appName} {formData.appNameHighlight}
                      </div>
                      <div className="text-[10px] text-slate-400">{formData.tagline}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 1: App & Gym Names */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
              1. ข้อมูลชื่อโรงยิม & คำโปรย
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ชื่อแอปพลิเคชัน / ชื่อโรงยิม <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  placeholder="เช่น NAKSOO COMBAT หรือ ศิษย์ยอดทองมวยไทย"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  คำต่อท้ายที่ต้องการเน้นสีทอง (Optional Highlight)
                </label>
                <input
                  type="text"
                  value={formData.appNameHighlight || ''}
                  onChange={(e) => setFormData({ ...formData, appNameHighlight: e.target.value })}
                  placeholder="เช่น COMBAT, GYM, ACADEMY (เว้นว่างได้)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  คำโปรย / ประเภทค่าย (Tagline)
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="เช่น ยิมศิลปะการต่อสู้ หรือ มวยไทย & MMA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  คำอธิบายย่อย (Sub-description)
                </label>
                <input
                  type="text"
                  value={formData.subDescription}
                  onChange={(e) => setFormData({ ...formData, subDescription: e.target.value })}
                  placeholder="เช่น ระบบบริหารโรงยิมและค่ายฝึกสอนครบวงจร"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Gym Contacts for Receipts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  เบอร์โทรติดต่อยิม (สำหรับพิมพ์ลงใบเสร็จ)
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="เช่น 02-999-8888 หรือ 081-234-5678"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ที่ตั้งโรงยิม / อาคาร
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="เช่น อาคารนวมทอง สุขุมวิท กรุงเทพฯ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Logo Customization */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
              2. รูปแบบและโลโก้โรงยิม (Logo Identity)
            </h4>

            {/* Logo Mode Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setActiveLogoTab('preset');
                  setFormData(prev => ({ ...prev, logoType: 'preset_icon' }));
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  formData.logoType === 'preset_icon'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                เลือกไอคอนศิลปะการต่อสู้ (Preset Icons)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLogoTab('upload');
                  setFormData(prev => ({ ...prev, logoType: 'custom_image' }));
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  formData.logoType === 'custom_image'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                อัปโหลดรูปภาพโลโก้ของคุณ (Custom Logo)
              </button>
            </div>

            {/* If Custom Image Upload */}
            {formData.logoType === 'custom_image' ? (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {formData.customLogoUrl ? (
                      <img
                        src={formData.customLogoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-500">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">ยังไม่มีรูป</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        เลือกไฟล์รูปภาพโลโก้
                      </button>

                      {formData.customLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, customLogoUrl: '', logoType: 'preset_icon' }))}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                          ลบรูปภาพ
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      รองรับไฟล์ PNG, JPG, SVG, WebP (แนะนำไฟล์ทรงสี่เหลี่ยมจัตุรัส 512x512px พื้นหลังโปร่งใสหรือทึบ)
                    </p>

                    {uploadError && (
                      <p className="text-xs text-red-400 flex items-center justify-center sm:justify-start">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        {uploadError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    หรือป้อนลิงก์รูปภาพโลโก้โดยตรง (Image URL)
                  </label>
                  <input
                    type="url"
                    value={formData.customLogoUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customLogoUrl: e.target.value, logoType: 'custom_image' }))}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              /* Preset Icon Selector */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    เลือกสัญลักษณ์ไอคอนประจำค่ายมวย:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {presetIcons.map((item) => {
                      const isSelected = formData.presetIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, presetIcon: item.id }))}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md scale-[1.02]'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1.5 ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300'}`}>
                            {item.icon}
                          </div>
                          <span className="text-xs font-medium leading-tight">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Theme Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    เลือกโทนสีพื้นหลังไล่เฉด (Logo Gradient Palette):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {colorThemes.map((theme) => {
                      const isSelected = formData.logoTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logoTheme: theme.id }))}
                          className={`p-2 rounded-xl border flex items-center space-x-2.5 transition-all text-left ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${theme.previewCls} shrink-0 shadow-xs border border-white/20`} />
                          <span className="text-[11px] font-medium truncate">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center text-xs text-slate-400 hover:text-red-400 transition-colors order-2 sm:order-1"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              คืนค่าชื่อและโลโก้เริ่มต้น (Reset)
            </button>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    บันทึกเรียบร้อย!
                  </>
                ) : (
                  'บันทึกชื่อ & โลโก้ใหม่'
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
