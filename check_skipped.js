const classes = JSON.parse(require('fs').readFileSync('parsed_classes.json', 'utf8'));

const skipped = [
  { classId: 'G1A', groupId: '3', qIdx: 1 },
  { classId: 'G1B', groupId: '4', qIdx: 1 },
  { classId: 'G1D', groupId: '1', qIdx: 2 },
  { classId: 'G1E', groupId: '1', qIdx: 1 },
];

skipped.forEach(s => {
  const cls = classes.find(c => c.class_id === s.classId);
  const grp = cls.groups.find(g => g.group_id === s.groupId);
  const q = grp.questions[s.qIdx];
  console.log(`\n${s.classId} G${s.groupId} Q${s.qIdx + 1}: ${q.question}`);
  console.log('A:', q.options.a);
  console.log('B:', q.options.b);
  console.log('C:', q.options.c);
  console.log('Current answer:', q.answer);
});
