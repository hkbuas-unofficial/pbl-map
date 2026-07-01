// Booth data for PBL map
// booth_x and booth_y are percentages (0-100) on the map image
// display_id is what shows on the map pin (1-7)

export const DEMO_BOOTHS = [
  {
    booth_id: 'G1',
    display_id: '1',
    booth_name: 'Unsung Neighbourhood Heroes',
    booth_location: 'Right building, 1st marked room',
    booth_x: 70.16,
    booth_y: 43.5,
    questions: [
      {
        question: 'What does "unsung" mean?',
        options: { a: 'Famous', b: 'Unknown or uncelebrated', c: 'Loud', d: 'Old' },
        answer: 'b',
      },
      {
        question: 'Which of these is an example of a neighbourhood hero?',
        options: { a: 'A movie star', b: 'A local volunteer', c: 'A politician', d: 'A singer' },
        answer: 'b',
      },
      {
        question: 'Why is it important to recognise neighbourhood heroes?',
        options: { a: 'They are famous', b: 'They make our community better', c: 'They are paid a lot', d: 'They live far away' },
        answer: 'b',
      },
    ],
  },
  {
    booth_id: 'G2',
    display_id: '2',
    booth_name: 'Animal Habitats',
    booth_location: 'Right building, 2nd marked room',
    booth_x: 74.91,
    booth_y: 44.3,
    questions: [
      {
        question: 'What is a habitat?',
        options: { a: 'A type of food', b: 'A place where animals live', c: 'A kind of weather', d: 'A musical instrument' },
        answer: 'b',
      },
      {
        question: 'Which habitat would a polar bear live in?',
        options: { a: 'Desert', b: 'Rainforest', c: 'Arctic', d: 'Grassland' },
        answer: 'c',
      },
      {
        question: 'Why should we protect animal habitats?',
        options: { a: 'To build more houses', b: 'To keep animals safe and healthy', c: 'To grow more crops', d: 'To make roads' },
        answer: 'b',
      },
    ],
  },
  {
    booth_id: 'G3',
    display_id: '3',
    booth_name: 'Cultural Connections',
    booth_location: 'Right building, 3rd marked room',
    booth_x: 80.22,
    booth_y: 42.44,
    questions: [
      {
        question: 'What does "culture" include?',
        options: { a: 'Only food', b: 'Traditions, language, arts, and beliefs', c: 'Only music', d: 'Only clothes' },
        answer: 'b',
      },
      {
        question: 'Why is learning about other cultures important?',
        options: { a: 'It helps us understand and respect others', b: 'It makes us all the same', c: 'It is not useful', d: 'It is only for travel' },
        answer: 'a',
      },
      {
        question: 'Which is a way to connect with another culture?',
        options: { a: 'Ignoring it', b: 'Trying its food or learning its language', c: 'Making fun of it', d: 'Avoiding its people' },
        answer: 'b',
      },
    ],
  },
  {
    booth_id: 'G4',
    display_id: '4',
    booth_name: 'Climate Change',
    booth_location: 'Right building, 4th marked room',
    booth_x: 85.16,
    booth_y: 42.88,
    questions: [
      {
        question: 'What is climate change?',
        options: { a: 'Daily weather changes', b: 'Long-term changes in Earth\'s temperature and weather patterns', c: 'Seasons changing', d: 'Wind direction' },
        answer: 'b',
      },
      {
        question: 'Which gas is a major cause of global warming?',
        options: { a: 'Oxygen', b: 'Carbon dioxide', c: 'Nitrogen', d: 'Hydrogen' },
        answer: 'b',
      },
      {
        question: 'What can we do to help reduce climate change?',
        options: { a: 'Use more plastic', b: 'Save energy and reduce waste', c: 'Cut down more trees', d: 'Drive everywhere' },
        answer: 'b',
      },
    ],
  },
  {
    booth_id: 'G5',
    display_id: '5',
    booth_name: 'Entrepreneurship',
    booth_location: 'Right building, 5th marked room (lower)',
    booth_x: 79.91,
    booth_y: 49.25,
    questions: [
      {
        question: 'What is an entrepreneur?',
        options: { a: 'Someone who starts and runs a business', b: 'A doctor', c: 'A teacher', d: 'A lawyer' },
        answer: 'a',
      },
      {
        question: 'Which skill is important for an entrepreneur?',
        options: { a: 'Giving up easily', b: 'Problem-solving', c: 'Ignoring customers', d: 'Avoiding risks' },
        answer: 'b',
      },
      {
        question: 'What is a business plan?',
        options: { a: 'A drawing', b: 'A document describing how a business will work', c: 'A recipe', d: 'A game' },
        answer: 'b',
      },
    ],
  },
  {
    booth_id: 'G6',
    display_id: '6',
    booth_name: 'STEAM Projects',
    booth_location: 'Right building, 6th marked room (upper)',
    booth_x: 74.91,
    booth_y: 37.31,
    questions: [
      {
        question: 'What does STEAM stand for?',
        options: { a: 'Science, Technology, Engineering, Arts, Mathematics', b: 'Sports, Theatre, English, Art, Music', c: 'Study, Train, Exercise, Act, Move', d: 'Space, Time, Energy, Air, Matter' },
        answer: 'a',
      },
      {
        question: 'Why are STEAM projects useful?',
        options: { a: 'They combine different skills to solve real problems', b: 'They are only for scientists', c: 'They do not need creativity', d: 'They are always easy' },
        answer: 'a',
      },
      {
        question: 'Which activity is part of STEAM?',
        options: { a: 'Building a robot', b: 'Sleeping', c: 'Watching TV', d: 'Eating' },
        answer: 'a',
      },
    ],
  },
  {
    booth_id: 'E',
    display_id: '7',
    booth_name: 'PS Excursion Groups',
    booth_location: 'Right building, top marked room',
    booth_x: 79.97,
    booth_y: 34.92,
    questions: [
      {
        question: 'What is an excursion?',
        options: { a: 'A short trip or visit', b: 'A type of food', c: 'A math problem', d: 'A sport' },
        answer: 'a',
      },
      {
        question: 'Why do schools organise excursions?',
        options: { a: 'To learn outside the classroom', b: 'To miss lessons', c: 'To play games only', d: 'To buy snacks' },
        answer: 'a',
      },
      {
        question: 'What should you bring on an excursion?',
        options: { a: 'Your phone only', b: 'Water, notebook, and appropriate clothing', c: 'Toys', d: 'Nothing' },
        answer: 'b',
      },
    ],
  },
];
