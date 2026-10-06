export type TechnicianId = 'tech1' | 'tech2';

export type UserRole = 'admin' | 'tech1' | 'tech2';

export interface TechnicianInfo {
  id: TechnicianId;
  name: string;
  themeColor: string;
  headerBg: string;
  badgeBg: string;
}

export interface BarberServicePreset {
  id: string;
  name: string;
  price: number;
  category: 'cut' | 'chemical' | 'wash' | 'beard';
}

export interface IncomeRecord {
  id: string;
  techId: TechnicianId;
  date: string; // YYYY-MM-DD or D/M/YYYY
  time: string; // HH:mm:ss
  cash: number; // เงินสด
  transfer: number; // โอน
  total: number; // รวม = cash + transfer
  note: string; // หมายเหตุบริการ / ทรงผม / จำนวนหัว
  customerCount?: number; // จำนวนลูกค้า
  createdAt?: string;
  updatedAt?: string;
  syncedToSheet?: boolean;
}

export interface AuthState {
  role: UserRole;
  name: string;
  techId?: TechnicianId;
  isAuthenticated: boolean;
}

export interface GoogleSheetConfig {
  spreadsheetId: string | null;
  spreadsheetName: string;
  spreadsheetUrl: string | null;
  autoSync: boolean;
  lastSyncTime: string | null;
  tech1SheetName: string;
  tech2SheetName: string;
}

export interface AppSettings {
  // 1. Shop & Branding
  shopName: string;
  shopSubtitle: string;
  currencySymbol: string;
  phone?: string;
  openingHours?: string;
  themeStyle: 'amber' | 'slate' | 'emerald' | 'crimson';

  // 2. Technicians Info & Commission
  tech1Name: string;
  tech1Role: string;
  tech1Commission: number; // % e.g. 50
  tech1Color: string;

  tech2Name: string;
  tech2Role: string;
  tech2Commission: number; // % e.g. 50
  tech2Color: string;

  // 3. Security PINs
  adminPin: string;
  tech1Pin: string;
  tech2Pin: string;

  // 4. Payment & PromptPay
  promptPayNumber?: string;
  promptPayName?: string;
  defaultPaymentMethod?: 'cash' | 'transfer';

  // 5. Period & Ledger Display
  periodCutoffDay: number; // default 15
  showDecimals: boolean;
  defaultViewMode: 'sheet' | 'cards';
  sortOrder?: 'asc' | 'desc'; // asc: 1 -> 15/31, desc: 15/31 -> 1
  monthlyTargetRevenue?: number;

  // 6. Custom Barber Services Menu
  services: BarberServicePreset[];

  // 7. Google Sheets & Apps Script Integration
  sheetConfig: GoogleSheetConfig;
  appsScriptUrl?: string;
}
