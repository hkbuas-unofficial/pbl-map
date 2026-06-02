// Demo booth data - replace with your xlsx import later
// booth_x and booth_y are percentages (0-100) on the map

export const DEMO_BOOTHS = [
  {
    booth_id: 'A01',
    booth_name: 'Science Lab',
    booth_x: 25,
    booth_y: 30,
    questions: [
      {
        question: 'What is the chemical symbol for water?',
        options: { a: 'H2O', b: 'CO2', c: 'O2', d: 'NaCl' },
        answer: 'a',
      },
      {
        question: 'Which planet is known as the Red Planet?',
        options: { a: 'Venus', b: 'Jupiter', c: 'Mars', d: 'Saturn' },
        answer: 'c',
      },
      {
        question: 'What gas do plants absorb from the atmosphere?',
        options: { a: 'Oxygen', b: 'Carbon Dioxide', c: 'Nitrogen', d: 'Hydrogen' },
        answer: 'b',
      },
      {
        question: 'How many bones are in the adult human body?',
        options: { a: '186', b: '206', c: '226', d: '246' },
        answer: 'b',
      },
      {
        question: 'What is the speed of light (approx)?',
        options: { a: '300,000 km/s', b: '150,000 km/s', c: '1,000,000 km/s', d: '30,000 km/s' },
        answer: 'a',
      },
    ],
  },
  {
    booth_id: 'A02',
    booth_name: 'Tech Hub',
    booth_x: 60,
    booth_y: 25,
    questions: [
      {
        question: 'What does "HTML" stand for?',
        options: { a: 'Hyper Text Markup Language', b: 'High Tech Modern Language', c: 'Hyper Transfer Main Link', d: 'Home Tool Markup Language' },
        answer: 'a',
      },
      {
        question: 'Which company created the iPhone?',
        options: { a: 'Samsung', b: 'Google', c: 'Apple', d: 'Microsoft' },
        answer: 'c',
      },
      {
        question: 'What is the binary representation of decimal 5?',
        options: { a: '100', b: '101', c: '110', d: '111' },
        answer: 'b',
      },
      {
        question: 'What does "CPU" stand for?',
        options: { a: 'Central Process Unit', b: 'Computer Personal Unit', c: 'Central Processing Unit', d: 'Central Processor Utility' },
        answer: 'c',
      },
      {
        question: 'Which programming language is known as the language of the web?',
        options: { a: 'Python', b: 'Java', c: 'C++', d: 'JavaScript' },
        answer: 'd',
      },
    ],
  },
  {
    booth_id: 'B01',
    booth_name: 'Art Studio',
    booth_x: 40,
    booth_y: 60,
    questions: [
      {
        question: 'Who painted the Mona Lisa?',
        options: { a: 'Van Gogh', b: 'Picasso', c: 'Da Vinci', d: 'Michelangelo' },
        answer: 'c',
      },
      {
        question: 'Which color is made by mixing red and blue?',
        options: { a: 'Orange', b: 'Green', c: 'Purple', d: 'Brown' },
        answer: 'c',
      },
      {
        question: 'What art movement is Salvador Dali associated with?',
        options: { a: 'Impressionism', b: 'Surrealism', c: 'Cubism', d: 'Abstract' },
        answer: 'b',
      },
      {
        question: 'How many primary colors are there?',
        options: { a: '2', b: '3', c: '4', d: '5' },
        answer: 'b',
      },
      {
        question: 'Which tool is used to apply paint in broad strokes?',
        options: { a: 'Pen', b: 'Pencil', c: 'Brush', d: 'Crayon' },
        answer: 'c',
      },
    ],
  },
  {
    booth_id: 'B02',
    booth_name: 'History Corner',
    booth_x: 75,
    booth_y: 55,
    questions: [
      {
        question: 'In which year did World War II end?',
        options: { a: '1943', b: '1944', c: '1945', d: '1946' },
        answer: 'c',
      },
      {
        question: 'Who was the first President of the United States?',
        options: { a: 'Jefferson', b: 'Lincoln', c: 'Washington', d: 'Adams' },
        answer: 'c',
      },
      {
        question: 'Which ancient civilization built the pyramids?',
        options: { a: 'Romans', b: 'Greeks', c: 'Egyptians', d: 'Mayans' },
        answer: 'c',
      },
      {
        question: 'The Titanic sank in which year?',
        options: { a: '1910', b: '1912', c: '1914', d: '1916' },
        answer: 'b',
      },
      {
        question: 'Which empire was ruled by Genghis Khan?',
        options: { a: 'Roman', b: 'Ottoman', c: 'Mongol', d: 'British' },
        answer: 'c',
      },
    ],
  },
  {
    booth_id: 'C01',
    booth_name: 'Sports Zone',
    booth_x: 15,
    booth_y: 75,
    questions: [
      {
        question: 'How many players are on a basketball team on court?',
        options: { a: '4', b: '5', c: '6', d: '7' },
        answer: 'b',
      },
      {
        question: 'Which country hosted the 2020 Summer Olympics (held in 2021)?',
        options: { a: 'China', b: 'Brazil', c: 'Japan', d: 'UK' },
        answer: 'c',
      },
      {
        question: 'In soccer, what is it called when a player scores 3 goals in one game?',
        options: { a: 'Hat-trick', b: 'Triple', c: 'Trifecta', d: 'Three-peat' },
        answer: 'a',
      },
      {
        question: 'How many holes are played in a standard round of golf?',
        options: { a: '9', b: '12', c: '18', d: '21' },
        answer: 'c',
      },
      {
        question: 'Which sport uses a shuttlecock?',
        options: { a: 'Tennis', b: 'Badminton', c: 'Squash', d: 'Table Tennis' },
        answer: 'b',
      },
    ],
  },
];
