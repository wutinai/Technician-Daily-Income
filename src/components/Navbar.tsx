import React from 'react';
import { UserRole, AppSettings } from '../types';
import {
  Shield,
  Scissors,
  Settings,
  FileSpreadsheet,
  BarChart3,
  Terminal,
  Lock,
  LogOut,
  UserCheck,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  activeTab: 'tech1' | 'tech2' | 'dashboard';
  onChangeTab: (tab: 'tech1' | 'tech2' | 'dashboard') => void;
  settings: AppSettings;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenSheetsModal: () => void;
  onOpenAppsScriptModal: () => void;
  isSheetsConnected: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  onChangeTab,
  settings,
  onOpenLogin,
  onLogout,
  onOpenSettings,
  onOpenSheetsModal,
  onOpenAppsScriptModal,
  isSheetsConnected,
  onToggleDarkMode,
}) => {
  const tech1Name = settings.tech1Name || 'ช่างบอม (Barber)';
  const tech2Name = settings.tech2Name || 'ช่างต๋อง (Stylist)';
  const isAdmin = currentRole === 'admin';

  const isHeaderLight = settings.headerTextColor === 'dark';
  const headerBg = settings.headerBgColor || '#1c1917';
  const logoShapeClass = settings.logoShape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const isDarkMode = settings.appBgMode === 'dark';

  return (
    <header
      style={{ backgroundColor: headerBg }}
      className={`border-b sticky top-0 z-40 shadow-md transition-colors ${
        isHeaderLight ? 'border-stone-200 text-stone-900' : 'border-stone-800 text-stone-100'
      }`}
    >
      {/* Optional Barber Pole Stripe Line at top */}
      {settings.showBarberPoleStripe !== false && (
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-white via-blue-600 via-white to-red-600 opacity-80" />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Barbershop Branding (Clickable for Admin to change logo/background) */}
          <div
            onClick={isAdmin ? onOpenSettings : undefined}
            className={`flex items-center gap-3 select-none ${
              isAdmin ? 'cursor-pointer group' : ''
            }`}
            title={isAdmin ? 'คลิกเพื่อแก้ไขโลโก้และสีพื้นหลังร้าน' : settings.shopName}
          >
            {/* Logo Display: Custom Image OR Icon */}
            <div className="relative">
              {settings.logoType === 'image' && settings.logoImage ? (
                <img
                  src={settings.logoImage}
                  alt={settings.shopName || 'Shop Logo'}
                  className={`w-11 h-11 object-cover ${logoShapeClass} shadow-md shrink-0 border-2 border-amber-400/50 group-hover:scale-105 transition-transform bg-stone-900`}
                />
              ) : (
                <div
                  style={{ backgroundColor: settings.logoBgColor || '#ea580c' }}
                  className={`w-11 h-11 ${logoShapeClass} flex items-center justify-center text-stone-950 shadow-md shrink-0 border border-white/30 text-xl font-bold group-hover:scale-105 transition-transform`}
                >
                  {settings.logoIcon || <Scissors className="w-5 h-5 text-stone-950 font-bold" />}
                </div>
              )}

              {/* Edit Indicator for Admin */}
              {isAdmin && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-stone-950 rounded-full text-[9px] flex items-center justify-center font-bold border border-stone-900 shadow-xs opacity-80 group-hover:opacity-100">
                  ✏️
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-black text-base md:text-lg tracking-tight font-sans transition-colors ${
                    isHeaderLight ? 'text-stone-900' : 'text-stone-100'
                  }`}
                >
                  {settings.shopName || 'BARBER & SALON'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold font-mono">
                  {isAdmin ? 'Admin Mode' : 'Barber Mode'}
                </span>
              </div>
              <p
                className={`text-[11px] hidden md:block transition-colors ${
                  isHeaderLight ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                {settings.shopSubtitle || 'ระบบบัญชีรายรับช่างผม • แยก 2 ชีท Google Sheets อัตโนมัติ'}
              </p>
            </div>
          </div>

          {/* Right Action Icons & Role Display */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Sheets Pill - Admin has full management, Barber can see status */}
            <button
              onClick={onOpenSheetsModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSheetsConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
              title="สถานะเชื่อมต่อ Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {isSheetsConnected ? 'Google Sheets เชื่อมต่อแล้ว' : 'Google Sheets'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSheetsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                }`}
              />
            </button>

            {/* Google Apps Script Modal Trigger - Visible only to Admin */}
            {isAdmin && (
              <button
                onClick={onOpenAppsScriptModal}
                className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-colors cursor-pointer"
                title="เปิดดูโค้ด Google Apps Script (Code.gs)"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Apps Script</span>
              </button>
            )}

            {/* Quick Dark Mode / Black Background Toggle Button */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-amber-400/20 text-amber-300 border-amber-500/50 hover:bg-amber-400/30 shadow-xs'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700'
                }`}
                title={isDarkMode ? 'คลิกเพื่อเปลี่ยนเป็นโหมดสว่าง' : 'คลิกเพื่อเปลี่ยนเป็นโหมดพื้นหลังสีดำ (Black Mode)'}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-300" />
                    <span className="text-[11px] font-bold hidden xl:inline">โหมดดำเปิดอยู่</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-bold hidden xl:inline">พื้นหลังสีดำ</span>
                  </>
                )}
              </button>
            )}

            {/* Admin Settings Button - Visible ONLY to Admin */}
            {isAdmin && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-700/80 transition-colors cursor-pointer"
                title="ตั้งค่าระบบ, โลโก้, พื้นหลังสีดำ และชื่อช่างผม"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Current Logged-in Profile Badge & Logout Button */}
            <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700 rounded-2xl p-1 pl-2.5">
              <div className="flex items-center gap-1.5 text-xs">
                {currentRole === 'admin' && (
                  <>
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-stone-200 hidden sm:inline">Admin (เจ้าของร้าน)</span>
                  </>
                )}
                {currentRole === 'tech1' && (
                  <>
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-stone-200 truncate max-w-[120px] sm:max-w-none">
                      {tech1Name}
                    </span>
                  </>
                )}
                {currentRole === 'tech2' && (
                  <>
                    <Scissors className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-stone-200 truncate max-w-[120px] sm:max-w-none">
                      {tech2Name}
                    </span>
                  </>
                )}
              </div>

              {/* Logout Button: Locks system and requires password to enter again */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-colors cursor-pointer"
                title="ออกจากระบบ เพื่อล็อกข้อมูล"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar - strictly permission controlled */}
        <div className="flex items-center justify-between border-t border-stone-800 pt-2 pb-2.5 overflow-x-auto">
          {isAdmin ? (
            /* Admin sees tabs for Tech 1, Tech 2, and Dashboard */
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChangeTab('tech1')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'tech1'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{tech1Name}</span>
              </button>

              <button
                onClick={() => onChangeTab('tech2')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'tech2'
                    ? 'bg-stone-700 text-white shadow-sm border border-stone-600'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{tech2Name}</span>
              </button>

              <button
                onClick={() => onChangeTab('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Dashboard สรุปภาพรวม</span>
              </button>
            </div>
          ) : (
            /* Individual Barber sees ONLY their own profile and locked badge. No tabs to other technicians! */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white shadow-xs flex items-center gap-1.5 ${
                    currentRole === 'tech1' ? 'bg-amber-600' : 'bg-stone-700'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{currentRole === 'tech1' ? tech1Name : tech2Name}</span>
                </span>
                <span className="text-xs text-amber-300/90 flex items-center gap-1.5 bg-stone-800/90 px-3 py-1 rounded-xl border border-stone-700 font-medium">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>ล็อกสิทธิ์เฉพาะตนเอง: ไม่สามารถดูหรือแก้ไขข้อมูลของช่างท่านอื่นได้</span>
                </span>
              </div>
              <div className="text-[11px] text-stone-400 hidden md:block">
                ต้องการสลับช่างหรือดูภาพรวม กรุณากด "ออกจากระบบ" แล้วเข้าด้วยรหัส Admin
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
