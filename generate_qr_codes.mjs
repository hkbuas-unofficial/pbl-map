// Generates QR codes for every group in src/data/groupQuestions.js
// Output: Downloads/QR Codes.zip (PNG + JPG per group, tree-organised)
// Run: node generate_qr_codes.mjs
import { GROUP_QUESTIONS } from './src/data/groupQuestions.js';
import { formatGroupDisplay } from './src/lib/groupDisplay.js';
import QRCode from 'qrcode';
import { Jimp } from 'jimp';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const groupCodes = Object.keys(GROUP_QUESTIONS).sort();

function parseGroupCode(code) {
  let m = code.match(/^G(\d)\s+(Local\s+\d+)-(\d+)$/);
  if (m) return { grade: `G${m[1]}`, class: m[2], groupNum: m[3] };
  m = code.match(/^G(\d)([A-Z]\d+)-(\d+)$/);
  if (m) return { grade: `G${m[1]}`, class: m[2], groupNum: m[3] };
  m = code.match(/^G(\d)([A-Z])-(\d+)$/);
  if (m) return { grade: `G${m[1]}`, class: m[2], groupNum: m[3] };
  m = code.match(/^([A-Za-z]+)-(\d+)$/);
  if (m) return { grade: m[1], class: '', groupNum: m[2] };
  return { grade: 'Other', class: '', groupNum: code };
}

const downloadsDir = execSync(`powershell.exe -NoProfile -Command "(New-Object -ComObject Shell.Application).Namespace('shell:Downloads').Self.Path"`, { encoding: 'utf8' }).trim();
const workDir = path.join(process.cwd(), 'tmp_qr_output');
const treeRoot = path.join(workDir, 'QR Codes');
const zipPath = path.join(downloadsDir, 'QR Codes.zip');

await fs.mkdir(treeRoot, { recursive: true });

const listLines = [];

for (const code of groupCodes) {
  const { grade, class: cls, groupNum } = parseGroupCode(code);
  const classDir = cls ? path.join(treeRoot, grade, cls) : path.join(treeRoot, grade);
  await fs.mkdir(classDir, { recursive: true });
  const fileName = formatGroupDisplay(code);
  const pngPath = path.join(classDir, `${fileName}.png`);
  const jpgPath = path.join(classDir, `${fileName}.jpg`);
  const url = `https://hkbuaspbl2026.pages.dev/?id=${encodeURIComponent(code)}`;

  await QRCode.toFile(pngPath, url, { width: 400, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
  const image = await Jimp.read(pngPath);
  await image.write(jpgPath, { quality: 90 });

  listLines.push(`${code} -> ${url}`);
  console.log(`${code}: ${pngPath}`);
}

await fs.writeFile(path.join(treeRoot, 'group_codes.txt'), listLines.join('\n'), 'utf8');

const psCmd = `Compress-Archive -Force -Path '${treeRoot}' -DestinationPath '${zipPath}'`;
execSync(`powershell.exe -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });

// Clean up temporary tree
await fs.rm(workDir, { recursive: true, force: true });

console.log(`\nCreated ${zipPath}`);
console.log(`Total groups: ${groupCodes.length}`);
