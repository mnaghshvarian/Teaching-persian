// The 32 letters of the Persian alphabet, in dictionary order.
// name: how the letter is called; spoken: Persian spelling of the name (for audio)
// sound: what it says; hint: how to make the sound with English (or Scottish!) sounds
// shape: a picture to remember it by; persian: one of the four letters Persian invented
// joins: false for the seven "shy" letters that never join the letter after them
// word / extra: example words (fa, translit, meaning)

export const ALPHABET = [
  {
    id: "alef", char: "ا", name: "alef", spoken: "الف", sound: "â / a", family: "alef", joins: false,
    hint: "At the start of a word it carries a vowel (a, e or o). In the middle or end it's a long â, like the 'a' in 'father'. With a little hat — آ — it's always a long â.",
    shape: "A tall, straight cypress tree. The cypress (سرو, sarv) stands in every Persian garden.",
    word: { fa: "انار", translit: "anâr", meaning: "pomegranate" },
    extra: { fa: "آب", translit: "âb", meaning: "water" },
  },
  {
    id: "be", char: "ب", name: "be", spoken: "بِ", sound: "b", family: "boat", joins: true,
    hint: "Just like the English 'b' in 'baby'.",
    shape: "A little boat with one pebble underneath.",
    word: { fa: "بابا", translit: "bâbâ", meaning: "dad" },
    extra: { fa: "باغ", translit: "bâgh", meaning: "garden" },
  },
  {
    id: "pe", char: "پ", name: "pe", spoken: "پِ", sound: "p", family: "boat", joins: true, persian: true,
    hint: "Like the English 'p' in 'picnic'.",
    shape: "The boat again, with three pebbles underneath. One of Persia's own letters!",
    word: { fa: "پنیر", translit: "panir", meaning: "cheese" },
    extra: { fa: "پرنده", translit: "parande", meaning: "bird" },
  },
  {
    id: "te", char: "ت", name: "te", spoken: "تِ", sound: "t", family: "boat", joins: true,
    hint: "Like the English 't', but softer — the tongue touches the back of the teeth.",
    shape: "The boat with two birds sitting on top.",
    word: { fa: "توت", translit: "tut", meaning: "mulberry" },
    extra: { fa: "تاب", translit: "tâb", meaning: "swing" },
  },
  {
    id: "se", char: "ث", name: "se", spoken: "ثِ", sound: "s", family: "boat", joins: true,
    hint: "Just an 's', as in 'sun'. It's a guest letter from Arabic, used in borrowed words.",
    shape: "The boat with three birds on top.",
    word: { fa: "ثانیه", translit: "sâniye", meaning: "second (of time)" },
    extra: { fa: "مثل", translit: "mesl", meaning: "like, as" },
  },
  {
    id: "jim", char: "ج", name: "jim", spoken: "جیم", sound: "j", family: "cup", joins: true,
    hint: "Like the English 'j' in 'jam'.",
    shape: "A cup with one seed inside.",
    word: { fa: "جان", translit: "jân (said 'joon')", meaning: "dear, soul — said after a name with love" },
    extra: { fa: "جوجه", translit: "juje", meaning: "chick (as in juje kabâb)" },
  },
  {
    id: "che", char: "چ", name: "che", spoken: "چِ", sound: "ch", family: "cup", joins: true, persian: true,
    hint: "Like the English 'ch' in 'cheese'.",
    shape: "The cup with three seeds inside. Persia invented this one too.",
    word: { fa: "چای", translit: "chây", meaning: "tea" },
    extra: { fa: "چشم", translit: "cheshm", meaning: "eye — and also 'gladly, of course!'" },
  },
  {
    id: "he-jimi", char: "ح", name: "he (jimi)", spoken: "حِ", sound: "h", family: "cup", joins: true,
    hint: "An 'h' as in 'hello'. Persian has two h letters; this one is the 'cup h'.",
    shape: "An empty cup — no dots at all.",
    word: { fa: "حال", translit: "hâl", meaning: "mood, how you are" },
    extra: { fa: "حلوا", translit: "halvâ", meaning: "halva (a sweet)" },
  },
  {
    id: "khe", char: "خ", name: "khe", spoken: "خِ", sound: "kh", family: "cup", joins: true,
    hint: "Exactly the 'ch' in the Scottish 'loch'. You already own this sound!",
    shape: "The cup with one dot on top, like a little steam puff.",
    word: { fa: "خوب", translit: "khub", meaning: "good" },
    extra: { fa: "خانه", translit: "khâne", meaning: "home, house" },
  },
  {
    id: "dal", char: "د", name: "dâl", spoken: "دال", sound: "d", family: "dal", joins: false,
    hint: "Like the English 'd', soft, with the tongue on the back of the teeth.",
    shape: "A small bowed head, like someone saying 'thank you'. A shy letter.",
    word: { fa: "دل", translit: "del", meaning: "heart (where Persian feelings live)" },
    extra: { fa: "درخت", translit: "derakht", meaning: "tree" },
  },
  {
    id: "zal", char: "ذ", name: "zâl", spoken: "ذال", sound: "z", family: "dal", joins: false,
    hint: "A 'z' as in 'zoo'. A guest letter from Arabic.",
    shape: "The bowed head wearing a one-dot hat.",
    word: { fa: "ذرت", translit: "zorrat", meaning: "corn" },
    extra: { fa: "لذیذ", translit: "laziz", meaning: "delicious" },
  },
  {
    id: "re", char: "ر", name: "re", spoken: "رِ", sound: "r", family: "re", joins: false,
    hint: "A light tap of the tongue — very close to a Scottish 'r' in 'very'.",
    shape: "A little slide, or a leaf falling below the line.",
    word: { fa: "روز", translit: "ruz", meaning: "day" },
    extra: { fa: "رنگ", translit: "rang", meaning: "colour" },
  },
  {
    id: "ze", char: "ز", name: "ze", spoken: "زِ", sound: "z", family: "re", joins: false,
    hint: "Like the English 'z' in 'zebra'.",
    shape: "The slide with one dot on top.",
    word: { fa: "زیبا", translit: "zibâ", meaning: "beautiful" },
    extra: { fa: "زرد", translit: "zard", meaning: "yellow" },
  },
  {
    id: "zhe", char: "ژ", name: "zhe", spoken: "ژِ", sound: "zh", family: "re", joins: false, persian: true,
    hint: "The soft sound in the middle of 'measure' or 'pleasure'.",
    shape: "The slide with three dots on top. A Persian original!",
    word: { fa: "ژاکت", translit: "zhâkat", meaning: "cardigan, jacket — handy in a Toronto winter" },
    extra: { fa: "ژاله", translit: "zhâle", meaning: "dew" },
  },
  {
    id: "sin", char: "س", name: "sin", spoken: "سین", sound: "s", family: "teeth", joins: true,
    hint: "Like the English 's' in 'sun'.",
    shape: "Three little teeth smiling on the line.",
    word: { fa: "سلام", translit: "salâm", meaning: "hello" },
    extra: { fa: "سیب", translit: "sib", meaning: "apple" },
  },
  {
    id: "shin", char: "ش", name: "shin", spoken: "شین", sound: "sh", family: "teeth", joins: true,
    hint: "Like the English 'sh' in 'shell'.",
    shape: "The three teeth with three sparkles on top.",
    word: { fa: "شیرین", translit: "shirin", meaning: "sweet (and my name!)" },
    extra: { fa: "شب", translit: "shab", meaning: "night" },
  },
  {
    id: "sad", char: "ص", name: "sâd", spoken: "صاد", sound: "s", family: "sad", joins: true,
    hint: "Just an 's' again — Persian has three of them! A guest letter from Arabic.",
    shape: "A loop lying down with a little tooth, then a bowl.",
    word: { fa: "صبح", translit: "sobh", meaning: "morning" },
    extra: { fa: "صدا", translit: "sedâ", meaning: "sound, voice" },
  },
  {
    id: "zad", char: "ض", name: "zâd", spoken: "ضاد", sound: "z", family: "sad", joins: true,
    hint: "A 'z'. Another guest from Arabic.",
    shape: "The same loop-and-bowl, with one dot on top.",
    word: { fa: "حوض", translit: "howz", meaning: "the little pool in a Persian courtyard" },
    extra: { fa: "راضی", translit: "râzi", meaning: "content, satisfied" },
  },
  {
    id: "ta", char: "ط", name: "tâ", spoken: "طا", sound: "t", family: "ta", joins: true,
    hint: "A 't', the same as ت. A guest letter from Arabic.",
    shape: "A loop with a tall stick — like a hand mirror.",
    word: { fa: "طوطی", translit: "tuti", meaning: "parrot" },
    extra: { fa: "طلا", translit: "talâ", meaning: "gold" },
  },
  {
    id: "za", char: "ظ", name: "zâ", spoken: "ظا", sound: "z", family: "ta", joins: true,
    hint: "A 'z' — the fourth z! Don't worry, they all sound the same.",
    shape: "The hand mirror with one dot.",
    word: { fa: "خداحافظ", translit: "khodâhâfez", meaning: "goodbye (\"God keep you\")" },
    extra: { fa: "ظهر", translit: "zohr", meaning: "noon" },
  },
  {
    id: "eyn", char: "ع", name: "eyn", spoken: "عین", sound: "' (a tiny catch)", family: "eyn", joins: true,
    hint: "In everyday Persian it's a tiny catch in the throat, like the break in 'uh-oh' — or simply the vowel next to it.",
    shape: "An open mouth, or a curl of ribbon.",
    word: { fa: "عشق", translit: "eshgh", meaning: "love" },
    extra: { fa: "عسل", translit: "asal", meaning: "honey (also 'sweetheart')" },
  },
  {
    id: "gheyn", char: "غ", name: "gheyn", spoken: "غین", sound: "gh", family: "eyn", joins: true,
    hint: "A soft gargle at the back of the throat, like the French 'r' in 'Paris'.",
    shape: "The ribbon with one dot on top.",
    word: { fa: "باغ", translit: "bâgh", meaning: "garden" },
    extra: { fa: "غذا", translit: "ghazâ", meaning: "food" },
  },
  {
    id: "fe", char: "ف", name: "fe", spoken: "فِ", sound: "f", family: "loop", joins: true,
    hint: "Like the English 'f' in 'flower'.",
    shape: "A small loop with one dot — like a bird's head on a branch.",
    word: { fa: "فارسی", translit: "fârsi", meaning: "Persian (the language)" },
    extra: { fa: "فال", translit: "fâl", meaning: "fortune (as in fâl-e Hâfez)" },
  },
  {
    id: "ghaf", char: "ق", name: "ghâf", spoken: "قاف", sound: "gh", family: "loop", joins: true,
    hint: "In Iran it sounds the same as غ — a soft gargle.",
    shape: "A loop with two dots and a deeper, rounder bowl.",
    word: { fa: "قند", translit: "ghand", meaning: "sugar cube (English 'candy' comes from it!)" },
    extra: { fa: "قلب", translit: "ghalb", meaning: "heart" },
  },
  {
    id: "kaf", char: "ک", name: "kâf", spoken: "کاف", sound: "k", family: "kaf", joins: true,
    hint: "Like the English 'k' in 'kite'.",
    shape: "A slanted roof with a little floor.",
    word: { fa: "کتاب", translit: "ketâb", meaning: "book" },
    extra: { fa: "کباب", translit: "kabâb", meaning: "kebab" },
  },
  {
    id: "gaf", char: "گ", name: "gâf", spoken: "گاف", sound: "g", family: "kaf", joins: true, persian: true,
    hint: "Like the English 'g' in 'garden'.",
    shape: "The roof with a second roof line. The fourth Persian original!",
    word: { fa: "گل", translit: "gol", meaning: "flower, rose" },
    extra: { fa: "گربه", translit: "gorbe", meaning: "cat" },
  },
  {
    id: "lam", char: "ل", name: "lâm", spoken: "لام", sound: "l", family: "lam", joins: true,
    hint: "Like the English 'l' in 'lemon'.",
    shape: "A tall shepherd's crook, or a fishing hook.",
    word: { fa: "لیمو", translit: "limu", meaning: "lemon" },
    extra: { fa: "لبخند", translit: "labkhand", meaning: "smile" },
  },
  {
    id: "mim", char: "م", name: "mim", spoken: "میم", sound: "m", family: "mim", joins: true,
    hint: "Like the English 'm' in 'moon'.",
    shape: "A little round bead with a tail — like a cherry on its stem.",
    word: { fa: "مرسی", translit: "mersi", meaning: "thanks (yes, from French!)" },
    extra: { fa: "ماه", translit: "mâh", meaning: "moon, month" },
  },
  {
    id: "nun", char: "ن", name: "nun", spoken: "نون", sound: "n", family: "nun", joins: true,
    hint: "Like the English 'n' in 'night'.",
    shape: "A round bowl holding one grain of rice.",
    word: { fa: "نان", translit: "nân", meaning: "bread" },
    extra: { fa: "نوروز", translit: "nowruz", meaning: "Persian New Year (\"new day\")" },
  },
  {
    id: "vav", char: "و", name: "vâv", spoken: "واو", sound: "v / u / o", family: "vav", joins: false,
    hint: "Three voices: 'v' as in 'violet', 'oo' as in 'moon', or 'o'. On its own, و means 'and' (said 'o').",
    shape: "A round head with a tail curling below — like a tadpole. A shy letter.",
    word: { fa: "دوست", translit: "dust", meaning: "friend" },
    extra: { fa: "وقت", translit: "vaght", meaning: "time" },
  },
  {
    id: "he-docheshm", char: "ه", name: "he (do-cheshm)", spoken: "هِ", sound: "h / e", family: "he", joins: true,
    hint: "An 'h' as in 'hello'. At the end of a word it often just makes an 'e' sound, as in خانه (khâne).",
    shape: "A little round flower. In the middle of a word it looks like two eyes: ـهـ — its name means 'two-eyed h'.",
    word: { fa: "هوا", translit: "havâ", meaning: "air, weather" },
    extra: { fa: "خانه", translit: "khâne", meaning: "home" },
  },
  {
    id: "ye", char: "ی", name: "ye", spoken: "یِ", sound: "y / i", family: "ye", joins: true,
    hint: "'y' as in 'yes', or a long 'ee' as in 'see'. Fun fact: in Persian, its dots disappear at the end of a word.",
    shape: "A swan gliding on the water, with two dots below when it's at the start or middle.",
    word: { fa: "یک", translit: "yek", meaning: "one" },
    extra: { fa: "دریا", translit: "daryâ", meaning: "sea" },
  },
];

export const BY_ID = Object.fromEntries(ALPHABET.map((l) => [l.id, l]));
export const BY_CHAR = Object.fromEntries(ALPHABET.map((l) => [l.char, l]));

export const FAMILIES = {
  alef: "The cypress",
  boat: "The little boats",
  cup: "The cups",
  dal: "The bowed heads",
  re: "The slides",
  teeth: "The smiling teeth",
  sad: "The loops & bowls",
  ta: "The hand mirrors",
  eyn: "The ribbons",
  loop: "The bird heads",
  kaf: "The roofs",
  lam: "The crook",
  mim: "The cherry",
  nun: "The rice bowl",
  vav: "The tadpole",
  he: "The two eyes",
  ye: "The swan",
};

// The four letters Persian added to the Arabic script.
export const PERSIAN_ORIGINALS = ["پ", "چ", "ژ", "گ"];
// The seven letters that never join to the next letter.
export const SHY_LETTERS = ["ا", "د", "ذ", "ر", "ز", "ژ", "و"];
