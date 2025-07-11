import * as XLSX from "xlsx";

/**
 * Universal Excel Exporter
 * - รองรับ export ข้อมูลจาก JSON (array of object), array of array (header หลายแถว), หรือ Table DOM (ref/node)
 * - รองรับ Title, วันที่ export, ชื่อคอลัมน์ และ merges (merge cell)
 * - ความกว้างคอลัมน์ dynamic ตามความยาวข้อความ
 * @param {Array<Array<string>>|Object[]|HTMLElement|React.Ref} source
 * @param {Object} options
 *   - filename: string
 *   - sheetName: string
 *   - title: string (optional)
 *   - exportDate: string (optional)
 *   - merges: array (optional) [{s: {r,c}, e: {r,c}}]
 */
export function exportExcel(
  source,
  {
    filename = "export.xlsx",
    sheetName = "Sheet1",
    title = "",
    exportDate = "",
    merges = [],
  } = {}
) {
  let exportData;

  // 1. ถ้า source เป็น array of array (header หลายแถว)
  if (Array.isArray(source) && Array.isArray(source[0])) {
    exportData = source;
  }
  // 2. ถ้าเป็น array of object (แบบเก่า)
  else if (
    Array.isArray(source) &&
    source.length > 0 &&
    typeof source[0] === "object"
  ) {
    const colHeaders = Object.keys(source[0]);
    const rows = source.map((row) =>
      colHeaders.map((key) => (row[key] != null ? row[key].toString() : ""))
    );
    exportData = [];
    if (title) exportData.push([title]);
    if (exportDate) exportData.push([exportDate]);
    exportData.push(colHeaders);
    exportData.push(...rows);
  }
  // 3. ถ้าเป็น table DOM หรือ ref
  else {
    const table = source?.current || source;
    if (
      !table ||
      !table.rows ||
      !table.tagName ||
      table.tagName.toLowerCase() !== "table"
    ) {
      console.error(
        "exportExcel: ไม่พบ table <table> หรือข้อมูล JSON ที่ต้องการ export"
      );
      return;
    }
    // Get header rows ทั้งหมด (รองรับหลายแถว)
    const thead = table.querySelector("thead");
    const headerRows = [];
    if (thead && thead.rows.length > 0) {
      for (let i = 0; i < thead.rows.length; i++) {
        headerRows.push(Array.from(thead.rows[i].cells).map((cell) => cell.innerText.trim()));
      }
    } else if (table.rows[0]) {
      headerRows.push(Array.from(table.rows[0].cells).map((cell) => cell.innerText.trim()));
    }
    // Data rows
    const allRows = Array.from(table.rows);
    let dataRows = [];
    if (thead && thead.rows.length > 0) {
      dataRows = allRows
        .slice(thead.rows.length)
        .map((row) => Array.from(row.cells).map((cell) => cell.innerText));
    } else {
      dataRows = allRows
        .slice(1)
        .map((row) => Array.from(row.cells).map((cell) => cell.innerText));
    }
    exportData = [];
    if (title) exportData.push([title]);
    if (exportDate) exportData.push([exportDate]);
    exportData.push(...headerRows);
    exportData.push(...dataRows);
  }

  // 4. Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(exportData);

  // 5. Merge cell (custom merges > auto merges)
  if (merges && merges.length) {
    ws["!merges"] = merges;
  } else {
    // ถ้าใช้ title/exportDate แบบเก่า ให้ merge เหมือนเดิม (auto)
    const oldMerges = [];
    // หาแถว header ที่ยาวที่สุด
    const colCount = exportData.reduce((max, row) => Math.max(max, row.length), 1);
    let headerRowOffset = 0;
    if (title) {
      oldMerges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } });
      headerRowOffset++;
    }
    if (exportDate) {
      oldMerges.push({
        s: { r: headerRowOffset, c: 0 },
        e: { r: headerRowOffset, c: colCount - 1 },
      });
    }
    if (oldMerges.length) ws["!merges"] = oldMerges;
  }

  // 6. Dynamic column width (ดูจาก header ที่ยาวสุด)
  const lastHeaderRow = exportData.reduce((longest, row) => (row.length > longest.length ? row : longest), []);
  ws["!cols"] = lastHeaderRow.map((header, colIdx) => {
    let maxLen = (header || "").length;
    exportData.forEach((row) => {
      const cell = row[colIdx];
      if (cell && cell.length > maxLen) maxLen = cell.length;
    });
    return { wch: maxLen + 4 };
  });

  // 7. Export file
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}