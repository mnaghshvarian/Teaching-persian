// The Garden Path: fourteen short stops. Each one introduces a family of
// letters, a handful of real words (the new letter is highlighted inside
// them), a story from Persian history and culture, and grows one plant in
// her garden.

export const LESSONS = [
  {
    id: "l0",
    title: "Salâm! Welcome to the garden",
    titleFa: "سلام",
    plant: "pool",
    plantName: "water for the courtyard pool (حوض, howz)",
    bloomText: "Water is flowing into your courtyard pool (حوض, howz). Every Persian garden begins with water. 🌿",
    letters: [],
    intro:
      "سلام (salâm)! I'm Shirin, and this garden is yours. No letters yet — today we simply say hello. Persian is read from right to left, like walking into a garden from the other gate. 🌿",
    words: [
      { fa: "سلام", translit: "salâm", meaning: "hello", note: "Works any time of day, with anyone." },
      { fa: "مرسی", translit: "mersi", meaning: "thanks", note: "Borrowed from French — Iranians say it all the time." },
      { fa: "خداحافظ", translit: "khodâhâfez", meaning: "goodbye", note: "Literally 'may God keep you'. The kh is your Scottish 'loch'!" },
      { fa: "جان", translit: "jân (said 'joon')", meaning: "dear", note: "Add it after a name to say it with love: 'Shirin joon'." },
    ],
    story: {
      title: "A language of a hundred million voices",
      body:
        "Persian is spoken by around a hundred million people. In Iran it's called Farsi, in Afghanistan Dari, and in Tajikistan Tajik — cousins who understand one another. It is one of the world's great languages of poetry: for a thousand years, poets from Shiraz to Delhi wrote in Persian, and many Iranians can still quote verses by heart. It's also a gentle language to begin: no 'he' or 'she' to worry about, no 'the' or 'a', and words that often sound soft and round.",
      bridge:
        "Toronto has one of the largest Iranian communities outside Iran — some Iranian-Canadians lovingly call it 'Tehranto'. Persian is all around you on Yonge Street.",
    },
    closing: { fa: "خوش آمدی", translit: "khosh âmadi", meaning: "welcome — 'your coming is a joy'" },
  },
  {
    id: "l1",
    title: "The tall cypress",
    titleFa: "الف",
    plant: "cypress",
    plantName: "a cypress tree (سرو, sarv)",
    letters: ["ا"],
    intro:
      "Our first letter is alef, ا — tall and straight like a cypress tree. With a little hat, آ, it always says a long 'â', like the 'a' in 'father'. Let's plant it.",
    words: [
      { fa: "آب", translit: "âb", meaning: "water", note: "آ with its hat at the start, then a ب.", focus: "ا" },
      { fa: "انار", translit: "anâr", meaning: "pomegranate", note: "Alef twice: first 'a', then a long 'â'.", focus: "ا" },
      { fa: "آسمان", translit: "âsemân", meaning: "sky", note: "Can you spot alef at the start and in the middle?", focus: "ا" },
      { fa: "ایران", translit: "irân", meaning: "Iran", note: "At the start, alef carries the 'i' sound here.", focus: "ا" },
    ],
    story: {
      title: "Paradise was a Persian garden",
      body:
        "Long ago, Persians built walled gardens in the dry land: a square divided into four by little channels of water, with a pool in the middle, fruit trees for shade and tall cypresses standing guard. The Old Persian word for such a walled garden became, through Greek and Latin, the English word 'paradise'. These gardens — باغ (bâgh) — still exist in Shiraz, Isfahan and Kashan, and UNESCO protects a group of them as World Heritage. The cypress, evergreen and upright, became a symbol of steadfastness and of a graceful beloved in Persian poetry.",
      bridge: "Every time someone in English says 'paradise', they are speaking a little Persian.",
    },
    closing: { fa: "آفرین", translit: "âfarin", meaning: "well done!" },
  },
  {
    id: "l2",
    title: "The little boats",
    titleFa: "ب پ ت ث",
    plant: "jasmine",
    plantName: "a jasmine bush (یاس, yâs)",
    letters: ["ب", "پ", "ت", "ث"],
    intro:
      "Four letters, one shape: a little boat. Only the dots change. One pebble under the boat is ب (b), three pebbles is پ (p), two birds on top is ت (t), three birds is ث (s). Dots are the whole secret!",
    words: [
      { fa: "بابا", translit: "bâbâ", meaning: "dad", note: "Boat, cypress, boat, cypress.", focus: "ب" },
      { fa: "باغ", translit: "bâgh", meaning: "garden", note: "Our garden word — the boat starts it.", focus: "ب" },
      { fa: "پنیر", translit: "panir", meaning: "cheese", note: "نان و پنیر (nân o panir) — bread and cheese — is a classic Persian breakfast.", focus: "پ" },
      { fa: "توت", translit: "tut", meaning: "mulberry", note: "Two ت with a و between them.", focus: "ت" },
      { fa: "ثانیه", translit: "sâniye", meaning: "a second (of time)", note: "ث says 's' — it lives mostly in words from Arabic.", focus: "ث" },
    ],
    story: {
      title: "Four letters Persia invented",
      body:
        "Persian has been written in many scripts. Kings like Darius carved Old Persian in wedge-shaped cuneiform at Persepolis; later came the Pahlavi script. After the Arab conquest in the 7th century, Persians gradually adopted the Arabic alphabet — but Arabic had no letters for p, ch, zh or g. So Persian simply made them, by adding dots and strokes to letters that already existed: پ چ ژ گ. Those four letters are Persia's own signature on the alphabet, and you just met the first one.",
      bridge: "English did something similar: 'w' began as a doubled 'u' — which is why we still call it 'double-u'.",
    },
    closing: { fa: "عالی بود", translit: "âli bud", meaning: "that was wonderful" },
  },
  {
    id: "l3",
    title: "The cups",
    titleFa: "ج چ ح خ",
    plant: "saffron",
    plantName: "saffron crocuses (زعفران, za'farân)",
    letters: ["ج", "چ", "ح", "خ"],
    intro:
      "Now four little cups. One seed inside is ج (j), three seeds is چ (ch), an empty cup is ح (h), and a dot on top is خ (kh). And خ is a gift for you — it's the Scottish 'loch' sound!",
    words: [
      { fa: "چای", translit: "chây", meaning: "tea", note: "The most important word in any Iranian home.", focus: "چ" },
      { fa: "جان", translit: "jân (said 'joon')", meaning: "dear, soul", note: "You learned it already — now you can read it!", focus: "ج" },
      { fa: "حال", translit: "hâl", meaning: "how you are, mood", note: "حالت چطوره؟ (hâlet chetore?) — how are you?", focus: "ح" },
      { fa: "خوب", translit: "khub", meaning: "good", note: "خوبم (khubam) — I'm good.", focus: "خ" },
      { fa: "خانه", translit: "khâne", meaning: "home", note: "Loch-kh, long â, n, and a soft 'e' at the end.", focus: "خ" },
    ],
    story: {
      title: "A glass of chai",
      body:
        "In Iran, the first thing a guest is offered is tea. It is brewed strong, often over a samovar, and poured into small clear glasses so you can admire its deep red-amber colour. Many people hold a sugar cube — قند (ghand) — between their teeth and sip the tea through it, or stir in نبات (nabât), golden rock candy flavoured with saffron. Tea is drunk without milk, sometimes with a pinch of cardamom. Refusing tea is almost impossible; accepting it is a way of saying 'I'm happy to be here'.",
      bridge:
        "A Canadian 'double-double' and a Scottish cuppa with milk are delicious — but next time, try Persian tea: no milk, a sugar cube, and a small glass held by the rim.",
    },
    closing: { fa: "نوش جان", translit: "nush-e jân", meaning: "'may it nourish your soul' — said to someone eating or drinking" },
  },
  {
    id: "l4",
    title: "The shy letters",
    titleFa: "د ذ ر ز ژ",
    plant: "tulip",
    plantName: "red tulips (لاله, lâle)",
    letters: ["د", "ذ", "ر", "ز", "ژ"],
    intro:
      "Some letters are shy: they hold the hand of the letter before them, but never the one after. There are seven — ا د ذ ر ز ژ و. Today we meet five of them: the bowed heads د ذ, and the little slides ر ز ژ.",
    words: [
      { fa: "دل", translit: "del", meaning: "heart", note: "Persian feelings live in the del. دلم برات تنگ شده (delam barât tang shode) — I miss you.", focus: "د" },
      { fa: "لذیذ", translit: "laziz", meaning: "delicious", note: "Perfect to say after tahdig.", focus: "ذ" },
      { fa: "روز", translit: "ruz", meaning: "day", note: "Tap the r lightly, like a Scot.", focus: "ر" },
      { fa: "زرد", translit: "zard", meaning: "yellow", note: "Three shy letters in a row — none of them join!", focus: "ز" },
      { fa: "ژاکت", translit: "zhâkat", meaning: "cardigan, jacket", note: "zh as in 'measure'. Very useful in a Toronto January.", focus: "ژ" },
    ],
    story: {
      title: "Jumping over fire",
      body:
        "On the last Tuesday evening before the Persian New Year, Iranians celebrate چهارشنبه‌سوری (chahârshanbe suri). Small bonfires are lit in streets and parks, and people of all ages jump over them, singing 'zardi-ye man az to, sorkhi-ye to az man' — 'my yellow to you, your red to me'. The fire takes away your paleness and tiredness (the yellow, zard!) and gives you its warmth and health (the red). Then come fireworks, sweets, and spoon-banging door to door, a little like Halloween.",
      bridge:
        "Scotland knows this magic too: Hogmanay torchlight processions and Shetland's Up Helly Aa light up the winter with fire, just as Chaharshanbe Suri lights up the end of winter in Iran.",
    },
    closing: { fa: "دستت درد نکنه", translit: "dastet dard nakone", meaning: "'may your hand not hurt' — thank you for your effort" },
  },
  {
    id: "l5",
    title: "The smiling teeth",
    titleFa: "س ش",
    plant: "hyacinth",
    plantName: "hyacinths (سنبل, sonbol)",
    letters: ["س", "ش"],
    intro:
      "س has three little teeth smiling on the line — it says 's'. Add three sparkles on top and it becomes ش, 'sh'. And yes — ش is the first letter of my name, شیرین!",
    words: [
      { fa: "سلام", translit: "salâm", meaning: "hello", note: "Now you can read your very first word!", focus: "س" },
      { fa: "سیب", translit: "sib", meaning: "apple", note: "One of the seven S's of Nowruz.", focus: "س" },
      { fa: "سبزه", translit: "sabze", meaning: "green sprouts", note: "Grown for Nowruz — a sign of new life.", focus: "س" },
      { fa: "شب", translit: "shab", meaning: "night", note: "شب بخیر (shab bekheyr) — good night.", focus: "ش" },
      { fa: "شیرین", translit: "shirin", meaning: "sweet", note: "My name! Three sparkles, a swan, a slide, a swan, a bowl.", focus: "ش" },
    ],
    story: {
      title: "The table of seven S's",
      body:
        "نوروز (nowruz), 'new day', is the Persian New Year. It begins at the exact moment of the spring equinox, around March 20, and has been celebrated for thousands of years. Families set a هفت‌سین (haft-sin) table with seven things that begin with س: sabze (sprouts, for rebirth), samanu (a sweet wheat pudding), senjed (dried oleaster fruit), sir (garlic), sib (apple), somâgh (sumac) and serke (vinegar) — each carrying a wish for the year. Beside them: a mirror, painted eggs, a goldfish, coins and a book of Hafez. Then come two weeks of visiting family and friends.",
      bridge:
        "Like Hogmanay and its first-footing, Nowruz is a fresh start shared by opening your door to visitors — and Toronto celebrates it every spring.",
    },
    closing: { fa: "سال نو مبارک", translit: "sâl-e no mobârak", meaning: "happy new year!" },
  },
  {
    id: "l6",
    title: "Guests from Arabic",
    titleFa: "ص ض ط ظ",
    plant: "plane",
    plantName: "a great plane tree (چنار, chenâr)",
    letters: ["ص", "ض", "ط", "ظ"],
    intro:
      "Here's a relaxing secret: these four letters make no new sounds. ص says 's', ض and ظ say 'z', and ط says 't'. They're guests from Arabic words — you only need to recognise their loopy shapes.",
    words: [
      { fa: "صبح", translit: "sobh", meaning: "morning", note: "صبح بخیر (sobh bekheyr) — good morning.", focus: "ص" },
      { fa: "حوض", translit: "howz", meaning: "courtyard pool", note: "The pool at the heart of our garden.", focus: "ض" },
      { fa: "طوطی", translit: "tuti", meaning: "parrot", note: "A happy word to say out loud.", focus: "ط" },
      { fa: "طلا", translit: "talâ", meaning: "gold", note: "The hand mirror, a crook, a cypress.", focus: "ط" },
      { fa: "خداحافظ", translit: "khodâhâfez", meaning: "goodbye", note: "Now you can read it — and it ends with ظ!", focus: "ظ" },
    ],
    story: {
      title: "The poet who saved a language",
      body:
        "Around a thousand years ago, a poet named Ferdowsi spent some thirty years writing the شاهنامه (Shâhnâme), the 'Book of Kings' — about 50,000 couplets of Iran's myths and history, from the first kings to the mighty hero Rostam and the magical bird Simorgh. He wrote it in a Persian with very few Arabic words, at a time when Arabic dominated learning. He wrote that with this Persian he had made the Persians live again. Iranians still read his stories to children and quote him with pride.",
      bridge:
        "Think of Robert Burns writing in Scots, giving his people's own voice a place in literature — Ferdowsi is that, on an epic scale, for Persian.",
    },
    closing: { fa: "به امید دیدار", translit: "be omid-e didâr", meaning: "hoping to see you again" },
  },
  {
    id: "l7",
    title: "The ribbons",
    titleFa: "ع غ",
    plant: "pomegranate",
    plantName: "a pomegranate tree (انار, anâr)",
    letters: ["ع", "غ"],
    intro:
      "ع looks like an open mouth or a curl of ribbon. In everyday Persian it's almost silent — just a tiny catch, like the middle of 'uh-oh'. With a dot it becomes غ, a soft gargle like the French 'r'.",
    words: [
      { fa: "عشق", translit: "eshgh", meaning: "love", note: "The word of a thousand Persian poems.", focus: "ع" },
      { fa: "عسل", translit: "asal", meaning: "honey", note: "Also a sweet way to say 'darling'.", focus: "ع" },
      { fa: "باغ", translit: "bâgh", meaning: "garden", note: "You know this one — now see the ribbon at the end.", focus: "غ" },
      { fa: "غذا", translit: "ghazâ", meaning: "food", note: "Gentle gargle at the start.", focus: "غ" },
    ],
    story: {
      title: "The longest night",
      body:
        "On the winter solstice, around December 20–21, Iranians celebrate شب یلدا (shab-e yaldâ), the longest night of the year. Families gather at the grandparents' house and stay up late to keep each other company until the light returns. On the table: red pomegranates and watermelon — the colour of dawn and life — nuts and dried fruit. Someone opens the poems of Hafez, the beloved 14th-century poet of Shiraz, at a random page; whoever made a wish hears the poem as their فال (fâl), their fortune.",
      bridge:
        "Burns Night and Yalda are kindred spirits: a winter gathering, poetry read aloud, good food, and warmth against the dark.",
    },
    closing: { fa: "یلدا مبارک", translit: "yaldâ mobârak", meaning: "happy Yalda!" },
  },
  {
    id: "l8",
    title: "The bird heads",
    titleFa: "ف ق",
    plant: "orange",
    plantName: "a bitter-orange tree (نارنج, nârenj)",
    letters: ["ف", "ق"],
    intro:
      "A small loop with one dot is ف (f). A deeper loop with two dots is ق — and in Iran it sounds just like غ, the soft gargle. Same sound, two letters — like 'c' and 'k' in English.",
    words: [
      { fa: "فارسی", translit: "fârsi", meaning: "Persian (language)", note: "من فارسی یاد می‌گیرم (man fârsi yâd migiram) — I'm learning Persian.", focus: "ف" },
      { fa: "فال", translit: "fâl", meaning: "fortune", note: "As in fâl-e Hâfez on Yalda night.", focus: "ف" },
      { fa: "قند", translit: "ghand", meaning: "sugar cube", note: "The ancestor of the English word 'candy'!", focus: "ق" },
      { fa: "قلب", translit: "ghalb", meaning: "heart (the organ, the shape)", note: "del is the feeling-heart; ghalb is the beating one.", focus: "ق" },
    ],
    story: {
      title: "Persian words you already know",
      body:
        "Persian words have travelled the Silk Road for centuries, and many reached English. Paradise (a walled garden). Bazaar. Caravan. Pajama (pâ-jâme, 'leg garment'). Kiosk (kushk, a pavilion). Jasmine (yâsaman). Lilac. Lemon and orange (limu, nârang). Spinach. Shawl. Candy, from qand — sugar. And checkmate, from shâh mât: 'the king is helpless'. Chess itself came to Europe through Persia, where it was loved for centuries.",
      bridge: "You walked into this garden already knowing a dozen Persian words.",
    },
    closing: { fa: "چه خوب!", translit: "che khub!", meaning: "how lovely!" },
  },
  {
    id: "l9",
    title: "The roofs",
    titleFa: "ک گ",
    plant: "rose",
    plantName: "a damask rose (گل محمدی, gol-e mohammadi)",
    letters: ["ک", "گ"],
    intro:
      "ک is a slanted roof with a little floor — it says 'k'. Give it a second roof line and it becomes گ, 'g' — the last of Persia's own four letters. You've now met all four: پ چ ژ گ!",
    words: [
      { fa: "کتاب", translit: "ketâb", meaning: "book", note: "Roof, two birds, cypress, boat.", focus: "ک" },
      { fa: "کباب", translit: "kabâb", meaning: "kebab", note: "Two boats in one tasty word.", focus: "ک" },
      { fa: "گل", translit: "gol", meaning: "flower, rose", note: "Our garden's favourite word.", focus: "گ" },
      { fa: "گربه", translit: "gorbe", meaning: "cat", note: "Persian cats, of course.", focus: "گ" },
    ],
    story: {
      title: "The rose and the nightingale",
      body:
        "In Persian poetry, the nightingale — بلبل (bolbol) — sings all night to the rose, گل (gol). The nightingale is the longing lover; the rose is the beautiful, unreachable beloved, with thorns to match. Poets from Rumi to Hafez returned to them again and again. The rose is real, too: every May, in Ghamsar near Kashan, families harvest damask roses at dawn and distil them into گلاب (golâb), rosewater, which perfumes Persian sweets, tea and celebrations.",
      bridge: "Robert Burns wrote 'O my Luve is like a red, red rose' — a Persian poet would have nodded and added a nightingale.",
    },
    closing: { fa: "قربونت برم", translit: "ghorbunet beram", meaning: "an affectionate 'you're the best' (literally 'may I be your sacrifice')" },
  },
  {
    id: "l10",
    title: "The crook, the cherry and the bowl",
    titleFa: "ل م ن",
    plant: "reed",
    plantName: "reeds by the pool (نی, ney)",
    letters: ["ل", "م", "ن"],
    intro:
      "Three friendly letters: ل is a tall shepherd's crook (l), م is a round cherry on its stem (m), and ن is a bowl holding one grain of rice (n).",
    words: [
      { fa: "لیمو", translit: "limu", meaning: "lemon", note: "Crook, swan, cherry, tadpole.", focus: "ل" },
      { fa: "لبخند", translit: "labkhand", meaning: "smile", note: "Literally 'lip-laugh'.", focus: "ل" },
      { fa: "مرسی", translit: "mersi", meaning: "thanks", note: "The cherry starts it.", focus: "م" },
      { fa: "ماه", translit: "mâh", meaning: "moon, month", note: "Also a compliment: someone lovely is 'a moon'.", focus: "م" },
      { fa: "نان", translit: "nân", meaning: "bread", note: "Two rice bowls holding a cypress.", focus: "ن" },
      { fa: "نوروز", translit: "nowruz", meaning: "Persian New Year", note: "Now you can read it!", focus: "ن" },
    ],
    story: {
      title: "Listen to the reed",
      body:
        "Rumi — called مولانا (Mowlânâ), 'our master', in Iran — was born in 1207 and wrote in Persian. His great poem, the Masnavi, begins: بشنو این نی چون حکایت می‌کند (beshnow in ney chon hekâyat mikonad) — 'Listen to this reed as it tells its tale.' The reed flute, the ney, cries because it was cut from its reed bed, and every soul that has been far from home understands its song. Today Rumi is one of the most-read poets in North America.",
      bridge:
        "A Highland lament on the pipes and the breathy song of the ney both sing of the same thing: longing for home.",
    },
    closing: { fa: "شب بخیر", translit: "shab bekheyr", meaning: "good night" },
  },
  {
    id: "l11",
    title: "Letters with many voices",
    titleFa: "و ه ی",
    plant: "lilac",
    plantName: "a lilac bush (یاس بنفش, yâs-e banafsh)",
    letters: ["و", "ه", "ی"],
    intro:
      "The last three letters are actors with many voices. و can say v, oo or o (and on its own means 'and'). ه says h — or a soft 'e' at the end of a word. ی says y or ee. Then you'll have met all 32!",
    words: [
      { fa: "دوست", translit: "dust", meaning: "friend", note: "Here و says 'oo'.", focus: "و" },
      { fa: "وقت", translit: "vaght", meaning: "time", note: "Here و says 'v'.", focus: "و" },
      { fa: "هوا", translit: "havâ", meaning: "air, weather", note: "ه says 'h' at the start.", focus: "ه" },
      { fa: "خانه", translit: "khâne", meaning: "home", note: "ه at the end just says 'e'.", focus: "ه" },
      { fa: "یک", translit: "yek", meaning: "one", note: "ی says 'y'.", focus: "ی" },
      { fa: "دریا", translit: "daryâ", meaning: "sea", note: "ی in the middle, with its two dots.", focus: "ی" },
    ],
    story: {
      title: "The rose garden",
      body:
        "Saadi of Shiraz wrote the گلستان (Golestân), 'The Rose Garden', in 1258 — a book of short stories and verses about kindness and wisdom, still read in Iranian schools. Its most famous lines say: بنی آدم اعضای یک پیکرند (bani âdam a'zâ-ye yek peykarand) — 'Human beings are members of one body, created from one essence; when one member is in pain, the others cannot rest.' These words are displayed at the United Nations.",
      bridge: "This garden you're learning in is named after Saadi's book — Golestan.",
    },
    closing: { fa: "تبریک!", translit: "tabrik!", meaning: "congratulations — you've met all 32 letters!" },
  },
  {
    id: "l13",
    title: "The little marks",
    titleFa: "نشانه‌های کوچک",
    plant: "narcissus",
    plantName: "white narcissus (نرگس, narges)",
    letters: [],
    intro:
      "Five little marks sit above or below the letters. Day to day, Persian leaves most of them out — but the Quran, prayers, poems and children's books write them in, and they tell you exactly how a word is said. They are the key to saying Arabic words in Persian correctly: الله, محمّد, مؤمن.",
    words: [
      { fa: "محمّد", translit: "mohammad", meaning: "Muhammad", note: "The little w-shape on م is a tashdid (ـّ): say the letter twice — mo-ham-mad." },
      { fa: "اوّل", translit: "avval", meaning: "first", note: "Tashdid on و: av-val. In الله the tashdid is there even when it isn't written: al-lâh." },
      { fa: "مؤمن", translit: "mo'men", meaning: "believer", note: "ء is a hamza: a tiny catch in the throat. Here it sits on a و." },
      { fa: "مسئله", translit: "mas'ale", meaning: "question, problem", note: "The same hamza, sitting on a ی without its dots: ئ." },
      { fa: "لطفاً", translit: "lotfan", meaning: "please", note: "Two little strokes on the final ا are a tanvin (ـً): it adds “an”." },
      { fa: "کتابِ من", translit: "ketâb-e man", meaning: "my book", note: "A small stroke under a letter (ـِ, kasre) shows the ezafe -e. Usually left unwritten." },
      { fa: "خانهٔ ما", translit: "khâne-ye mâ", meaning: "our house", note: "After a final ه the ezafe is written as a little ء on top, and says -ye." },
    ],
    story: {
      title: "The dots that kept the Quran's sounds",
      body:
        "The first Arabic writing had no vowel marks at all. Abu al-Aswad al-Du'ali, a companion of Imam Ali (ع) — who, many narrations say, taught him the first rules of Arabic grammar — marked the vowels of the Quran with coloured dots: a dot above a letter for “a”, below it for “e”, beside it for “o”. A century later the scholar al-Khalil ibn Ahmad turned those dots into the little strokes still written today, and added the tashdid. Every Quran and prayer book you'll open in Iran carries them, so that each word is said just as it was revealed.",
      bridge:
        "The accents on French words in Montreal — café, Québec, élève — do the same job: little marks that tell you exactly how to say a word.",
    },
    closing: { fa: "ماشاءالله", translit: "mâshâallâh", meaning: "“what God has willed” — said with admiration, like “how wonderful!”" },
  },
  {
    id: "l12",
    title: "Your first conversation",
    titleFa: "اولین گفتگو",
    plant: "nightingale",
    plantName: "a nightingale (بلبل, bolbol)",
    bloomText: "A nightingale (بلبل, bolbol) has come to sing in your garden. Every letter, every stop — your garden is complete. 🌸",
    letters: [],
    intro:
      "You know every letter now. Let's put them together into a real little conversation — the kind you could have over tea this week.",
    words: [
      { fa: "حالت چطوره؟", translit: "hâlet chetore?", meaning: "how are you?", note: "Casual and warm. Written چطور است but said chetore." },
      { fa: "خوبم، مرسی", translit: "khubam, mersi", meaning: "I'm good, thanks", note: "Add 'to chetori?' — 'and you?'" },
      { fa: "اسم من … است", translit: "esm-e man … e", meaning: "my name is …", note: "Put your name in the middle. Verbs go at the end in Persian!" },
      { fa: "خوشبختم", translit: "khoshbakhtam", meaning: "pleased to meet you", note: "Literally 'I am fortunate'." },
      { fa: "خسته نباشی", translit: "khaste nabâshi", meaning: "may you not be tired", note: "Said to anyone who's been working — the cook, the host, yourself." },
      { fa: "دوستت دارم", translit: "dustet dâram", meaning: "I love you", note: "Use generously." },
    ],
    story: {
      title: "The dance of ta'ârof",
      body:
        "تعارف (ta'ârof) is the Persian art of politeness. A host offers more food; you politely decline; they insist; you decline again; on the third offer, you accept. A shopkeeper may say قابل نداره (ghâbel nadâre) — 'it's not worthy of you' — as if you needn't pay. (You should still pay!) At a door, two people may insist 'befarmâ'id' — 'please, after you' — for a while before anyone walks through. It isn't insincere: it's a graceful game of putting the other person first.",
      bridge:
        "A Canadian who has ever said 'sorry' to someone who bumped into them is already halfway to mastering ta'ârof.",
    },
    closing: { fa: "خسته نباشی", translit: "khaste nabâshi", meaning: "may you not be tired — you've earned some tea 🍵" },
  },
];

export const BY_LESSON = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

// Gentle sayings for the home page.
export const PROVERBS = [
  { fa: "قطره قطره جمع گردد، وانگهی دریا شود", translit: "ghatre ghatre jam' gardad, vângahi daryâ shavad", meaning: "Drop by drop it gathers, and then it becomes a sea." },
  { fa: "کار نیکو کردن از پر کردن است", translit: "kâr-e niku kardan az por kardan ast", meaning: "Doing something well comes from doing it again and again." },
  { fa: "صبر تلخ است ولیکن بر شیرین دارد", translit: "sabr talkh ast valikan bar-e shirin dârad", meaning: "Patience is bitter, but its fruit is sweet." },
  { fa: "یک دست صدا ندارد", translit: "yek dast sedâ nadârad", meaning: "One hand makes no sound — we do things together." },
  { fa: "از دل برآید، لاجرم بر دل نشیند", translit: "az del barâyad, lâjaram bar del neshinad", meaning: "What comes from the heart, surely settles in the heart." },
  { fa: "دوست آن باشد که گیرد دست دوست", translit: "dust ân bâshad ke girad dast-e dust", meaning: "A friend is one who takes a friend's hand. — Saadi" },
];
