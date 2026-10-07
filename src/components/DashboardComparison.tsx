import React, { useState, useMemo } from 'react';
import { IncomeRecord, AppSettings } from '../types';
import {
  TrendingUp,
  Download,
  Users,
  Wallet,
  ArrowRightLeft,
  Calendar,
  Award,
  Scissors,
  Smartphone,
  Coins,
  Sparkles,
  BookmarkCheck,
  CheckCheck,
} from 'lucide-react';
import { exportComparisonCSV } from '../services/storage';

interface DashboardComparisonProps {
  records: IncomeRecord[];
  settings: AppSettings;
  onSelectTechnician: (techId: 'tech1' | 'tech2') => void;
  isDarkMode?: boolean;
}

export const DashboardComparison: React.FC<DashboardComparisonProps> = ({
  records,
  settings,
  onSelectTechnician,
  isDarkMode = false,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'page1' | 'page2' | 'all'>('page1');

  const tech1Name = settings.tech1Name || 'ช่างบอม (Barber)';
  const tech2Name = settings.tech2Name || 'ช่างต๋อง (Stylist)';

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

  // Filter records based on selected period
  const filteredRecords = useMemo(() => {
    if (selectedPeriod === 'page1') {
      return records.filter((r) => {
        const day = getDayNum(r.date);
        return day >= 1 && day <= 15;
      });
    }
    if (selectedPeriod === 'page2') {
      return records.filter((r) => {
        const day = getDayNum(r.date);
        return day >= 16 && day <= 31;
      });
    }
    return records;
  }, [records, selectedPeriod]);

  const tech1Records = useMemo(
    () => filteredRecords.filter((r) => r.techId === 'tech1'),
    [filteredRecords]
  );
  const tech2Records = useMemo(
    () => filteredRecords.filter((r) => r.techId === 'tech2'),
    [filteredRecords]
  );

  // Totals for filtered period
  const t1Cash = tech1Records.reduce((s, r) => s + (Number(r.cash) || 0), 0);
  const t1Transfer = tech1Records.reduce((s, r) => s + (Number(r.transfer) || 0), 0);
  const t1Total = t1Cash + t1Transfer;

  const t2Cash = tech2Records.reduce((s, r) => s + (Number(r.cash) || 0), 0);
  const t2Transfer = tech2Records.reduce((s, r) => s + (Number(r.transfer) || 0), 0);
  const t2Total = t2Cash + t2Transfer;

  const grandCash = t1Cash + t2Cash;
  const grandTransfer = t1Transfer + t2Transfer;
  const grandTotal = t1Total + t2Total;

  // Percentage calculations
  const t1Share = grandTotal > 0 ? Math.round((t1Total / grandTotal) * 100) : 50;
  const t2Share = grandTotal > 0 ? 100 - t1Share : 50;

  const cashShare = grandTotal > 0 ? Math.round((grandCash / grandTotal) * 100) : 0;
  const transferShare = grandTotal > 0 ? 100 - cashShare : 0;

  // Full Month Grand Totals (1-31)
  const allT1 = records.filter((r) => r.techId === 'tech1');
  const allT2 = records.filter((r) => r.techId === 'tech2');
  const fullMonthGrand =
    allT1.reduce((s, r) => s + (Number(r.cash) || 0) + (Number(r.transfer) || 0), 0) +
    allT2.reduce((s, r) => s + (Number(r.cash) || 0) + (Number(r.transfer) || 0), 0);

  // Daily comparison for table
  const dailyComparison = useMemo(() => {
    const datesMap = new Map<
      string,
      {
        t1Cash: number;
        t1Transfer: number;
        t1Total: number;
        t2Cash: number;
        t2Transfer: number;
        t2Total: number;
      }
    >();

    filteredRecords.forEach((r) => {
      const current = datesMap.get(r.date) || {
        t1Cash: 0,
        t1Transfer: 0,
        t1Total: 0,
        t2Cash: 0,
        t2Transfer: 0,
        t2Total: 0,
      };

      if (r.techId === 'tech1') {
        current.t1Cash += Number(r.cash) || 0;
        current.t1Transfer += Number(r.transfer) || 0;
        current.t1Total += (Number(r.cash) || 0) + (Number(r.transfer) || 0);
      } else {
        current.t2Cash += Number(r.cash) || 0;
        current.t2Transfer += Number(r.transfer) || 0;
        current.t2Total += (Number(r.cash) || 0) + (Number(r.transfer) || 0);
      }

      datesMap.set(r.date, current);
    });

    const parseDateNum = (d: string) => {
      if (d.includes('/')) {
        const parts = d.split('/').map(Number);
        return (parts[2] || 2026) * 10000 + (parts[1] || 1) * 100 + (parts[0] || 1);
      }
      return new Date(d).getTime() || 0;
    };

    return Array.from(datesMap.entries())
      .sort((a, b) => parseDateNum(a[0]) - parseDateNum(b[0]))
      .map(([date, data]) => ({
        date,
        ...data,
        combinedTotal: data.t1Total + data.t2Total,
      }));
  }, [filteredRecords]);

  const handleExportComparison = () => {
    exportComparisonCSV(tech1Records, tech2Records, tech1Name, tech2Name);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Barber theme */}
      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-white rounded-3xl p-6 md:p-7 shadow-xl border border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Scissors className="w-4 h-4" />
            <span>Barbershop & Salon Performance Analytics</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-stone-100">
            สรุปเปรียบเทียบรายรับร้านตัดผม
          </h2>
          <p className="text-stone-300 text-xs md:text-sm mt-1">
            วิเคราะห์ผลงานและเปรียบเทียบยอดเงินสด-เงินโอนระหว่าง <strong>{tech1Name}</strong> และ <strong>{tech2Name}</strong>
          </p>
        </div>

        <button
          onClick={handleExportComparison}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs md:text-sm shadow-md transition-all cursor-pointer border border-amber-400/30"
        >
          <Download className="w-4 h-4" />
          <span>ส่งออกเปรียบเทียบ (CSV)</span>
        </button>
      </div>

      {/* Period Selection Bar */}
      <div
        className={`rounded-2xl p-2.5 border shadow-xs flex items-center justify-between flex-wrap gap-2 transition-colors ${
          isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedPeriod('page1')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === 'page1'
                ? 'bg-amber-600 text-white shadow-md'
                : isDarkMode
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>งวดที่ 1 (วันที่ 1 - 15)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('page2')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPeriod === 'page2'
                ? 'bg-stone-950 text-amber-300 shadow-md border border-amber-500/40'
                : isDarkMode
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>งวดที่ 2 (วันที่ 16 - 31)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : isDarkMode
                ? 'text-stone-400 hover:bg-stone-800'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            <span>ทั้งเดือน (1-31)</span>
          </button>
        </div>

        <div className={`text-xs ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>
          ยอดรวมทั้งเดือน: <strong className={`font-mono ${isDarkMode ? 'text-amber-300' : 'text-stone-900'}`}>฿{fullMonthGrand.toLocaleString()}</strong>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Grand for Period */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              {selectedPeriod === 'page1'
                ? 'รายรับงวดวันที่ 1-15'
                : selectedPeriod === 'page2'
                ? 'รายรับงวดวันที่ 16-31'
                : 'รายรับรวมทั้งเดือน'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-stone-900">
            ฿ {grandTotal.toLocaleString('th-TH')}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
            <span>{filteredRecords.length} รายการ</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">
              {selectedPeriod === 'page1' ? 'สรุปยอด ณ วันที่ 15' : 'สรุปยอดสิ้นเดือน'}
            </span>
          </div>
        </div>

        {/* Tech 1 Card */}
        <div
          onClick={() => onSelectTechnician('tech1')}
          className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-amber-600" />
              {tech1Name}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
              {t1Share}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-950">
            ฿ {t1Total.toLocaleString('th-TH')}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex justify-between">
            <span className="text-rose-700">สด: ฿{t1Cash.toLocaleString()}</span>
            <span className="text-emerald-700">โอน: ฿{t1Transfer.toLocaleString()}</span>
          </div>
          <div className="text-[11px] text-amber-800 font-bold mt-2 group-hover:underline">
            ดูตาราง {tech1Name} →
          </div>
        </div>

        {/* Tech 2 Card */}
        <div
          onClick={() => onSelectTechnician('tech2')}
          className="bg-white rounded-2xl p-5 border border-stone-300 shadow-xs hover:border-stone-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-stone-800" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-stone-700" />
              {tech2Name}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-900 font-bold">
              {t2Share}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-stone-900">
            ฿ {t2Total.toLocaleString('th-TH')}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex justify-between">
            <span className="text-rose-700">สด: ฿{t2Cash.toLocaleString()}</span>
            <span className="text-emerald-700">โอน: ฿{t2Transfer.toLocaleString()}</span>
          </div>
          <div className="text-[11px] text-stone-700 font-bold mt-2 group-hover:underline">
            ดูตาราง {tech2Name} →
          </div>
        </div>

        {/* Payment Methods Ratio */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              สัดส่วนงวดนี้
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-rose-700">เงินสด: {cashShare}%</span>
              <span className="text-emerald-700">PromptPay: {transferShare}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden flex">
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${cashShare}%` }}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${transferShare}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-stone-500 font-mono">
              <span>฿{grandCash.toLocaleString()}</span>
              <span>฿{grandTransfer.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Share Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-stone-900 text-sm md:text-base flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-amber-700" />
            <span>เปรียบเทียบสัดส่วนรายรับ ({tech1Name} vs {tech2Name})</span>
          </h3>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-amber-900">
              <span className="w-3 h-3 rounded-full bg-amber-600" />
              {tech1Name}: {t1Share}% (฿{t1Total.toLocaleString()})
            </span>
            <span className="flex items-center gap-1.5 text-stone-800">
              <span className="w-3 h-3 rounded-full bg-stone-800" />
              {tech2Name}: {t2Share}% (฿{t2Total.toLocaleString()})
            </span>
          </div>
        </div>

        <div className="w-full bg-stone-100 rounded-2xl h-7 overflow-hidden flex shadow-inner border border-stone-200">
          <div
            className="bg-gradient-to-r from-amber-600 to-amber-700 h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
            style={{ width: `${t1Share}%` }}
          >
            {t1Share > 15 ? `${tech1Name} (${t1Share}%)` : ''}
          </div>
          <div
            className="bg-gradient-to-r from-stone-800 to-stone-900 h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
            style={{ width: `${t2Share}%` }}
          >
            {t2Share > 15 ? `${tech2Name} (${t2Share}%)` : ''}
          </div>
        </div>
      </div>

      {/* Side-by-side Table with Period Subtotals */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-stone-900 text-sm">
              ตารางเปรียบเทียบรายวัน (Side-by-Side Breakdown)
            </h3>
          </div>
          <span className="text-xs text-stone-500">
            {selectedPeriod === 'page1'
              ? 'แสดงงวดที่ 1 (วันที่ 1 - 15)'
              : selectedPeriod === 'page2'
              ? 'แสดงงวดที่ 2 (วันที่ 16 - 31)'
              : 'แสดงทั้งเดือน'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase bg-stone-100 text-stone-700 border-b border-stone-300 font-bold">
              <tr>
                <th className="px-4 py-3 border-r border-stone-200">วันที่</th>
                <th colSpan={3} className="px-4 py-2 border-r border-stone-200 text-center bg-amber-50 text-amber-950 font-black">
                  ✂️ {tech1Name}
                </th>
                <th colSpan={3} className="px-4 py-2 border-r border-stone-200 text-center bg-stone-150 text-stone-950 font-black">
                  ✂️ {tech2Name}
                </th>
                <th className="px-4 py-3 text-right bg-emerald-50 text-emerald-950 font-black">
                  รวมทั้งร้าน
                </th>
              </tr>
              <tr className="border-b border-stone-200 text-[10px] text-stone-500">
                <th className="px-4 py-1.5 border-r border-stone-200"></th>
                <th className="px-2 py-1.5 text-right border-r border-stone-100 bg-amber-50/40">เงินสด</th>
                <th className="px-2 py-1.5 text-right border-r border-stone-100 bg-amber-50/40">โอน</th>
                <th className="px-2 py-1.5 text-right border-r border-stone-200 bg-amber-100/60 font-bold text-amber-900">รวม</th>
                <th className="px-2 py-1.5 text-right border-r border-stone-100 bg-stone-50">เงินสด</th>
                <th className="px-2 py-1.5 text-right border-r border-stone-100 bg-stone-50">โอน</th>
                <th className="px-2 py-1.5 text-right border-r border-stone-200 bg-stone-100 font-bold text-stone-900">รวม</th>
                <th className="px-4 py-1.5 text-right bg-emerald-50/80 font-bold text-emerald-900">สุทธิ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {dailyComparison.map((row, idx) => (
                <tr
                  key={row.date}
                  className={`hover:bg-amber-50/40 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'
                  }`}
                >
                  <td className="px-4 py-2.5 font-sans font-bold text-stone-900 border-r border-stone-200">
                    {row.date}
                  </td>
                  <td className="px-2 py-2.5 text-right border-r border-stone-100 text-stone-600">
                    {row.t1Cash.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right border-r border-stone-100 text-stone-600">
                    {row.t1Transfer.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right border-r border-stone-200 font-bold text-amber-900 bg-amber-50/40">
                    {row.t1Total.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right border-r border-stone-100 text-stone-600">
                    {row.t2Cash.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right border-r border-stone-100 text-stone-600">
                    {row.t2Transfer.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right border-r border-stone-200 font-bold text-stone-900 bg-stone-100/40">
                    {row.t2Total.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-emerald-950 bg-emerald-50/50">
                    ฿{row.combinedTotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-stone-100 font-bold text-xs border-t-2 border-stone-300">
              <tr>
                <td className="px-4 py-3 border-r border-stone-200 font-sans">
                  {selectedPeriod === 'page1'
                    ? '⭐ สรุปยอดงวด 1-15'
                    : selectedPeriod === 'page2'
                    ? '⭐ สรุปยอดงวด 16-31'
                    : 'รวมทั้งสิ้น'}
                </td>
                <td className="px-2 py-3 text-right border-r border-stone-100 font-mono text-stone-700">
                  {t1Cash.toLocaleString()}
                </td>
                <td className="px-2 py-3 text-right border-r border-stone-100 font-mono text-stone-700">
                  {t1Transfer.toLocaleString()}
                </td>
                <td className="px-2 py-3 text-right border-r border-stone-200 font-mono text-amber-900 bg-amber-100/70 font-black">
                  {t1Total.toLocaleString()}
                </td>
                <td className="px-2 py-3 text-right border-r border-stone-100 font-mono text-stone-700">
                  {t2Cash.toLocaleString()}
                </td>
                <td className="px-2 py-3 text-right border-r border-stone-100 font-mono text-stone-700">
                  {t2Transfer.toLocaleString()}
                </td>
                <td className="px-2 py-3 text-right border-r border-stone-200 font-mono text-stone-900 bg-stone-200/70 font-black">
                  {t2Total.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-mono font-black text-sm text-emerald-950 bg-emerald-100/90">
                  ฿{grandTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
