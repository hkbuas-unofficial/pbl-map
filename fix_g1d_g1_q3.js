const fs = require('fs');
const classes = JSON.parse(fs.readFileSync('parsed_classes.json', 'utf8'));
const cls = classes.find(c => c.class_id === 'G1D');
const grp = cls.groups.find(g => g.group_id === '1');
grp.questions[2].answer = 'c';
fs.writeFileSync('parsed_classes.json', JSON.stringify(classes, null, 2));
console.log('Fixed G1D Group 1 Q3 answer to C');
