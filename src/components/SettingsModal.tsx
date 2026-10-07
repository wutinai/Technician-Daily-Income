import React, { useState } from 'react';
import { AppSettings, BarberServicePreset, IncomeRecord } from '../types';
import {
  Settings,
  Save,
  RotateCcw,
  X,
  Shield,
  Scissors,
  Check,
  Store,
  DollarSign,
  Lock,
  Plus,
  Trash2,
  Download,
  Upload,
  Calendar,
  Sparkles,
  Percent,
  FileSpreadsheet,
  AlertTriangle,
  QrCode,
  Phone,
  Clock,
  ArrowUpDown,
  Target,
  ExternalLink,
  Smartphone,
  Wallet,
  Coins,
  RefreshCw,
  Image as ImageIcon,
  Smile,
  Moon,
  Sun,
  Palette,
  Eye,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { exportBackupJSON, importBackupJSON } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  records: IncomeRecord[];
  onSaveSettings: (settings: AppSettings) => void;
  onRestoreData?: (records: IncomeRecord[], settings: AppSettings) => void;
  onResetDemoData: () => void;
  onClearAllRecords?: () => void;
}

type SettingsTab =
  | 'shop'
  | 'technicians'
  | 'security'
  | 'services'
  | 'payment'
  | 'ledger'
  | 'sheets'
  | 'backup';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  records,
  onSaveSettings,
  onRestoreData,
  onResetDemoData,
  onClearAllRecords,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('shop');

  // 1. Form states - Shop & Branding
  const [shopName, setShopName] = useState(settings.shopName || 'BARBER & SALON');
  const [shopSubtitle, setShopSubtitle] = useState(settings.shopSubtitle || 'ระบบบัญชีรายรับช่างผมประจำร้าน');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '฿');
  const [phone, setPhone] = useState(settings.phone || '081-234-5678');
  const [openingHours, setOpeningHours] = useState(settings.openingHours || '10:00 - 20:00 น.');
  const [themeStyle, setThemeStyle] = useState<'amber' | 'slate' | 'emerald' | 'crimson'>(
    settings.themeStyle || 'amber'
  );

  // Logo & Header & Black Theme states
  const [logoType, setLogoType] = useState<'icon' | 'image'>(settings.logoType || 'icon');
  const [logoImage, setLogoImage] = useState<string>(settings.logoImage || '');
  const [logoIcon, setLogoIcon] = useState<string>(settings.logoIcon || '✂️');
  const [logoBgColor, setLogoBgColor] = useState<string>(settings.logoBgColor || '#ea580c');
  const [logoShape, setLogoShape] = useState<'circle' | 'rounded'>(settings.logoShape || 'rounded');
  const [headerBgColor, setHeaderBgColor] = useState<string>(settings.headerBgColor || '#1c1917');
  const [appBgMode, setAppBgMode] = useState<'dark' | 'light'>(settings.appBgMode || 'light');
  const [showBarberPoleStripe, setShowBarberPoleStripe] = useState<boolean>(
    settings.showBarberPoleStripe !== false
  );

  // 2. Technicians
  const [tech1Name, setTech1Name] = useState(settings.tech1Name || 'ช่างบอม (Barber)');
  const [tech1Role, setTech1Role] = useState(settings.tech1Role || 'Master Barber');
  const [tech1Commission, setTech1Commission] = useState(settings.tech1Commission || 50);

  const [tech2Name, setTech2Name] = useState(settings.tech2Name || 'ช่างต๋อง (Stylist)');
  const [tech2Role, setTech2Role] = useState(settings.tech2Role || 'Hair Stylist');
  const [tech2Commission, setTech2Commission] = useState(settings.tech2Commission || 50);

  const [monthlyTargetRevenue, setMonthlyTargetRevenue] = useState(
    settings.monthlyTargetRevenue || 60000
  );

  // 3. PINs
  const [adminPin, setAdminPin] = useState(settings.adminPin || '1234');
  const [tech1Pin, setTech1Pin] = useState(settings.tech1Pin || '1234');
  const [tech2Pin, setTech2Pin] = useState(settings.tech2Pin || '1234');

  // 4. Payment & PromptPay
  const [promptPayNumber, setPromptPayNumber] = useState(settings.promptPayNumber || '081-234-5678');
  const [promptPayName, setPromptPayName] = useState(settings.promptPayName || 'ร้านบาร์เบอร์ แอนด์ ซาลอน');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<'cash' | 'transfer'>(
    settings.defaultPaymentMethod || 'transfer'
  );

  // 5. Ledger & Periods
  const [periodCutoffDay, setPeriodCutoffDay] = useState(settings.periodCutoffDay || 15);
  const [showDecimals, setShowDecimals] = useState(!!settings.showDecimals);
  const [defaultViewMode, setDefaultViewMode] = useState<'sheet' | 'cards'>(
    settings.defaultViewMode || 'sheet'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(settings.sortOrder || 'asc');

  // 6. Services Menu List
  const [services, setServices] = useState<BarberServicePreset[]>(
    settings.services?.length ? settings.services : []
  );
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<'cut' | 'chemical' | 'wash' | 'beard'>('cut');

  // 7. Google Sheets config
  const [sheetId, setSheetId] = useState(settings.sheetConfig?.spreadsheetId || '');
  const [tech1SheetName, setTech1SheetName] = useState(
    settings.sheetConfig?.tech1SheetName || tech1Name || 'ช่างบอม (Barber)'
  );
  const [tech2SheetName, setTech2SheetName] = useState(
    settings.sheetConfig?.tech2SheetName || tech2Name || 'ช่างต๋อง (Stylist)'
  );
  const [autoSync, setAutoSync] = useState(!!settings.sheetConfig?.autoSync);
  const [appsScriptUrl, setAppsScriptUrl] = useState(settings.appsScriptUrl || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoImage(result);
      setLogoType('image');
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Save full settings
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const isLightHeader = headerBgColor === '#ffffff';

    const updated: AppSettings = {
      ...settings,
      shopName: shopName.trim() || 'BARBER & SALON',
      shopSubtitle: shopSubtitle.trim() || 'ระบบบัญชีรายรับช่างผมประจำร้าน',
      currencySymbol: currencySymbol.trim() || '฿',
      phone: phone.trim(),
      openingHours: openingHours.trim(),
      themeStyle,

      // Logo & Theme
      logoType,
      logoImage,
      logoIcon,
      logoBgColor,
      logoShape,
      headerBgColor,
      headerTextColor: isLightHeader ? 'dark' : 'light',
      appBgMode,
      showBarberPoleStripe,

      tech1Name: tech1Name.trim() || 'ช่างบอม (Barber)',
      tech1Role: tech1Role.trim() || 'Master Barber',
      tech1Commission: Number(tech1Commission) || 50,
      tech1Color: settings.tech1Color || '#ea580c',

      tech2Name: tech2Name.trim() || 'ช่างต๋อง (Stylist)',
      tech2Role: tech2Role.trim() || 'Hair Stylist',
      tech2Commission: Number(tech2Commission) || 50,
      tech2Color: settings.tech2Color || '#0284c7',

      monthlyTargetRevenue: Number(monthlyTargetRevenue) || 60000,

      adminPin: adminPin.trim() || '1234',
      tech1Pin: tech1Pin.trim() || '1234',
      tech2Pin: tech2Pin.trim() || '1234',

      promptPayNumber: promptPayNumber.trim(),
      promptPayName: promptPayName.trim(),
      defaultPaymentMethod,

      periodCutoffDay: Number(periodCutoffDay) || 15,
      showDecimals,
      defaultViewMode,
      sortOrder,

      services,

      sheetConfig: {
        ...settings.sheetConfig,
        spreadsheetId: sheetId.trim() || settings.sheetConfig.spreadsheetId,
        tech1SheetName: tech1SheetName.trim() || tech1Name.trim(),
        tech2SheetName: tech2SheetName.trim() || tech2Name.trim(),
        autoSync,
      },
      appsScriptUrl: appsScriptUrl.trim(),
    };

    onSaveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 1800);
  };

  // Add Service
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newSvc: BarberServicePreset = {
      id: `svc-${Date.now()}`,
      name: newServiceName.trim(),
      price: parseFloat(newServicePrice) || 300,
      category: newServiceCategory,
    };

    setServices([...services, newSvc]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  // Delete Service
  const handleDeleteService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    exportBackupJSON(records, settings);
    setBackupMessage('ดาวน์โหลดไฟล์สำรองข้อมูล (JSON) เรียบร้อยแล้ว');
  };

  // Import JSON Backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const result = importBackupJSON(content);
        if (onRestoreData) {
          onRestoreData(result.records, result.settings);
          setBackupMessage(`กู้คืนข้อมูลสำเร็จ! (${result.records.length} รายการ)`);
        }
      } catch (err: any) {
        alert(err.message);
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'shop' as SettingsTab, label: 'โลโก้, ธีมดำ & ข้อมูลร้าน', icon: Store },
    { id: 'technicians' as SettingsTab, label: 'ช่าง & ค่าคอมฯ', icon: Scissors },
    { id: 'security' as SettingsTab, label: 'รหัสผ่าน PIN', icon: Shield },
    { id: 'services' as SettingsTab, label: 'เมนูราคาตัดผม', icon: Sparkles },
    { id: 'payment' as SettingsTab, label: 'พร้อมเพย์ & ชำระเงิน', icon: QrCode },
    { id: 'ledger' as SettingsTab, label: 'รอบงวดบัญชี', icon: Calendar },
    { id: 'sheets' as SettingsTab, label: 'Google Sheets', icon: FileSpreadsheet },
    { id: 'backup' as SettingsTab, label: 'สำรอง & กู้คืน', icon: Download },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-5 text-white flex items-center justify-between border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>ระบบตั้งค่าต่างๆ ทั้งหมด</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                  Full Settings
                </span>
              </h2>
              <p className="text-stone-300 text-xs">
                จัดการข้อมูลร้าน, ช่างผม, สิทธิ์ความปลอดภัย, เมนูราคา, พร้อมเพย์, รอบงวดบัญชี และ Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-stone-100 border-b border-stone-200 px-3 md:px-4 flex items-center gap-1 overflow-x-auto shrink-0 py-2 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200 ring-1 ring-amber-500/30'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Contents */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 font-sans space-y-5">
          {/* TAB 1: SHOP, LOGO & BLACK THEME */}
          {activeTab === 'shop' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* LIVE BRANDING & HEADER PREVIEW */}
              <div className="bg-stone-900 rounded-2xl p-4 border border-stone-800 shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Eye className="w-4 h-4" />
                    <span>พรีวิวการแสดงผลจริง (Live Branding & Header Preview)</span>
                  </span>
                  <span className="text-[11px] bg-stone-800 px-2.5 py-0.5 rounded-full text-stone-300 font-mono">
                    {appBgMode === 'dark' ? '⚫ โหมดพื้นหลังสีดำ (Jet Black)' : '⚪ โหมดสว่าง'}
                  </span>
                </div>

                {/* Simulated Header */}
                <div
                  style={{ backgroundColor: headerBgColor }}
                  className="rounded-xl border border-stone-700/60 overflow-hidden shadow-inner transition-colors"
                >
                  {showBarberPoleStripe && (
                    <div className="h-1 w-full bg-gradient-to-r from-red-600 via-white via-blue-600 via-white to-red-600 opacity-80" />
                  )}
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Logo Preview */}
                      {logoType === 'image' && logoImage ? (
                        <img
                          src={logoImage}
                          alt="Shop Logo"
                          className={`w-11 h-11 object-cover ${
                            logoShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                          } border-2 border-amber-400/50 shadow-md bg-stone-900 shrink-0`}
                        />
                      ) : (
                        <div
                          style={{ backgroundColor: logoBgColor }}
                          className={`w-11 h-11 ${
                            logoShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                          } flex items-center justify-center text-stone-950 shadow-md shrink-0 border border-white/30 text-xl font-bold`}
                        >
                          {logoIcon || '✂️'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm md:text-base tracking-tight ${
                              headerBgColor === '#ffffff' ? 'text-stone-900' : 'text-stone-100'
                            }`}
                          >
                            {shopName || 'BARBER & SALON'}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                            Barbershop
                          </span>
                        </div>
                        <p
                          className={`text-[10px] ${
                            headerBgColor === '#ffffff' ? 'text-stone-600' : 'text-stone-400'
                          }`}
                        >
                          {shopSubtitle || 'ระบบบัญชีรายรับช่างผมประจำร้าน'}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-1 rounded-lg bg-stone-800 text-stone-300 border border-stone-700">
                        {phone || '081-234-5678'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION A: แก้ไขและเปลี่ยน LOGO ร้าน */}
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 md:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                      <Scissors className="w-4 h-4 text-amber-700 font-bold" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm">
                        1. แก้ไขและเปลี่ยนโลโก้ร้าน (Custom Logo)
                      </h4>
                      <p className="text-xs text-stone-600">
                        เลือกใช้ไอคอน Emoji หรืออัปโหลดไฟล์รูปภาพโลโก้ของคุณเอง
                      </p>
                    </div>
                  </div>

                  {/* Logo Type Selector */}
                  <div className="flex items-center bg-stone-200/80 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setLogoType('icon')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        logoType === 'icon'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>ไอคอน / Emoji</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoType('image')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        logoType === 'image'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>รูปภาพโลโก้ร้าน (Image)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-section: IF ICON / EMOJI */}
                {logoType === 'icon' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        เลือกไอคอน Emoji ประจำร้าน (คลิกเพื่อเลือกทันที):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['✂️', '💈', '🪒', '👑', '💇‍♂️', '💇‍♀️', '⚡', '🦁', '🎩', '🥇', '⭐', '🔥', '🏆', '🧔', '🕶️', '⚜️'].map(
                          (emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setLogoIcon(emoji)}
                              className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer border ${
                                logoIcon === emoji
                                  ? 'bg-amber-600 text-white border-amber-600 scale-110 shadow-sm'
                                  : 'bg-white hover:bg-amber-100/60 border-stone-200 text-stone-800'
                              }`}
                            >
                              {emoji}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          หรือพิมพ์ไอคอน / อักษรย่อร้านเอง:
                        </label>
                        <input
                          type="text"
                          value={logoIcon}
                          maxLength={4}
                          onChange={(e) => setLogoIcon(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold"
                          placeholder="เช่น 💈 หรือ B&S"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          รูปทรงกรอบโลโก้ (Shape):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setLogoShape('rounded')}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                              logoShape === 'rounded'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-md bg-current opacity-80" />
                            <span>สี่เหลี่ยมมน</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogoShape('circle')}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer ${
                              logoShape === 'circle'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-current opacity-80" />
                            <span>ทรงวงกลม</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Logo Background Color Palette */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        สีพื้นหลังไอคอนโลโก้ (Logo Background Color):
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { label: 'ส้มอำพัน', color: '#ea580c' },
                          { label: 'ทองคำ', color: '#d97706' },
                          { label: 'ดำสนิท', color: '#09090b' },
                          { label: 'เขียวมรกต', color: '#059669' },
                          { label: 'แดงคลาสสิก', color: '#dc2626' },
                          { label: 'ฟ้าคราม', color: '#0284c7' },
                          { label: 'ม่วงรอยัล', color: '#7c3aed' },
                          { label: 'เทาสเลท', color: '#334155' },
                        ].map((item) => (
                          <button
                            key={item.color}
                            type="button"
                            onClick={() => setLogoBgColor(item.color)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              logoBgColor === item.color
                                ? 'ring-2 ring-amber-500 border-amber-500 scale-105 shadow-xs bg-white'
                                : 'border-stone-300 bg-white hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-section: IF IMAGE */}
                {logoType === 'image' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Upload from file */}
                      <div className="bg-white p-3.5 rounded-xl border border-stone-300 space-y-2">
                        <label className="block text-xs font-bold text-stone-800">
                          📁 1. อัปโหลดรูปภาพจากเครื่อง (PNG / JPG / WebP):
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="w-full text-xs text-stone-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                        />
                        <p className="text-[11px] text-stone-500">
                          แนะนำรูปสี่เหลี่ยมจัตุรัส ขนาดไม่เกิน 2MB
                        </p>
                      </div>

                      {/* Image URL Input */}
                      <div className="bg-white p-3.5 rounded-xl border border-stone-300 space-y-2">
                        <label className="block text-xs font-bold text-stone-800">
                          🔗 2. หรือวาง URL ลิงก์รูปภาพ:
                        </label>
                        <input
                          type="text"
                          value={logoImage}
                          onChange={(e) => setLogoImage(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                        {logoImage && (
                          <button
                            type="button"
                            onClick={() => setLogoImage('')}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                          >
                            ล้างรูปภาพออก
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preset Sample Logos */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        หรือเลือกรูปภาพตัวอย่างโลโก้ร้านตัดผมพรีเมียม (คลิกเพื่อใช้ทันที):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          {
                            name: '💈 Barber Pole Vintage',
                            url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&h=150&q=80',
                          },
                          {
                            name: '✂️ Gold Vintage Scissors',
                            url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=150&h=150&q=80',
                          },
                          {
                            name: '👑 Royal Barber Crest',
                            url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=150&h=150&q=80',
                          },
                          {
                            name: '🪒 Straight Razor Salon',
                            url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=150&h=150&q=80',
                          },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setLogoImage(preset.url);
                              setLogoType('image');
                            }}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border bg-white text-stone-800 text-[11px] font-bold transition-all cursor-pointer hover:border-amber-500 hover:shadow-xs ${
                              logoImage === preset.url ? 'ring-2 ring-amber-600 border-amber-600' : 'border-stone-200'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                            />
                            <span className="truncate w-full text-center">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION B: โหมดพื้นหลังสีดำ & ปรับแต่งธีมระบบ */}
              <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 md:p-5 border border-stone-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-amber-400 font-bold" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-100 text-sm">
                      2. ปรับแต่งพื้นหลังสีดำ & สีแถบระบบ (Black Background & Themes)
                    </h4>
                    <p className="text-xs text-stone-400">
                      สลับโหมดพื้นหลังสีดำทั้งระบบเพื่อสไตล์บาร์เบอร์วินเทจสุดเท่ และถนอมสายตา
                    </p>
                  </div>
                </div>

                {/* 1. APP BACKGROUND MODE (DARK / BLACK vs LIGHT) */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-2">
                    โหมดพื้นหลังของแอปพลิเคชัน (App Background Mode):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Dark / Black Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setAppBgMode('dark');
                        if (headerBgColor === '#ffffff') setHeaderBgColor('#1c1917');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        appBgMode === 'dark'
                          ? 'bg-stone-950 border-amber-500 ring-2 ring-amber-500/50 text-white shadow-lg'
                          : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-black border border-stone-700 flex items-center justify-center shrink-0 text-amber-400">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-stone-100">
                            ⚫ โหมดพื้นหลังสีดำ (Jet Black)
                          </span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                            ยอดนิยม
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          พื้นหลังสีดำสนิท สไตล์ร้านตัดผมโมเดิร์น & วินเทจหรูหรา ถนอมสายตา และตัวเลขเด่นชัดเจน
                        </p>
                      </div>
                    </button>

                    {/* Light Option */}
                    <button
                      type="button"
                      onClick={() => setAppBgMode('light')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        appBgMode === 'light'
                          ? 'bg-stone-800 border-amber-500 ring-2 ring-amber-500/50 text-white shadow-lg'
                          : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center shrink-0 text-stone-900">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-black text-sm text-stone-100">
                          ⚪ โหมดพื้นหลังสว่าง (Classic Ivory)
                        </span>
                        <p className="text-xs text-stone-400 mt-0.5">
                          พื้นหลังสีสว่าง สบายตา สไตล์กระดาษตารางบันทึกบัญชีดั้งเดิม
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. HEADER BACKGROUND COLOR PRESETS */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    สีพื้นหลังแถบ Header ด้านบน (Header Background Color):
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { label: '⚫ ดำสนิท (Jet Black)', color: '#000000' },
                      { label: '🌑 เทาดำเข้ม (Stone Dark)', color: '#1c1917' },
                      { label: '🔘 ซิงก์เข้ม (Dark Zinc)', color: '#18181b' },
                      { label: '🌌 มิดไนท์เนวี (Midnight Navy)', color: '#0f172a' },
                      { label: '⚪ ขาวสว่าง (Ivory White)', color: '#ffffff' },
                    ].map((item) => (
                      <button
                        key={item.color}
                        type="button"
                        onClick={() => setHeaderBgColor(item.color)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          headerBgColor === item.color
                            ? 'ring-2 ring-amber-400 border-amber-400 bg-stone-800 text-amber-300 scale-105'
                            : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-stone-500 shadow-2xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. BARBER POLE STRIPE TOGGLE */}
                <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💈</span>
                    <div>
                      <div className="text-xs font-bold text-stone-200">
                        เส้นไฟหมุนบาร์เบอร์โพล (Barber Pole Line) ด้านบนสุด
                      </div>
                      <div className="text-[11px] text-stone-400">
                        แสดงแถบสีแดง ขาว น้ำเงิน สัญลักษณ์ร้านตัดผมที่ขอบบนสุดของจอ
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBarberPoleStripe(!showBarberPoleStripe)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      showBarberPoleStripe
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                  >
                    {showBarberPoleStripe ? '✓ เปิดใช้งาน' : '✕ ปิด'}
                  </button>
                </div>
              </div>

              {/* SECTION C: ข้อมูลร้านตัดผมพื้นฐาน (Basic Shop Info) */}
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-stone-200 shadow-xs space-y-4">
                <div className="border-b border-stone-200 pb-2 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <h4 className="font-extrabold text-stone-900 text-sm">
                    3. ข้อมูลร้านตัดผมทั่วไป (Shop Information)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ชื่อร้าน (Shop Name):
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 bg-white"
                      placeholder="เช่น VINTAGE BARBER & SALON"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      คำอธิบาย / สโลแกนร้าน:
                    </label>
                    <input
                      type="text"
                      value={shopSubtitle}
                      onChange={(e) => setShopSubtitle(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                      placeholder="เช่น ระบบบัญชีรายรับช่างผมประจำร้าน"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-stone-500" />
                      <span>เบอร์โทรศัพท์ร้าน:</span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                      placeholder="เช่น 081-234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span>เวลาเปิด - ปิดร้าน:</span>
                    </label>
                    <input
                      type="text"
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                      placeholder="เช่น 10:00 - 20:00 น."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      สัญลักษณ์สกุลเงิน:
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 bg-white"
                      placeholder="฿ หรือ THB"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      โทนสีแบรนด์หลัก (Theme Accent Style):
                    </label>
                    <select
                      value={themeStyle}
                      onChange={(e: any) => setThemeStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 bg-white cursor-pointer"
                    >
                      <option value="amber">💈 Vintage Amber & Gold (คลาสสิกบาร์เบอร์)</option>
                      <option value="slate">✂️ Modern Charcoal Slate (โมเดิร์นซาลอน)</option>
                      <option value="emerald">🌿 Luxury Emerald Green (หรูหรา)</option>
                      <option value="crimson">💈 Royal Barber Crimson (แดงบาร์เบอร์โพล)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICIANS & COMMISSION */}
          {activeTab === 'technicians' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-200 pb-2">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-600" />
                  <span>ข้อมูลช่างผม & ส่วนแบ่งรายได้ (Barbers & Commission)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  ตั้งชื่อช่างทั้ง 2 คน ตำแหน่ง และสัดส่วนค่าคอมมิชชันที่คำนวณในรายงาน
                </p>
              </div>

              {/* Tech 1 Card */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-950 text-xs uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <span>ช่างคนที่ 1 (ชีทที่ 1 ใน Google Sheet)</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    บัญชีแยกอิสระ 1
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">ชื่อช่าง 1:</label>
                    <input
                      type="text"
                      value={tech1Name}
                      onChange={(e) => setTech1Name(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">ตำแหน่ง / ฉายา:</label>
                    <input
                      type="text"
                      value={tech1Role}
                      onChange={(e) => setTech1Role(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs"
                      placeholder="เช่น Master Barber"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Percent className="w-3 h-3 text-amber-700" />
                      <span>ส่วนแบ่งช่าง (%):</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tech1Commission}
                      onChange={(e) => setTech1Commission(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Tech 2 Card */}
              <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sky-950 text-xs uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    <span>ช่างคนที่ 2 (ชีทที่ 2 ใน Google Sheet)</span>
                  </div>
                  <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-bold">
                    บัญชีแยกอิสระ 2
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">ชื่อช่าง 2:</label>
                    <input
                      type="text"
                      value={tech2Name}
                      onChange={(e) => setTech2Name(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">ตำแหน่ง / ฉายา:</label>
                    <input
                      type="text"
                      value={tech2Role}
                      onChange={(e) => setTech2Role(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs"
                      placeholder="เช่น Hair Stylist"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Percent className="w-3 h-3 text-sky-700" />
                      <span>ส่วนแบ่งช่าง (%):</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tech2Commission}
                      onChange={(e) => setTech2Commission(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Target */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>เป้าหมายยอดรายรับรวมร้านต่อเดือน (บาท):</span>
                </label>
                <p className="text-[11px] text-stone-500">
                  สำหรับคำนวณแถบความคืบหน้า (Progress Bar) และสถิติความสำเร็จในหน้ารายงาน
                </p>
                <div className="max-w-xs">
                  <input
                    type="number"
                    value={monthlyTargetRevenue}
                    onChange={(e) => setMonthlyTargetRevenue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold text-right"
                    placeholder="เช่น 60000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PINS */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-200 pb-2">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>รหัสผ่านความปลอดภัย & สิทธิ์แยกช่าง (Security PINs)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  ช่างแต่ละท่านจะใช้ PIN ของตนเองในการเข้าสู่ระบบ และจะถูกล็อกสิทธิ์ให้เข้าถึงเฉพาะข้อมูลของตนเองเท่านั้น
                </p>
              </div>

              {/* Security Banner Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">นโยบายความเป็นส่วนตัวของข้อมูลช่าง:</span>
                  <span>
                    เมื่อช่างล็อกอินด้วยรหัสของตนเอง ระบบจะซ่อนแท็บช่างคนอื่น, ซ่อนแดชบอร์ดสรุปรวม และไม่อนุญาตให้แก้ไขหรือลบรายการของช่างท่านอื่นโดยเด็ดขาด
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-stone-300 bg-stone-50/80 space-y-2">
                  <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Admin PIN (ผู้ดูแล):</span>
                  </label>
                  <p className="text-[11px] text-stone-500">รหัสผ่านสำหรับดูและจัดการทุกอย่าง</p>
                  <input
                    type="text"
                    maxLength={8}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono text-center font-bold text-sm bg-white"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-amber-600" />
                    <span>ช่าง 1 PIN ({tech1Name}):</span>
                  </label>
                  <p className="text-[11px] text-stone-500">รหัสผ่านล็อกอินของช่าง 1</p>
                  <input
                    type="text"
                    maxLength={8}
                    value={tech1Pin}
                    onChange={(e) => setTech1Pin(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl font-mono text-center font-bold text-sm bg-white"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/50 space-y-2">
                  <label className="block text-xs font-bold text-sky-950 flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-sky-600" />
                    <span>ช่าง 2 PIN ({tech2Name}):</span>
                  </label>
                  <p className="text-[11px] text-stone-500">รหัสผ่านล็อกอินของช่าง 2</p>
                  <input
                    type="text"
                    maxLength={8}
                    value={tech2Pin}
                    onChange={(e) => setTech2Pin(e.target.value)}
                    className="w-full px-3 py-2 border border-sky-300 rounded-xl font-mono text-center font-bold text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SERVICES & PRICING */}
          {activeTab === 'services' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>เมนูบริการและราคาตัดผม (Services & Price Menu)</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    รายการบริการเหล่านี้จะปรากฏเป็นปุ่มลัด (Quick chips) ในหน้าจอลงรายการด่วน
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                  {services.length} บริการ
                </span>
              </div>

              {/* Add New Service Form */}
              <form onSubmit={handleAddService} className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-stone-800 block">เพิ่มบริการใหม่:</span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="ชื่อบริการ เช่น สปาผมเคราติน"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="ราคา (บาท)"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs font-mono font-bold bg-white text-right"
                    />
                  </div>
                  <div>
                    <select
                      value={newServiceCategory}
                      onChange={(e: any) => setNewServiceCategory(e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded-xl text-xs bg-white"
                    >
                      <option value="cut">✂️ ตัดผม</option>
                      <option value="beard">💈 โกนหนวด</option>
                      <option value="wash">🧴 สระไดร์</option>
                      <option value="chemical">🧪 ทำสี/ดัด</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Existing Services List */}
              <div className="divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                {services.map((svc) => (
                  <div key={svc.id} className="p-3 flex items-center justify-between hover:bg-stone-50 text-xs">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-semibold text-stone-800">{svc.name}</span>
                      <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                        {svc.category === 'cut'
                          ? 'ตัดผม'
                          : svc.category === 'beard'
                          ? 'โกนหนวด'
                          : svc.category === 'wash'
                          ? 'สระไดร์'
                          : 'เคมี'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-stone-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                        ฿{svc.price.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(svc.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENT & PROMPTPAY */}
          {activeTab === 'payment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-200 pb-2">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span>ระบบชำระเงิน & พร้อมเพย์ (Payment & PromptPay)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  ตั้งค่าหมายเลขพร้อมเพย์ร้าน และวิธีการรับเงินเริ่มต้นสำหรับให้ลูกค้าสแกนโอน
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                  <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>หมายเลขพร้อมเพย์ร้าน (PromptPay ID):</span>
                  </label>
                  <p className="text-[11px] text-stone-500">เบอร์มือถือ หรือ เลขบัตรประชาชน หรือ เลขประจำตัวผู้เสียภาษี</p>
                  <input
                    type="text"
                    value={promptPayNumber}
                    onChange={(e) => setPromptPayNumber(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono font-bold bg-white"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                  <label className="block text-xs font-bold text-stone-900">
                    ชื่อบัญชีพร้อมเพย์ / ชื่อร้าน:
                  </label>
                  <p className="text-[11px] text-stone-500">ชื่อที่จะแสดงให้ลูกค้าตรวจสอบตอนโอนเงิน</p>
                  <input
                    type="text"
                    value={promptPayName}
                    onChange={(e) => setPromptPayName(e.target.value)}
                    placeholder="เช่น ร้านบาร์เบอร์ แอนด์ ซาลอน"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white"
                  />
                </div>

                <div className="md:col-span-2 p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                  <label className="block text-xs font-bold text-stone-900">
                    วิธีการชำระเงินเริ่มต้นตอนกดบริการด่วน:
                  </label>
                  <p className="text-[11px] text-stone-500">
                    เลือกว่าเมื่อกดปุ่มบริการลัด ราคาจะลงช่องใดเป็นค่าเริ่มต้น
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="defaultPay"
                        checked={defaultPaymentMethod === 'transfer'}
                        onChange={() => setDefaultPaymentMethod('transfer')}
                        className="text-amber-600"
                      />
                      <span>สแกนโอน PromptPay (แนะนำ - ลูกค้าร้านตัดผม 80% สแกนจ่าย)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="defaultPay"
                        checked={defaultPaymentMethod === 'cash'}
                        onChange={() => setDefaultPaymentMethod('cash')}
                        className="text-amber-600"
                      />
                      <span>เงินสด (Cash)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LEDGER & PERIODS */}
          {activeTab === 'ledger' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-200 pb-2">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>รอบงวดบัญชี & การแสดงผลตาราง (Periods & Ledger View)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  กำหนดการแบ่ง 2 หน้า (งวด 1-15 และ 16-31) และรูปแบบการแสดงผล
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2">
                  <label className="block text-xs font-bold text-stone-900">
                    วันตัดรอบงวดที่ 1 ของเดือน:
                  </label>
                  <p className="text-[11px] text-stone-500">
                    หน้าที่ 1 แสดงวันที่ 1 ถึงวันที่ตัดรอบนี้ (ค่าเริ่มต้นคือวันที่ 15)
                  </p>
                  <select
                    value={periodCutoffDay}
                    onChange={(e) => setPeriodCutoffDay(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value={15}>วันที่ 15 (หน้าที่ 1: 1-15 | หน้าที่ 2: 16-สิ้นเดือน) [มาตรฐาน]</option>
                    <option value={10}>วันที่ 10 (หน้าที่ 1: 1-10 | หน้าที่ 2: 11-สิ้นเดือน)</option>
                    <option value={20}>วันที่ 20 (หน้าที่ 1: 1-20 | หน้าที่ 2: 21-สิ้นเดือน)</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2">
                  <label className="block text-xs font-bold text-stone-900">
                    การเรียงลำดับวันที่ในตาราง:
                  </label>
                  <p className="text-[11px] text-stone-500">
                    เลือกวิธีเรียงแถวในหน้าตาราง
                  </p>
                  <select
                    value={sortOrder}
                    onChange={(e: any) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="asc">จากวันที่เริ่มต้นไปหาวันสิ้นงวด (เช่น วันที่ 1 ➔ 15)</option>
                    <option value="desc">วันล่าสุดขึ้นก่อน (เช่น วันที่ 15 ➔ 1)</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2">
                  <label className="block text-xs font-bold text-stone-900">
                    การแสดงผลทศนิยม:
                  </label>
                  <p className="text-[11px] text-stone-500">
                    แสดงตัวเลขเป็นจำนวนเต็ม (฿1,500) หรือมีทศนิยม (฿1,500.00)
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="decimals"
                        checked={!showDecimals}
                        onChange={() => setShowDecimals(false)}
                        className="text-amber-600"
                      />
                      <span>จำนวนเต็ม (฿1,500)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="decimals"
                        checked={showDecimals}
                        onChange={() => setShowDecimals(true)}
                        className="text-amber-600"
                      />
                      <span>มีสตางค์ (฿1,500.00)</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2">
                  <label className="block text-xs font-bold text-stone-900">
                    มุมมองเริ่มต้น:
                  </label>
                  <p className="text-[11px] text-stone-500">
                    ตาราง Spreadsheet หรือ การ์ดรายการ
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="viewmode"
                        checked={defaultViewMode === 'sheet'}
                        onChange={() => setDefaultViewMode('sheet')}
                        className="text-amber-600"
                      />
                      <span>ตาราง Spreadsheet (แนะนำ)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="viewmode"
                        checked={defaultViewMode === 'cards'}
                        onChange={() => setDefaultViewMode('cards')}
                        className="text-amber-600"
                      />
                      <span>การ์ด (Cards View)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GOOGLE SHEETS & APPS SCRIPT */}
          {activeTab === 'sheets' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-200 pb-2">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Google Sheets & Apps Script Integration</span>
                </h3>
                <p className="text-xs text-stone-500">
                  กำหนดค่าการบันทึกข้อมูลแยก 2 ชีทใน Google Spreadsheet
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                  <label className="block text-xs font-bold text-stone-900">
                    Google Spreadsheet ID / URL:
                  </label>
                  <p className="text-[11px] text-stone-500">
                    รหัสไฟล์ Google Spreadsheet ที่ใช้จัดเก็บข้อมูล
                  </p>
                  <input
                    type="text"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    placeholder="วาง Spreadsheet ID หรือ URL เต็ม"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <label className="block text-xs font-bold text-amber-950">
                      ชื่อชีทช่างคนที่ 1 (Tab Name):
                    </label>
                    <input
                      type="text"
                      value={tech1SheetName}
                      onChange={(e) => setTech1SheetName(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-2">
                    <label className="block text-xs font-bold text-sky-950">
                      ชื่อชีทช่างคนที่ 2 (Tab Name):
                    </label>
                    <input
                      type="text"
                      value={tech2SheetName}
                      onChange={(e) => setTech2SheetName(e.target.value)}
                      className="w-full px-3 py-2 border border-sky-300 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-900">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>เปิดการซิงค์ข้อมูลอัตโนมัติ (Auto-Sync to Google Sheets เมื่อบันทึกรายการ)</span>
                  </label>
                  <p className="text-[11px] text-stone-500 pl-6">
                    เมื่อเปิดใช้งาน ทุกครั้งที่ช่างบันทึกรายการใหม่ ข้อมูลจะถูกส่งไปเขียนใน Google Sheet ของช่างคนนั้นทันที
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                  <label className="block text-xs font-bold text-stone-900">
                    Google Apps Script Webhook URL (ทางเลือก):
                  </label>
                  <p className="text-[11px] text-stone-500">
                    กรณีนำ Code.gs ไป Deploy เป็น Web App สามารถวาง URL ที่นี่เพื่อส่งข้อมูลผ่าน POST Request
                  </p>
                  <input
                    type="text"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-stone-200 pb-2">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>สำรอง & กู้คืนข้อมูล (Backup & Restore)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  ส่งออกไฟล์ JSON สำรองข้อมูลทั้งหมด หรือกู้คืนข้อมูลในเครื่องอื่น
                </p>
              </div>

              {backupMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{backupMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Backup */}
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                  <span className="text-xs font-bold text-stone-900 block">สำรองข้อมูลทั้งหมด:</span>
                  <p className="text-[11px] text-stone-500">
                    ดาวน์โหลดไฟล์ .json เพื่อเก็บไว้เป็นสำรองข้อมูลความปลอดภัย
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-500/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์สำรองข้อมูล (JSON)</span>
                  </button>
                </div>

                {/* Import Backup */}
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                  <span className="text-xs font-bold text-stone-900 block">กู้คืนข้อมูลจากไฟล์:</span>
                  <p className="text-[11px] text-stone-500">
                    เลือกไฟล์ .json ที่เคยสำรองไว้เพื่อนำข้อมูลกลับมา
                  </p>
                  <label className="w-full py-2.5 px-4 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>เลือกไฟล์สำรองเพื่อกู้คืน</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset Data Danger Zone */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-2">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>จัดการข้อมูลระบบ:</span>
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างร้านตัดผม (1-31 วัน) กลับเป็นค่าเริ่มต้นหรือไม่?')) {
                        onResetDemoData();
                        onClose();
                      }
                    }}
                    className="py-2 px-3 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>โหลดข้อมูลตัวอย่าง (1-31 ม.ค. 2026)</span>
                  </button>

                  {onClearAllRecords && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('คำเตือน: คุณต้องการล้างข้อมูลบันทึกทั้งหมดเพื่อเริ่มใช้งานจริงหรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)')) {
                          onClearAllRecords();
                          onClose();
                        }
                      }}
                      className="py-2 px-3 border border-rose-300 bg-white hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ล้างข้อมูลทั้งหมดเพื่อเริ่มใช้จริง</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Save Bar */}
        <div className="bg-stone-100 px-6 py-3.5 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500">
            {savedSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>บันทึกการตั้งค่าระบบเรียบร้อยแล้ว</span>
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-200 cursor-pointer"
            >
              ปิด
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-stone-900 to-stone-950 text-amber-300 hover:text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
