// Oreo: the story of one dog's life. Every person and dog here is made up.
(function (G) {
  'use strict';
  function rng(seed) {
    let s = (typeof seed === 'string' ? hash(seed) : seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  const LAST_DAY = 40;
  const CHAPTERS = [
    { id: 0, name: 'Little Oreo', from: 1, blurb: 'A fluffy cockapoo puppy with big paws and an even bigger heart.', music: 'folk' },
    { id: 1, name: 'Zoomies', from: 10, blurb: 'Every day is the best day ever.', music: 'reggae' },
    { id: 2, name: 'Best friend', from: 20, blurb: 'The family is growing, and so is Oreo.', music: 'soul' },
    { id: 3, name: 'Old friend', from: 31, blurb: 'Slower walks. Longer naps. Just as much love.', music: 'jazz' },
  ];

  // The family, drawn with the same character art as the other Snoopster games.
  const FAMILY = {
    mia: [ // Mia grows up alongside Oreo
      { skin: '#e9b98f', hair: 'curly', hairCol: '#3b2414', top: 'tee', col: '#ff8ac0', legs: '#2f9bff', acc: 'none', build: 0.8, h: 0.66 },
      { skin: '#e9b98f', hair: 'curly', hairCol: '#3b2414', top: 'hoodie', col: '#b14bff', legs: '#2b3a67', acc: 'none', build: 0.88, h: 0.86 },
      { skin: '#e9b98f', hair: 'long', hairCol: '#3b2414', top: 'cardigan', col: '#39d0b8', legs: '#2b3a67', acc: 'earrings', build: 0.9, h: 0.97 },
      { skin: '#e9b98f', hair: 'bun', hairCol: '#3b2414', top: 'shirt', col: '#f2a93b', legs: '#2b3a67', acc: 'glasses', build: 0.92, h: 0.98 },
    ],
    mum: { skin: '#e9b98f', hair: 'bob', hairCol: '#6b3d1f', top: 'cardigan', col: '#7a9ad8', legs: '#2b3a67', acc: 'earrings', build: 0.95, h: 0.96 },
    dad: { skin: '#b97a4e', hair: 'short', hairCol: '#1c1410', top: 'shirt', col: '#2f6f5e', legs: '#4a3b2a', acc: 'beard', build: 1.15, h: 1.04 },
    ted: { skin: '#f0c9a8', hair: 'bald', hairCol: '#d9d9d9', top: 'cardigan', col: '#a7783f', legs: '#5b6470', acc: 'glasses', build: 1.05, h: 0.94 },
    leo: [
      null, null,
      { skin: '#d9a06f', hair: 'spiky', hairCol: '#3b2414', top: 'tee', col: '#ffcf3f', legs: '#2f9bff', acc: 'none', build: 0.7, h: 0.5 },
      { skin: '#d9a06f', hair: 'short', hairCol: '#3b2414', top: 'hoodie', col: '#e5483b', legs: '#2b3a67', acc: 'none', build: 0.82, h: 0.72 },
    ],
  };

  // Oreo's diary: one of these opens each ordinary day.
  const DIARY = [
    ['The big people call me Oreo. I think it means "good boy". I hope so.', 'Mum says I\'m a cockapoo: half cocker spaniel, half poodle, all trouble.', 'My fur is so curly that Dad lost a biscuit in it. I found it later. Lovely.', 'I found my tail today. It was behind me the whole time.', 'Mia smells like toast and happiness.', 'I barked at the hoover. The hoover did not apologise.', 'There is a dog in the oven door. He copies everything I do.', 'My paws are too big for me. Dad says I will "grow into them".'],
    ['Today I ran round the garden eleven times for no reason. It was brilliant.', 'The postman came. I protected everyone. You\'re welcome.', 'I can hear the cheese drawer from three rooms away.', 'Mia taught me a new word: "walkies". Best word.', 'A squirrel looked at me. I will never forgive it.', 'I helped Dad with the garden. He says I dug "the wrong hole".'],
    ['When Mia is happy, I\'m happy. When she\'s sad, I sit really close.', 'Leo shares his biscuits with me. Leo is my favourite. Don\'t tell Mia.', 'Mum pretends she doesn\'t let me on the sofa. She does.', 'I know everyone\'s footsteps now. Even Grandad Ted\'s slow shuffle.', 'I am very good at waiting by the door.', 'Dad and I watched the football. We both shouted at it.'],
    ['My legs are a bit stiff in the mornings now. The sun on the rug helps.', 'I don\'t run after the ball much any more. I watch it, and I remember.', 'Leo carries my ball for me now. He says I taught him how.', 'I sleep a lot more. I dream about the park.', 'My curls have gone grey round my nose. Mia says it makes me look wise.', 'Every day is still a good day. Some are just slower.'],
  ];

  // Things to do. Each day you get to pick two.
  const ACTIVITIES = {
    walk: { name: 'Go for a walk', icon: '🦮', place: 'park', energy: -18, happy: 14, bond: 4, tummy: -10, game: 'walk' },
    fetch: { name: 'Play fetch', icon: '🎾', place: 'park', energy: -22, happy: 16, bond: 5, tummy: -12, game: 'fetch' },
    trick: { name: 'Learn a trick', icon: '🐾', place: 'home', energy: -10, happy: 8, bond: 7, tummy: -4, game: 'trick' },
    cuddle: { name: 'Sofa cuddles', icon: '🛋️', place: 'home', energy: 4, happy: 10, bond: 9, tummy: -2, game: 'cuddle' },
    nap: { name: 'Nap in the sun', icon: '☀️', place: 'garden', energy: 30, happy: 4, bond: 1, tummy: -4, game: 'nap' },
    dig: { name: 'Dig in the garden', icon: '🦴', place: 'garden', energy: -14, happy: 12, bond: 2, tummy: -8, game: 'dig' },
  };

  const TRICKS = [
    { id: 'sit', name: 'Sit', icon: '🪑' }, { id: 'paw', name: 'Paw', icon: '🐾' }, { id: 'spin', name: 'Spin', icon: '🌀' },
    { id: 'roll', name: 'Roll over', icon: '🔄' }, { id: 'beg', name: 'Beg', icon: '🙏' }, { id: 'bang', name: 'Play dead', icon: '💥' },
  ];

  // Things buried in the garden.
  const TREASURES = ['an old tennis ball', 'Dad\'s missing sock', 'a very important stick', 'a bone from last summer', 'Mia\'s lost hair bobble', 'a toy dinosaur', 'a carrot (disappointing)', 'Grandad Ted\'s glasses'];

  // The big moments of a life. Each has a place, what happens, and how Oreo can respond.
  // Every choice is a kind one: they just make different memories.
  const EVENTS = {
    1: { place: 'home', who: ['mia', 'mum'], text: 'A box. A blanket. A big new smell. I\'m a very small, very fluffy cockapoo. The small human is called Mia. She\'s looking at me like I\'m the best thing she\'s ever seen.',
      opts: [{ label: 'Sniff her hand', reply: 'She giggled. Her hand smelled of toast. I decided to stay forever.', memory: 'First hello' },
        { label: 'Hide behind the sofa', reply: 'Mia lay on the floor and waited. After a while, I came out. She was still there. She\'s always still there.', memory: 'Brave enough' }] },
    2: { place: 'night', who: ['mia'], text: 'My first night. It\'s dark and quiet and I miss my brothers and sisters.',
      opts: [{ label: 'Cry a little', reply: 'Mia came downstairs in her pyjamas and slept on the floor next to my bed.', memory: 'First night' },
        { label: 'Snuggle the blanket', reply: 'The blanket smells like Mia. I\'m not alone. I\'m home.', memory: 'Home smell' }] },
    4: { place: 'garden', who: ['dad'], text: 'Dad is teaching me where to go to the toilet. Outside, apparently. Who knew?',
      opts: [{ label: 'Wee on the grass', reply: '"GOOD BOY!" Dad did a little dance. I\'ve never felt so proud.', memory: 'Good boy!' },
        { label: 'Wee on Dad\'s slipper', reply: 'Dad made a noise I\'ve not heard before. Then he laughed. Then he bought new slippers.', memory: 'The slipper incident' }] },
    6: { place: 'vet', who: ['mum'], text: 'The vet. A cold table, a funny smell and a kind lady with treats in her pocket.',
      opts: [{ label: 'Be very brave', reply: 'One tiny scratch and three treats. Mum said I was the bravest dog in Britain.', memory: 'Bravest dog in Britain' },
        { label: 'Shake like a leaf', reply: 'Mum held me the whole time and whispered that I was safe. I was.', memory: 'Safe with Mum' }] },
    9: { place: 'park', who: ['ted'], text: 'Mia\'s grandad, Ted, is taking me to the park. He walks very slowly.',
      opts: [{ label: 'Walk slowly with him', reply: 'We sat on the bench and watched the ducks. Ted told me about his old dog, Bramble. I think Bramble would have liked me.', memory: 'Bench with Ted' },
        { label: 'Bring him every stick', reply: 'Ted\'s pockets are now full of sticks. He says it\'s the best present he\'s had in years.', memory: 'Ted\'s stick collection' }] },
    12: { place: 'snow', who: ['mia', 'dad'], text: 'The whole world has gone white and cold and crunchy. WHAT IS THIS?',
      opts: [{ label: 'Eat the snow', reply: 'It tastes like cold nothing. I ate loads. Mia made a snow-dog that looked exactly like me.', memory: 'First snow' },
        { label: 'Zoom through it', reply: 'I did zoomies until I was a snowball with eyes. Dad had to dry me with Mum\'s best towel.', memory: 'Snowball with eyes' }] },
    14: { place: 'home', who: ['mia'], text: 'Mia came home from school really quiet. She didn\'t want to play.',
      opts: [{ label: 'Bring her my best toy', reply: 'She held my squeaky duck and told me everything. Then she smiled. Just a little one.', memory: 'Best medicine' },
        { label: 'Rest my head on her lap', reply: 'We sat like that for a long time. She said, "You always know." I do.', memory: 'I always know' }] },
    17: { place: 'beach', who: ['mia', 'mum', 'dad'], text: 'The beach! The sea keeps running at me and then running away again.',
      opts: [{ label: 'Chase the waves', reply: 'I chased the sea all day. I never caught it. Best day of my life.', memory: 'Chasing the sea' },
        { label: 'Dig a giant hole', reply: 'Dad helped. We dug to the middle of the earth (nearly). Mia buried Dad\'s legs.', memory: 'The great hole' }] },
    19: { place: 'home', who: ['mia', 'mum', 'dad'], text: 'It\'s Mia\'s birthday. There\'s a cake on the table. It\'s at exactly nose height.',
      opts: [{ label: 'Sit nicely and wait', reply: 'Mia gave me the first bit of crust. "Oreo gets the first slice. Always."', memory: 'First slice' },
        { label: 'Just one lick...', reply: 'The cake now has a nose-shaped dent. Everyone sang anyway. Mia said it made it "extra special".', memory: 'Extra special cake' }] },
    21: { place: 'home', who: ['mum', 'dad'], text: 'A tiny human has arrived. His name is Leo. He smells of milk and he\'s VERY loud.',
      opts: [{ label: 'Guard the cot', reply: 'I slept by the cot every night. Nobody asked me to. Somebody had to.', memory: 'Leo\'s guard' },
        { label: 'Give him a gentle sniff', reply: 'He grabbed my ear and laughed for the first time ever. Mum cried. Happy crying.', memory: 'Leo\'s first laugh' }] },
    24: { place: 'park', who: ['mia'], text: 'A squirrel! I ran and ran... and now I don\'t know where I am. Everything smells wrong.',
      opts: [{ label: 'Sit and wait', reply: 'I heard "OREO!" from far away. Mia ran across the whole park. She hugged me so tight. I\'ll never chase a squirrel again. (I will.)', memory: 'Found' },
        { label: 'Follow my nose home', reply: 'I followed the smell of toast all the way home. Everyone was out looking. Dad found me on the doorstep, waiting.', memory: 'The way home' }] },
    26: { place: 'home', who: ['leo', 'mum'], text: 'Leo is trying to stand up. He\'s holding onto my fur.',
      opts: [{ label: 'Stay very, very still', reply: 'He stood up. Then he took two steps. Holding onto me. Mum got it on video.', memory: 'Leo\'s first steps' },
        { label: 'Walk slowly beside him', reply: 'Step, step, wobble, step. We walked to the kitchen together. He fell on his bottom and laughed.', memory: 'Walking together' }] },
    29: { place: 'home', who: ['mia', 'mum', 'dad'], text: 'Mia is putting all her things in boxes. She\'s going somewhere called "university".',
      opts: [{ label: 'Sit in a box', reply: 'I sat in her box so she\'d take me too. She cried and laughed at the same time. "I\'ll be back, Oreo. I promise."', memory: 'Pack me too' },
        { label: 'Wait by the door', reply: 'I watched the car until it went round the corner. Then I lay on her jumper. It still smells like her.', memory: 'Her jumper' }] },
    32: { place: 'home', who: ['mia', 'leo'], text: 'The door. That car. Those footsteps. IT\'S MIA. SHE\'S HOME FOR CHRISTMAS.',
      opts: [{ label: 'ZOOMIES', reply: 'My legs don\'t work like they used to, but I did the best zoomies of my life. Three laps. Then a lie-down.', memory: 'She came back' },
        { label: 'Lean on her and sigh', reply: 'She sat on the floor with her coat still on. We didn\'t move for an hour.', memory: 'Home for Christmas' }] },
    34: { place: 'park', who: ['ted'], text: 'Ted and I are both old now. We sit on our bench. Neither of us hurries.',
      opts: [{ label: 'Lie on his feet', reply: '"Still my best mate," said Ted. We watched the ducks until the sun went down.', memory: 'Two old friends' },
        { label: 'Share his sandwich', reply: 'He pretended not to notice. He always pretends not to notice.', memory: 'Ted\'s sandwich' }] },
    37: { place: 'garden', who: ['mia', 'leo'], text: 'Mia has brought someone home. A puppy called Pickle. She\'s very bouncy and she wants to know EVERYTHING.',
      opts: [{ label: 'Show her the best sniffing spots', reply: 'I showed Pickle the cheese drawer, the sunny rug and the hole by the fence. She\'s learning fast.', memory: 'Teaching Pickle' },
        { label: 'Let her have my ball', reply: 'She carried it round all day like treasure. It is treasure. It\'s the best ball in the world.', memory: 'Passing it on' }] },
  };

  // The last day.
  const FINALE = {
    place: 'sunset',
    lines: [
      'The sun is warm today. Everyone is here.',
      'Mia is sitting next to me on the grass. Leo is holding my paw. Mum and Dad are pretending not to cry.',
      'I\'m very old now, and very tired, and very, very loved.',
      'I remember the box and the blanket. The snow. The sea. The squirrel (I nearly had him).',
      'I don\'t think "Oreo" means "good boy". I think it means "family".',
      'Thank you for taking me home.',
    ],
    epilogue: 'Pickle sleeps in Oreo\'s bed now. Every morning she checks the cheese drawer, waits by the door, and sits very close to Mia when she\'s sad. Somebody taught her well.',
  };

  // Background grooves for the shared synth engine.
  const GENRES = { soul: { bpm: 84 }, folk: { bpm: 92 }, jazz: { bpm: 96 }, reggae: { bpm: 74 } };

  G.OREO_DATA = { rng, hash, pick, LAST_DAY, CHAPTERS, FAMILY, DIARY, ACTIVITIES, TRICKS, TREASURES, EVENTS, FINALE, GENRES };
})(typeof window !== 'undefined' ? window : globalThis);
