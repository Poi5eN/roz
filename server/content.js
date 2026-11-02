// Question bank. [sentence, emoji, word, hindi, [[emoji, word], [emoji, word]]]
// Add more rows to grow the game - no other code changes needed.
const ROWS = [
  ["Please drink some water.", "💧", "water", "पानी", [["🍞", "bread"], ["🔥", "fire"]]],
  ["The baby is sleeping.", "😴", "sleep", "सोना", [["🏃", "run"], ["🍽️", "eat"]]],
  ["It is raining today.", "🌧️", "rain", "बारिश", [["☀️", "sun"], ["❄️", "snow"]]],
  ["I take the bus to work.", "🚌", "bus", "बस", [["✈️", "plane"], ["🚲", "bicycle"]]],
  ["My phone needs charging.", "🔋", "battery", "बैटरी", [["🔑", "key"], ["🎁", "gift"]]],
  ["Open the door, please.", "🚪", "door", "दरवाज़ा", [["🪟", "window"], ["🛏️", "bed"]]],
  ["She is reading a book.", "📖", "book", "किताब", [["⚽", "ball"], ["🎤", "microphone"]]],
  ["We eat rice for lunch.", "🍚", "rice", "चावल", [["🥛", "milk"], ["🍌", "banana"]]],
  ["He has a fever.", "🤒", "sick", "बीमार", [["😄", "happy"], ["😡", "angry"]]],
  ["Wash your hands with soap.", "🧼", "soap", "साबुन", [["🧹", "broom"], ["🧺", "basket"]]],
  ["The farmer is in the field.", "🧑‍🌾", "farmer", "किसान", [["👩‍🏫", "teacher"], ["👮", "police"]]],
  ["I need money for the market.", "💰", "money", "पैसे", [["🎁", "gift"], ["🔒", "lock"]]],
  ["The sun is hot today.", "☀️", "sun", "सूरज", [["🌙", "moon"], ["☁️", "cloud"]]],
  ["Please close the window.", "🪟", "window", "खिड़की", [["🚪", "door"], ["🪑", "chair"]]],
  ["My mother is cooking.", "👩‍🍳", "cook", "खाना बनाना", [["🧑‍⚕️", "doctor"], ["🚗", "car"]]],
  ["The cow gives milk.", "🐄", "cow", "गाय", [["🐔", "hen"], ["🐕", "dog"]]],
  ["Please call me tonight.", "📞", "call", "फ़ोन करना", [["💬", "message"], ["📷", "camera"]]],
  ["The train is late.", "🚆", "train", "रेलगाड़ी", [["🚢", "ship"], ["🛵", "scooter"]]],
  ["The tree gives shade.", "🌳", "tree", "पेड़", [["🏠", "house"], ["⛰️", "mountain"]]],
  ["I wear a shirt.", "👕", "shirt", "कमीज़", [["👟", "shoes"], ["🧢", "cap"]]],
  ["Please wear your shoes.", "👟", "shoes", "जूते", [["👕", "shirt"], ["🧤", "gloves"]]],
  ["The doctor will see you now.", "🧑‍⚕️", "doctor", "डॉक्टर", [["👩‍🍳", "cook"], ["🧑‍🌾", "farmer"]]],
  ["Switch on the light.", "💡", "light", "बत्ती", [["📺", "TV"], ["🔔", "bell"]]],
  ["Let us watch TV.", "📺", "TV", "टीवी", [["📻", "radio"], ["💻", "laptop"]]],
  ["I want a cup of tea.", "☕", "tea", "चाय", [["🥛", "milk"], ["💧", "water"]]],
  ["The moon is bright tonight.", "🌙", "moon", "चाँद", [["☀️", "sun"], ["⭐", "star"]]],
  ["Eat a banana.", "🍌", "banana", "केला", [["🍎", "apple"], ["🥭", "mango"]]],
  ["The fish swims in the river.", "🐟", "fish", "मछली", [["🐦", "bird"], ["🐍", "snake"]]],
  ["Ring the bell.", "🔔", "bell", "घंटी", [["🔑", "key"], ["🔒", "lock"]]]
];

export const ITEMS = ROWS.map(([say, emoji, word, hi, ds], i) => ({
  id: "q" + String(i + 1).padStart(3, "0"),
  say, hi,
  correct: { emoji, word },
  distractors: ds.map(([e, w]) => ({ emoji: e, word: w }))
}));
