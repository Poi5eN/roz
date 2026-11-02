// Question bank. [sentence, emoji, word, hindi, [[emoji, word], [emoji, word]]]
// Add more rows to grow the game - no other code changes needed.
const ROWS = [
  // Everyday basics
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
  ["Ring the bell.", "🔔", "bell", "घंटी", [["🔑", "key"], ["🔒", "lock"]]],

  // Farm
  ["The farmer drives a tractor.", "🚜", "tractor", "ट्रैक्टर", [["🚗", "car"], ["⛵", "boat"]]],
  ["Plant the seeds in soil.", "🌱", "seeds", "बीज", [["🪨", "stone"], ["🪵", "wood"]]],
  ["The wheat crop is ready.", "🌾", "wheat", "गेहूं", [["🌻", "sunflower"], ["🌲", "tree"]]],
  ["The goat eats grass.", "🐐", "goat", "बकरी", [["🐅", "tiger"], ["🐘", "elephant"]]],
  ["The rooster crows early.", "🐓", "rooster", "मुर्गा", [["🦆", "duck"], ["🦉", "owl"]]],
  ["Pull the carrot from the farm.", "🥕", "carrot", "गाजर", [["🍞", "bread"], ["🧀", "cheese"]]],

  // Market
  ["Buy fresh tomatoes today.", "🍅", "tomato", "टमाटर", [["🍋", "lemon"], ["🍇", "grapes"]]],
  ["Put the vegetables in the bag.", "🛍️", "bag", "थैला", [["📦", "box"], ["🧳", "suitcase"]]],
  ["Cut the onion for dinner.", "🧅", "onion", "प्याज़", [["🌽", "corn"], ["🫑", "pepper"]]],
  ["Sweet mangoes are in the market.", "🥭", "mango", "आम", [["🍉", "watermelon"], ["🍓", "strawberry"]]],
  ["Weigh the potatoes on the scale.", "🥔", "potato", "आलू", [["🥥", "coconut"], ["🍍", "pineapple"]]],
  ["Pay with paper cash.", "💵", "cash", "रोकड़", [["💳", "card"], ["🎫", "ticket"]]],

  // Health
  ["Take this medicine after food.", "💊", "medicine", "दवाई", [["🍬", "candy"], ["🧴", "lotion"]]],
  ["Visit the doctor at the hospital.", "🏥", "hospital", "अस्पताल", [["🏫", "school"], ["🏦", "bank"]]],
  ["Put a bandage on the wound.", "🩹", "bandage", "पट्टी", [["✂️", "scissors"], ["🧷", "pin"]]],
  ["Eat a red apple every day.", "🍎", "apple", "सेब", [["🍒", "cherry"], ["🍑", "peach"]]],
  ["Brush your teeth well.", "🪥", "toothbrush", "टूथब्रश", [["🪞", "mirror"], ["🪮", "comb"]]],
  ["My eye is red and itching.", "👁️", "eye", "आँख", [["👂", "ear"], ["👃", "nose"]]],

  // Phone & Technology
  ["Send a text message.", "💬", "message", "संदेश", [["📧", "email"], ["📦", "package"]]],
  ["Take a photo with the camera.", "📷", "camera", "कैमरा", [["🔦", "torch"], ["🎙️", "microphone"]]],
  ["Plug in the phone charger.", "🔌", "charger", "चार्जर", [["🔋", "battery"], ["💡", "light"]]],
  ["Type on the computer.", "💻", "computer", "कंप्यूटर", [["📱", "phone"], ["📠", "fax"]]],
  ["Listen with your headphones.", "🎧", "headphones", "हेडफ़ोन", [["👓", "glasses"], ["🕶️", "sunglasses"]]],

  // Transport
  ["Hail an auto rickshaw.", "🛺", "rickshaw", "ऑटो", [["🏎️", "racecar"], ["🚒", "fire engine"]]],
  ["Ride the bicycle to class.", "🚲", "bicycle", "साइकिल", [["🛵", "scooter"], ["🛹", "skateboard"]]],
  ["The airplane flies high.", "✈️", "airplane", "हवाई जहाज़", [["🚁", "helicopter"], ["🚀", "rocket"]]],
  ["Show your travel ticket.", "🎫", "ticket", "टिकट", [["📜", "paper"], ["✉️", "envelope"]]],
  ["Drive the car carefully.", "🚗", "car", "गाड़ी", [["🚜", "tractor"], ["🚚", "truck"]]],

  // Family
  ["My father is working.", "👨", "father", "पिताजी", [["👦", "boy"], ["👴", "grandfather"]]],
  ["My sister helps with homework.", "👧", "sister", "बहन", [["👶", "baby"], ["👵", "grandmother"]]],
  ["My brother is playing outside.", "👦", "brother", "भाई", [["👨", "father"], ["🧔", "uncle"]]],
  ["Grandmother tells old stories.", "👵", "grandmother", "दादी", [["👩", "woman"], ["👧", "girl"]]],
  ["Grandfather goes for a walk.", "👴", "grandfather", "दादाजी", [["👨", "father"], ["👦", "boy"]]],

  // Time & Daily Routine
  ["The alarm clock is ringing.", "⏰", "clock", "घड़ी", [["⌛", "hourglass"], ["🧭", "compass"]]],
  ["Wake up at sunrise.", "🌅", "sunrise", "सुबह", [["🌆", "sunset"], ["🌃", "night"]]],
  ["The stars shine at night.", "⭐", "star", "तारा", [["☀️", "sun"], ["⚡", "lightning"]]]
];

export const ITEMS = ROWS.map(([say, emoji, word, hi, ds], i) => ({
  id: "q" + String(i + 1).padStart(3, "0"),
  say, hi,
  correct: { emoji, word },
  distractors: ds.map(([e, w]) => ({ emoji: e, word: w }))
}));
