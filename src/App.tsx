import React, { useState, useEffect } from 'react';
import {
  UserRole,
  IncomeRecord,
  AppSettings,
  TechnicianId,
} from './types';
import {
  loadStoredRecords,
  saveStoredRecords,
  loadStoredSettings,
  saveStoredSettings,
  loadSavedAuth,
  saveAuthSession,
  exportToCSV,
} from './services/storage';
import { initAuth } from './services/firebaseAuth';
import { syncRecordsToGoogleSheet } from './services/googleSheets';
import { Navbar } from './components/Navbar';
import { SpreadsheetView } from './components/SpreadsheetView';
import { DashboardComparison } from './components/DashboardComparison';
import { LoginModal } from './components/LoginModal';
import { SettingsModal } from './components/SettingsModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { MobileQuickEntry } from './components/MobileQuickEntry';
import {
  Shield,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Lock,
  Info,
  KeyRound,
} from 'lucide-react';

export default function App() {
  // Application settings (Tech names, PINs, Google Sheets configuration)
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());

  // Income records in LocalStorage
  const [records, setRecords] = useState<IncomeRecord[]>(() => loadStoredRecords());

  // Current Authentication State & Role
  const [savedAuth] = useState(() => loadSavedAuth());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return savedAuth ? !!savedAuth.isAuthenticated : false;
  });
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return savedAuth?.role || 'tech1';
  });

  // Active view tab: 'tech1' | 'tech2' | 'dashboard'
  const [activeTab, setActiveTab] = useState<'tech1' | 'tech2' | 'dashboard'>('tech1');

  // Google Authentication State
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync state with LocalStorage
  useEffect(() => {
    saveStoredRecords(records);
  }, [records]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Keep activeTab strictly constrained by role permissions
  useEffect(() => {
    if (currentRole === 'tech1') {
      setActiveTab('tech1');
    } else if (currentRole === 'tech2') {
      setActiveTab('tech2');
    }
  }, [currentRole]);

  // Firebase Auth listener for Google account
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setIsGoogleSignedIn(true);
        setGoogleUserEmail(user.email);
      },
      () => {
        setIsGoogleSignedIn(false);
        setGoogleUserEmail(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Secure Login handler
  const handleLogin = (role: UserRole) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
    saveAuthSession({ role, isAuthenticated: true });
    setIsLoginModalOpen(false);

    if (role === 'admin') {
      setActiveTab('tech1');
      showToast('เข้าสู่ระบบสำเร็จในฐานะ Admin (สิทธิ์ผู้ดูแลร้านและช่างทุกคน)', 'info');
    } else if (role === 'tech1') {
      setActiveTab('tech1');
      showToast(`เข้าสู่ระบบสำเร็จในฐานะ ${settings.tech1Name || 'ช่างบอม'} (ล็อกสิทธิ์เฉพาะตนเอง)`, 'info');
    } else {
      setActiveTab('tech2');
      showToast(`เข้าสู่ระบบสำเร็จในฐานะ ${settings.tech2Name || 'ช่างต๋อง'} (ล็อกสิทธิ์เฉพาะตนเอง)`, 'info');
    }
  };

  // Secure Logout handler - locks the application
  const handleLogout = () => {
    setIsAuthenticated(false);
    saveAuthSession(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว ล็อกการเข้าถึงข้อมูล', 'info');
  };

  // Add new record with STRICT role verification
  const handleAddRecord = async (newRecordData: Omit<IncomeRecord, 'id' | 'createdAt'>) => {
    // SECURITY ENFORCEMENT: Technician cannot add for other technician
    if (currentRole === 'tech1' && newRecordData.techId !== 'tech1') {
      showToast('คุณไม่มีสิทธิ์บันทึกข้อมูลของช่างท่านอื่น', 'error');
      return;
    }
    if (currentRole === 'tech2' && newRecordData.techId !== 'tech2') {
      showToast('คุณไม่มีสิทธิ์บันทึกข้อมูลของช่างท่านอื่น', 'error');
      return;
    }

    const finalTechId: TechnicianId = currentRole === 'admin' ? newRecordData.techId : currentRole;

    const newRecord: IncomeRecord = {
      ...newRecordData,
      techId: finalTechId,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    showToast(`บันทึกรายรับวันที่ ${newRecord.date} เรียบร้อยแล้ว (฿${newRecord.total.toLocaleString()})`);

    // Optional background sync to Google Sheets if configured
    if (
      settings.sheetConfig.spreadsheetId &&
      isGoogleSignedIn &&
      settings.sheetConfig.autoSync
    ) {
      try {
        const techName =
          finalTechId === 'tech1'
            ? settings.tech1Name || 'ช่างบอม (Barber)'
            : settings.tech2Name || 'ช่างต๋อง (Stylist)';
        const filtered = updatedRecords.filter((r) => r.techId === finalTechId);
        await syncRecordsToGoogleSheet(
          settings.sheetConfig.spreadsheetId,
          techName,
          techName,
          filtered
        );
      } catch (err) {
        console.warn('Auto sync skipped:', err);
      }
    }
  };

  // Update record with STRICT authorization
  const handleUpdateRecord = (id: string, updated: Partial<IncomeRecord>) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;

    // SECURITY ENFORCEMENT: Technician cannot modify other technician's record
    if (currentRole === 'tech1' && target.techId !== 'tech1') {
      showToast('คุณไม่มีสิทธิ์แก้ไขข้อมูลของช่างท่านอื่น', 'error');
      return;
    }
    if (currentRole === 'tech2' && target.techId !== 'tech2') {
      showToast('คุณไม่มีสิทธิ์แก้ไขข้อมูลของช่างท่านอื่น', 'error');
      return;
    }

    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated, updatedAt: new Date().toISOString() } : r))
    );
    showToast('อัปเดตข้อมูลเรียบร้อยแล้ว');
  };

  // Delete record with STRICT authorization
  const handleDeleteRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;

    // SECURITY ENFORCEMENT: Technician cannot delete other technician's record
    if (currentRole === 'tech1' && target.techId !== 'tech1') {
      showToast('คุณไม่มีสิทธิ์ลบข้อมูลของช่างท่านอื่น', 'error');
      return;
    }
    if (currentRole === 'tech2' && target.techId !== 'tech2') {
      showToast('คุณไม่มีสิทธิ์ลบข้อมูลของช่างท่านอื่น', 'error');
      return;
    }

    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('ลบรายการเรียบร้อยแล้ว', 'info');
  };

  // Export CSV for single technician
  const handleExportCSV = (techId: TechnicianId) => {
    if (currentRole === 'tech1' && techId !== 'tech1') return;
    if (currentRole === 'tech2' && techId !== 'tech2') return;

    const isTech1 = techId === 'tech1';
    const techName = isTech1 ? settings.tech1Name || 'ช่างบอม (Barber)' : settings.tech2Name || 'ช่างต๋อง (Stylist)';
    const targetRecords = records.filter((r) => r.techId === techId);
    exportToCSV(targetRecords, techName, `รายรับ_${techName}`);
    showToast(`ส่งออกไฟล์ CSV ของ ${techName} สำเร็จ`);
  };

  // Reset sample demo data (Admin only)
  const handleResetDemoData = () => {
    if (currentRole !== 'admin') {
      showToast('เฉพาะ Admin เท่านั้นที่สามารถรีเซ็ตข้อมูลได้', 'error');
      return;
    }
    localStorage.removeItem('tech_income_records_barber_v3');
    localStorage.removeItem('tech_income_records_barber_v2');
    localStorage.removeItem('tech_income_records_v1');
    const fresh = loadStoredRecords();
    setRecords(fresh);
    showToast('รีเซ็ตข้อมูลตัวอย่างร้านตัดผมเรียบร้อยแล้ว');
  };

  // Restore backup from JSON
  const handleRestoreData = (newRecords: IncomeRecord[], newSettings: AppSettings) => {
    setRecords(newRecords);
    setSettings(newSettings);
    saveStoredRecords(newRecords);
    saveStoredSettings(newSettings);
    showToast(`กู้คืนข้อมูลสำเร็จเรียบร้อย (${newRecords.length} รายการ)`);
  };

  // Clear all data to start fresh real usage
  const handleClearAllRecords = () => {
    setRecords([]);
    saveStoredRecords([]);
    showToast('ล้างข้อมูลเรียบร้อยแล้ว พร้อมเริ่มบันทึกใช้งานจริง', 'info');
  };

  // Toggle Dark Mode / Black Background
  const handleToggleDarkMode = () => {
    const nextMode = settings.appBgMode === 'dark' ? 'light' : 'dark';
    setSettings((prev) => ({
      ...prev,
      appBgMode: nextMode,
    }));
    showToast(
      nextMode === 'dark'
        ? 'เปลี่ยนเป็นโหมดพื้นหลังสีดำ (Jet Black) เรียบร้อย'
        : 'เปลี่ยนเป็นโหมดสว่าง (Light Mode) เรียบร้อย'
    );
  };

  const tech1Name = settings.tech1Name || 'ช่างบอม (Barber)';
  const tech2Name = settings.tech2Name || 'ช่างต๋อง (Stylist)';
  const isDarkMode = settings.appBgMode === 'dark';

  // If not authenticated, force the Login Screen!
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <LoginModal
          isOpen={true}
          settings={settings}
          currentRole={null}
          onLogin={handleLogin}
          onClose={undefined} // Not closable until authenticated!
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-[#09090b] text-stone-100' : 'bg-stone-100/90 text-stone-900'
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold ${
              toast.type === 'success'
                ? 'bg-stone-900 text-amber-300 border-amber-500/40'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-stone-950 text-stone-100 border-stone-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        settings={settings}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
        isSheetsConnected={isGoogleSignedIn && !!settings.sheetConfig.spreadsheetId}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Security Status Banner */}
      <div className="bg-stone-900 text-stone-300 border-b border-stone-800 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {currentRole === 'admin' ? (
                <strong className="text-amber-300 font-medium">
                  สิทธิ์ผู้ดูแลระบบ (Admin): เข้าถึงและจัดการข้อมูลช่างทุกคน, Dashboard, และตั้งค่าร้านได้
                </strong>
              ) : currentRole === 'tech1' ? (
                <strong className="text-amber-300 font-medium">
                  ล็อกสิทธิ์เฉพาะ: {tech1Name} — ดูและบันทึกแก้ไขได้เฉพาะของตนเอง ไม่สามารถดูหรือแก้ไขของช่างคนที่ 2 ได้
                </strong>
              ) : (
                <strong className="text-sky-300 font-medium">
                  ล็อกสิทธิ์เฉพาะ: {tech2Name} — ดูและบันทึกแก้ไขได้เฉพาะของตนเอง ไม่สามารถดูหรือแก้ไขของช่างคนที่ 1 ได้
                </strong>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <span>ต้องการสลับบทบาท?</span>
            <button
              onClick={handleLogout}
              className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
            >
              กดออกจากระบบเพื่อยืนยัน PIN ใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - STRICT PERMISSION RENDERING */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6">
        {/*
          DATA ISOLATION:
          - If user is Tech 1: ONLY pass tech1 records. Tech 2 records are completely filtered out!
          - If user is Tech 2: ONLY pass tech2 records. Tech 1 records are completely filtered out!
          - If user is Admin: can view active tab.
        */}
        {currentRole === 'tech1' && (
          <SpreadsheetView
            technicianId="tech1"
            technicianName={tech1Name}
            themeColor="#ea580c"
            records={records.filter((r) => r.techId === 'tech1')} // STRICT: Only tech1 records in memory
            userRole={currentRole}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            onExportCSV={() => handleExportCSV('tech1')}
            onOpenSyncModal={() => setIsSheetsModalOpen(true)}
            isSheetsConnected={isGoogleSignedIn && !!settings.sheetConfig.spreadsheetId}
            isDarkMode={isDarkMode}
          />
        )}

        {currentRole === 'tech2' && (
          <SpreadsheetView
            technicianId="tech2"
            technicianName={tech2Name}
            themeColor="#0284c7"
            records={records.filter((r) => r.techId === 'tech2')} // STRICT: Only tech2 records in memory
            userRole={currentRole}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            onExportCSV={() => handleExportCSV('tech2')}
            onOpenSyncModal={() => setIsSheetsModalOpen(true)}
            isSheetsConnected={isGoogleSignedIn && !!settings.sheetConfig.spreadsheetId}
            isDarkMode={isDarkMode}
          />
        )}

        {currentRole === 'admin' && (
          <>
            {activeTab === 'tech1' && (
              <SpreadsheetView
                technicianId="tech1"
                technicianName={tech1Name}
                themeColor="#ea580c"
                records={records.filter((r) => r.techId === 'tech1')}
                userRole={currentRole}
                onAddRecord={handleAddRecord}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
                onExportCSV={() => handleExportCSV('tech1')}
                onOpenSyncModal={() => setIsSheetsModalOpen(true)}
                isSheetsConnected={isGoogleSignedIn && !!settings.sheetConfig.spreadsheetId}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'tech2' && (
              <SpreadsheetView
                technicianId="tech2"
                technicianName={tech2Name}
                themeColor="#0284c7"
                records={records.filter((r) => r.techId === 'tech2')}
                userRole={currentRole}
                onAddRecord={handleAddRecord}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
                onExportCSV={() => handleExportCSV('tech2')}
                onOpenSyncModal={() => setIsSheetsModalOpen(true)}
                isSheetsConnected={isGoogleSignedIn && !!settings.sheetConfig.spreadsheetId}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardComparison
                records={records}
                settings={settings}
                onSelectTechnician={(id) => setActiveTab(id)}
                isDarkMode={isDarkMode}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Floating Quick Entry - STRICTLY locked to the technician */}
      {currentRole === 'tech1' && (
        <MobileQuickEntry
          technicianId="tech1"
          technicianName={tech1Name}
          onAddRecord={handleAddRecord}
        />
      )}
      {currentRole === 'tech2' && (
        <MobileQuickEntry
          technicianId="tech2"
          technicianName={tech2Name}
          onAddRecord={handleAddRecord}
        />
      )}
      {currentRole === 'admin' && activeTab !== 'dashboard' && (
        <MobileQuickEntry
          technicianId={activeTab}
          technicianName={activeTab === 'tech1' ? tech1Name : tech2Name}
          onAddRecord={handleAddRecord}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-10 py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">
              ระบบบันทึกรายรับร้านตัดผม (BARBER & SALON LEDGER)
            </span>
            <span>•</span>
            <span className="text-amber-800 font-medium">{tech1Name} & {tech2Name}</span>
          </div>
          <div className="flex items-center gap-3 text-stone-400">
            <span>ระบบแยกสิทธิ์ช่างอิสระ</span>
            <span>•</span>
            <span>แยก 2 ชีท Google Sheets อัตโนมัติ</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        settings={settings}
        currentRole={currentRole}
        onLogin={handleLogin}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {currentRole === 'admin' && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          settings={settings}
          records={records}
          onClose={() => setIsSettingsModalOpen(false)}
          onSaveSettings={(newSettings) => {
            setSettings(newSettings);
            showToast('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
          }}
          onRestoreData={handleRestoreData}
          onResetDemoData={handleResetDemoData}
          onClearAllRecords={handleClearAllRecords}
        />
      )}

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
        }}
        records={records}
        currentRole={currentRole}
        isGoogleSignedIn={isGoogleSignedIn}
        googleUserEmail={googleUserEmail}
        onGoogleSignInSuccess={(email) => {
          setIsGoogleSignedIn(true);
          setGoogleUserEmail(email);
          showToast(`เข้าสู่ระบบ Google (${email}) สำเร็จ`);
        }}
        onGoogleSignOutSuccess={() => {
          setIsGoogleSignedIn(false);
          setGoogleUserEmail(null);
          showToast('ออกจากระบบ Google แล้ว', 'info');
        }}
      />

      {currentRole === 'admin' && (
        <AppsScriptModal
          isOpen={isAppsScriptModalOpen}
          onClose={() => setIsAppsScriptModalOpen(false)}
          tech1Name={tech1Name}
          tech2Name={tech2Name}
        />
      )}
    </div>
  );
}
