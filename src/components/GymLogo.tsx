import React, { useState } from 'react';
import { 
  Dumbbell, 
  Flame, 
  Shield, 
  Trophy, 
  Swords, 
  Zap, 
  Crown, 
  Target 
} from 'lucide-react';
import { GymSettings, PresetLogoIcon, LogoTheme } from '../types/gym';

export const DEFAULT_GYM_SETTINGS: GymSettings = {
  appName: 'NAKSOO COMBAT',
  appNameHighlight: 'COMBAT',
  tagline: 'ยิมศิลปะการต่อสู้',
  subDescription: 'ระบบบริหารโรงยิมและค่ายฝึกสอนครบวงจร',
  logoType: 'preset_icon',
  presetIcon: 'dumbbell',
  logoTheme: 'amber_red',
  customLogoUrl: '',
  phone: '02-999-8888',
  address: 'อาคารนวมทอง สุขุมวิท กรุงเทพฯ'
};

interface GymLogoProps {
  settings?: GymSettings;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const GymLogo: React.FC<GymLogoProps> = ({
  settings = DEFAULT_GYM_SETTINGS,
  size = 'md',
  className = '',
  showText = false
}) => {
  const [imageError, setImageError] = useState(false);

  const getThemeClasses = (theme: LogoTheme) => {
    switch (theme) {
      case 'red_black':
        return 'bg-gradient-to-br from-red-600 to-slate-950 text-white border border-red-500/40 shadow-red-600/30';
      case 'emerald_amber':
        return 'bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-400 text-slate-950 shadow-emerald-500/30';
      case 'blue_cyan':
        return 'bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-cyan-500/30';
      case 'purple_rose':
        return 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-rose-500 text-white shadow-purple-600/30';
      case 'gold_luxury':
        return 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-slate-950 shadow-amber-400/40';
      case 'carbon_dark':
        return 'bg-gradient-to-br from-slate-800 to-slate-950 text-amber-400 border border-slate-700 shadow-black/50';
      case 'amber_red':
      default:
        return 'bg-gradient-to-br from-amber-500 to-red-600 text-slate-950 shadow-amber-500/25';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          box: 'w-8 h-8 rounded-lg text-sm',
          icon: 'w-4 h-4',
          img: 'w-8 h-8 rounded-lg'
        };
      case 'lg':
        return {
          box: 'w-14 h-14 rounded-2xl text-2xl',
          icon: 'w-7 h-7',
          img: 'w-14 h-14 rounded-2xl'
        };
      case 'xl':
        return {
          box: 'w-20 h-20 rounded-2xl text-4xl',
          icon: 'w-10 h-10',
          img: 'w-20 h-20 rounded-2xl'
        };
      case 'md':
      default:
        return {
          box: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-base',
          icon: 'w-5 h-5 sm:w-6 sm:h-6',
          img: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl'
        };
    }
  };

  const renderPresetIcon = (iconName: PresetLogoIcon, iconClass: string) => {
    switch (iconName) {
      case 'flame':
        return <Flame className={`${iconClass} fill-current`} />;
      case 'shield':
        return <Shield className={`${iconClass} fill-current/20`} />;
      case 'trophy':
        return <Trophy className={`${iconClass} fill-current/20`} />;
      case 'swords':
        return <Swords className={iconClass} />;
      case 'zap':
        return <Zap className={`${iconClass} fill-current`} />;
      case 'crown':
        return <Crown className={`${iconClass} fill-current`} />;
      case 'target':
        return <Target className={iconClass} />;
      case 'dumbbell':
      default:
        return <Dumbbell className={iconClass} />;
    }
  };

  const sizeCls = getSizeClasses();
  const themeCls = getThemeClasses(settings.logoTheme || 'amber_red');

  const isCustomImage = settings.logoType === 'custom_image' && settings.customLogoUrl && !imageError;

  return (
    <div className={`inline-flex items-center space-x-3 ${className}`}>
      {isCustomImage ? (
        <div className={`overflow-hidden border border-slate-700/80 shadow-md bg-slate-900 flex items-center justify-center shrink-0 ${sizeCls.img}`}>
          <img
            src={settings.customLogoUrl}
            alt={settings.appName || 'Gym Logo'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div 
          className={`flex items-center justify-center shadow-md font-black shrink-0 ${sizeCls.box} ${themeCls}`}
        >
          {renderPresetIcon(settings.presetIcon || 'dumbbell', sizeCls.icon)}
        </div>
      )}

      {showText && (
        <div className="leading-tight">
          <div className="flex items-center space-x-1.5 font-bold text-white tracking-tight">
            <span>{settings.appName || 'NAKSOO COMBAT'}</span>
            {settings.appNameHighlight && (
              <span className="text-amber-400">{settings.appNameHighlight}</span>
            )}
          </div>
          {settings.tagline && (
            <p className="text-xs text-slate-400">{settings.tagline}</p>
          )}
        </div>
      )}
    </div>
  );
};
