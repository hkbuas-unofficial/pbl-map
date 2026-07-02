const fs = require('fs');
const classes = JSON.parse(fs.readFileSync('parsed_classes.json', 'utf8'));

// Grade pin coordinates (the current 7 pins)
const gradePins = [
  { booth_id: 'G1', display_id: '1', booth_name: 'Grade 1', booth_location: '3rd floor', booth_x: 70.16, booth_y: 43.5, grade: 'G1' },
  { booth_id: 'G2', display_id: '2', booth_name: 'Grade 2', booth_location: '3rd floor', booth_x: 74.91, booth_y: 44.3, grade: 'G2' },
  { booth_id: 'G3', display_id: '3', booth_name: 'Grade 3', booth_location: '4th floor', booth_x: 80.22, booth_y: 42.44, grade: 'G3' },
  { booth_id: 'G4', display_id: '4', booth_name: 'Grade 4', booth_location: 'Local study area', booth_x: 85.16, booth_y: 42.88, grade: 'G4' },
  { booth_id: 'G5', display_id: '5', booth_name: 'Grade 5', booth_location: 'Entrepreneurship area', booth_x: 79.91, booth_y: 49.25, grade: 'G5' },
  { booth_id: 'G6', display_id: '6', booth_name: 'Grade 6', booth_location: 'STEAM area', booth_x: 74.91, booth_y: 37.31, grade: 'G6' },
  { booth_id: 'E', display_id: '7', booth_name: 'Excursion', booth_location: 'Excursion area', booth_x: 79.97, booth_y: 34.92, grade: 'E' },
];

// Group questions lookup
const groupQuestions = {};
classes.forEach(c => {
  c.groups.forEach(g => {
    const groupId = `${c.class_id}-${g.group_id}`;
    groupQuestions[groupId] = {
      groupId,
      classId: c.class_id,
      grade: c.grade,
      groupName: g.group_name,
      questions: g.questions.map(q => ({
        question: q.question,
        options: q.options,
        answer: q.answer,
      })),
    };
  });
});

fs.writeFileSync('src/data/demoBooths.js', `// Grade pin data for PBL map
export const DEMO_BOOTHS = ${JSON.stringify(gradePins, null, 2)};
`);

fs.writeFileSync('src/data/groupQuestions.js', `// Group question data parsed from Excel
export const GROUP_QUESTIONS = ${JSON.stringify(groupQuestions, null, 2)};
`);

console.log(`Generated demoBooths.js with ${gradePins.length} grade pins`);
console.log(`Generated groupQuestions.js with ${Object.keys(groupQuestions).length} groups`);
