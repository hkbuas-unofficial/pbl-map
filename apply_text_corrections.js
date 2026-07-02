const fs = require('fs');
const classes = JSON.parse(fs.readFileSync('parsed_classes.json', 'utf8'));

const text = fs.readFileSync('corrections_g1.txt', 'utf8');
const lines = text.split('\n').map(l => l.trim()).filter(l => l);

let currentClass = null;
let currentGroup = null;
let pendingQuestion = null;
let pendingQIndex = -1;

const classMap = {};
classes.forEach(c => {
  classMap[c.class_id] = c;
});

function cleanText(t) {
  return t.replace(/[\s？?.,!！:：;；'"“”‘’]/g, '').toLowerCase();
}

function findAnswerLetter(question, checkedText) {
  const cleanChecked = cleanText(checkedText);
  for (const [key, val] of Object.entries(question.options)) {
    if (cleanText(val) === cleanChecked) return key;
  }
  // Partial match
  for (const [key, val] of Object.entries(question.options)) {
    if (cleanChecked.includes(cleanText(val).slice(0, 20)) || cleanText(val).includes(cleanChecked.slice(0, 20))) {
      return key;
    }
  }
  return null;
}

let applied = 0;
let skipped = 0;

lines.forEach(line => {
  if (/^G1[A-E]$/i.test(line)) {
    currentClass = line.toUpperCase();
    currentGroup = null;
    pendingQuestion = null;
    return;
  }
  const groupMatch = line.match(/^Group\s+(\d+)$/i);
  if (groupMatch) {
    currentGroup = groupMatch[1];
    pendingQuestion = null;
    pendingQIndex = -1;
    return;
  }
  if (line.startsWith('---')) return;
  if (line.startsWith('(')) return;

  const isOption = line.startsWith('[');
  if (!isOption) {
    // It's a question - find its index in the group
    pendingQIndex++;
    pendingQuestion = line;
  } else {
    const checked = line.includes('[✓]');
    if (checked && currentClass && currentGroup && pendingQIndex >= 0) {
      const cls = classMap[currentClass];
      if (cls) {
        const grp = cls.groups.find(g => g.group_id === currentGroup);
        if (grp && grp.questions[pendingQIndex]) {
          const checkedText = line.replace(/\[[\s✓xX]\]\s*/, '').trim();
          const answer = findAnswerLetter(grp.questions[pendingQIndex], checkedText);
          if (answer) {
            grp.questions[pendingQIndex].answer = answer;
            applied++;
          } else {
            console.log(`Could not match: ${currentClass} G${currentGroup} Q${pendingQIndex + 1}: ${checkedText.slice(0, 50)}`);
            skipped++;
          }
        }
      }
    }
  }
});

fs.writeFileSync('parsed_classes.json', JSON.stringify(classes, null, 2));
console.log(`Applied ${applied} corrections, skipped ${skipped}`);
