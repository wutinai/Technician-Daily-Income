import React, { useState } from 'react';
import { AppSettings, IncomeRecord, UserRole } from '../types';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  X,
  Plus,
  Link,
  ShieldCheck,
  LogOut,
  Lock,
} from 'lucide-react';
import { googleSignIn, googleSignOut } from '../services/firebaseAuth';
import {
  createTechnicianSpreadsheet,
  syncRecordsToGoogleSheet,
} from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  records: IncomeRecord[];
  currentRole: UserRole;
  isGoogleSignedIn: boolean;
  googleUserEmail: string | null;
  onGoogleSignInSuccess: (email: string) => void;
  onGoogleSignOutSuccess: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  records,
  currentRole,
  isGoogleSignedIn,
  googleUserEmail,
  onGoogleSignInSuccess,
  onGoogleSignOutSuccess,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [customSheetId, setCustomSheetId] = useState(
    settings.sheetConfig.spreadsheetId || ''
  );
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Confirmation dialog state for mutating Google Sheets data (mandatory per Workspace skill)
  const [showConfirmSync, setShowConfirmSync] = useState(false);

  if (!isOpen) return null;

  const isAdmin = currentRole === 'admin';
  const tech1Name = settings.tech1Name || 'ช่างบอม (Barber)';
  const tech2Name = settings.tech2Name || 'ช่างต๋อง (Stylist)';
  const spreadsheetId = settings.sheetConfig.spreadsheetId;
  const spreadsheetUrl =
    settings.sheetConfig.spreadsheetUrl ||
    (spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onGoogleSignInSuccess(result.user.email || 'ผู้ใช้งาน Google');
        setStatusMessage({
          type: 'success',
          text: `เชื่อมต่อบัญชี Google (${result.user.email}) สำเร็จ!`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `เชื่อมต่อไม่สำเร็จ: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      onGoogleSignOutSuccess();
      setStatusMessage({
        type: 'info',
        text: 'ออกจากระบบ Google สำเร็จ',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!isAdmin) {
      setStatusMessage({ type: 'error', text: 'เฉพาะ Admin เท่านั้นที่สามารถสร้าง Google Sheet ใหม่ได้' });
      return;
    }

    if (!isGoogleSignedIn) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาเชื่อมต่อบัญชี Google ก่อนสร้างไฟล์ Spreadsheet',
      });
      return;
    }

    setIsCreatingSheet(true);
    setStatusMessage(null);
    try {
      const title = `บัญชีรายรับร้านตัดผม - ${tech1Name} & ${tech2Name}`;
      const res = await createTechnicianSpreadsheet(title, tech1Name, tech2Name);

      const updated = {
        ...settings,
        sheetConfig: {
          ...settings.sheetConfig,
          spreadsheetId: res.spreadsheetId,
          spreadsheetName: res.title,
          spreadsheetUrl: res.spreadsheetUrl,
          tech1SheetName: tech1Name,
          tech2SheetName: tech2Name,
        },
      };

      onUpdateSettings(updated);
      setCustomSheetId(res.spreadsheetId);

      setStatusMessage({
        type: 'success',
        text: `สร้าง Google Spreadsheet เรียบร้อยแล้ว พร้อม 2 ชีท: "${tech1Name}" และ "${tech2Name}"`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `สร้างไฟล์ไม่สำเร็จ: ${err.message}`,
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSaveCustomId = () => {
    if (!isAdmin) return;
    let cleanedId = customSheetId.trim();
    const urlMatch = cleanedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanedId = urlMatch[1];
    }

    if (!cleanedId) {
      setStatusMessage({ type: 'error', text: 'กรุณาระบุ Spreadsheet ID หรือ URL' });
      return;
    }

    const updated = {
      ...settings,
      sheetConfig: {
        ...settings.sheetConfig,
        spreadsheetId: cleanedId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanedId}/edit`,
      },
    };
    onUpdateSettings(updated);
    setStatusMessage({
      type: 'success',
      text: 'บันทึก Google Spreadsheet ID เรียบร้อยแล้ว',
    });
  };

  // Trigger confirmation dialog for sync
  const handleRequestSync = () => {
    if (!isGoogleSignedIn) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาเชื่อมต่อบัญชี Google ก่อนเริ่มซิงค์ข้อมูล',
      });
      return;
    }

    if (!spreadsheetId) {
      setStatusMessage({
        type: 'error',
        text: 'ยังไม่มีไฟล์ Google Spreadsheet ที่เชื่อมต่ออยู่ กรุณาติดต่อ Admin เพื่อตั้งค่า',
      });
      return;
    }

    setShowConfirmSync(true);
  };

  // Perform actual sync with STRICT technician isolation
  const handleExecuteSync = async () => {
    setShowConfirmSync(false);
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      if (currentRole === 'tech1') {
        // STRICT: Only sync Tech 1's sheet
        const tech1Records = records.filter((r) => r.techId === 'tech1');
        await syncRecordsToGoogleSheet(
          spreadsheetId!,
          tech1Name,
          tech1Name,
          tech1Records
        );
        setStatusMessage({
          type: 'success',
          text: `ซิงค์ข้อมูลชีท "${tech1Name}" ไปยัง Google Sheets สำเร็จแล้ว (${tech1Records.length} รายการ)`,
        });
      } else if (currentRole === 'tech2') {
        // STRICT: Only sync Tech 2's sheet
        const tech2Records = records.filter((r) => r.techId === 'tech2');
        await syncRecordsToGoogleSheet(
          spreadsheetId!,
          tech2Name,
          tech2Name,
          tech2Records
        );
        setStatusMessage({
          type: 'success',
          text: `ซิงค์ข้อมูลชีท "${tech2Name}" ไปยัง Google Sheets สำเร็จแล้ว (${tech2Records.length} รายการ)`,
        });
      } else {
        // Admin syncs both
        const tech1Records = records.filter((r) => r.techId === 'tech1');
        const tech2Records = records.filter((r) => r.techId === 'tech2');

        await syncRecordsToGoogleSheet(
          spreadsheetId!,
          tech1Name,
          tech1Name,
          tech1Records
        );
        await syncRecordsToGoogleSheet(
          spreadsheetId!,
          tech2Name,
          tech2Name,
          tech2Records
        );
        setStatusMessage({
          type: 'success',
          text: `ซิงค์ข้อมูลทั้ง 2 ชีท ("${tech1Name}" และ "${tech2Name}") ไปยัง Google Sheets สำเร็จแล้ว`,
        });
      }

      const nowTime = new Date().toLocaleTimeString('th-TH');
      onUpdateSettings({
        ...settings,
        sheetConfig: {
          ...settings.sheetConfig,
          lastSyncTime: nowTime,
        },
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `ซิงค์ไม่สำเร็จ: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-stone-200 animate-in fade-in duration-200 font-sans">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-5 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                {isAdmin ? 'จัดการเชื่อมต่อ Google Sheets' : `ซิงค์ Google Sheets (${currentRole === 'tech1' ? tech1Name : tech2Name})`}
              </h2>
              <p className="text-amber-300/80 text-xs">
                {isAdmin ? 'แยกบันทึก 2 ชีท: ' + tech1Name + ' & ' + tech2Name : 'บันทึกลงชีทเฉพาะของท่านเท่านั้น'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs md:text-sm flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-300'
                  : 'bg-stone-100 text-stone-800 border border-stone-300'
              }`}
            >
              {statusMessage.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {statusMessage.type === 'error' && (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* Section 1: Google Account Connection */}
          <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                สถานะบัญชี Google:
              </span>
              {isGoogleSignedIn ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  เชื่อมต่อแล้ว
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                  ยังไม่ได้เชื่อมต่อ
                </span>
              )}
            </div>

            {isGoogleSignedIn ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200">
                <div className="text-xs">
                  <div className="font-bold text-stone-900">{googleUserEmail}</div>
                  <div className="text-stone-500 text-[11px]">พร้อมสิทธิ์เข้าถึง Google Sheets</div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-stone-600 mb-3">
                  เข้าสู่ระบบด้วยบัญชี Google เพื่อให้ระบบสามารถบันทึกข้อมูลรายรับลง Google Spreadsheet ได้
                </p>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isSigningIn ? 'กำลังเชื่อมต่อ...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Connected Spreadsheet & Sync */}
          <div className="space-y-3">
            {spreadsheetId ? (
              <div className="bg-stone-50 border border-stone-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Google Spreadsheet:
                    </span>
                    <div className="font-extrabold text-stone-900 text-sm mt-0.5">
                      {settings.sheetConfig.spreadsheetName || 'บัญชีรายรับร้านตัดผม'}
                    </div>
                    <div className="text-[11px] font-mono text-stone-400 mt-0.5 truncate max-w-xs">
                      ID: {spreadsheetId}
                    </div>
                  </div>
                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-black text-amber-300 rounded-xl text-xs font-bold shadow-xs cursor-pointer border border-amber-500/30"
                    >
                      <span>เปิดใน Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-700">
                  <span>
                    {isAdmin ? (
                      <>ชีทที่จะซิงค์: <strong>"{tech1Name}"</strong> และ <strong>"{tech2Name}"</strong></>
                    ) : (
                      <>ชีทเฉพาะของท่าน: <strong>"{currentRole === 'tech1' ? tech1Name : tech2Name}"</strong></>
                    )}
                  </span>
                  {settings.sheetConfig.lastSyncTime && (
                    <span className="text-[11px] text-stone-400">
                      ซิงค์ล่าสุด: {settings.sheetConfig.lastSyncTime}
                    </span>
                  )}
                </div>

                {/* Big Sync Button */}
                <button
                  type="button"
                  onClick={handleRequestSync}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-bold rounded-2xl shadow-md text-xs md:text-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncing
                      ? 'กำลังบันทึกลง Google Sheets...'
                      : isAdmin
                      ? 'ซิงค์ข้อมูลทั้ง 2 ช่างไปยัง Google Sheets'
                      : `ซิงค์ข้อมูลของ ${currentRole === 'tech1' ? tech1Name : tech2Name} ไปยัง Google Sheet`}
                  </span>
                </button>
              </div>
            ) : (
              /* If Admin: can create or link */
              isAdmin ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCreateNewSpreadsheet}
                    disabled={isCreatingSheet || !isGoogleSignedIn}
                    className="p-4 rounded-2xl border-2 border-dashed border-amber-400 hover:border-amber-600 bg-amber-50/50 hover:bg-amber-50 text-left transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-xs text-amber-950">สร้าง Google Sheet ร้านใหม่</div>
                    <p className="text-[11px] text-amber-800 mt-1">
                      สร้างไฟล์อัตโนมัติ 2 ชีท: "{tech1Name}" และ "{tech2Name}"
                    </p>
                  </button>

                  <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <Link className="w-4 h-4 text-stone-500" />
                      <span>ระบุ Google Sheet ID เดิม</span>
                    </div>
                    <input
                      type="text"
                      value={customSheetId}
                      onChange={(e) => setCustomSheetId(e.target.value)}
                      placeholder="วาง Spreadsheet ID หรือ URL"
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-xl text-xs font-mono focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomId}
                      className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      เชื่อมต่อ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>ยังไม่มีการเชื่อมต่อ Google Spreadsheet กรุณาให้ผู้ดูแลระบบ (Admin) ดำเนินการสร้างหรือเชื่อมต่อไฟล์ Sheet ให้</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive / Mutating Operation (Workspace Skill Requirement) */}
      {showConfirmSync && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-stone-900">
                ยืนยันการบันทึกข้อมูลลง Google Sheets หรือไม่?
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {isAdmin ? (
                  <>ระบบจะบันทึกอัปเดตข้อมูลทั้งชีท <strong>"{tech1Name}"</strong> และ <strong>"{tech2Name}"</strong> ใน Google Sheets ของคุณ</>
                ) : (
                  <>ระบบจะบันทึกอัปเดตข้อมูลเฉพาะในชีท <strong>"{currentRole === 'tech1' ? tech1Name : tech2Name}"</strong> เท่านั้น</>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                ยืนยันการบันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
