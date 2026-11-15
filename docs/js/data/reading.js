// The Reading Room: from letters to real Persian — signs, menus, prices,
// messages from family and a first little story. Each item is shown in
// Persian first; she tries to read it, then reveals the answer.
// `say` (optional) is how the audio pronounces it when that differs from the
// transliteration shown.

export const READING = [
  {
    id: "r1",
    title: "Guessing the vowels",
    titleFa: "حدس زدن صداها",
    intro:
      "Persian writes the consonants and the long vowels (ا و ی), but leaves out the short ones (a, e, o) — like a text message. Real readers simply guess from words they know. Here are the tricks that make the guessing easy.",
    tips: [
      "ا in the middle or end of a word is a long â — as in مادر (mâdar).",
      "و between consonants is usually u, and ی is usually i: دوست (dust), سیب (sib).",
      "ه at the very end is usually a soft e: خانه (khâne).",
      "After خ, a silent و often hides before ا: خواهر is read khâhar.",
      "A little ـاً at the end says “an”: لطفاً (lotfan).",
    ],
    items: [
      { fa: "مادر", translit: "mâdar", meaning: "mother", note: "Cherry, cypress, bowed head, slide." },
      { fa: "پدر", translit: "pedar", meaning: "father", note: "No vowels written at all — you know it from the sound." },
      { fa: "برادر", translit: "barâdar", meaning: "brother", note: "Only the â is written." },
      { fa: "خواهر", translit: "khâhar", meaning: "sister", note: "The و after خ is silent." },
      { fa: "خواب", translit: "khâb", meaning: "sleep", note: "Silent و again." },
      { fa: "لطفاً", translit: "lotfan", meaning: "please", note: "The ـاً ending says “an”." },
      { fa: "ایرانی", translit: "irâni", meaning: "Iranian", note: "ی at the end means “of” or “from”: Iran → Iranian." },
      { fa: "کتابِ من", translit: "ketâb-e man", meaning: "my book", note: "The little ـِ (often unwritten) links words: “book-of me”." },
    ],
  },
  {
    id: "r2",
    title: "Numbers and prices",
    titleFa: "عددها و قیمت‌ها",
    intro:
      "Persian numerals look different from ours, but — good news — numbers are written left to right, just like in English, even inside right-to-left text. Prices are usually said in toman (one toman is ten rials), and people often drop the “thousand”.",
    tips: [
      "۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹ — zero to nine. ۰ is a dot, and ۵ looks like a little heart upside down.",
      "Numbers read left to right: ۲۵ is twenty-five.",
      "Price tags are usually in toman; if a tag looks ten times too big, it's in rial.",
      "In shops and taxis people say “panjâh” (fifty) and mean fifty thousand toman.",
    ],
    items: [
      { fa: "۱ یک", translit: "yek", meaning: "one", say: "yek" },
      { fa: "۲ دو", translit: "do", meaning: "two", say: "do" },
      { fa: "۳ سه", translit: "se", meaning: "three", say: "se" },
      { fa: "۴ چهار", translit: "chahâr", meaning: "four", say: "chahâr" },
      { fa: "۵ پنج", translit: "panj", meaning: "five", say: "panj" },
      { fa: "۶ شش", translit: "shesh", meaning: "six", say: "shesh" },
      { fa: "۷ هفت", translit: "haft", meaning: "seven", say: "haft" },
      { fa: "۸ هشت", translit: "hasht", meaning: "eight", say: "hasht" },
      { fa: "۹ نه", translit: "noh", meaning: "nine", say: "noh" },
      { fa: "۱۰ ده", translit: "dah", meaning: "ten", say: "dah" },
      { fa: "۲۰ بیست", translit: "bist", meaning: "twenty", say: "bist" },
      { fa: "۵۰ پنجاه", translit: "panjâh", meaning: "fifty", say: "panjâh" },
      { fa: "۱۰۰ صد", translit: "sad", meaning: "a hundred", say: "sad" },
      { fa: "۱۰۰۰ هزار", translit: "hezâr", meaning: "a thousand", say: "hezâr" },
      { fa: "۵۰ هزار تومان", translit: "panjâh hezâr tomân", meaning: "50,000 toman", note: "In speech: panjâh tomen." },
      { fa: "قیمت", translit: "gheymat", meaning: "price" },
    ],
  },
  {
    id: "r3",
    title: "Signs in the street",
    titleFa: "تابلوهای خیابان",
    intro:
      "Walking through Tehran or Shiraz, these are the words you'll see on doors, walls and street corners. Reading them feels like a superpower.",
    tips: [
      "Street names begin with خیابان (street), کوچه (lane) or میدان (square).",
      "Doors say بکشید (pull) or فشار دهید (push) — very handy!",
    ],
    items: [
      { fa: "ورود", translit: "vorud", meaning: "entrance" },
      { fa: "خروج", translit: "khoruj", meaning: "exit" },
      { fa: "ورود ممنوع", translit: "vorud mamnu'", meaning: "no entry" },
      { fa: "بکشید", translit: "bekeshid", meaning: "pull" },
      { fa: "فشار دهید", translit: "feshâr dahid", meaning: "push" },
      { fa: "باز", translit: "bâz", meaning: "open" },
      { fa: "بسته", translit: "baste", meaning: "closed" },
      { fa: "آقایان", translit: "âghâyân", meaning: "men (gentlemen)" },
      { fa: "بانوان", translit: "bânovân", meaning: "women (ladies)" },
      { fa: "سرویس بهداشتی", translit: "servis-e behdâshti", meaning: "toilets" },
      { fa: "خیابان", translit: "khiyâbân", meaning: "street" },
      { fa: "کوچه", translit: "kuche", meaning: "lane, alley" },
      { fa: "میدان", translit: "meydân", meaning: "square (said meydun)" },
      { fa: "ایستگاه مترو", translit: "istgâh-e metro", meaning: "metro station" },
      { fa: "داروخانه", translit: "dârukhâne", meaning: "pharmacy" },
      { fa: "بیمارستان", translit: "bimârestân", meaning: "hospital" },
      { fa: "نانوایی", translit: "nânvâyi", meaning: "bakery (for bread)" },
      { fa: "فرودگاه", translit: "forudgâh", meaning: "airport" },
    ],
  },
  {
    id: "r4",
    title: "Reading a menu",
    titleFa: "خواندن منو",
    intro:
      "Persian food is a big part of every visit. Here's a café and restaurant menu — read the name, guess, then peek. Your stomach will thank you.",
    tips: ["کباب at the end means it's grilled; خورش or a herb name usually means a slow stew served with rice."],
    items: [
      { fa: "چای", translit: "chây", meaning: "tea" },
      { fa: "قهوه", translit: "ghahve", meaning: "coffee" },
      { fa: "دوغ", translit: "dugh", meaning: "doogh — a salty yogurt drink with mint" },
      { fa: "چلوکباب", translit: "chelow kabâb", meaning: "rice with kebab", say: "chelo kabâb" },
      { fa: "جوجه‌کباب", translit: "juje kabâb", meaning: "saffron chicken kebab" },
      { fa: "کوبیده", translit: "kubide", meaning: "minced-meat kebab" },
      { fa: "قورمه‌سبزی", translit: "ghorme sabzi", meaning: "herb and bean stew" },
      { fa: "فسنجان", translit: "fesenjân", meaning: "pomegranate and walnut stew" },
      { fa: "ته‌دیگ", translit: "tahdig", meaning: "crispy golden rice" },
      { fa: "آش رشته", translit: "âsh-e reshte", meaning: "thick noodle and herb soup" },
      { fa: "ماست", translit: "mâst", meaning: "yogurt" },
      { fa: "سالاد شیرازی", translit: "sâlâd shirâzi", meaning: "Shirazi salad (cucumber, tomato, onion)" },
      { fa: "بستنی سنتی", translit: "bastani sonnati", meaning: "traditional saffron ice cream" },
      { fa: "فالوده", translit: "fâlude", meaning: "rosewater noodle sorbet" },
    ],
  },
  {
    id: "r5",
    title: "Messages from family",
    titleFa: "پیام‌های خانواده",
    intro:
      "Family messages are written the way people speak — short, warm and full of love. Here are the kinds of texts you might get before a visit.",
    tips: ["Casual writing often shortens words: می‌خوام for می‌خواهم (I want), برات for برای تو (for you)."],
    items: [
      { fa: "سلام عزیزم!", translit: "salâm azizam!", meaning: "Hello my dear!" },
      { fa: "کی می‌رسی؟", translit: "key mirasi?", meaning: "When do you arrive?" },
      { fa: "منتظرتیم", translit: "montazeretim", meaning: "We're waiting for you" },
      { fa: "دلمون برات تنگ شده", translit: "delemun barât tang shode", meaning: "We miss you (our hearts are tight for you)" },
      { fa: "فردا ساعت ۸ فرودگاهیم", translit: "fardâ sâ'at-e hasht forudgâhim", meaning: "Tomorrow at 8 we'll be at the airport" },
      { fa: "شام بیا خونه‌ی ما", translit: "shâm biyâ khune-ye mâ", meaning: "Come to our place for dinner" },
      { fa: "مواظب خودت باش", translit: "movâzeb-e khodet bâsh", meaning: "Take care of yourself" },
      { fa: "بوس!", translit: "bus!", meaning: "Kisses! (how Iranians sign off)" },
    ],
  },
  {
    id: "r6",
    title: "Your first story",
    titleFa: "اولین داستان",
    intro:
      "A tiny story about tea at grandma's house, one sentence at a time. Read each sentence, then reveal. By the end you'll have read a whole Persian story!",
    tips: ["است (ast) means “is”; in speech it becomes a little -e on the end: خوشمزه است → khoshmaze-st."],
    items: [
      { fa: "امروز جمعه است.", translit: "emruz jom'e ast.", meaning: "Today is Friday.", note: "Friday is the weekend in Iran — family day." },
      { fa: "ما خانهٔ مادربزرگ هستیم.", translit: "mâ khâne-ye mâdarbozorg hastim.", meaning: "We are at Grandma's house." },
      { fa: "مادربزرگ چای می‌آورد.", translit: "mâdarbozorg chây miâvarad.", meaning: "Grandma brings tea." },
      { fa: "چای داغ و خوشبو است.", translit: "chây dâgh va khoshbu ast.", meaning: "The tea is hot and fragrant." },
      { fa: "من می‌گویم: «مرسی، خیلی خوشمزه است!»", translit: "man miguyam: «mersi, kheyli khoshmaze ast!»", meaning: "I say: “Thanks, it's delicious!”" },
      { fa: "مادربزرگ می‌خندد و می‌گوید: «نوش جان!»", translit: "mâdarbozorg mikhandad va miguyad: «nush-e jân!»", meaning: "Grandma laughs and says: “Enjoy!”" },
    ],
  },
];

export const BY_READING = Object.fromEntries(READING.map((r) => [r.id, r]));
