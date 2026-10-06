import React, { useState } from 'react';
import { Plus, X, Check, Calendar, Scissors, Wallet, Smartphone, Sparkles, Coins } from 'lucide-react';
import { IncomeRecord, TechnicianId } from '../types';
import { BARBER_SERVICES } from '../services/storage';

interface MobileQuickEntryProps {
  technicianId: TechnicianId;
  technicianName: string;
  onAddRecord: (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => void;
}

export const MobileQuickEntry: React.FC<MobileQuickEntryProps> = ({
  technicianId,
  technicianName,
  onAddRecord,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  });
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 8));
  const [cash, setCash] = useState('');
  const [transfer, setTransfer] = useState('');
  const [note, setNote] = useState('');

  const cashNum = parseFloat(cash) || 0;
  const transferNum = parseFloat(transfer) || 0;
  const total = cashNum + transferNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashNum === 0 && transferNum === 0 && !note.trim()) {
      return;
    }

    onAddRecord({
      techId: technicianId,
      date,
      time: time || new Date().toTimeString().slice(0, 8),
      cash: cashNum,
      transfer: transferNum,
      total,
      note: note || 'ตัดผมและจัดแต่งทรง',
    });

    setCash('');
    setTransfer('');
    setNote('');
    setIsOpen(false);
  };

  const handleQuickAddCash = (amount: number) => {
    setCash((prev) => ((parseFloat(prev) || 0) + amount).toString());
  };

  const handleQuickAddTransfer = (amount: number) => {
    setTransfer((prev) => ((parseFloat(prev) || 0) + amount).toString());
  };

  const handleSelectService = (name: string, price: number) => {
    // Default to transfer PromptPay since 80% barbershop customers scan QR
    setTransfer(price.toString());
    setNote((prev) => (prev ? `${prev}, ${name}` : name));
  };

  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(`${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`);
    setTime(new Date().toTimeString().slice(0, 8));
  };

  return (
    <>
      {/* Floating Action Button for Mobile with Barbershop styling */}
      <div className="fixed bottom-5 right-5 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-amber-300 font-bold rounded-full shadow-2xl active:scale-95 transition-all cursor-pointer border-2 border-amber-500/50"
        >
          <Scissors className="w-5 h-5 text-amber-400" />
          <span className="text-sm">ลงงานตัดผมด่วน</span>
        </button>
      </div>

      {/* Mobile Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-4 text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-stone-100">
                    บันทึกรายรับด่วน ({technicianName})
                  </h3>
                  <p className="text-amber-300/80 text-[11px]">ร้านตัดผม & ซาลอน</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 font-sans">
              {/* Quick Services Chips */}
              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>แตะเพื่อเลือกบริการด่วน (Autofill):</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BARBER_SERVICES.slice(0, 6).map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handleSelectService(svc.name, svc.price)}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-amber-100 active:bg-amber-200 text-stone-800 rounded-xl text-xs font-medium border border-stone-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{svc.name}</span>
                      <span className="font-bold text-amber-800 font-mono">฿{svc.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    วันที่:
                  </span>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setQuickDate(0)}
                      className="text-amber-700 font-bold hover:underline cursor-pointer"
                    >
                      วันนี้
                    </button>
                    <span className="text-stone-300">•</span>
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      className="text-stone-500 hover:underline cursor-pointer"
                    >
                      เมื่อวาน
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono text-center font-bold"
                    placeholder="D/M/YYYY"
                    required
                  />
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono text-center text-stone-600"
                    placeholder="HH:mm:ss"
                  />
                </div>
              </div>

              {/* Cash Input */}
              <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-900 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-rose-600" />
                    <span>เงินสด:</span>
                  </label>
                  <span className="text-[11px] text-rose-600 font-mono">บาท</span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-rose-300 font-mono text-xl font-black text-rose-900 text-right focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {[100, 200, 300, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAddCash(amt)}
                      className="py-1 px-1 text-center bg-rose-200/70 active:bg-rose-300 text-rose-900 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transfer Input */}
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>สแกนโอน PromptPay:</span>
                  </label>
                  <span className="text-[11px] text-emerald-600 font-mono">บาท</span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={transfer}
                  onChange={(e) => setTransfer(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-emerald-300 font-mono text-xl font-black text-emerald-900 text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {[300, 500, 1000, 1500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAddTransfer(amt)}
                      className="py-1 px-1 text-center bg-emerald-200/70 active:bg-emerald-300 text-emerald-900 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live calculated Total */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 rounded-2xl text-stone-950 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    ยอดรวมสุทธิ
                  </span>
                  <div className="text-[10px] opacity-80">เงินสด + โอน</div>
                </div>
                <div className="text-xl font-black font-mono">
                  ฿ {total.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  บริการ / ทรงผม:
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ตัดผมวินเทจ + สระไดร์..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 hover:from-black hover:to-stone-900 text-amber-300 font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all border border-amber-500/30"
                >
                  <Check className="w-5 h-5 text-amber-400" />
                  <span>บันทึกลงตารางทันที</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
