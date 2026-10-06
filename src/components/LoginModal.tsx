import React, { useState } from 'react';
import { UserRole, AppSettings } from '../types';
import { Shield, Scissors, Lock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  settings: AppSettings;
  currentRole: UserRole | null;
  onLogin: (role: UserRole) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  settings,
  currentRole,
  onLogin,
  onClose,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPin('');
    setError('');
  };

  const handleQuickPin = (digit: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleClearPin = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let correctPin = '1234';
    if (selectedRole === 'admin') correctPin = settings.adminPin || '1234';
    if (selectedRole === 'tech1') correctPin = settings.tech1Pin || '1234';
    if (selectedRole === 'tech2') correctPin = settings.tech2Pin || '1234';

    if (pin === correctPin) {
      setError('');
      onLogin(selectedRole);
    } else {
      setError('รหัสผ่านไม่ถูกต้อง (รหัสผ่านทดสอบเริ่มต้นคือ 1234)');
    }
  };

  const roles = [
    {
      id: 'admin' as UserRole,
      title: 'Admin (เจ้าของร้าน / ผู้ดูแลระบบ)',
      subtitle: 'ดูข้อมูลและจัดการของช่างทุกคน, ตรวจสอบ Dashboard รวม, ตั้งค่าระบบทั้งหมด',
      icon: Shield,
      tag: 'สิทธิ์สูงสุด',
      tagColor: 'bg-amber-100 text-amber-900 border border-amber-300',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/50',
    },
    {
      id: 'tech1' as UserRole,
      title: `ช่าง 1 (${settings.tech1Name || 'ช่างบอม'})`,
      subtitle: `บันทึก/ดู ได้เฉพาะข้อมูลของ ${settings.tech1Name || 'ช่างบอม'} เท่านั้น (ไม่สามารถดูหรือแก้ไขของอีกช่างได้)`,
      icon: Scissors,
      tag: 'สิทธิ์เฉพาะตนเอง',
      tagColor: 'bg-amber-50 text-amber-900 border border-amber-200',
      activeBorder: 'border-amber-600 ring-2 ring-amber-500/30 bg-stone-50',
    },
    {
      id: 'tech2' as UserRole,
      title: `ช่าง 2 (${settings.tech2Name || 'ช่างต๋อง'})`,
      subtitle: `บันทึก/ดู ได้เฉพาะข้อมูลของ ${settings.tech2Name || 'ช่างต๋อง'} เท่านั้น (ไม่สามารถดูหรือแก้ไขของอีกช่างได้)`,
      icon: Scissors,
      tag: 'สิทธิ์เฉพาะตนเอง',
      tagColor: 'bg-sky-50 text-sky-900 border border-sky-200',
      activeBorder: 'border-sky-600 ring-2 ring-sky-500/30 bg-stone-50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-6 text-white text-center relative border-b border-amber-500/30">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg border border-amber-400/40">
            <Scissors className="w-7 h-7 text-stone-950" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-stone-100">
            เข้าสู่ระบบบันทึกรายรับร้านตัดผม
          </h2>
          <p className="text-amber-300/90 text-xs mt-1">
            เลือกระดับสิทธิ์และกรอกรหัสผ่าน (รหัสทดสอบ: <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">1234</span>)
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Role selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <span>เลือกสิทธิ์เข้าใช้งาน:</span>
            </label>
            <div className="space-y-2">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                      isSelected
                        ? r.activeBorder
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-amber-500 text-stone-950 shadow-xs' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm md:text-base">
                            {r.title}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.tagColor}`}>
                            {r.tag}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{r.subtitle}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  รหัสผ่าน (PIN 4 หลัก):
                </label>
                <button
                  type="button"
                  onClick={() => setPin('1234')}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold cursor-pointer underline"
                >
                  คลิกเพื่อกรอก 1234 ด่วน
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="เช่น 1234"
                  maxLength={8}
                  className="w-full text-center text-2xl tracking-[0.3em] font-mono py-2.5 px-4 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 font-black text-stone-900"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Numpad */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((key) => {
                if (key === 'C') {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={handleClearPin}
                      className="py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors cursor-pointer"
                    >
                      ลบ
                    </button>
                  );
                }
                if (key === '✓') {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSubmit()}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
                    >
                      ตกลง
                    </button>
                  );
                }
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleQuickPin(key)}
                    className="py-2.5 rounded-xl bg-stone-50 hover:bg-amber-50 text-stone-800 hover:text-amber-900 border border-stone-200 font-bold text-base transition-colors cursor-pointer"
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex gap-2">
              {onClose && currentRole && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-stone-900 to-stone-950 hover:from-black hover:to-stone-900 text-amber-300 font-bold text-xs shadow-md transition-all cursor-pointer border border-amber-500/30"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
