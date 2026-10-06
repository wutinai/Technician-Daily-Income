import { IncomeRecord } from '../types';
import { getAccessToken } from './firebaseAuth';

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates a new Google Spreadsheet with two sheets for Tech1 and Tech2
 */
export async function createTechnicianSpreadsheet(
  title: string,
  tech1Name: string,
  tech2Name: string
): Promise<CreateSpreadsheetResult> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  const body = {
    properties: {
      title: title || 'ระบบบันทึกรายรับช่าง',
    },
    sheets: [
      {
        properties: {
          title: tech1Name || 'ช่างบอม',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
      {
        properties: {
          title: tech2Name || 'ช่างต๋อง',
          gridProperties: { rowCount: 100, columnCount: 10 },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`สร้าง Google Sheets ไม่สำเร็จ: ${errorText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: data.properties.title,
  };
}

/**
 * Ensures a sheet with sheetTitle exists in the spreadsheet
 */
export async function ensureSheetExists(
  spreadsheetId: string,
  sheetTitle: string
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  // 1. Get spreadsheet info
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    throw new Error('ไม่พบ Google Spreadsheet ตามรหัส ID ที่ระบุ');
  }

  const meta = await metaRes.json();
  const sheets: any[] = meta.sheets || [];
  const exists = sheets.some((s) => s.properties?.title === sheetTitle);

  if (!exists) {
    // Add new sheet
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                },
              },
            },
          ],
        }),
      }
    );
    if (!addRes.ok) {
      console.warn(`Could not add sheet ${sheetTitle}`);
    }
  }
}

/**
 * Synchronize technician records to the specific sheet tab
 */
export async function syncRecordsToGoogleSheet(
  spreadsheetId: string,
  sheetTitle: string,
  technicianName: string,
  records: IncomeRecord[]
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  // Ensure sheet tab exists
  await ensureSheetExists(spreadsheetId, sheetTitle);

  // Compute totals
  const totalCash = records.reduce((sum, r) => sum + (Number(r.cash) || 0), 0);
  const totalTransfer = records.reduce((sum, r) => sum + (Number(r.transfer) || 0), 0);
  const grandTotal = totalCash + totalTransfer;

  // Prepare table data matching the user's design & prompt specification:
  // Row 1: [Technician Name, "", "", "", "", ""]
  // Row 2: ["รวมทั้งหมด", "", totalCash, totalTransfer, grandTotal, ""]
  // Row 3: ["วันที่ (ค.ศ.)", "เวลา (ชั่วโมง:นาที:วินาที)", "เงินสด", "เงินโอน", "รวม", "หมายเหตุ / สรุปงานประจำวัน"]
  // Row 4+: Data rows
  const headerRows = [
    [technicianName, '', '', '', '', ''],
    ['ยอดรวมทั้งหมด', '', totalCash, totalTransfer, grandTotal, ''],
    ['วันที่ (ค.ศ.)', 'เวลา (ชั่วโมง:นาที:วินาที)', 'เงินสด', 'เงินโอน', 'รวม', 'หมายเหตุ / สรุปงานประจำวัน'],
  ];

  const sortedRecords = [...records].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const dataRows = sortedRecords.map((r) => [
    r.date,
    r.time || '00:00:00',
    Number(r.cash) || 0,
    Number(r.transfer) || 0,
    (Number(r.cash) || 0) + (Number(r.transfer) || 0),
    r.note || '',
  ]);

  const allValues = [...headerRows, ...dataRows];

  // Clear existing content in sheet to prevent leftover rows
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A1:Z500:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  // Write new values
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${sheetTitle}'!A1`,
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  if (!writeRes.ok) {
    const errorText = await writeRes.text();
    throw new Error(`บันทึกข้อมูลลง Google Sheets ไม่สำเร็จ: ${errorText}`);
  }
}

/**
 * Append a single row to Google Sheet
 */
export async function appendRecordToGoogleSheet(
  spreadsheetId: string,
  sheetTitle: string,
  record: IncomeRecord
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');

  await ensureSheetExists(spreadsheetId, sheetTitle);

  const row = [
    record.date,
    record.time || '00:00:00',
    Number(record.cash) || 0,
    Number(record.transfer) || 0,
    (Number(record.cash) || 0) + (Number(record.transfer) || 0),
    record.note || '',
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetTitle)}'!A:F:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ไม่สามารถเพิ่มข้อมูลลง Google Sheets: ${errorText}`);
  }
}
