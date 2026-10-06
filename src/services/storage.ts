import { AppSettings, BarberServicePreset, IncomeRecord, TechnicianId } from '../types';

const STORAGE_KEY_RECORDS = 'tech_income_records_barber_v3';
const STORAGE_KEY_SETTINGS = 'tech_income_settings_barber_v4';
const STORAGE_KEY_AUTH = 'tech_income_auth_barber_v3';

export const DEFAULT_SERVICES: BarberServicePreset[] = [
  { id: 'cut-fade', name: 'ตัดผมวินเทจ Fade / แฟชั่น', price: 300, category: 'cut' },
  { id: 'cut-beard', name: 'ตัดผม + โกนหนวด กันขอบ', price: 350, category: 'beard' },
  { id: 'wash-style', name: 'สระไดร์ + เซ็ต Pomade', price: 200, category: 'wash' },
  { id: 'perm-korea', name: 'ดัดวอลลุ่ม / Down Perm', price: 1500, category: 'chemical' },
  { id: 'color-bleach', name: 'ทำสีแฟชั่น / ไฮไลท์', price: 1800, category: 'chemical' },
  { id: 'spa-treatment', name: 'สปาหนังศีรษะ ทรีทเม้นท์', price: 600, category: 'wash' },
  { id: 'cut-kid', name: 'ตัดผมเด็ก / ทรงนักเรียน', price: 150, category: 'cut' },
];

export const BARBER_SERVICES = DEFAULT_SERVICES;

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: 'BARBER & SALON',
  shopSubtitle: 'ระบบบัญชีรายรับช่างผมประจำร้าน',
  currencySymbol: '฿',
  phone: '081-234-5678',
  openingHours: '10:00 - 20:00 น.',
  themeStyle: 'amber',

  tech1Name: 'ช่างบอม (Barber)',
  tech1Role: 'Master Barber',
  tech1Commission: 50,
  tech1Color: '#ea580c',

  tech2Name: 'ช่างต๋อง (Stylist)',
  tech2Role: 'Hair Stylist',
  tech2Commission: 50,
  tech2Color: '#0284c7',

  adminPin: '1234',
  tech1Pin: '1234',
  tech2Pin: '1234',

  promptPayNumber: '081-234-5678',
  promptPayName: 'ร้านบาร์เบอร์ แอนด์ ซาลอน',
  defaultPaymentMethod: 'transfer',

  periodCutoffDay: 15,
  showDecimals: false,
  defaultViewMode: 'sheet',
  sortOrder: 'asc',
  monthlyTargetRevenue: 60000,

  services: DEFAULT_SERVICES,

  sheetConfig: {
    spreadsheetId: null,
    spreadsheetName: 'บัญชีรายรับร้านตัดผม (Barber & Salon)',
    spreadsheetUrl: null,
    autoSync: false,
    lastSyncTime: null,
    tech1SheetName: 'ช่างบอม (Barber)',
    tech2SheetName: 'ช่างต๋อง (Stylist)',
  },
  appsScriptUrl: '',
};

// Seed initial records for days 1 to 31 for full month simulation
function generateInitialRecords(): IncomeRecord[] {
  const records: IncomeRecord[] = [];

  // Tech 1 (ช่างบอม) jobs for full month (Days 1 to 31)
  const tech1BarberJobs = [
    // งวดที่ 1: วันที่ 1 - 15 (สรุปวันที่ 15)
    { day: 1, cash: 900, transfer: 2100, note: 'ตัดผมวินเทจ Fade 4 หัว + ดัด Down Perm 1 หัว', customers: 5 },
    { day: 2, cash: 600, transfer: 1800, note: 'ตัด+โกนหนวด 2 ท่าน + ตัดสไตล์เกาหลี 2 ท่าน', customers: 4 },
    { day: 3, cash: 300, transfer: 3300, note: 'ดัดวอลลุ่ม 2 หัว + ตัดผม Drop Cut 1 หัว', customers: 3 },
    { day: 4, cash: 1200, transfer: 900, note: 'ตัดผมชาย 5 หัว + สระไดร์เซ็ต Pomade', customers: 5 },
    { day: 5, cash: 600, transfer: 2400, note: 'ทำสีเทาควันบุหรี่ 1 ท่าน + ตัดผม Fade 3 ท่าน', customers: 4 },
    { day: 6, cash: 1500, transfer: 1800, note: 'ตัดผมชาย 6 หัว + เซ็ตทรงงานแต่ง 1 หัว', customers: 7 },
    { day: 7, cash: 900, transfer: 1200, note: 'ตัดผมเด็ก 2 + ตัดผมชายวินเทจ 3 หัว', customers: 5 },
    { day: 8, cash: 600, transfer: 2700, note: 'ดัดวอลลุ่มสไตล์โอปป้า + โกนหนวดกันหน้า', customers: 3 },
    { day: 9, cash: 1200, transfer: 1500, note: 'ตัดผมทรงทูบล็อค 4 หัว + ทรีทเม้นท์', customers: 4 },
    { day: 10, cash: 900, transfer: 3000, note: 'ทำสีชานม Brown Ash + ตัดแต่งทรง 3 ท่าน', customers: 4 },
    { day: 11, cash: 1500, transfer: 900, note: 'ตัดผมชาย 5 หัว + สระนวดผ่อนคลาย', customers: 5 },
    { day: 12, cash: 600, transfer: 2100, note: 'ตัดผม Low Fade 3 หัว + ดัด Down Perm', customers: 4 },
    { day: 13, cash: 1200, transfer: 1800, note: 'ตัดผมชาย 6 ท่าน + โกนหนวดแนบชิด', customers: 6 },
    { day: 14, cash: 900, transfer: 2400, note: 'ตัด+เซ็ตผมงานอีเวนต์ + ตัดผมทั่วไป 4 หัว', customers: 5 },
    { day: 15, cash: 1800, transfer: 2100, note: 'สรุปงวดแรกวันที่ 15: ลูกค้าแน่น 9 ท่าน', customers: 9 },

    // งวดที่ 2: วันที่ 16 - 31 (สรุปสิ้นเดือน)
    { day: 16, cash: 900, transfer: 1800, note: 'เริ่มงวดสอง: ตัดผมวินเทจ Fade 3 ท่าน + โกนหนวด', customers: 4 },
    { day: 17, cash: 600, transfer: 2700, note: 'ดัดวอลลุ่มโอปป้า 1 + สระไดร์เซ็ต 2 หัว', customers: 3 },
    { day: 18, cash: 1200, transfer: 1500, note: 'ตัดผมชาย 5 หัว + ทำความสะอาดกันขอบ', customers: 5 },
    { day: 19, cash: 600, transfer: 2400, note: 'ตัดผมทรง Mullet Fade 2 + ย้อมสีปิดผมขาว 1', customers: 3 },
    { day: 20, cash: 1500, transfer: 1200, note: 'ตัดผมชาย 6 หัว + ล้างสารเคมีตกค้าง', customers: 6 },
    { day: 21, cash: 900, transfer: 3000, note: 'ดัดวอลลุ่มเกาหลี 2 หัว + ตัดสกินเฮด 1', customers: 3 },
    { day: 22, cash: 600, transfer: 1800, note: 'ตัดผมเด็กนักเรียน 3 + ผู้ใหญ่ 2 ท่าน', customers: 5 },
    { day: 23, cash: 1200, transfer: 2100, note: 'ตัดแต่งทรง Fade + โกนหนวดประคบผ้าร้อน', customers: 4 },
    { day: 24, cash: 1800, transfer: 2400, note: 'เสาร์-อาทิตย์ คิวเต็ม 8 ท่าน', customers: 8 },
    { day: 25, cash: 1500, transfer: 2700, note: 'ตัดผมชาย 7 ท่าน + Down Perm 1 หัว', customers: 8 },
    { day: 26, cash: 900, transfer: 1500, note: 'ตัดผมทรง Side Part 4 ท่าน', customers: 4 },
    { day: 27, cash: 600, transfer: 2400, note: 'ทำสีบลอนด์หม่น 1 ท่าน + ตัดผม 2 ท่าน', customers: 3 },
    { day: 28, cash: 1200, transfer: 1800, note: 'ตัดผมชาย 5 หัว + สระนวดคลายเครียด', customers: 5 },
    { day: 29, cash: 900, transfer: 2700, note: 'ดัดวอลลุ่มเกาหลี 1 + ตัดแต่งทรง 4 ท่าน', customers: 5 },
    { day: 30, cash: 1500, transfer: 2100, note: 'ตัดผมชาย 6 ท่าน + โกนหนวดแนบเนียน', customers: 6 },
    { day: 31, cash: 2100, transfer: 3300, note: 'สรุปงวดสิ้นเดือน: ปิดยอดเดือนมกราคม ลูกค้า 10 ท่าน', customers: 10 },
  ];

  for (const job of tech1BarberJobs) {
    const dayStr = `${job.day}/1/2026`;
    records.push({
      id: `barber-t1-${job.day}`,
      techId: 'tech1',
      date: dayStr,
      time: '18:30:00',
      cash: job.cash,
      transfer: job.transfer,
      total: job.cash + job.transfer,
      note: job.note,
      customerCount: job.customers,
      createdAt: new Date().toISOString(),
    });
  }

  // Tech 2 (ช่างต๋อง) jobs for full month (Days 1 to 31)
  const tech2BarberJobs = [
    // งวดที่ 1: วันที่ 1 - 15 (สรุปวันที่ 15)
    { day: 1, cash: 600, transfer: 2400, note: 'ทำสีน้ำตาลคาราเมล + ตัดสไตล์เกาหลี 2 หัว', customers: 3 },
    { day: 2, cash: 900, transfer: 1800, note: 'ตัดผมหญิงเลเยอร์คัท 2 + สระไดร์วอลลุ่ม', customers: 4 },
    { day: 3, cash: 300, transfer: 2800, note: 'ดัดลอนเกาหลี 1 + ทำสีออร์แกนิก 1', customers: 2 },
    { day: 4, cash: 1500, transfer: 1200, note: 'ตัดผมซอยสั้น + สระไดร์เซ็ตทรง 5 หัว', customers: 5 },
    { day: 5, cash: 600, transfer: 3000, note: 'ยืดผมเคราตินพรีเมียม 1 หัว + ตัดแต่งทรง', customers: 2 },
    { day: 6, cash: 1200, transfer: 2100, note: 'ทำไฮไลท์ Babylight + ตัดทรง Wolf Cut', customers: 3 },
    { day: 7, cash: 600, transfer: 1500, note: 'สปาผม Detox หนังศีรษะ 2 + ตัดผมชาย 2', customers: 4 },
    { day: 8, cash: 900, transfer: 2200, note: 'ตัดผมทรงมัลเล็ต 3 หัว + สระไดร์', customers: 4 },
    { day: 9, cash: 1200, transfer: 1800, note: 'ตัดผมบ๊อบสไตล์ญี่ปุ่น 3 + อบไอน้ำบำรุง', customers: 4 },
    { day: 10, cash: 600, transfer: 3200, note: 'ดัดวอลลุ่ม + ทำสีหม่นพาสเทล', customers: 3 },
    { day: 11, cash: 1500, transfer: 1500, note: 'ตัดผมชาย-หญิง 6 หัว + สระนวดอโรม่า', customers: 6 },
    { day: 12, cash: 900, transfer: 2100, note: 'ตัดแต่งหน้าม้า + เล็มปลาย + ทำสีโคนผม', customers: 4 },
    { day: 13, cash: 1200, transfer: 2400, note: 'ตัดผมแฟชั่น 5 ท่าน + บำรุงเคราตินเข้มข้น', customers: 5 },
    { day: 14, cash: 900, transfer: 2700, note: 'ดัดเย็นวอลลุ่ม 1 + ตัดผมทรงฮิต 3 หัว', customers: 4 },
    { day: 15, cash: 1500, transfer: 3000, note: 'สรุปงวดแรกวันที่ 15: เคมีและตัดซอยรวม 7 หัว', customers: 7 },

    // งวดที่ 2: วันที่ 16 - 31 (สรุปสิ้นเดือน)
    { day: 16, cash: 900, transfer: 2100, note: 'เริ่มงวดสอง: ยืดโคนดัดปลาย 1 + สระไดร์ 2', customers: 3 },
    { day: 17, cash: 600, transfer: 2700, note: 'ทำสี Balayage ไฮไลท์ + บำรุง Olaplex', customers: 2 },
    { day: 18, cash: 1200, transfer: 1800, note: 'ตัดผมหญิงบ๊อบเท 2 + ตัดผมชาย 3', customers: 5 },
    { day: 19, cash: 600, transfer: 3300, note: 'ดัดดิจิตอลวอลลุ่ม 1 + ทำสีช็อกโกแลต 1', customers: 2 },
    { day: 20, cash: 1500, transfer: 1500, note: 'ตัดแต่งทรงแฟชั่น 5 หัว + สระนวดอโรม่า', customers: 5 },
    { day: 21, cash: 900, transfer: 2400, note: 'ทรีทเม้นท์เคลือบแก้ว 2 + ซอยเลเยอร์ 2', customers: 4 },
    { day: 22, cash: 1200, transfer: 2100, note: 'ตัดผมสไตล์เกาหลี 4 หัว + เซ็ตไดร์', customers: 4 },
    { day: 23, cash: 600, transfer: 2800, note: 'ทำสีพาสเทลเทาหม่น + ตัดแต่งทรง', customers: 2 },
    { day: 24, cash: 1800, transfer: 2700, note: 'เสาร์-อาทิตย์ ลูกค้าสระไดร์และตัด 8 ท่าน', customers: 8 },
    { day: 25, cash: 1500, transfer: 3000, note: 'ดัดวอลลุ่ม 2 + ยืดผมเคราติน 1', customers: 3 },
    { day: 26, cash: 900, transfer: 1800, note: 'ตัดผมทรง Hush Cut 3 ท่าน + สระไดร์', customers: 4 },
    { day: 27, cash: 1200, transfer: 2400, note: 'ทำสี Ash Brown 2 ท่าน + บำรุงเข้มข้น', customers: 3 },
    { day: 28, cash: 600, transfer: 2100, note: 'สปาหนังศีรษะ 2 + ตัดผมหญิง 2', customers: 4 },
    { day: 29, cash: 1200, transfer: 2700, note: 'ดัดลอนใหญ่สไตล์เกาหลี + สระไดร์ 3 ท่าน', customers: 4 },
    { day: 30, cash: 1500, transfer: 2400, note: 'ตัดผมสไตล์โมเดิร์น 6 หัว + สระนวด', customers: 6 },
    { day: 31, cash: 1800, transfer: 3600, note: 'สรุปงวดสิ้นเดือน: งานเคมีและตัดแต่งทรงรวม 8 ท่าน', customers: 8 },
  ];

  for (const job of tech2BarberJobs) {
    const dayStr = `${job.day}/1/2026`;
    records.push({
      id: `barber-t2-${job.day}`,
      techId: 'tech2',
      date: dayStr,
      time: '19:00:00',
      cash: job.cash,
      transfer: job.transfer,
      total: job.cash + job.transfer,
      note: job.note,
      customerCount: job.customers,
      createdAt: new Date().toISOString(),
    });
  }

  return records;
}

export function loadStoredRecords(): IncomeRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!saved) {
      const initial = generateInitialRecords();
      saveStoredRecords(initial);
      return initial;
    }
    return JSON.parse(saved);
  } catch (err) {
    console.error('Error loading stored records:', err);
    return [];
  }
}

export function saveStoredRecords(records: IncomeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving stored records:', err);
  }
}

export function loadStoredSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!saved) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      services: parsed.services?.length ? parsed.services : DEFAULT_SERVICES,
      sheetConfig: {
        ...DEFAULT_SETTINGS.sheetConfig,
        ...(parsed.sheetConfig || {}),
      },
    };
  } catch (err) {
    console.error('Error loading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

export function loadSavedAuth() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(auth: any) {
  try {
    if (!auth) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } else {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(auth));
    }
  } catch (err) {
    console.error('Error saving auth:', err);
  }
}

/**
 * Backup entire system to a downloadable JSON file
 */
export function exportBackupJSON(records: IncomeRecord[], settings: AppSettings) {
  const backupData = {
    appName: 'Barber & Salon Ledger',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    settings,
    records,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `barber_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Restore data from a JSON file string
 */
export function importBackupJSON(jsonStr: string): { records: IncomeRecord[]; settings: AppSettings } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.records || !Array.isArray(parsed.records)) {
      throw new Error('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง (ไม่พบรายการ records)');
    }
    return {
      records: parsed.records,
      settings: parsed.settings ? { ...DEFAULT_SETTINGS, ...parsed.settings } : DEFAULT_SETTINGS,
    };
  } catch (err: any) {
    throw new Error(`ไม่สามารถกู้คืนข้อมูลได้: ${err.message}`);
  }
}

/**
 * Export records as CSV with UTF-8 BOM for Thai language compatibility in Excel
 */
export function exportToCSV(
  records: IncomeRecord[],
  technicianName: string,
  fileNamePrefix: string,
  periodName?: string
) {
  const bom = '\uFEFF';
  const headers = [
    'วันที่ (ค.ศ.)',
    'เวลา',
    'เงินสด (บาท)',
    'เงินโอน PromptPay (บาท)',
    'รวมสุทธิ (บาท)',
    'บริการ / หมายเหตุงานตัดผม',
  ];

  const rows = records.map((r) => [
    `"${r.date}"`,
    `"${r.time || ''}"`,
    r.cash,
    r.transfer,
    r.total,
    `"${(r.note || '').replace(/"/g, '""')}"`,
  ]);

  const totalCash = records.reduce((sum, r) => sum + (Number(r.cash) || 0), 0);
  const totalTransfer = records.reduce((sum, r) => sum + (Number(r.transfer) || 0), 0);
  const grandTotal = totalCash + totalTransfer;

  const summaryRow = ['"รวมทั้งหมด"', '""', totalCash, totalTransfer, grandTotal, '""'];

  const csvContent =
    bom +
    `"บัญชีรายรับร้านตัดผม: ${technicianName} ${periodName ? `(${periodName})` : ''}"\n` +
    headers.join(',') +
    '\n' +
    rows.map((r) => r.join(',')).join('\n') +
    '\n' +
    summaryRow.join(',');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export full comparison CSV for barbershop
 */
export function exportComparisonCSV(
  tech1Records: IncomeRecord[],
  tech2Records: IncomeRecord[],
  tech1Name: string,
  tech2Name: string
) {
  const bom = '\uFEFF';
  const headers = [
    'วันที่ (ค.ศ.)',
    `เงินสด (${tech1Name})`,
    `เงินโอน (${tech1Name})`,
    `รวม (${tech1Name})`,
    `เงินสด (${tech2Name})`,
    `เงินโอน (${tech2Name})`,
    `รวม (${tech2Name})`,
    'รวมรายรับร้านทั้งหมด',
  ];

  const dateSet = new Set<string>();
  tech1Records.forEach((r) => dateSet.add(r.date));
  tech2Records.forEach((r) => dateSet.add(r.date));

  const sortedDates = Array.from(dateSet).sort((a, b) => {
    const parseDateNum = (d: string) => {
      if (d.includes('/')) {
        const parts = d.split('/').map(Number);
        return (parts[2] || 2026) * 10000 + (parts[1] || 1) * 100 + (parts[0] || 1);
      }
      return new Date(d).getTime() || 0;
    };
    return parseDateNum(a) - parseDateNum(b);
  });

  let sumTech1Cash = 0;
  let sumTech1Transfer = 0;
  let sumTech1Total = 0;
  let sumTech2Cash = 0;
  let sumTech2Transfer = 0;
  let sumTech2Total = 0;

  const rows = sortedDates.map((date) => {
    const t1 = tech1Records.filter((r) => r.date === date);
    const t2 = tech2Records.filter((r) => r.date === date);

    const t1Cash = t1.reduce((s, r) => s + (Number(r.cash) || 0), 0);
    const t1Transfer = t1.reduce((s, r) => s + (Number(r.transfer) || 0), 0);
    const t1Total = t1Cash + t1Transfer;

    const t2Cash = t2.reduce((s, r) => s + (Number(r.cash) || 0), 0);
    const t2Transfer = t2.reduce((s, r) => s + (Number(r.transfer) || 0), 0);
    const t2Total = t2Cash + t2Transfer;

    sumTech1Cash += t1Cash;
    sumTech1Transfer += t1Transfer;
    sumTech1Total += t1Total;
    sumTech2Cash += t2Cash;
    sumTech2Transfer += t2Transfer;
    sumTech2Total += t2Total;

    const dayCombined = t1Total + t2Total;

    return [
      `"${date}"`,
      t1Cash,
      t1Transfer,
      t1Total,
      t2Cash,
      t2Transfer,
      t2Total,
      dayCombined,
    ];
  });

  const totalAll = sumTech1Total + sumTech2Total;
  const summaryRow = [
    '"รวมทั้งสิ้น"',
    sumTech1Cash,
    sumTech1Transfer,
    sumTech1Total,
    sumTech2Cash,
    sumTech2Transfer,
    sumTech2Total,
    totalAll,
  ];

  const csvContent =
    bom +
    `"รายงานสรุปเปรียบเทียบรายรับร้านตัดผม: ${tech1Name} & ${tech2Name}"\n` +
    headers.join(',') +
    '\n' +
    rows.map((r) => r.join(',')).join('\n') +
    '\n' +
    summaryRow.join(',');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `เปรียบเทียบรายรับร้านตัดผม_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
