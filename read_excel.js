const XLSX = require('xlsx');
const path = 'E:/mydocuments/Downloads/PBL - Showcase Day Questions for Guests.xlsx';
const wb = XLSX.readFile(path, { cellStyles: true });

wb.SheetNames.forEach(sheetName => {
  if (sheetName === 'Sheet5' || sheetName === 'Sheet4') return;
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' });
  const colors = {};
  data.slice(1).forEach((row, rowIdx) => {
    const questionStarts = [2, 6, 10];
    questionStarts.forEach(qCol => {
      [0, 1, 2].forEach(optIdx => {
        const col = qCol + 1 + optIdx;
        const cellRef = String.fromCharCode(65 + col) + (rowIdx + 2);
        const cell = ws[cellRef];
        if (cell && cell.s) {
          const fill = cell.s.fill || cell.s;
          const rgb = fill && fill.fgColor && fill.fgColor.rgb;
          if (rgb) {
            colors[rgb] = (colors[rgb] || 0) + 1;
          }
        }
      });
    });
  });
  console.log(`${sheetName}:`, colors);
});
