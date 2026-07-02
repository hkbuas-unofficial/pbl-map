const fs = require('fs');
const classes = JSON.parse(fs.readFileSync('parsed_classes.json', 'utf8'));

function shortDisplay(classId) {
  // G1A -> 1A, G4 Local 1 -> L1, G5E1 -> E1, G6S1 -> S1, Singapore -> SG
  if (classId.startsWith('G') && classId.length <= 4) return classId.slice(1); // G1A -> 1A
  if (classId.includes('Local')) return classId.replace('Local ', 'L'); // G4 Local 1 -> G4L1
  if (classId.startsWith('G5E')) return classId.replace('G5E', 'E'); // G5E1 -> E1
  if (classId.startsWith('G6S')) return classId.replace('G6S', 'S'); // G6S1 -> S1
  const map = { Singapore: 'SG', Sichuan: 'SC', Malaysia: 'MY', Madrid: 'MD', London: 'LD', Shanghai: 'SH' };
  return map[classId] || classId.slice(0, 2).toUpperCase();
}

function className(classId) {
  if (classId.startsWith('G') && classId.length <= 4) return `${classId} Class`;
  return classId;
}

function locationForGrade(grade, classId) {
  if (grade === 'G1') return '3rd floor';
  if (grade === 'G2') return '3rd floor';
  if (grade === 'G3') return '4th floor';
  if (grade === 'G4') return 'Local study area';
  if (grade === 'G5') return 'Entrepreneurship area';
  if (grade === 'G6') return 'STEAM area';
  return 'Excursion area';
}

// Grid layout (placeholder - user should adjust via coordinate editor)
const classOrder = classes.map(c => c.class_id);
const cols = 5;
const startX = 50;
const startY = 25;
const stepX = 8;
const stepY = 8;

const coords = {};
classOrder.forEach((id, idx) => {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  coords[id] = {
    x: startX + col * stepX,
    y: startY + row * stepY,
  };
});

const booths = classes.map(c => ({
  booth_id: c.class_id,
  display_id: shortDisplay(c.class_id),
  booth_name: className(c.class_id),
  booth_location: locationForGrade(c.grade, c.class_id),
  grade: c.grade,
  booth_x: coords[c.class_id].x,
  booth_y: coords[c.class_id].y,
  groups: c.groups,
}));

const output = `// Booth / class data for PBL map
// Generated from Excel. Coordinates are placeholders - adjust via tools/coordinate-editor.html

export const DEMO_BOOTHS = ${JSON.stringify(booths, null, 2)};
`;

fs.writeFileSync('src/data/demoBooths.js', output);
console.log(`Generated src/data/demoBooths.js with ${booths.length} classes`);
