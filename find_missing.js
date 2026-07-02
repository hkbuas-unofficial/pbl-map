const classes = JSON.parse(require('fs').readFileSync('parsed_classes.json', 'utf8'));

let count = 0;
classes.forEach(c => {
  c.groups.forEach(g => {
    g.questions.forEach((q, idx) => {
      if (q.answerWasMissing) {
        count++;
        console.log(`\n${c.class_id} ${g.group_id} Q${idx + 1}: ${q.question}`);
        console.log(`  A: ${q.options.a}`);
        console.log(`  B: ${q.options.b}`);
        console.log(`  C: ${q.options.c}`);
        console.log(`  Current fallback: ${q.answer.toUpperCase()}`);
      }
    });
  });
});
console.log(`\nTotal missing: ${count}`);
