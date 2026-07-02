const fs = require('fs');
const classes = JSON.parse(fs.readFileSync('parsed_classes.json', 'utf8'));

// Override answers for questions where highlight was missing
// Format: `${classId}|${groupId}|${qIndex}`: 'a'/'b'/'c'
const overrides = {
  // G2A Group 1
  'G2A|1|0': 'b', // 5 oceans
  'G2A|1|1': 'b', // 5 layers
  'G2A|1|2': 'a', // food water shelter
  // G2A Group 2
  'G2A|2|0': 'b', // 20-30C
  'G2A|2|1': 'b', // Great Steppe
  'G2A|2|2': 'b', // wildfire
  // G2A Group 3
  'G2A|3|0': 'c', // long leg
  'G2A|3|1': 'b', // padded feet
  'G2A|3|2': 'a', // 3 problems
  // G2A Group 4
  'G2A|4|0': 'a', // insects/reptiles
  'G2A|4|1': 'a', // spines reduce evaporation
  'G2A|4|2': 'a', // <25cm rain
  // G2A Group 5
  'G2A|5|0': 'b', // 3 types
  'G2A|5|1': 'a', // 41.7 inches
  'G2A|5|2': 'a', // 25-75cm
  // G2A Group 6
  'G2A|6|0': 'b', // 7 threats
  'G2A|6|1': 'c', // 97%
  'G2A|6|2': 'a', // -2 to 30C
  // G2B Group 3
  'G2B|3|0': 'a', // poison dart frog
  'G2B|3|1': 'c', // 4 layers
  'G2B|3|2': 'a', // canopy
  // G2B Group 4
  'G2B|4|0': 'a', // blue whale
  'G2B|4|1': 'c', // don't throw trash
  'G2B|4|2': 'a', // sunlight
  // G2B Group 6
  'G2B|6|0': 'c', // place for plants/animals
  // G2C Group 6
  'G2C|6|2': 'b', // loss of sea ice
  // G5E1 Group 6
  'G5E1|6|1': 'a', // flexible handle
  // G6S1 Group 6
  'G6S1|6|0': 'a', // 50% vs <15%
  // G6S3 Group 5
  'G6S3|5|2': 'c', // Richard Thompson
  // Shanghai Group 5
  'Shanghai|5|0': 'b', // 140,000 bricks
  'Shanghai|5|1': 'a', // beetroot
  'Shanghai|5|2': 'c', // western tailoring
  // Shanghai Group 6
  'Shanghai|6|0': 'b', // Tianzifang
  'Shanghai|6|1': 'c', // borscht & pork chop
  'Shanghai|6|2': 'b', // local cloth
};

classes.forEach(c => {
  c.groups.forEach(g => {
    g.questions.forEach((q, idx) => {
      const key = `${c.class_id}|${g.group_id}|${idx}`;
      if (overrides[key]) {
        q.answer = overrides[key];
      }
    });
  });
});

fs.writeFileSync('parsed_classes.json', JSON.stringify(classes, null, 2));
console.log('Overrides applied');
