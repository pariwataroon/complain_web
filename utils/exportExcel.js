import * as XLSX from "xlsx";

/**
 * Universal Excel Exporter
 * - รองรับ export ข้อมูลจาก JSON (array of object) หรือจาก Table DOM (ref หรือ node)
 * - รองรับ Title, วันที่ export, และชื่อคอลัมน์
 * - ความกว้างคอลัมน์ dynamic ตามความยาวข้อความ
 * @param {Object[]|HTMLElement|React.Ref} source - array of object หรือ <table> element หรือ ref ไปยัง <table>
 * @param {Object} options
 *   - filename: string
 *   - sheetName: string
 *   - title: string (optional)
 *   - exportDate: string (optional)
 */
export function exportExcel(
  source,
  {
    filename = "export.xlsx",
    sheetName = "Sheet1",
    title = "",
    exportDate = "",
  } = {}
) {
  let rows = [];
  let colHeaders = [];

  // --- 1. Detect source type: JSON or table ---
  if (
    Array.isArray(source) &&
    source.length > 0 &&
    typeof source[0] === "object"
  ) {
    // ---- JSON array ----
    colHeaders = Object.keys(source[0]);

    // Prepare data rows
    rows = source.map((row) =>
      colHeaders.map((key) => (row[key] != null ? row[key].toString() : ""))
    );
  } else {
    // Assume Table DOM or ref
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

    // Get column headers from thead or first row
    const thead = table.querySelector("thead");
    if (thead && thead.rows[0]) {
      colHeaders = Array.from(thead.rows[0].cells).map((cell) =>
        cell.innerText.trim()
      );
    } else if (table.rows[0]) {
      colHeaders = Array.from(table.rows[0].cells).map((cell) =>
        cell.innerText.trim()
      );
    }

    // Get data rows (skip header)
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
    rows = dataRows;
  }

  // --- 2. Compose export data: Title, Date, Headers, Data ---
  const exportData = [];
  if (title) exportData.push([title]);
  if (exportDate) exportData.push([exportDate]);
  exportData.push(colHeaders);
  exportData.push(...rows);

  // --- 3. Create worksheet ---
  const ws = XLSX.utils.aoa_to_sheet(exportData);

  // --- 4. Merge Title, Date rows if they exist ---
  const merges = [];
  const colCount = colHeaders.length || 1;
  let headerRowOffset = 0;
  if (title) {
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } });
    headerRowOffset++;
  }
  if (exportDate) {
    merges.push({
      s: { r: headerRowOffset, c: 0 },
      e: { r: headerRowOffset, c: colCount - 1 },
    });
    headerRowOffset++;
  }
  if (merges.length) ws["!merges"] = merges;

  // --- 5. Dynamic column width ---
  ws["!cols"] = colHeaders.map((header, colIdx) => {
    let maxLen = (header || "").length;
    exportData.forEach((row, ridx) => {
      // Only check if column exists in this row
      const cell = row[colIdx];
      if (cell && cell.length > maxLen) maxLen = cell.length;
    });
    return { wch: maxLen + 2 };
  });

  // --- 6. Export file ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
