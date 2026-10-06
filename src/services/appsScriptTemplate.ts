/**
 * Google Apps Script Templates (Code.gs & index.html)
 * สำหรับติดตั้งลงใน Google Sheets เพื่อเปิดใช้งาน Web Application เชื่อมต่อตรง 100%
 */

export function getGoogleAppsScriptCode(tech1Name = 'ช่างบอม (Barber)', tech2Name = 'ช่างต๋อง (Stylist)'): string {
  return `/**
 * ====================================================================
 * ระบบบันทึกรายรับร้านตัดผม (BARBER & SALON LEDGER)
 * ไฟล์: Code.gs
 * แยกเป็น 2 ชีทตามชื่อช่าง: "${tech1Name}" และ "${tech2Name}"
 * แบ่ง 2 หน้า: วันที่ 1-15 (สรุปงวด 15) และ วันที่ 16-31 (สรุปสิ้นเดือน)
 * ====================================================================
 */

var CONFIG = {
  TECH1_NAME: '${tech1Name}',
  TECH2_NAME: '${tech2Name}',
  ADMIN_PIN: '1234',
  TECH1_PIN: '1234',
  TECH2_PIN: '1234',
  SHOP_NAME: 'BARBER & SALON',
  SHOP_SUBTITLE: 'ระบบบัญชีรายรับช่างผมประจำร้าน • แยก 2 ชีทอัตโนมัติ'
};

/**
 * 1. ฟังก์ชันแสดงหน้าเว็บ Web Application (index.html)
 */
function doGet(e) {
  // หากเรียกผ่าน API parameter
  if (e && e.parameter && e.parameter.api) {
    return handleApiGet(e);
  }

  // แสดงผลหน้าเว็บ index.html
  var template = HtmlService.createTemplateFromFile('index');
  template.config = CONFIG;
  
  return template.evaluate()
    .setTitle(CONFIG.SHOP_NAME + ' - บันทึกรายรับช่างผม')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 2. ฟังก์ชันรับข้อมูลผ่าน HTTP POST (REST Webhook API)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var result = saveRecord(data);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 3. ฟังก์ชันดึงข้อมูลเริ่มต้นทั้งหมด (ส่งให้ index.html เมื่อเปิดเว็บ)
 */
function getInitialData(techName, month) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsSetup();
  
  var targetTech = techName || CONFIG.TECH1_NAME;
  var targetMonth = month || (new Date().getMonth() + 1).toString();
  
  var records = getTechnicianRecords(targetTech, targetMonth);
  
  return {
    config: CONFIG,
    tech1Name: CONFIG.TECH1_NAME,
    tech2Name: CONFIG.TECH2_NAME,
    currentTech: targetTech,
    month: targetMonth,
    records: records
  };
}

/**
 * 4. ฟังก์ชันบันทึกข้อมูลลงชีทของช่าง (เรียกจากหน้าเว็บ index.html)
 */
function saveRecord(item) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var techName = item.technicianName || CONFIG.TECH1_NAME;
  var sheet = ss.getSheetByName(techName);

  if (!sheet) {
    sheet = ss.insertSheet(techName);
    setupSheetLayout(sheet, techName);
  }

  var now = new Date();
  var dateStr = item.date || (now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear());
  var timeStr = item.time || Utilities.formatDate(now, 'Asia/Bangkok', 'HH:mm:ss');
  var cash = Number(item.cash) || 0;
  var transfer = Number(item.transfer) || 0;
  var total = cash + transfer;
  var note = item.note || '';

  // เพิ่มแถวข้อมูลใหม่ที่ด้านล่าง
  sheet.appendRow([dateStr, timeStr, cash, transfer, total, note]);
  var lastRow = sheet.getLastRow();
  
  // จัดรูปแบบตัวเลข เงินสด โอน รวม
  sheet.getRange(lastRow, 3, 1, 3).setNumberFormat('#,##0.00');
  sheet.getRange(lastRow, 1, 1, 2).setHorizontalAlignment('center');
  sheet.getRange(lastRow, 3, 1, 3).setHorizontalAlignment('right');

  return {
    success: true,
    techName: techName,
    row: lastRow,
    record: {
      date: dateStr,
      time: timeStr,
      cash: cash,
      transfer: transfer,
      total: total,
      note: note,
      rowIndex: lastRow
    }
  };
}

/**
 * 5. ฟังก์ชันดึงข้อมูลจากชีท
 */
function getTechnicianRecords(techName, monthFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(techName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 4) return [];

  var data = sheet.getRange(4, 1, lastRow - 3, 6).getValues();
  var records = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var rawDate = row[0];
    var dateStr = '';
    
    if (rawDate instanceof Date) {
      dateStr = rawDate.getDate() + '/' + (rawDate.getMonth() + 1) + '/' + rawDate.getFullYear();
    } else {
      dateStr = String(rawDate || '');
    }

    var timeStr = String(row[1] || '');
    if (row[1] instanceof Date) {
      timeStr = Utilities.formatDate(row[1], 'Asia/Bangkok', 'HH:mm:ss');
    }

    var cash = Number(row[2]) || 0;
    var transfer = Number(row[3]) || 0;
    var total = Number(row[4]) || (cash + transfer);
    var note = String(row[5] || '');

    // กรองเดือนถ้ามีระบุ
    if (monthFilter && monthFilter !== 'all') {
      var parts = dateStr.split('/');
      var rowMonth = parts.length > 1 ? parts[1] : '';
      if (rowMonth && rowMonth !== monthFilter) {
        continue;
      }
    }

    records.push({
      rowIndex: i + 4,
      date: dateStr,
      time: timeStr,
      cash: cash,
      transfer: transfer,
      total: total,
      note: note
    });
  }

  return records;
}

/**
 * 6. ฟังก์ชันลบรายการแถว
 */
function deleteRecordByRow(techName, rowIndex) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(techName);
  if (!sheet || rowIndex < 4) return false;
  sheet.deleteRow(rowIndex);
  return true;
}

/**
 * 7. ตรวจสอบและสร้างชีททั้ง 2 ช่างอัตโนมัติ
 */
function ensureSheetsSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var techNames = [CONFIG.TECH1_NAME, CONFIG.TECH2_NAME];
  
  for (var i = 0; i < techNames.length; i++) {
    var name = techNames[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      setupSheetLayout(sheet, name);
    }
  }
}

/**
 * 8. ออกแบบเลย์เอาต์ชีท (แบนเนอร์ส้ม + แถบสรุปยอดเขียว + ตาราง)
 */
function setupSheetLayout(sheet, techName) {
  sheet.clear();

  // แถวที่ 1: แบนเนอร์ชื่อช่าง สีส้มแบบรูปภาพ
  sheet.getRange('A1:F1').merge();
  var titleCell = sheet.getRange('A1');
  titleCell.setValue(techName);
  titleCell.setFontSize(20);
  titleCell.setFontWeight('bold');
  titleCell.setBackground('#ea580c');
  titleCell.setFontColor('#ffffff');
  titleCell.setHorizontalAlignment('left');

  // แถวที่ 2: แถบสรุปยอดรวมสุทธิ สีเขียวสด
  sheet.getRange('A2:B2').merge();
  sheet.getRange('A2').setValue('⭐ ยอดรวมสุทธิ');
  sheet.getRange('A2').setFontWeight('bold');
  sheet.getRange('A2').setHorizontalAlignment('center');

  sheet.getRange('C2').setFormula('=SUM(C4:C)');
  sheet.getRange('D2').setFormula('=SUM(D4:D)');
  sheet.getRange('E2').setFormula('=SUM(E4:E)');
  sheet.getRange('F2').setValue('สูตรคำนวณอัตโนมัติ');

  var sumRange = sheet.getRange('A2:F2');
  sumRange.setBackground('#22c55e');
  sumRange.setFontColor('#ffffff');
  sumRange.setFontWeight('bold');
  sheet.getRange('C2:E2').setNumberFormat('#,##0.00');

  // แถวที่ 3: หัวคอลัมน์มาตรฐาน
  var headers = [
    'วันที่ (ค.ศ.)',
    'เวลา (ชั่วโมง:นาที:วินาที)',
    'เงินสด',
    'โอน PromptPay',
    'รวม',
    'บริการตัดผม / หมายเหตุงาน'
  ];
  sheet.getRange('A3:F3').setValues([headers]);
  sheet.getRange('A3:F3').setFontWeight('bold');
  sheet.getRange('A3:F3').setBackground('#f3f4f6');
  sheet.getRange('A3:F3').setFontColor('#1f2937');
  sheet.getRange('A3:F3').setHorizontalAlignment('center');

  // ปรับความกว้างคอลัมน์ให้อ่านง่าย
  sheet.setColumnWidth(1, 130); // วันที่
  sheet.setColumnWidth(2, 110); // เวลา
  sheet.setColumnWidth(3, 130); // เงินสด
  sheet.setColumnWidth(4, 130); // โอน
  sheet.setColumnWidth(5, 140); // รวม
  sheet.setColumnWidth(6, 320); // หมายเหตุ
  
  sheet.setFrozenRows(3);
}

function handleApiGet(e) {
  var tech = e.parameter.tech || CONFIG.TECH1_NAME;
  var month = e.parameter.month || '';
  var records = getTechnicianRecords(tech, month);
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', tech: tech, records: records }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}

export function getAppsScriptIndexHtml(tech1Name = 'ช่างบอม (Barber)', tech2Name = 'ช่างต๋อง (Stylist)'): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ระบบบันทึกรายรับร้านตัดผม</title>
  <!-- Google Fonts: Prompt -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Prompt', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            barber: {
              gold: '#f59e0b',
              dark: '#1c1917',
              red: '#dc2626',
              blue: '#2563eb'
            }
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Prompt', sans-serif; -webkit-tap-highlight-color: transparent; }
    .barber-pole {
      background: repeating-linear-gradient(
        -45deg,
        #dc2626,
        #dc2626 12px,
        #ffffff 12px,
        #ffffff 24px,
        #2563eb 24px,
        #2563eb 36px,
        #ffffff 36px,
        #ffffff 48px
      );
      height: 4px;
    }
  </style>
</head>
<body class="bg-stone-100 text-stone-900 min-h-screen flex flex-col font-sans">

  <!-- Barber Pole Accent Strip -->
  <div class="barber-pole w-full"></div>

  <!-- App Header -->
  <header class="bg-stone-900 text-white shadow-md sticky top-0 z-30 border-b border-stone-800">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-bold shadow-md">
          ✂️
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-extrabold text-base md:text-lg tracking-tight text-stone-100">
              BARBER & SALON
            </h1>
            <span id="roleBadge" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
              กำลังโหลด...
            </span>
          </div>
          <p class="text-[11px] text-stone-400">ระบบบันทึกรายรับช่างผม • แยก 2 ชีท Google Sheets</p>
        </div>
      </div>

      <!-- User Role Info & Logout -->
      <div class="flex items-center gap-2">
        <div id="currentUserPill" class="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-stone-800 rounded-xl text-xs border border-stone-700">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span id="currentUserName" class="font-bold text-stone-200"></span>
        </div>
        <button onclick="handleLogout()" class="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition-colors cursor-pointer">
          ออกจากระบบ
        </button>
      </div>
    </div>

    <!-- Navigation Tabs (Only for Admin) -->
    <div id="adminNavTabs" class="hidden bg-stone-950 border-t border-stone-800 px-4 py-1.5">
      <div class="max-w-6xl mx-auto flex items-center gap-2">
        <span class="text-xs text-stone-400 font-bold mr-1">สลับช่าง:</span>
        <button id="tabTech1" onclick="switchTech('tech1')" class="px-3 py-1 rounded-xl text-xs font-bold bg-amber-600 text-white cursor-pointer shadow-xs">
          ${tech1Name}
        </button>
        <button id="tabTech2" onclick="switchTech('tech2')" class="px-3 py-1 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer">
          ${tech2Name}
        </button>
      </div>
    </div>
  </header>

  <!-- Login Modal Overlay (Mandatory on Start) -->
  <div id="loginModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
    <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
      <div class="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-6 text-white text-center border-b border-amber-500/30">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 mx-auto flex items-center justify-center text-2xl mb-2">
          💈
        </div>
        <h2 class="text-xl font-black text-stone-100">เข้าสู่ระบบบันทึกรายรับ</h2>
        <p class="text-amber-300/80 text-xs mt-1">เลือกระดับสิทธิ์และกรอกรหัส PIN (เริ่มต้น: 1234)</p>
      </div>

      <div class="p-6 space-y-4">
        <!-- Role selector buttons -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-stone-600 uppercase">เลือกผู้ใช้งาน:</label>
          <div class="space-y-2">
            <button type="button" onclick="selectLoginRole('admin')" id="roleBtnAdmin" class="w-full text-left p-3 rounded-2xl border border-amber-500 bg-amber-50 ring-2 ring-amber-500/30 flex items-center justify-between cursor-pointer">
              <div>
                <div class="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                  <span>🛡️ Admin (ผู้ดูแลระบบ)</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">สิทธิ์สูงสุด</span>
                </div>
                <p class="text-[11px] text-stone-500 mt-0.5">ดูข้อมูลและจัดการช่างทุกคน</p>
              </div>
              <span id="checkAdmin" class="text-amber-600 font-bold text-base">✓</span>
            </button>

            <button type="button" onclick="selectLoginRole('tech1')" id="roleBtnTech1" class="w-full text-left p-3 rounded-2xl border border-stone-200 hover:border-stone-300 flex items-center justify-between cursor-pointer">
              <div>
                <div class="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                  <span>✂️ ${tech1Name}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold">สิทธิ์เฉพาะตนเอง</span>
                </div>
                <p class="text-[11px] text-stone-500 mt-0.5">บันทึก/ดู ได้เฉพาะข้อมูลของตนเอง</p>
              </div>
              <span id="checkTech1" class="hidden text-amber-600 font-bold text-base">✓</span>
            </button>

            <button type="button" onclick="selectLoginRole('tech2')" id="roleBtnTech2" class="w-full text-left p-3 rounded-2xl border border-stone-200 hover:border-stone-300 flex items-center justify-between cursor-pointer">
              <div>
                <div class="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                  <span>✂️ ${tech2Name}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold">สิทธิ์เฉพาะตนเอง</span>
                </div>
                <p class="text-[11px] text-stone-500 mt-0.5">บันทึก/ดู ได้เฉพาะข้อมูลของตนเอง</p>
              </div>
              <span id="checkTech2" class="hidden text-amber-600 font-bold text-base">✓</span>
            </button>
          </div>
        </div>

        <!-- PIN Input -->
        <div class="space-y-1.5 pt-1">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-stone-700">รหัสผ่าน PIN 4 หลัก:</label>
            <button type="button" onclick="fillQuickPin('1234')" class="text-xs text-amber-700 hover:underline font-bold">คลิกกรอก 1234 ด่วน</button>
          </div>
          <input type="password" id="pinInput" maxlength="8" placeholder="••••" class="w-full text-center text-2xl font-mono tracking-[0.3em] font-black py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-stone-50">
          <div id="loginError" class="hidden text-xs text-rose-700 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200 text-center"></div>
        </div>

        <button type="button" onclick="handleLoginSubmit()" class="w-full py-3 bg-stone-900 hover:bg-black text-amber-300 font-bold text-sm rounded-xl shadow-md cursor-pointer border border-amber-500/30">
          เข้าสู่ระบบ
        </button>
      </div>
    </div>
  </div>

  <!-- Main Content Container -->
  <main class="max-w-6xl w-full mx-auto px-4 py-5 flex-1 space-y-4">
    
    <!-- Top Action Toolbar -->
    <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="text-xs font-bold text-stone-500 uppercase">เดือนที่แสดง:</div>
        <select id="monthSelect" onchange="changeMonth()" class="px-3 py-1.5 border border-stone-300 rounded-xl text-xs font-bold bg-stone-50 cursor-pointer">
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
        <button onclick="refreshData()" class="p-2 text-stone-500 hover:text-stone-800 bg-stone-100 rounded-xl cursor-pointer" title="รีเฟรชข้อมูลจากชีท">
          🔄
        </button>
      </div>

      <button onclick="openAddJobModal()" class="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all">
        <span>+ ลงงานตัดผมด่วน</span>
      </button>
    </div>

    <!-- 2-PAGE PERIOD SWITCHER (งวด 1-15 vs งวด 16-31) -->
    <div class="bg-white rounded-2xl p-2.5 border border-stone-300 shadow-xs flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <button id="btnPage1" onclick="switchPage('page1')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md ring-2 ring-amber-500/40 cursor-pointer flex items-center gap-1.5">
          <span>🔖 หน้าที่ 1 : วันที่ 1 - 15</span>
          <span class="text-[10px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded-full font-mono">สรุปวันที่ 15</span>
        </button>

        <button id="btnPage2" onclick="switchPage('page2')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer flex items-center gap-1.5">
          <span>🔖 หน้าที่ 2 : วันที่ 16 - 31</span>
          <span class="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-mono">สรุปสิ้นเดือน</span>
        </button>
      </div>

      <div id="pageNavHint" class="text-xs text-stone-500 font-medium"></div>
    </div>

    <!-- Main Spreadsheet Container -->
    <div class="bg-white rounded-2xl shadow-md border border-stone-300 overflow-hidden">
      <!-- Orange Banner Header with Technician Name -->
      <div id="bannerHeader" class="bg-gradient-to-r from-amber-700 to-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
            ✂️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span id="displayTechName" class="text-2xl font-black tracking-tight">${tech1Name}</span>
              <span id="displayPeriodTag" class="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-bold">
                หน้าที่ 1 (วันที่ 1 - 15)
              </span>
            </div>
            <p class="text-xs text-stone-300 mt-0.5">เชื่อมต่อ Google Sheets แยกชีทอัตโนมัติ</p>
          </div>
        </div>

        <div class="text-right">
          <div class="text-[11px] text-stone-300">จำนวนวันที่มีข้อมูล</div>
          <div id="recordCount" class="text-xl font-black text-amber-300 font-mono">0 วัน</div>
        </div>
      </div>

      <!-- Top Summary Row (Green Bar) -->
      <div class="bg-stone-900 text-white grid grid-cols-12 border-b-2 border-stone-800 text-xs font-bold">
        <div class="col-span-3 px-3 py-3 text-right text-amber-300 flex items-center justify-end font-extrabold border-r border-stone-800">
          <span id="summaryBarTitle">⭐ สรุปยอดงวดวันที่ 1 - 15:</span>
        </div>
        <div class="col-span-2 px-3 py-3 text-right bg-rose-950/80 text-rose-200 font-mono font-black text-sm border-r border-stone-800">
          <div class="text-[10px] text-rose-300 font-normal">เงินสด</div>
          <div id="sumBarCash">฿ 0</div>
        </div>
        <div class="col-span-2 px-3 py-3 text-right bg-emerald-950/80 text-emerald-200 font-mono font-black text-sm border-r border-stone-800">
          <div class="text-[10px] text-emerald-300 font-normal">โอน PromptPay</div>
          <div id="sumBarTransfer">฿ 0</div>
        </div>
        <div class="col-span-2 px-3 py-3 text-right bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 font-mono font-black text-base border-r border-stone-800">
          <div class="text-[10px] text-stone-900 font-bold uppercase">รวมสุทธิงวดนี้</div>
          <div id="sumBarTotal">฿ 0</div>
        </div>
        <div class="col-span-3 px-3 py-3 text-xs text-stone-400 flex items-center justify-between">
          <span id="periodBadgeDesc">คำนวณสดจาก Google Sheet</span>
        </div>
      </div>

      <!-- Table Column Headers -->
      <div class="grid grid-cols-12 bg-stone-100 border-b border-stone-300 text-xs font-bold text-stone-700 py-2">
        <div class="col-span-3 px-3 border-r border-stone-300">วันที่ & เวลา</div>
        <div class="col-span-2 px-3 text-right border-r border-stone-300 text-rose-800">เงินสด (บาท)</div>
        <div class="col-span-2 px-3 text-right border-r border-stone-300 text-emerald-800">โอน QR (บาท)</div>
        <div class="col-span-2 px-3 text-right border-r border-stone-300 text-amber-950">รวม (บาท)</div>
        <div class="col-span-3 px-3">บริการตัดผม / หมายเหตุ</div>
      </div>

      <!-- Table Data Rows -->
      <div id="tableRows" class="divide-y divide-stone-200 text-xs font-sans">
        <div class="p-8 text-center text-stone-500">
          <div class="animate-spin inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mb-2"></div>
          <div>กำลังโหลดข้อมูลจาก Google Sheets...</div>
        </div>
      </div>

      <!-- Bottom Summary Row for Period 1 (งวดวันที่ 15) -->
      <div id="bottomSummaryP1" class="grid grid-cols-12 bg-amber-50 border-t-2 border-amber-300 font-bold text-xs p-3">
        <div class="col-span-3 flex items-center gap-1.5 text-amber-950 font-extrabold">
          <span>⭐ สรุปยอดรวม ณ วันที่ 15 (งวด 1-15)</span>
        </div>
        <div id="p1BottomCash" class="col-span-2 text-right font-mono font-black text-rose-900">฿ 0</div>
        <div id="p1BottomTransfer" class="col-span-2 text-right font-mono font-black text-emerald-900">฿ 0</div>
        <div id="p1BottomTotal" class="col-span-2 text-right font-mono font-black text-base text-amber-950">฿ 0</div>
        <div class="col-span-3 text-right">
          <button onclick="switchPage('page2')" class="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold cursor-pointer">
            ไปงวด 16-31 ➔
          </button>
        </div>
      </div>

      <!-- Bottom Summary Row for Period 2 (สิ้นเดือน + รวมทั้งเดือน) -->
      <div id="bottomSummaryP2" class="hidden">
        <div class="grid grid-cols-12 bg-sky-50 border-t-2 border-sky-300 font-bold text-xs p-3">
          <div class="col-span-3 text-sky-950 font-extrabold">
            ⭐ สรุปยอดรวม ณ สิ้นเดือน (งวด 16-31)
          </div>
          <div id="p2BottomCash" class="col-span-2 text-right font-mono font-black text-rose-900">฿ 0</div>
          <div id="p2BottomTransfer" class="col-span-2 text-right font-mono font-black text-emerald-900">฿ 0</div>
          <div id="p2BottomTotal" class="col-span-2 text-right font-mono font-black text-base text-sky-950">฿ 0</div>
          <div class="col-span-3 text-right">
            <button onclick="switchPage('page1')" class="px-2.5 py-1 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-xs font-bold cursor-pointer">
              ⬅️ กลับงวด 1-15
            </button>
          </div>
        </div>

        <div class="grid grid-cols-12 bg-stone-900 text-amber-300 border-t-2 border-stone-950 font-bold text-xs p-3.5 shadow-inner">
          <div class="col-span-3 text-white font-black flex items-center gap-1">
            <span>🌟 สรุปยอดสุทธิทั้งเดือน (งวด 15 + สิ้นเดือน)</span>
          </div>
          <div id="monthBottomCash" class="col-span-2 text-right font-mono font-black text-rose-300">฿ 0</div>
          <div id="monthBottomTransfer" class="col-span-2 text-right font-mono font-black text-emerald-300">฿ 0</div>
          <div id="monthBottomTotal" class="col-span-2 text-right font-mono font-black text-base text-amber-300">฿ 0</div>
          <div class="col-span-3 text-right text-stone-400 text-[11px]">
            รวมตลอดทั้งเดือน
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Add Job Modal -->
  <div id="addModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
    <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
      <div class="bg-gradient-to-r from-stone-950 to-stone-900 p-5 text-white flex items-center justify-between border-b border-amber-500/30">
        <div>
          <h3 class="font-extrabold text-base">บันทึกงานตัดผม - <span id="addModalTechName"></span></h3>
          <p class="text-xs text-stone-300">ข้อมูลจะถูกเขียนลง Google Sheets อัตโนมัติ</p>
        </div>
        <button onclick="closeAddModal()" class="text-stone-400 hover:text-white p-1 text-xl font-bold cursor-pointer">✕</button>
      </div>

      <div class="p-5 space-y-4 text-xs">
        <!-- Service Quick Chips -->
        <div>
          <span class="font-bold text-stone-700 block mb-1.5">กดเลือกบริการด่วน (ราคาจะกรอกให้อัตโนมัติ):</span>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" onclick="quickService('ตัดผมวินเทจ Fade', 300)" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl font-medium cursor-pointer">
              ตัดผม Fade ฿300
            </button>
            <button type="button" onclick="quickService('ตัดผม + โกนหนวด กันขอบ', 350)" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl font-medium cursor-pointer">
              ตัด+โกนหนวด ฿350
            </button>
            <button type="button" onclick="quickService('สระไดร์ + เซ็ต Pomade', 200)" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl font-medium cursor-pointer">
              สระไดร์เซ็ต ฿200
            </button>
            <button type="button" onclick="quickService('ดัดวอลลุ่ม / Down Perm', 1500)" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl font-medium cursor-pointer">
              ดัดวอลลุ่ม ฿1,500
            </button>
            <button type="button" onclick="quickService('ทำสีแฟชั่น / ไฮไลท์', 1800)" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl font-medium cursor-pointer">
              ทำสีแฟชั่น ฿1,800
            </button>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-stone-700 mb-1">วันที่ (ว/ด/ป):</label>
            <input type="text" id="inputDate" class="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold">
            <div id="quickDateChips" class="flex gap-1.5 mt-1 text-[10px] text-stone-500"></div>
          </div>
          <div>
            <label class="block font-bold text-stone-700 mb-1">เวลา:</label>
            <input type="text" id="inputTime" class="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono text-stone-600">
          </div>
        </div>

        <!-- Cash & Transfer -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-rose-50 p-3 rounded-2xl border border-rose-200">
            <label class="block font-bold text-rose-900 mb-1">เงินสด (บาท):</label>
            <input type="number" id="inputCash" placeholder="0" class="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-xl font-mono font-bold text-right text-sm">
          </div>
          <div class="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
            <label class="block font-bold text-emerald-900 mb-1">โอน PromptPay (บาท):</label>
            <input type="number" id="inputTransfer" placeholder="0" class="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl font-mono font-bold text-right text-sm">
          </div>
        </div>

        <!-- Note -->
        <div>
          <label class="block font-bold text-stone-700 mb-1">บริการตัดผม / ทรงผม / หมายเหตุ:</label>
          <input type="text" id="inputNote" placeholder="เช่น ตัดผมวินเทจ Fade 3 ท่าน + โกนหนวด" class="w-full px-3 py-2 border border-stone-300 rounded-xl">
        </div>

        <div id="saveStatus" class="hidden p-2 text-center rounded-xl font-bold"></div>

        <div class="flex gap-2 pt-2">
          <button type="button" onclick="closeAddModal()" class="flex-1 py-2.5 border border-stone-300 rounded-xl font-bold text-stone-700 cursor-pointer">
            ยกเลิก
          </button>
          <button type="button" onclick="submitNewRecord()" id="btnSubmitJob" class="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-white rounded-xl font-bold shadow-md cursor-pointer">
            บันทึกลงชีท
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Client-Side State & Logic (Direct connection to Code.gs via google.script.run) -->
  <script>
    var state = {
      role: 'admin',
      tech1Name: '${tech1Name}',
      tech2Name: '${tech2Name}',
      currentTech: '${tech1Name}',
      activePage: 'page1', // 'page1' (1-15) or 'page2' (16-31)
      records: [],
      selectedMonth: '1'
    };

    // Initialize App
    window.addEventListener('load', function() {
      // Prompt Login
      openLoginModal();
    });

    function selectLoginRole(role) {
      state.role = role;
      document.getElementById('roleBtnAdmin').className = role === 'admin' ? 'w-full text-left p-3 rounded-2xl border border-amber-500 bg-amber-50 ring-2 ring-amber-500/30 flex items-center justify-between cursor-pointer' : 'w-full text-left p-3 rounded-2xl border border-stone-200 hover:border-stone-300 flex items-center justify-between cursor-pointer';
      document.getElementById('roleBtnTech1').className = role === 'tech1' ? 'w-full text-left p-3 rounded-2xl border border-amber-500 bg-amber-50 ring-2 ring-amber-500/30 flex items-center justify-between cursor-pointer' : 'w-full text-left p-3 rounded-2xl border border-stone-200 hover:border-stone-300 flex items-center justify-between cursor-pointer';
      document.getElementById('roleBtnTech2').className = role === 'tech2' ? 'w-full text-left p-3 rounded-2xl border border-amber-500 bg-amber-50 ring-2 ring-amber-500/30 flex items-center justify-between cursor-pointer' : 'w-full text-left p-3 rounded-2xl border border-stone-200 hover:border-stone-300 flex items-center justify-between cursor-pointer';
      
      document.getElementById('checkAdmin').classList.toggle('hidden', role !== 'admin');
      document.getElementById('checkTech1').classList.toggle('hidden', role !== 'tech1');
      document.getElementById('checkTech2').classList.toggle('hidden', role !== 'tech2');
      document.getElementById('pinInput').value = '';
      document.getElementById('loginError').classList.add('hidden');
    }

    function fillQuickPin(pin) {
      document.getElementById('pinInput').value = pin;
    }

    function handleLoginSubmit() {
      var pin = document.getElementById('pinInput').value.trim();
      var errorEl = document.getElementById('loginError');

      // Verify PIN (default 1234)
      if (pin !== '1234') {
        errorEl.textContent = 'รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นคือ 1234)';
        errorEl.classList.remove('hidden');
        return;
      }

      // Close login modal
      document.getElementById('loginModal').classList.add('hidden');

      // Set active technician strictly based on role
      if (state.role === 'tech1') {
        state.currentTech = state.tech1Name;
        document.getElementById('roleBadge').textContent = 'ช่าง 1 (สิทธิ์เฉพาะตนเอง)';
        document.getElementById('adminNavTabs').classList.add('hidden');
      } else if (state.role === 'tech2') {
        state.currentTech = state.tech2Name;
        document.getElementById('roleBadge').textContent = 'ช่าง 2 (สิทธิ์เฉพาะตนเอง)';
        document.getElementById('adminNavTabs').classList.add('hidden');
      } else {
        state.currentTech = state.tech1Name;
        document.getElementById('roleBadge').textContent = 'Admin Mode';
        document.getElementById('adminNavTabs').classList.remove('hidden');
      }

      document.getElementById('currentUserPill').classList.remove('hidden');
      document.getElementById('currentUserName').textContent = state.role === 'admin' ? 'Admin' : state.currentTech;
      document.getElementById('displayTechName').textContent = state.currentTech;

      // Load data from Google Apps Script Code.gs
      fetchServerData();
    }

    function handleLogout() {
      document.getElementById('loginModal').classList.remove('hidden');
      document.getElementById('pinInput').value = '';
      document.getElementById('loginError').classList.add('hidden');
    }

    function openLoginModal() {
      selectLoginRole('admin');
      document.getElementById('loginModal').classList.remove('hidden');
    }

    function switchTech(techKey) {
      if (state.role !== 'admin') return;
      state.currentTech = techKey === 'tech1' ? state.tech1Name : state.tech2Name;
      document.getElementById('tabTech1').className = techKey === 'tech1' ? 'px-3 py-1 rounded-xl text-xs font-bold bg-amber-600 text-white cursor-pointer shadow-xs' : 'px-3 py-1 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer';
      document.getElementById('tabTech2').className = techKey === 'tech2' ? 'px-3 py-1 rounded-xl text-xs font-bold bg-stone-700 text-white cursor-pointer shadow-xs' : 'px-3 py-1 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer';
      document.getElementById('displayTechName').textContent = state.currentTech;
      fetchServerData();
    }

    function switchPage(page) {
      state.activePage = page;
      var isP1 = page === 'page1';
      document.getElementById('btnPage1').className = isP1 ? 'px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md ring-2 ring-amber-500/40 cursor-pointer flex items-center gap-1.5' : 'px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer flex items-center gap-1.5';
      document.getElementById('btnPage2').className = !isP1 ? 'px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-stone-900 to-stone-950 text-amber-300 shadow-md ring-2 ring-stone-700 border border-amber-500/40 cursor-pointer flex items-center gap-1.5' : 'px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer flex items-center gap-1.5';
      document.getElementById('displayPeriodTag').textContent = isP1 ? 'หน้าที่ 1 (วันที่ 1 - 15)' : 'หน้าที่ 2 (วันที่ 16 - 31)';
      document.getElementById('summaryBarTitle').textContent = isP1 ? '⭐ สรุปยอดงวดวันที่ 1 - 15:' : '⭐ สรุปยอดงวดวันที่ 16 - สิ้นเดือน:';
      document.getElementById('bottomSummaryP1').classList.toggle('hidden', !isP1);
      document.getElementById('bottomSummaryP2').classList.toggle('hidden', isP1);
      renderTable();
    }

    function changeMonth() {
      state.selectedMonth = document.getElementById('monthSelect').value;
      fetchServerData();
    }

    function refreshData() {
      fetchServerData();
    }

    // Call Code.gs via google.script.run
    function fetchServerData() {
      var rowsEl = document.getElementById('tableRows');
      rowsEl.innerHTML = '<div class="p-8 text-center text-stone-500"><div class="animate-spin inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mb-2"></div><div>กำลังโหลดข้อมูลจาก Google Sheets...</div></div>';

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(data) {
            state.records = data.records || [];
            if (data.tech1Name) state.tech1Name = data.tech1Name;
            if (data.tech2Name) state.tech2Name = data.tech2Name;
            renderTable();
          })
          .withFailureHandler(function(err) {
            rowsEl.innerHTML = '<div class="p-8 text-center text-rose-600 font-bold">เกิดข้อผิดพลาดในการโหลด: ' + err + '</div>';
          })
          .getInitialData(state.currentTech, state.selectedMonth);
      } else {
        // Fallback demo mode if opened outside Google Apps Script container
        rowsEl.innerHTML = '<div class="p-6 text-center text-stone-500">กรุณาเปิดใช้งานภายใน Google Sheets (Extensions > Apps Script > Web App) เพื่อเชื่อมต่อฐานข้อมูลจริง</div>';
      }
    }

    function getDayNum(dStr) {
      if (!dStr) return 1;
      if (dStr.indexOf('/') !== -1) {
        return parseInt(dStr.split('/')[0], 10) || 1;
      }
      return 1;
    }

    function renderTable() {
      var rowsEl = document.getElementById('tableRows');
      var isP1 = state.activePage === 'page1';

      var p1List = [];
      var p2List = [];
      var p1Cash = 0, p1Transfer = 0;
      var p2Cash = 0, p2Transfer = 0;

      for (var i = 0; i < state.records.length; i++) {
        var r = state.records[i];
        var day = getDayNum(r.date);
        var cash = Number(r.cash) || 0;
        var transfer = Number(r.transfer) || 0;

        if (day >= 1 && day <= 15) {
          p1List.push(r);
          p1Cash += cash;
          p1Transfer += transfer;
        } else {
          p2List.push(r);
          p2Cash += cash;
          p2Transfer += transfer;
        }
      }

      var displayList = isP1 ? p1List : p2List;
      var activeCash = isP1 ? p1Cash : p2Cash;
      var activeTransfer = isP1 ? p1Transfer : p2Transfer;
      var activeTotal = activeCash + activeTransfer;

      document.getElementById('recordCount').textContent = displayList.length + ' วัน';
      document.getElementById('sumBarCash').textContent = '฿ ' + activeCash.toLocaleString();
      document.getElementById('sumBarTransfer').textContent = '฿ ' + activeTransfer.toLocaleString();
      document.getElementById('sumBarTotal').textContent = '฿ ' + activeTotal.toLocaleString();

      // Bottom summaries
      document.getElementById('p1BottomCash').textContent = '฿ ' + p1Cash.toLocaleString();
      document.getElementById('p1BottomTransfer').textContent = '฿ ' + p1Transfer.toLocaleString();
      document.getElementById('p1BottomTotal').textContent = '฿ ' + (p1Cash + p1Transfer).toLocaleString();

      document.getElementById('p2BottomCash').textContent = '฿ ' + p2Cash.toLocaleString();
      document.getElementById('p2BottomTransfer').textContent = '฿ ' + p2Transfer.toLocaleString();
      document.getElementById('p2BottomTotal').textContent = '฿ ' + (p2Cash + p2Transfer).toLocaleString();

      var monthCash = p1Cash + p2Cash;
      var monthTransfer = p1Transfer + p2Transfer;
      var monthTotal = monthCash + monthTransfer;
      document.getElementById('monthBottomCash').textContent = '฿ ' + monthCash.toLocaleString();
      document.getElementById('monthBottomTransfer').textContent = '฿ ' + monthTransfer.toLocaleString();
      document.getElementById('monthBottomTotal').textContent = '฿ ' + monthTotal.toLocaleString();

      if (displayList.length === 0) {
        rowsEl.innerHTML = '<div class="p-10 text-center text-stone-500 font-bold">ยังไม่มีข้อมูลบันทึกในงวดนี้ (' + (isP1 ? 'วันที่ 1 - 15' : 'วันที่ 16 - 31') + ')<br><span class="text-xs font-normal">กดปุ่ม "+ ลงงานตัดผมด่วน" ด้านบนเพื่อบันทึกรายการ</span></div>';
        return;
      }

      var html = '';
      for (var j = 0; j < displayList.length; j++) {
        var rec = displayList[j];
        var rowTotal = (Number(rec.cash) || 0) + (Number(rec.transfer) || 0);
        var bgClass = j % 2 === 0 ? 'bg-white' : 'bg-stone-50/60';

        html += '<div class="grid grid-cols-12 py-2.5 px-1 ' + bgClass + ' hover:bg-amber-50/40 items-center">';
        html += '<div class="col-span-3 px-3 font-mono font-bold text-stone-900">' + rec.date + (rec.time ? ' <span class="text-stone-400 text-[10px]">' + rec.time + '</span>' : '') + '</div>';
        html += '<div class="col-span-2 px-3 text-right font-mono font-bold text-rose-900 bg-rose-50/40 py-1 rounded">' + Number(rec.cash || 0).toLocaleString() + '</div>';
        html += '<div class="col-span-2 px-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/40 py-1 rounded">' + Number(rec.transfer || 0).toLocaleString() + '</div>';
        html += '<div class="col-span-2 px-3 text-right font-mono font-black text-amber-950 bg-amber-50/60 py-1 rounded">฿ ' + rowTotal.toLocaleString() + '</div>';
        html += '<div class="col-span-3 px-3 text-stone-700 truncate" title="' + (rec.note || '') + '">' + (rec.note || '<span class="text-stone-300">- ว่าง -</span>') + '</div>';
        html += '</div>';
      }
      rowsEl.innerHTML = html;
    }

    function openAddJobModal() {
      document.getElementById('addModal').classList.remove('hidden');
      document.getElementById('addModalTechName').textContent = state.currentTech;
      var now = new Date();
      var isP2 = state.activePage === 'page2';
      var d = isP2 ? 16 : 1;
      document.getElementById('inputDate').value = d + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
      document.getElementById('inputTime').value = now.toTimeString().slice(0, 8);
      document.getElementById('inputCash').value = '';
      document.getElementById('inputTransfer').value = '';
      document.getElementById('inputNote').value = '';
      document.getElementById('saveStatus').className = 'hidden';

      // Render quick date chips
      var m = now.getMonth() + 1;
      var y = now.getFullYear();
      var chipsEl = document.getElementById('quickDateChips');
      if (isP2) {
        chipsEl.innerHTML = '<span class="text-stone-400">เลือกด่วน:</span>' +
          '<button type="button" onclick="document.getElementById(\\'inputDate\\').value=\\'16/' + m + '/' + y + '\\'" class="hover:underline font-bold text-amber-800">16</button> • ' +
          '<button type="button" onclick="document.getElementById(\\'inputDate\\').value=\\'20/' + m + '/' + y + '\\'" class="hover:underline">20</button> • ' +
          '<button type="button" onclick="document.getElementById(\\'inputDate\\').value=\\'25/' + m + '/' + y + '\\'" class="hover:underline">25</button> • ' +
          '<button type="button" onclick="document.getElementById(\\'inputDate\\').value=\\'31/' + m + '/' + y + '\\'" class="hover:underline font-bold text-amber-900">31 (สิ้นเดือน)</button>';
      } else {
        chipsEl.innerHTML = '<span class="text-stone-400">เลือกด่วน:</span>' +
          '<button type="button" onclick="document.getElementById(\\'inputDate\\').value=\\'1/' + m + '/' + y + '\\'" class="hover:underline font-bold text-amber-800">1</button> • ' +
          '<button type="button" onclick="document.getElementById(\\'inputDate\\').value=\\'5/' + m + '/' + y + '\\'" class="hover:underline">5</button> • ' +
          '<button type="button" onclick="document.getElementById(\\'inputDate\\').value=\\'10/' + m + '/' + y + '\\'" class="hover:underline">10</button> • ' +
          '<button type="button" onclick="document.getElementById(\\'inputDate\\').value=\\'15/' + m + '/' + y + '\\'" class="hover:underline font-bold text-amber-900">15 (สรุปงวด 1)</button>';
      }
    }

    function closeAddModal() {
      document.getElementById('addModal').classList.add('hidden');
    }

    function quickService(name, price) {
      document.getElementById('inputTransfer').value = price;
      document.getElementById('inputCash').value = '0';
      var noteEl = document.getElementById('inputNote');
      noteEl.value = noteEl.value ? noteEl.value + ' + ' + name : name;
    }

    function submitNewRecord() {
      var date = document.getElementById('inputDate').value.trim();
      var time = document.getElementById('inputTime').value.trim();
      var cash = parseFloat(document.getElementById('inputCash').value) || 0;
      var transfer = parseFloat(document.getElementById('inputTransfer').value) || 0;
      var note = document.getElementById('inputNote').value.trim();
      var btn = document.getElementById('btnSubmitJob');
      var statusEl = document.getElementById('saveStatus');

      btn.disabled = true;
      btn.textContent = 'กำลังบันทึกลง Google Sheet...';
      statusEl.className = 'p-2 text-center rounded-xl font-bold bg-amber-100 text-amber-900 block';
      statusEl.textContent = 'กำลังส่งข้อมูลไปยังชีท "' + state.currentTech + '"...';

      var recordData = {
        technicianName: state.currentTech,
        date: date,
        time: time,
        cash: cash,
        transfer: transfer,
        note: note
      };

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.textContent = 'บันทึกลงชีท';
            statusEl.className = 'p-2 text-center rounded-xl font-bold bg-emerald-100 text-emerald-900 block';
            statusEl.textContent = 'บันทึกสำเร็จเรียบร้อย!';
            setTimeout(function() {
              closeAddModal();
              fetchServerData();
            }, 800);
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.textContent = 'บันทึกลงชีท';
            statusEl.className = 'p-2 text-center rounded-xl font-bold bg-rose-100 text-rose-900 block';
            statusEl.textContent = 'เกิดข้อผิดพลาด: ' + err;
          })
          .saveRecord(recordData);
      } else {
        alert('กรุณารันใน Google Apps Script Web App เพื่อบันทึกลง Google Sheet จริง');
        btn.disabled = false;
        btn.textContent = 'บันทึกลงชีท';
      }
    }
  </script>
</body>
</html>
`;
}
