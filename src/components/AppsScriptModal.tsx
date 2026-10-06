import React, { useState } from 'react';
import { Terminal, Copy, Check, X, FileCode, Layers, ExternalLink, HelpCircle, CheckCircle2 } from 'lucide-react';
import { getGoogleAppsScriptCode, getAppsScriptIndexHtml } from '../services/appsScriptTemplate';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tech1Name: string;
  tech2Name: string;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  tech1Name,
  tech2Name,
}) => {
  const [activeFile, setActiveFile] = useState<'codegs' | 'indexhtml'>('codegs');
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  if (!isOpen) return null;

  const codeGs = getGoogleAppsScriptCode(tech1Name, tech2Name);
  const indexHtml = getAppsScriptIndexHtml(tech1Name, tech2Name);

  const handleCopyGs = () => {
    navigator.clipboard.writeText(codeGs);
    setCopiedGs(true);
    setTimeout(() => setCopiedGs(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(indexHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-stone-200 animate-in fade-in duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-5 text-white flex items-center justify-between border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-md">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>Google Apps Script (Code.gs & index.html)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold">
                  เชื่อมต่อตรง 100%
                </span>
              </h2>
              <p className="text-amber-300/80 text-xs">
                แยก 2 ชีทอัตโนมัติ: "{tech1Name}" และ "{tech2Name}" • พร้อมหน้าเว็บ Web App ใช้งานได้ทันที
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

        {/* Step-by-Step Instructions Banner */}
        <div className="bg-stone-50 border-b border-stone-200 p-4 text-xs text-stone-700 shrink-0">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-stone-900">ขั้นตอนนำไปใส่ใน Google Sheets (ใช้เวลาไม่ถึง 2 นาที):</span>
              <ol className="list-decimal list-inside space-y-0.5 text-stone-600 pl-1">
                <li>เปิด Google Spreadsheet ของท่าน แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong></li>
                <li>ที่ไฟล์ <code>Code.gs</code>: ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดจากแท็บ <strong>Code.gs</strong></li>
                <li>กดปุ่ม <strong>+ (เพิ่มไฟล์)</strong> &gt; เลือก <strong>HTML</strong> &gt; ตั้งชื่อว่า <code>index</code> แล้ววางโค้ดจากแท็บ <strong>index.html</strong></li>
                <li>กด <strong>ทำให้ใช้งานได้ (Deploy)</strong> ด้านบนขวา &gt; <strong>การทำให้ใช้งานได้รายการใหม่ (New deployment)</strong> &gt; เลือกประเภท <strong>Web app</strong></li>
                <li>ตั้งค่า <em>ผู้มีสิทธิ์เข้าถึง (Who has access)</em> เป็น <strong>ทุกคน (Anyone)</strong> แล้วกด <strong>ทำให้ใช้งานได้ (Deploy)</strong></li>
              </ol>
            </div>
          </div>
        </div>

        {/* File Tabs: Code.gs vs index.html */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFile('codegs')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFile === 'codegs'
                  ? 'bg-stone-900 text-amber-300 shadow-sm border border-amber-500/40'
                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>1. Code.gs (สคริปต์จัดการชีท & API)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFile('indexhtml')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFile === 'indexhtml'
                  ? 'bg-stone-900 text-amber-300 shadow-sm border border-amber-500/40'
                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>2. index.html (หน้าเว็บร้านตัดผม 2 หน้า)</span>
            </button>
          </div>

          <div>
            {activeFile === 'codegs' ? (
              <button
                type="button"
                onClick={handleCopyGs}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                {copiedGs ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedGs ? 'คัดลอก Code.gs แล้ว!' : 'คัดลอก Code.gs ทั้งหมด'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                {copiedHtml ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedHtml ? 'คัดลอก index.html แล้ว!' : 'คัดลอก index.html ทั้งหมด'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Editor Preview Area */}
        <div className="flex-1 overflow-hidden p-4 bg-stone-950 font-mono text-xs flex flex-col">
          <div className="flex items-center justify-between text-stone-400 text-[11px] pb-2 border-b border-stone-800">
            <span>{activeFile === 'codegs' ? 'ไฟล์: Code.gs (JavaScript / Google Apps Script)' : 'ไฟล์: index.html (HTML + Tailwind CSS + JS)'}</span>
            <span className="text-stone-500">กดปุ่มคัดลอกด้านบน แล้วนำไปวางใน Google Apps Script</span>
          </div>
          <pre className="flex-1 overflow-auto text-stone-200 pt-3 leading-relaxed select-all scrollbar-thin">
            {activeFile === 'codegs' ? codeGs : indexHtml}
          </pre>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-6 py-3 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>เชื่อมต่อกับ Google Spreadsheet ของคุณโดยตรง ข้อมูลไม่มีวันสูญหาย</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
