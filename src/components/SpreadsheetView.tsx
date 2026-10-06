import React, { useState, useMemo } from 'react';
import { IncomeRecord, TechnicianId, UserRole } from '../types';
import { BARBER_SERVICES } from '../services/storage';
import {
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  FileSpreadsheet,
  Download,
  Filter,
  Check,
  X,
  Search,
  ChevronDown,
  Scissors,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Wallet,
  Smartphone,
  Coins,
  ArrowRight,
  ArrowLeft,
  BookmarkCheck,
  CheckCheck,
} from 'lucide-react';

interface SpreadsheetViewProps {
  technicianId: TechnicianId;
  technicianName: string;
  themeColor?: string;
  records: IncomeRecord[];
  userRole: UserRole;
  onAddRecord: (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => void;
  onUpdateRecord: (id: string, updated: Partial<IncomeRecord>) => void;
  onDeleteRecord: (id: string) => void;
  onExportCSV: () => void;
  onOpenSyncModal: () => void;
  isSheetsConnected: boolean;
}

type PeriodType = 'page1' | 'page2'; // หน้าที่ 1: วันที่ 1 - 15, หน้าที่ 2: วันที่ 16 - 31

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  technicianId,
  technicianName,
  records,
  userRole,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onExportCSV,
  onOpenSyncModal,
  isSheetsConnected,
}) => {
  // Page / Period State: 'page1' (1-15), 'page2' (16-31), or 'all'
  const [activePage, setActivePage] = useState<PeriodType>('page1');

  // Editing state for inline edits
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCash, setEditCash] = useState<number>(0);
  const [editTransfer, setEditTransfer] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');

  // Search & Month Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('1'); // Default January
  const [viewMode, setViewMode] = useState<'sheet' | 'cards'>('sheet');

  // New Record Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDate, setNewDate] = useState<string>(() => {
    return activePage === 'page2' ? '16/1/2026' : '1/1/2026';
  });
  const [newTime, setNewTime] = useState<string>(() => {
    return new Date().toTimeString().slice(0, 8);
  });
  const [newCash, setNewCash] = useState<string>('');
  const [newTransfer, setNewTransfer] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [selectedPaymentType] = useState<'cash' | 'transfer'>('transfer');

  // Helper to extract day number from date string
  const getDayNum = (dStr: string): number => {
    if (!dStr) return 1;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      return parseInt(parts[0], 10) || 1;
    }
    if (dStr.includes('-')) {
      const parts = dStr.split('-');
      return parseInt(parts[2], 10) || 1;
    }
    return 1;
  };

  // Helper to get sort timestamp
  const getSortTimestamp = (d: string): number => {
    if (d.includes('/')) {
      const parts = d.split('/').map(Number);
      return (parts[2] || 2026) * 10000 + (parts[1] || 1) * 100 + (parts[0] || 1);
    }
    return new Date(d).getTime() || 0;
  };

  // All records for this technician within selected month
  const monthRecords = useMemo(() => {
    let list = records.filter((r) => r.techId === technicianId);

    if (selectedMonth !== 'all') {
      list = list.filter((r) => {
        if (r.date.includes('/')) {
          const parts = r.date.split('/');
          return parts[1] === selectedMonth;
        } else if (r.date.includes('-')) {
          const parts = r.date.split('-');
          return parseInt(parts[1], 10).toString() === selectedMonth;
        }
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.date.toLowerCase().includes(q) ||
          r.note.toLowerCase().includes(q) ||
          (r.time && r.time.includes(q))
      );
    }

    return list.sort((a, b) => getSortTimestamp(a.date) - getSortTimestamp(b.date));
  }, [records, technicianId, selectedMonth, searchQuery]);

  // Split into Period 1 (1-15) and Period 2 (16-31)
  const period1Records = useMemo(() => {
    return monthRecords.filter((r) => {
      const day = getDayNum(r.date);
      return day >= 1 && day <= 15;
    });
  }, [monthRecords]);

  const period2Records = useMemo(() => {
    return monthRecords.filter((r) => {
      const day = getDayNum(r.date);
      return day >= 16 && day <= 31;
    });
  }, [monthRecords]);

  // Current page records to display (Strict 2-Page mode: 1-15 vs 16-31)
  const currentDisplayRecords = useMemo(() => {
    if (activePage === 'page1') return period1Records;
    return period2Records;
  }, [activePage, period1Records, period2Records]);

  // Totals for Period 1 (วันที่ 1 - 15) - สรุปยอด ณ วันที่ 15
  const p1Totals = useMemo(() => {
    const cash = period1Records.reduce((sum, r) => sum + (Number(r.cash) || 0), 0);
    const transfer = period1Records.reduce((sum, r) => sum + (Number(r.transfer) || 0), 0);
    return { cash, transfer, total: cash + transfer, count: period1Records.length };
  }, [period1Records]);

  // Totals for Period 2 (วันที่ 16 - 31) - สรุปยอด ณ สิ้นเดือน
  const p2Totals = useMemo(() => {
    const cash = period2Records.reduce((sum, r) => sum + (Number(r.cash) || 0), 0);
    const transfer = period2Records.reduce((sum, r) => sum + (Number(r.transfer) || 0), 0);
    return { cash, transfer, total: cash + transfer, count: period2Records.length };
  }, [period2Records]);

  // Overall Month Totals (วันที่ 1 - 31)
  const monthTotals = useMemo(() => {
    const cash = monthRecords.reduce((sum, r) => sum + (Number(r.cash) || 0), 0);
    const transfer = monthRecords.reduce((sum, r) => sum + (Number(r.transfer) || 0), 0);
    return { cash, transfer, total: cash + transfer, count: monthRecords.length };
  }, [monthRecords]);

  // Active displayed totals depending on active page
  const activeTotals = useMemo(() => {
    if (activePage === 'page1') return p1Totals;
    return p2Totals;
  }, [activePage, p1Totals, p2Totals]);

  // Inline edit handlers
  const handleStartEdit = (record: IncomeRecord) => {
    setEditingId(record.id);
    setEditCash(record.cash);
    setEditTransfer(record.transfer);
    setEditNote(record.note || '');
    setEditDate(record.date);
    setEditTime(record.time || '18:00:00');
  };

  const handleSaveEdit = (id: string) => {
    const cashNum = Number(editCash) || 0;
    const transferNum = Number(editTransfer) || 0;
    onUpdateRecord(id, {
      cash: cashNum,
      transfer: transferNum,
      total: cashNum + transferNum,
      note: editNote,
      date: editDate,
      time: editTime,
      updatedAt: new Date().toISOString(),
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Submit quick add
  const handleAddNewRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const cashNum = parseFloat(newCash) || 0;
    const transferNum = parseFloat(newTransfer) || 0;

    onAddRecord({
      techId: technicianId,
      date: newDate,
      time: newTime || new Date().toTimeString().slice(0, 8),
      cash: cashNum,
      transfer: transferNum,
      total: cashNum + transferNum,
      note: newNote || 'ตัดผมและจัดแต่งทรง',
    });

    setNewCash('');
    setNewTransfer('');
    setNewNote('');
    setIsAddModalOpen(false);
  };

  // Preset Barbershop Service click helper
  const handleSelectServicePreset = (service: (typeof BARBER_SERVICES)[0]) => {
    const priceStr = service.price.toString();
    if (selectedPaymentType === 'transfer') {
      setNewTransfer(priceStr);
      setNewCash('0');
    } else {
      setNewCash(priceStr);
      setNewTransfer('0');
    }
    setNewNote((prev) => (prev ? `${prev} + ${service.name}` : service.name));
  };

  const isTech1 = technicianId === 'tech1';

  return (
    <div className="space-y-4">
      {/* Top Barbershop Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/90 p-3.5 md:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Month Filter */}
          <div className="flex items-center gap-1.5 bg-stone-100/90 px-3 py-1.5 rounded-xl border border-stone-200 text-xs md:text-sm font-medium text-stone-700">
            <Filter className="w-4 h-4 text-amber-700" />
            <span>เดือน:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-xs md:text-sm font-bold text-stone-900 focus:outline-none cursor-pointer"
            >
              <option value="1">มกราคม 2026</option>
              <option value="2">กุมภาพันธ์ 2026</option>
              <option value="3">มีนาคม 2026</option>
              <option value="4">เมษายน 2026</option>
              <option value="5">พฤษภาคม 2026</option>
              <option value="6">มิถุนายน 2026</option>
              <option value="7">กรกฎาคม 2026</option>
              <option value="8">สิงหาคม 2026</option>
              <option value="9">กันยายน 2026</option>
              <option value="10">ตุลาคม 2026</option>
              <option value="11">พฤศจิกายน 2026</option>
              <option value="12">ธันวาคม 2026</option>
              <option value="all">ทั้งปี (All)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาวันที่, บริการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-stone-50/50 w-32 md:w-48"
            />
          </div>

          {/* View Mode Toggle: Spreadsheet vs Cards */}
          <div className="inline-flex rounded-xl border border-stone-200 p-0.5 bg-stone-100 text-xs">
            <button
              onClick={() => setViewMode('sheet')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'sheet'
                  ? 'bg-white shadow-xs text-stone-900'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>ตาราง</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white shadow-xs text-stone-900'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ด</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs md:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            title="ส่งออกไฟล์ CSV สำหรับร้านตัดผม"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={onOpenSyncModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors cursor-pointer shadow-2xs ${
              isSheetsConnected
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => {
              setNewDate(activePage === 'page2' ? '16/1/2026' : '1/1/2026');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white text-xs md:text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-98"
          >
            <Scissors className="w-4 h-4" />
            <span>+ บันทึกงาน</span>
          </button>
        </div>
      </div>

      {/* 2-PAGE PERIOD SWITCHER (หน้าที่ 1: วันที่ 1 - 15 vs หน้าที่ 2: วันที่ 16 - 31) */}
      <div className="bg-white rounded-2xl p-2.5 md:p-3 border border-stone-300 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Page 1 Button: วันที่ 1 - 15 */}
          <button
            type="button"
            onClick={() => setActivePage('page1')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activePage === 'page1'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md ring-2 ring-amber-500/40'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>หน้าที่ 1 : วันที่ 1 - 15</span>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono ${
                activePage === 'page1' ? 'bg-amber-900 text-amber-200' : 'bg-stone-200 text-stone-700'
              }`}
            >
              ⭐ สรุปยอดวันที่ 15
            </span>
          </button>

          {/* Page 2 Button: วันที่ 16 - 31 */}
          <button
            type="button"
            onClick={() => setActivePage('page2')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activePage === 'page2'
                ? 'bg-gradient-to-r from-stone-900 to-stone-950 text-amber-300 shadow-md ring-2 ring-stone-700 border border-amber-500/40'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>หน้าที่ 2 : วันที่ 16 - 31</span>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono ${
                activePage === 'page2'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              ⭐ สรุปยอดสิ้นเดือน
            </span>
          </button>
        </div>

        {/* Quick Page Prev/Next Navigation */}
        <div className="flex items-center gap-2">
          {activePage === 'page1' ? (
            <button
              onClick={() => setActivePage('page2')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-50 to-stone-100 hover:from-amber-100 hover:to-stone-200 text-stone-900 text-xs font-bold rounded-xl transition-all cursor-pointer border border-amber-300 shadow-2xs"
            >
              <span>ไปหน้าที่ 2 (วันที่ 16 - 31)</span>
              <ArrowRight className="w-4 h-4 text-amber-700" />
            </button>
          ) : (
            <button
              onClick={() => setActivePage('page1')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-50 to-stone-100 hover:from-amber-100 hover:to-stone-200 text-stone-900 text-xs font-bold rounded-xl transition-all cursor-pointer border border-amber-300 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-amber-700" />
              <span>กลับไปหน้าที่ 1 (วันที่ 1 - 15)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View: Spreadsheet Mode */}
      {viewMode === 'sheet' && (
        <div className="bg-white rounded-2xl shadow-md border border-stone-300/80 overflow-hidden">
          {/* Header Banner */}
          <div className="grid grid-cols-12 border-b border-stone-300">
            <div
              className={`col-span-12 md:col-span-6 px-6 py-4 flex items-center justify-between ${
                isTech1
                  ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 text-white'
                  : 'bg-gradient-to-r from-stone-900 via-slate-800 to-stone-950 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
                  <Scissors className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
                      {technicianName}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md">
                      {isTech1 ? 'Master Barber' : 'Hair Stylist'}
                    </span>
                  </div>
                  <div className="text-xs text-stone-300 mt-0.5 flex items-center gap-1.5">
                    <span className="font-bold text-amber-300">
                      {activePage === 'page1'
                        ? 'หน้าที่ 1: วันที่ 1 - 15 (สรุปงวดวันที่ 15)'
                        : activePage === 'page2'
                        ? 'หน้าที่ 2: วันที่ 16 - 31 (สรุปงวดสิ้นเดือน)'
                        : 'แสดงทั้งเดือน: วันที่ 1 - 31'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-stone-300">จำนวนที่แสดง</div>
                <div className="text-lg font-black text-amber-300 font-mono">
                  {currentDisplayRecords.length} <span className="text-xs font-normal text-stone-300">วัน</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex col-span-6 bg-stone-50 items-center justify-end px-6 gap-6 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>เงินสด: <strong>฿{activeTotals.cash.toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>สแกนโอน: <strong>฿{activeTotals.transfer.toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-100/70 border border-amber-300 px-3 py-1 rounded-lg font-bold text-amber-900">
                <Coins className="w-4 h-4 text-amber-700" />
                <span>รวมงวดนี้: ฿{activeTotals.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Active Period Summary Bar */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Grand Total Summary Row for the Active Period */}
              <div className="grid grid-cols-12 bg-stone-900 text-white border-b-2 border-stone-800 text-xs md:text-sm font-bold shadow-inner">
                {/* Date column label */}
                <div className="col-span-3 border-r border-stone-800 px-4 py-3 flex items-center justify-end font-bold text-amber-300 bg-stone-900">
                  <span className="text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {activePage === 'page1'
                        ? 'สรุปยอดงวดวันที่ 1 - 15:'
                        : activePage === 'page2'
                        ? 'สรุปยอดงวดวันที่ 16 - สิ้นเดือน:'
                        : 'ยอดรวมสุทธิทั้งเดือน:'}
                    </span>
                  </span>
                </div>

                {/* Cash Total Cell */}
                <div className="col-span-2 border-r border-stone-800 px-3 py-3 text-right bg-gradient-to-b from-rose-950/80 to-rose-900/90 text-rose-200 font-mono font-black text-base md:text-lg flex items-center justify-end shadow-inner">
                  <div className="w-full text-right">
                    <div className="text-[10px] text-rose-300/80 font-normal">เงินสด</div>
                    <div>฿ {activeTotals.cash.toLocaleString('th-TH')}</div>
                  </div>
                </div>

                {/* Transfer Total Cell */}
                <div className="col-span-2 border-r border-stone-800 px-3 py-3 text-right bg-gradient-to-b from-emerald-950/80 to-emerald-900/90 text-emerald-200 font-mono font-black text-base md:text-lg flex items-center justify-end shadow-inner">
                  <div className="w-full text-right">
                    <div className="text-[10px] text-emerald-300/80 font-normal">สแกนโอน QR</div>
                    <div>฿ {activeTotals.transfer.toLocaleString('th-TH')}</div>
                  </div>
                </div>

                {/* Grand Total Cell */}
                <div className="col-span-2 border-r border-stone-800 px-3 py-3 text-right bg-gradient-to-b from-amber-600 to-amber-700 text-stone-950 font-mono font-black text-base md:text-lg flex items-center justify-end shadow-md">
                  <div className="w-full text-right">
                    <div className="text-[10px] text-stone-900 font-bold uppercase">
                      {activePage === 'page1' ? 'รวมงวดวันที่ 15' : activePage === 'page2' ? 'รวมงวดสิ้นเดือน' : 'รวมสุทธิ'}
                    </div>
                    <div>฿ {activeTotals.total.toLocaleString('th-TH')}</div>
                  </div>
                </div>

                {/* Quick insight */}
                <div className="col-span-3 px-4 py-3 flex items-center justify-between text-xs text-stone-300 bg-stone-900">
                  <span className="text-[11px] text-stone-400">
                    {activePage === 'page1' ? 'สรุปผลงานงวด 1-15' : 'สรุปผลงานงวด 16-สิ้นเดือน'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-900/50 border border-amber-600/60 px-2.5 py-1 rounded-full font-mono">
                    ฿{activeTotals.total.toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              {/* Table Column Headers */}
              <div className="grid grid-cols-12 bg-stone-100 border-b border-stone-300 text-xs font-bold text-stone-700 select-none py-1">
                {/* Date */}
                <div className="col-span-3 border-r border-stone-300 px-3 py-2 flex items-center gap-1.5 text-stone-900">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>วันที่ & เวลา</span>
                </div>

                {/* เงินสด badge */}
                <div className="col-span-2 border-r border-stone-300 px-2 py-1.5 flex items-center justify-end">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold shadow-2xs">
                    <Wallet className="w-3 h-3 text-rose-600" />
                    <span>เงินสด</span>
                    <ChevronDown className="w-3 h-3 text-rose-500" />
                  </div>
                </div>

                {/* โอน badge */}
                <div className="col-span-2 border-r border-stone-300 px-2 py-1.5 flex items-center justify-end">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                    <Smartphone className="w-3 h-3 text-emerald-600" />
                    <span>โอน PromptPay</span>
                    <ChevronDown className="w-3 h-3 text-emerald-500" />
                  </div>
                </div>

                {/* รวม... badge */}
                <div className="col-span-2 border-r border-stone-300 px-2 py-1.5 flex items-center justify-end">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs">
                    <Coins className="w-3 h-3 text-amber-700" />
                    <span>รวมสุทธิ</span>
                    <ChevronDown className="w-3 h-3 text-amber-600" />
                  </div>
                </div>

                {/* Service description */}
                <div className="col-span-3 px-3 py-2 text-stone-700 font-bold flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-stone-500" />
                    <span>บริการตัดผม / ทรงผม / บันทึก</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-normal">จัดการ</span>
                </div>
              </div>

              {/* Data Rows */}
              {currentDisplayRecords.length === 0 ? (
                <div className="p-12 text-center text-stone-500">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center text-amber-700 mb-3 border border-amber-200">
                    <Scissors className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-stone-800 text-base">
                    ยังไม่มีข้อมูลในช่วงวันที่นี้ ({activePage === 'page1' ? '1 - 15' : '16 - 31'})
                  </p>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    กดปุ่ม "+ บันทึกงาน" เพื่อเพิ่มรายรับประจำวันของ {technicianName}
                  </p>
                  <button
                    onClick={() => {
                      setNewDate(activePage === 'page2' ? '16/1/2026' : '1/1/2026');
                      setIsAddModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    บันทึกรายการสำหรับช่วงนี้
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-stone-200 font-sans">
                  {currentDisplayRecords.map((record, index) => {
                    const isEditing = editingId === record.id;
                    const rowCash = Number(record.cash) || 0;
                    const rowTransfer = Number(record.transfer) || 0;
                    const rowTotal = rowCash + rowTransfer;

                    return (
                      <div
                        key={record.id}
                        className={`grid grid-cols-12 text-xs md:text-sm transition-colors group ${
                          isEditing
                            ? 'bg-amber-50/90 ring-1 ring-amber-400'
                            : index % 2 === 0
                            ? 'bg-white hover:bg-stone-50'
                            : 'bg-stone-50/50 hover:bg-stone-100/60'
                        }`}
                      >
                        {/* Column 1: Date & Time */}
                        <div className="col-span-3 border-r border-stone-200 px-3 py-2.5 flex items-center justify-between">
                          {isEditing ? (
                            <div className="space-y-1 w-full">
                              <input
                                type="text"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full px-2 py-1 border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                                placeholder="ว/ด/ป เช่น 1/1/2026"
                              />
                              <input
                                type="text"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="w-full px-2 py-0.5 border border-stone-200 rounded text-[11px] text-stone-500 font-mono"
                                placeholder="เวลา เช่น 18:30:00"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-stone-900 text-sm">
                                  {record.date}
                                </span>
                              </div>
                              {record.time && (
                                <div className="text-[11px] text-stone-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  <span>{record.time}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Column 2: เงินสด */}
                        <div className="col-span-2 border-r border-stone-200 px-3 py-2.5 bg-rose-50/30 group-hover:bg-rose-50/60 transition-colors flex items-center justify-end font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editCash}
                              onChange={(e) => setEditCash(Number(e.target.value))}
                              className="w-full text-right px-2 py-1 bg-white border border-rose-300 rounded text-xs font-mono font-bold focus:ring-1 focus:ring-rose-500"
                              min="0"
                            />
                          ) : (
                            <span
                              className={`font-semibold text-right cursor-pointer hover:underline ${
                                rowCash > 0 ? 'text-rose-950 font-bold' : 'text-stone-400'
                              }`}
                              onClick={() => handleStartEdit(record)}
                              title="คลิกเพื่อแก้ไขตัวเลข"
                            >
                              {rowCash.toLocaleString('th-TH')}
                            </span>
                          )}
                        </div>

                        {/* Column 3: โอน */}
                        <div className="col-span-2 border-r border-stone-200 px-3 py-2.5 bg-emerald-50/30 group-hover:bg-emerald-50/60 transition-colors flex items-center justify-end font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editTransfer}
                              onChange={(e) => setEditTransfer(Number(e.target.value))}
                              className="w-full text-right px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                              min="0"
                            />
                          ) : (
                            <span
                              className={`font-semibold text-right cursor-pointer hover:underline ${
                                rowTransfer > 0 ? 'text-emerald-950 font-bold' : 'text-stone-400'
                              }`}
                              onClick={() => handleStartEdit(record)}
                              title="คลิกเพื่อแก้ไขตัวเลข"
                            >
                              {rowTransfer.toLocaleString('th-TH')}
                            </span>
                          )}
                        </div>

                        {/* Column 4: รวม */}
                        <div className="col-span-2 border-r border-stone-200 px-3 py-2.5 bg-amber-50/40 group-hover:bg-amber-50/70 transition-colors flex items-center justify-end font-mono">
                          <span
                            className={`font-black text-right ${
                              isEditing
                                ? 'text-amber-800 bg-amber-100 px-2 py-0.5 rounded'
                                : rowTotal > 0
                                ? 'text-stone-900 text-sm'
                                : 'text-stone-400'
                            }`}
                          >
                            {isEditing
                              ? (Number(editCash || 0) + Number(editTransfer || 0)).toLocaleString(
                                  'th-TH'
                                )
                              : rowTotal.toLocaleString('th-TH')}
                          </span>
                        </div>

                        {/* Column 5: Services & Notes / Actions */}
                        <div className="col-span-3 px-3 py-2.5 flex items-center justify-between gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input
                                type="text"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="เช่น ตัดผมวินเทจ + สระไดร์..."
                                className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(record.id)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer shadow-2xs"
                                title="บันทึก"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded cursor-pointer"
                                title="ยกเลิก"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="truncate flex-1" title={record.note}>
                                <span className="text-stone-800 font-medium text-xs">
                                  {record.note ? record.note : <span className="text-stone-300 italic">- ว่าง -</span>}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(record)}
                                  className="p-1 hover:bg-amber-100 text-stone-600 hover:text-amber-800 rounded transition-colors cursor-pointer"
                                  title="แก้ไขตัวเลข/บริการ"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {(userRole === 'admin' || userRole === technicianId) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        window.confirm(`ต้องการลบรายการวันที่ ${record.date} หรือไม่?`)
                                      ) {
                                        onDeleteRecord(record.id);
                                      }
                                    }}
                                    className="p-1 hover:bg-rose-100 text-rose-500 rounded transition-colors cursor-pointer"
                                    title="ลบรายการ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* SUMMARY SECTION FOR PERIOD 1 (ณ วันที่ 15) */}
                  {activePage === 'page1' && (
                    <div className="grid grid-cols-12 bg-amber-50/90 border-t-2 border-b border-amber-300 font-bold text-xs md:text-sm shadow-xs">
                      <div className="col-span-3 border-r border-amber-300 px-3 py-3 flex items-center gap-1.5 text-amber-950 font-extrabold">
                        <CheckCheck className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>⭐ สรุปยอดรวม ณ วันที่ 15 (งวด 1 - 15)</span>
                      </div>
                      <div className="col-span-2 border-r border-amber-300 px-3 py-3 text-right font-mono font-black text-rose-900 bg-rose-100/50">
                        ฿ {p1Totals.cash.toLocaleString('th-TH')}
                      </div>
                      <div className="col-span-2 border-r border-amber-300 px-3 py-3 text-right font-mono font-black text-emerald-900 bg-emerald-100/50">
                        ฿ {p1Totals.transfer.toLocaleString('th-TH')}
                      </div>
                      <div className="col-span-2 border-r border-amber-300 px-3 py-3 text-right font-mono font-black text-base text-amber-950 bg-amber-200/80">
                        ฿ {p1Totals.total.toLocaleString('th-TH')}
                      </div>
                      <div className="col-span-3 px-3 py-3 text-xs text-amber-900 flex items-center justify-between">
                        <span>สรุปยอดรอบวันที่ 15 ({p1Totals.count} วันทำการ)</span>
                        <button
                          onClick={() => setActivePage('page2')}
                          className="px-2.5 py-1 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1 shadow-xs"
                        >
                          <span>ไปงวด 16-31</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUMMARY SECTION FOR PERIOD 2 (ณ สิ้นเดือน) */}
                  {activePage === 'page2' && (
                    <>
                      {/* Period 2 subtotal (16 - 31) */}
                      <div className="grid grid-cols-12 bg-sky-50/90 border-t-2 border-b border-sky-300 font-bold text-xs md:text-sm shadow-xs">
                        <div className="col-span-3 border-r border-sky-300 px-3 py-3 flex items-center gap-1.5 text-sky-950 font-extrabold">
                          <CheckCheck className="w-4 h-4 text-sky-700 shrink-0" />
                          <span>⭐ สรุปยอดรวม ณ สิ้นเดือน (งวด 16 - 31)</span>
                        </div>
                        <div className="col-span-2 border-r border-sky-300 px-3 py-3 text-right font-mono font-black text-rose-900 bg-rose-100/50">
                          ฿ {p2Totals.cash.toLocaleString('th-TH')}
                        </div>
                        <div className="col-span-2 border-r border-sky-300 px-3 py-3 text-right font-mono font-black text-emerald-900 bg-emerald-100/50">
                          ฿ {p2Totals.transfer.toLocaleString('th-TH')}
                        </div>
                        <div className="col-span-2 border-r border-sky-300 px-3 py-3 text-right font-mono font-black text-base text-sky-950 bg-sky-200/80">
                          ฿ {p2Totals.total.toLocaleString('th-TH')}
                        </div>
                        <div className="col-span-3 px-3 py-3 text-xs text-sky-900 flex items-center justify-between">
                          <span>สรุปยอดรอบสิ้นเดือน ({p2Totals.count} วันทำการ)</span>
                          <button
                            onClick={() => setActivePage('page1')}
                            className="px-2.5 py-1 rounded-xl bg-stone-700 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>กลับไปงวด 1-15</span>
                          </button>
                        </div>
                      </div>

                      {/* Cumulative Full Month Total */}
                      <div className="grid grid-cols-12 bg-stone-900 text-amber-300 border-t-2 border-stone-950 font-bold text-xs md:text-sm shadow-md">
                        <div className="col-span-3 border-r border-stone-800 px-3 py-3.5 flex items-center gap-1.5 text-white font-black">
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>🌟 สรุปยอดรวมสุทธิทั้งเดือน (งวด 15 + สิ้นเดือน)</span>
                        </div>
                        <div className="col-span-2 border-r border-stone-800 px-3 py-3.5 text-right font-mono font-black text-rose-300 bg-rose-950/60">
                          ฿ {monthTotals.cash.toLocaleString('th-TH')}
                        </div>
                        <div className="col-span-2 border-r border-stone-800 px-3 py-3.5 text-right font-mono font-black text-emerald-300 bg-emerald-950/60">
                          ฿ {monthTotals.transfer.toLocaleString('th-TH')}
                        </div>
                        <div className="col-span-2 border-r border-stone-800 px-3 py-3.5 text-right font-mono font-black text-base md:text-lg text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500">
                          ฿ {monthTotals.total.toLocaleString('th-TH')}
                        </div>
                        <div className="col-span-3 px-3 py-3.5 text-xs text-stone-300 flex items-center justify-between">
                          <span>ยอดรวมทั้งสิ้น (งวด 1 + งวด 2)</span>
                          <span className="font-mono text-amber-400 font-bold">
                            {monthTotals.count} วันทำการ
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-stone-100 border-t border-stone-300 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 font-medium">
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                กำลังดู: <strong>{activePage === 'page1' ? 'หน้าที่ 1 (วันที่ 1 - 15) • สรุปยอด ณ วันที่ 15' : 'หน้าที่ 2 (วันที่ 16 - 31) • สรุปยอด ณ สิ้นเดือน'}</strong>
              </span>
              <span>
                สัดส่วนเงินสด: <strong className="text-rose-700">{activeTotals.total > 0 ? Math.round((activeTotals.cash / activeTotals.total) * 100) : 0}%</strong>
              </span>
              <span>
                สัดส่วนโอน: <strong className="text-emerald-700">{activeTotals.total > 0 ? Math.round((activeTotals.transfer / activeTotals.total) * 100) : 0}%</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activePage === 'page1' ? (
                <button
                  type="button"
                  onClick={() => setActivePage('page2')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>เปิดหน้าที่ 2 (วันที่ 16 - 31)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActivePage('page1')}
                  className="px-3 py-1 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>เปิดหน้าที่ 1 (วันที่ 1 - 15)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alternate View: Barber Service Cards */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {currentDisplayRecords.map((record) => {
              const rowCash = Number(record.cash) || 0;
              const rowTransfer = Number(record.transfer) || 0;
              const rowTotal = rowCash + rowTransfer;

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-mono font-bold text-stone-900 text-sm flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>{record.date}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                          {record.time || '18:00:00'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-amber-900">
                          ฿{rowTotal.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-stone-400">ยอดรวมประจำวัน</span>
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-xl p-2.5 my-2 border border-stone-100 text-xs text-stone-700 font-medium">
                      <div className="flex items-center gap-1 text-stone-500 text-[11px] mb-1">
                        <Scissors className="w-3 h-3 text-amber-600" />
                        <span>รายการบริการ:</span>
                      </div>
                      <p className="line-clamp-2">{record.note || 'ตัดผมและจัดแต่งทรง'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="text-rose-700">สด: ฿{rowCash.toLocaleString()}</span>
                      <span className="text-emerald-700">โอน: ฿{rowTransfer.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(record)}
                        className="p-1 hover:bg-stone-100 text-stone-600 rounded cursor-pointer"
                        title="แก้ไข"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {(userRole === 'admin' || userRole === technicianId) && (
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cards View Summary Badge */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-950 p-4 rounded-2xl text-white flex items-center justify-between border border-amber-500/30">
            <div>
              <div className="text-amber-400 font-bold text-xs uppercase">
                {activePage === 'page1' ? 'สรุปยอดงวดที่ 1 (วันที่ 1 - 15)' : 'สรุปยอดงวดที่ 2 (วันที่ 16 - 31)'}
              </div>
              <div className="text-stone-300 text-xs mt-0.5">
                เงินสด ฿{activeTotals.cash.toLocaleString()} • โอน ฿{activeTotals.transfer.toLocaleString()}
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-300">
              ฿ {activeTotals.total.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Add Barbershop Job Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-stone-950 via-stone-850 to-stone-900 p-5 text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base md:text-lg">บันทึกงานตัดผม - {technicianName}</h3>
                  <p className="text-stone-300 text-xs">
                    {activePage === 'page1' ? 'บันทึกในงวดที่ 1 (วันที่ 1 - 15)' : 'บันทึกในงวดที่ 2 (วันที่ 16 - 31)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewRecord} className="p-5 space-y-4 font-sans">
              {/* Quick Barbershop Service Presets Chips */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>กดเลือกบริการยอดนิยม (ราคาจะกรอกให้อัตโนมัติ):</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BARBER_SERVICES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectServicePreset(s)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/90 text-amber-950 border border-amber-200/80 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>{s.name}</span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
                        ฿{s.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    วันที่ (D/M/YYYY):
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="เช่น 15/1/2026 หรือ 31/1/2026"
                  />
                  <div className="flex gap-1.5 mt-1.5 text-[10px] text-stone-500 flex-wrap">
                    <span className="text-stone-400">เลือกด่วน:</span>
                    {activePage === 'page1' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setNewDate(`1/${selectedMonth === 'all' ? '1' : selectedMonth}/2026`)}
                          className="hover:text-amber-800 bg-stone-100 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          วันที่ 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDate(`5/${selectedMonth === 'all' ? '1' : selectedMonth}/2026`)}
                          className="hover:text-amber-800 bg-stone-100 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          วันที่ 5
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDate(`10/${selectedMonth === 'all' ? '1' : selectedMonth}/2026`)}
                          className="hover:text-amber-800 bg-stone-100 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          วันที่ 10
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDate(`15/${selectedMonth === 'all' ? '1' : selectedMonth}/2026`)}
                          className="text-amber-900 font-bold bg-amber-200/80 hover:bg-amber-300 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          วันที่ 15 (สรุปงวด 1)
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setNewDate(`16/${selectedMonth === 'all' ? '1' : selectedMonth}/2026`)}
                          className="hover:text-amber-800 bg-stone-100 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          วันที่ 16
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDate(`20/${selectedMonth === 'all' ? '1' : selectedMonth}/2026`)}
                          className="hover:text-amber-800 bg-stone-100 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          วันที่ 20
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDate(`25/${selectedMonth === 'all' ? '1' : selectedMonth}/2026`)}
                          className="hover:text-amber-800 bg-stone-100 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          วันที่ 25
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewDate(`31/${selectedMonth === 'all' ? '1' : selectedMonth}/2026`)}
                          className="text-amber-900 font-bold bg-amber-200/80 hover:bg-amber-300 px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          วันที่ 31 (สรุปสิ้นเดือน)
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    เวลา:
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="HH:mm:ss"
                  />
                </div>
              </div>

              {/* Cash & Transfer Inputs */}
              <div className="grid grid-cols-2 gap-3">
                {/* Cash */}
                <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-rose-900 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-rose-600" />
                      <span>เงินสด:</span>
                    </label>
                    <span className="text-[11px] text-rose-600 font-mono">บาท</span>
                  </div>
                  <input
                    type="number"
                    value={newCash}
                    onChange={(e) => setNewCash(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 border border-rose-300 rounded-xl text-lg font-mono font-black text-rose-900 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-right"
                  />
                  <div className="flex gap-1 mt-1.5 justify-end">
                    {[150, 300, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNewCash((prev) => ((Number(prev) || 0) + amt).toString())}
                        className="text-[10px] px-1.5 py-0.5 bg-rose-200/60 hover:bg-rose-200 text-rose-900 rounded-lg font-mono cursor-pointer"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transfer */}
                <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>โอน PromptPay:</span>
                    </label>
                    <span className="text-[11px] text-emerald-600 font-mono">บาท</span>
                  </div>
                  <input
                    type="number"
                    value={newTransfer}
                    onChange={(e) => setNewTransfer(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-lg font-mono font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-right"
                  />
                  <div className="flex gap-1 mt-1.5 justify-end">
                    {[300, 500, 1500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() =>
                          setNewTransfer((prev) => ((Number(prev) || 0) + amt).toString())
                        }
                        className="text-[10px] px-1.5 py-0.5 bg-emerald-200/60 hover:bg-emerald-200 text-emerald-900 rounded-lg font-mono cursor-pointer"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live calculated Total */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3.5 rounded-2xl text-stone-950 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    ยอดรวมคำนวณสุทธิ
                  </span>
                  <div className="text-[11px] opacity-80">เงินสด + โอน อัตโนมัติ</div>
                </div>
                <div className="text-2xl font-black font-mono">
                  ฿{' '}
                  {(
                    (parseFloat(newCash) || 0) + (parseFloat(newTransfer) || 0)
                  ).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Service description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  บริการ / ทรงผม / สรุปงาน:
                </label>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="เช่น ตัดผมวินเทจ Fade 3 ท่าน + ดัดวอลลุ่ม..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  บันทึกลงตาราง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
