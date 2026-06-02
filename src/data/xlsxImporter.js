// XLSX Import Utility
// Usage: Call importBoothDataFromXlsx(filePath) to parse your Excel file

import * as XLSX from 'xlsx';

/**
 * Expected column headers in the .xlsx file:
 * booth_id, booth_name, booth_location, booth_x, booth_y,
 * question_1, option_1a, option_1b, option_1c, option_1d, answer_1,
 * question_2, option_2a, option_2b, option_2c, option_2d, answer_2,
 * ... (repeat for questions 3-5)
 *
 * @param {ArrayBuffer|Buffer} fileData - The raw file data
 * @returns {Array} Array of booth objects
 */
export function importBoothDataFromXlsx(fileData) {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (jsonData.length < 2) {
    throw new Error('Excel file appears to be empty or missing data rows');
  }

  const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
  const booths = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row[0]) continue; // Skip empty rows

    const booth = {
      booth_id: String(getCell(row, headers, 'booth_id') || '').trim().toUpperCase(),
      booth_name: String(getCell(row, headers, 'booth_name') || '').trim(),
      booth_location: String(getCell(row, headers, 'booth_location') || '').trim(),
      booth_x: parseFloat(getCell(row, headers, 'booth_x')) || 50,
      booth_y: parseFloat(getCell(row, headers, 'booth_y')) || 50,
      questions: [],
    };

    // Parse questions 1-5
    for (let q = 1; q <= 5; q++) {
      const questionText = getCell(row, headers, `question_${q}`);
      if (!questionText) continue;

      const question = {
        question: String(questionText).trim(),
        options: {
          a: String(getCell(row, headers, `option_${q}a`) || '').trim(),
          b: String(getCell(row, headers, `option_${q}b`) || '').trim(),
          c: String(getCell(row, headers, `option_${q}c`) || '').trim(),
          d: String(getCell(row, headers, `option_${q}d`) || '').trim(),
        },
        answer: String(getCell(row, headers, `answer_${q}`) || 'a').trim().toLowerCase(),
      };

      // Validate answer is a, b, c, or d
      if (!['a', 'b', 'c', 'd'].includes(question.answer)) {
        question.answer = 'a';
      }

      booth.questions.push(question);
    }

    if (booth.booth_id && booth.questions.length > 0) {
      booths.push(booth);
    }
  }

  return booths;
}

function getCell(row, headers, columnName) {
  const index = headers.indexOf(columnName.toLowerCase());
  if (index === -1) return null;
  return row[index];
}

/**
 * For React Native / Web: Load xlsx file from assets
 * Place your booth_data.xlsx in the assets/ folder and call:
 * 
 * const response = await fetch(require('../assets/booth_data.xlsx'));
 * const arrayBuffer = await response.arrayBuffer();
 * const booths = importBoothDataFromXlsx(arrayBuffer);
 */
export async function loadBoothDataFromAsset(assetPath) {
  const response = await fetch(assetPath);
  const arrayBuffer = await response.arrayBuffer();
  return importBoothDataFromXlsx(arrayBuffer);
}
