const XLSX = require('xlsx');
const fs = require('fs');

const path = 'E:/mydocuments/Downloads/PBL - Showcase Day Questions for Guests.xlsx';
const wb = XLSX.readFile(path, { cellStyles: true });

const SHEETS = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'Excursion Grp'];

function isHighlighted(cell) {
  if (!cell || !cell.s) return false;
  const fill = cell.s.fill || cell.s;
  if (fill && fill.fgColor) {
    const color = fill.fgColor.rgb || fill.fgColor.theme;
    // Yellow highlight
    if (color === 'FFFF00') return true;
  }
  return false;
}

function colIndexToLetter(index) {
  let result = '';
  let i = index;
  do {
    result = String.fromCharCode(65 + (i % 26)) + result;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return result;
}

const classes = [];

SHEETS.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  if (!ws) return;

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' });
  if (data.length < 2) return;

  const header = data[0];

  // Group rows by class, keeping absolute row index
  const rowsByClass = {};
  data.slice(1).forEach((row, absoluteRowIdx) => {
    const className = String(row[0] || '').trim();
    if (!className) return;
    if (!rowsByClass[className]) rowsByClass[className] = [];
    rowsByClass[className].push({ row, absoluteRowIdx });
  });

  Object.entries(rowsByClass).forEach(([className, rows]) => {
    const groups = rows.map(({ row, absoluteRowIdx }) => {
      const groupName = String(row[1] || '').trim(); // e.g. "Group 1"
      const groupNumber = groupName.replace(/\D/g, '');

      const questions = [];
      // Questions at columns 2, 6, 10 (0-indexed: 2, 6, 10)
      // Answers at 3,4,5 then 7,8,9 then 11,12,13
      const questionStarts = [2, 6, 10];
      questionStarts.forEach((qCol) => {
        const qText = String(row[qCol] || '').trim();
        if (!qText) return;

        const options = {};
        let answer = null;
        ['A', 'B', 'C'].forEach((letter, optIdx) => {
          const col = qCol + 1 + optIdx;
          const value = String(row[col] || '').trim();
          const key = letter.toLowerCase();
          options[key] = value;

          // Check if this cell is highlighted
          const cellRef = colIndexToLetter(col) + (absoluteRowIdx + 2);
          const cell = ws[cellRef];
          if (isHighlighted(cell)) {
            answer = key;
          }
        });

        questions.push({
          question: qText,
          options,
          answer: answer || 'a', // fallback if highlight missing
          answerWasMissing: !answer,
        });
      });

      return {
        group_id: groupNumber,
        group_name: groupName,
        questions: questions.filter(q => q.question),
      };
    });

    classes.push({
      class_id: className,
      grade: sheetName === 'Excursion Grp' ? 'E' : sheetName,
      groups: groups.filter(g => g.questions.length > 0),
    });
  });
});

// Summary
console.log(`Parsed ${classes.length} classes`);
classes.forEach(c => {
  const totalQuestions = c.groups.reduce((sum, g) => sum + g.questions.length, 0);
  const missingAnswers = c.groups.reduce((sum, g) => sum + g.questions.filter(q => !q.answer).length, 0);
  console.log(`  ${c.class_id} (${c.grade}): ${c.groups.length} groups, ${totalQuestions} questions, ${missingAnswers} missing answers`);
});

fs.writeFileSync('parsed_classes.json', JSON.stringify(classes, null, 2));
console.log('\nSaved to parsed_classes.json');
