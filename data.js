// __FOOD_GUIDE_START__
export const foodCategories = {
    cafe:     { emoji: '☕', label: 'בתי קפה ומאפיות' },
    ramen:    { emoji: '🍜', label: 'ראמן' },
    sushi:    { emoji: '🍣', label: 'סושי ופירות ים' },
    yakiniku: { emoji: '🔥', label: 'יאקיניקו ובשרים' },
    gyoza:    { emoji: '🥟', label: 'גיוזות' },
    burger:   { emoji: '🍔', label: 'המבורגרים' },
    bar:      { emoji: '🍸', label: 'ברים וספיקיזי' },
    street:   { emoji: '🥡', label: 'אוכל רחוב ונשנושים' },
};

export const foodGuide = [
    // ── CAFE / BAKERY ──
    { name: 'Flippers – פנקייק סופלה',      city: 'tokyo', area: 'הרג׳וקו',             category: 'cafe',     desc: 'פנקייקים אווריריים כמו ענן',                         day: 2  },
    { name: 'אייג׳י3 – סנדוויץ׳ ויראלי',    city: 'tokyo', area: 'גינזה',               category: 'cafe',     desc: 'לחם מטוגן עם קצפת – הכי ויראלי בטוקיו',             day: 3  },
    { name: 'Panel Café',                    city: 'kyoto', area: 'גיון-שיג׳ו',          category: 'cafe',     desc: 'פנקייקים וקרוופלים – קפה קטן ומקסים',                day: 7  },
    { name: 'le 14e – ביסטרו צרפתי',         city: 'kyoto', area: 'סנג׳ו-קיאמאצ׳י',    category: 'cafe',     desc: 'Michelin Selected – אוכל עונתי ויין טבעי',            day: 8  },
    { name: 'Truffle Bakery',                city: 'osaka', area: 'נמבה',                category: 'cafe',     desc: 'לחמים ומאפים עם טרופל שחור',                          day: 11 },
    { name: 'Brooklyn Roasting Co.',         city: 'osaka', area: 'קיטאהאמה',            category: 'cafe',     desc: 'קפה ניו-יורקי על נהר אוסקה',                          day: 13 },
    // ── RAMEN ──
    { name: 'AFURI – ראמן יוזו',            city: 'tokyo', area: 'הרג׳וקו',             category: 'ramen',    desc: 'ראמן יוזו שיו ייחודי – ~¥1,300',                     day: 2  },
    // ── SUSHI ──
    { name: 'שוק צוקיג׳י',                  city: 'tokyo', area: 'צוקיג׳י',             category: 'sushi',    desc: 'סושי טרי, תמנון ואומלט יפני',                         day: 4  },
    { name: 'נובו טוקיו',                   city: 'tokyo', area: 'טוראנומון-מידטאון',   category: 'sushi',    desc: 'דג הגד שחור במיסו – מסעדת יוקרה',                    day: 4  },
    { name: 'סושי קייטן גינזה אונודרה',     city: 'tokyo', area: 'גינזה',               category: 'sushi',    desc: 'דגים טריים על מסוע – בית השף אונודרה',               day: 5  },
    // ── YAKINIKU ──
    { name: 'האן נו דאידוקורו',             city: 'tokyo', area: 'שיבויה',              category: 'yakiniku', desc: 'וואגיו פרימיום על גריל אישי',                         day: 2  },
    { name: 'Maumu Kiyamachi',               city: 'kyoto', area: 'קיאמאצ׳י',           category: 'yakiniku', desc: 'יאקיניקו קוריאני-יפני – ממש ליד המלון',              day: 7  },
    { name: 'GOSYU',                         city: 'kyoto', area: 'צפון קיוטו',          category: 'yakiniku', desc: 'וואגיו אומי עם נוף לגן יפני – חובה הזמנה',           day: 10 },
    // ── GYOZA ──
    { name: 'KAKEKOMI גיוזות',              city: 'tokyo', area: 'שינג׳וקו',            category: 'gyoza',    desc: 'גיוזות צמחוניות מטוגנות ומאודות',                     day: 6  },
    { name: "צ'או צ'או גיוזה",              city: 'kyoto', area: 'גיון',                category: 'gyoza',    desc: 'גיוזות קריספיות במילויים מטורפים – נשנוש לילי',      day: 9  },
    { name: 'MOTOI גיוזות',                 city: 'kyoto', area: 'קארסומה',             category: 'gyoza',    desc: 'שף בוגר מישלן – גיוזות בוטיק',                        day: 10 },
    // ── BURGER ──
    { name: 'שוגון בורגר שינג׳וקו',        city: 'tokyo', area: 'שינג׳וקו – קאבוקי-צ׳ו', category: 'burger', desc: '100% וואגיו – ממש ליד ראש הגודזילה',                  day: 6  },
    // ── BAR ──
    { name: 'אומואידה יוקוצ׳ו',            city: 'tokyo', area: 'שינג׳וקו',            category: 'bar',      desc: 'סמטאות ניאון, יאקיטורי ובירה',                        day: 6  },
    { name: 'גולדן גאי',                    city: 'tokyo', area: 'שינג׳וקו',            category: 'bar',      desc: '200 ברים קטנים ומיוחדים',                             day: 6  },
    { name: "BEE'S KNEES",                  city: 'kyoto', area: 'גיון',                category: 'bar',      desc: "Asia's Best 50 Bars – דלת צהובה נסתרת",               day: 7  },
    { name: 'Tokito – איזאקאיה',            city: 'osaka', area: 'קארהורי',             category: 'bar',      desc: 'בר-מסעדה מוסתר – אווירה ייחודית',                     day: 13 },
    // ── STREET / SNACKS ──
    { name: 'DE FRITES STAAN',               city: 'kyoto', area: 'קיאמאצ׳י',           category: 'street',   desc: 'ציפס הולנדי קריספי ובירות קראפט',                     day: 7  },
    { name: 'Pablo – טארטים',               city: 'osaka', area: 'שינסאיבאשי',          category: 'street',   desc: 'טארט גבינה חם ונוזלי',                                day: 11 },
    { name: 'Strawberry Mania',              city: 'osaka', area: 'נמבה',                category: 'street',   desc: 'סנדוויץ׳ פרות ותות טבול שוקולד',                     day: 11 },
    { name: 'דוטונבורי',                    city: 'osaka', area: 'דוטונבורי',           category: 'street',   desc: 'טאקויאקי, אוקונומיאקי – לב אוסקה בלילה',             day: 11 },
];
// __FOOD_GUIDE_END__

// __ITINERARY_DATA_START__
export const days = [
    {
        day: 1, date: '27.9', weekday: 'ראשון', city: 'tokyo',
        title: 'נחיתה + סיבוב ספונטני',
        weather: '☀️ 24°C',
        activities: [
            { name: 'הגעה למלון דאיווה רויינט', time: '~20:00', desc: 'צ׳ק-אין והתרעננות – ~90 דקות מנאריטה ברכבת NEX / ~50 דקות מהנדה', lat: 35.6938, lng: 139.6921, type: 'attraction' },
            { name: 'סיבוב ספונטני בשינג׳וקו', time: 'לילה', desc: 'אוכל, ניאון ואווירה – ללא תוכנית קבועה', lat: 35.6934, lng: 139.6984, type: 'attraction' }
        ]
    },
    {
        day: 2, date: '28.9', weekday: 'שני', city: 'tokyo',
        title: 'שינג׳וקו, הרג׳וקו ושיבויה',
        weather: '🌤️ 23°C',
        activities: [
            { name: 'פליפרס – פנקייק סופלה', time: '09:30', desc: 'פנקייקים אווריריים כמו ענן – ארוחת בוקר בהרג׳וקו', lat: 35.6912, lng: 139.7046, type: 'cafe' },
            { name: 'מקדש מייג׳י', time: '11:00', desc: 'יער עבות ושער עץ ענק', lat: 35.6764, lng: 139.6993, type: 'attraction' },
            { name: 'רחוב טאקשיטה', time: '12:30', desc: 'אופנת רחוב צבעונית, קרפים וחנויות ייחודיות', lat: 35.6716, lng: 139.7031, type: 'attraction' },
            { name: 'קט סטריט / אומטסנדרו', time: '13:30', desc: 'רחוב קניות אופנתי – בוטיקים, קפות ועיצוב', lat: 35.6700, lng: 139.7100, type: 'attraction' },
            { name: 'ראמן יוזו – AFURI הרג׳וקו', time: '15:00', desc: 'ראמן יוזו שיו מיוחד וייחודי – ~¥1,300 למנה', lat: 35.6708, lng: 139.7071, type: 'restaurant' },
            { name: 'מעבר החציה + תצפית סטארבקס', time: '16:30', desc: 'מעבר החציה הסואן בעולם + קפה עם תצפית מקומה 2', lat: 35.6597, lng: 139.7003, type: 'cafe' },
            { name: 'שיבויה סקיי', time: '17:30', desc: 'שקיעה רומנטית מקומה 47', lat: 35.6584, lng: 139.7022, type: 'attraction' },
            { name: 'דון קיחוטה שיבויה', time: '19:00', desc: 'קניות, חטיפים, קוסמטיקה וכיף ב-8 קומות', lat: 35.6590, lng: 139.6983, type: 'attraction' },
            { name: 'האן נו דאידוקורו – יאקיניקו', time: '20:00', desc: 'וואגיו פרימיום על גריל אישי', lat: 35.6564, lng: 139.6961, type: 'restaurant' }
        ]
    },
    {
        day: 3, date: '29.9', weekday: 'שלישי', city: 'tokyo',
        title: 'טוקיו דיסני סי 🌋',
        weather: '🌤️ 22°C',
        activities: [
            { name: 'טוקיו דיסני סי', time: 'יום שלם', desc: 'הר געש, גונדולה, פנטזי ספרינגס', lat: 35.6267, lng: 139.8851, type: 'attraction' },
            { name: 'אייג׳י3 גינזה – סנדוויץ׳ ויראלי', time: '20:00', desc: 'לחם מטוגן עם קצפת מטורפת – תחנת ביניים בדרך חזרה דרך גינזה', lat: 35.6726, lng: 139.7649, type: 'cafe' }
        ]
    },
    {
        day: 4, date: '30.9', weekday: 'רביעי', city: 'tokyo',
        title: 'צוקיג׳י, טימלאב ואקיהברה',
        weather: '☀️ 23°C',
        activities: [
            { name: 'שוק צוקיג׳י', time: '09:00', desc: 'סושי טרי, תמנון ואומלט יפני', lat: 35.6654, lng: 139.7707, type: 'attraction' },
            { name: 'טימלאב פלנטס', time: '12:00', desc: 'מוזיאום חושי יחפים', lat: 35.6427, lng: 139.7837, type: 'attraction' },
            { name: 'אקיהברה', time: '16:00', desc: 'גיימינג, אנימה וארקיידים', lat: 35.7023, lng: 139.7745, type: 'attraction' },
            { name: 'נובו טוקיו', time: '19:30', desc: 'ארוחת יוקרה – דג הגד שחור במיסו', lat: 35.6657, lng: 139.7497, type: 'restaurant' }
        ]
    },
    {
        day: 5, date: '1.10', weekday: 'חמישי', city: 'tokyo',
        title: 'אסאקוסה, גינזה ויוניקלו',
        weather: '☀️ 22°C',
        activities: [
            { name: 'מקדש סנסו-ג׳י', time: '09:00', desc: 'לנטרנת ענק ושער הת׳ונדר גייט המפורסם', lat: 35.7148, lng: 139.7967, type: 'attraction' },
            { name: 'שוק נקמיסה', time: '10:00', desc: 'רחוב קניות מסורתי לאורך 250 מ׳ – מזכרות, מאצ׳ה ומלאכת יד', lat: 35.7147, lng: 139.7965, type: 'attraction' },
            { name: 'שוק קפבאשי – רחוב כלי המטבח', time: '11:00', desc: 'רחוב כלי בישול יפניים – דגמי אוכל מפלסטיק, סכינים ומלאכת יד', lat: 35.7133, lng: 139.7926, type: 'attraction' },
            { name: 'סיבוב קניות בגינזה – יוניקלו 12 קומות', time: '14:00', desc: 'יוניקלו הגדול בעולם – 12 קומות של אופנה יפנית + סיבוב ברחוב גינזה', lat: 35.6715, lng: 139.7636, type: 'attraction' },
            { name: 'סושי קייטן גינזה אונודרה', time: '19:00', desc: 'סושי קייטן מושלם מבית השף אונודרה – דגים טריים על מסוע', lat: 35.6717, lng: 139.7660, type: 'restaurant' }
        ]
    },
    {
        day: 6, date: '2.10', weekday: 'שישי', city: 'tokyo',
        title: 'יום שלם בשינג׳וקו',
        weather: '⛅ 20°C',
        activities: [
            { name: 'פארק שינג׳וקו גיון', time: '09:00', desc: 'גנים יפניים מדהימים – דובדבן, אזלייה וטבע שלו', lat: 35.6851, lng: 139.7100, type: 'attraction' },
            { name: 'בניין הממשל העירוני – תצפית חינמית', time: '11:00', desc: 'תצפית פנורמית חינמית מקומה 45 על כל טוקיו', lat: 35.6896, lng: 139.6917, type: 'attraction' },
            { name: 'ראש הגודזילה – טוהו סינמה', time: '12:30', desc: 'ראש הגודזילה המפורסם על גג הבניין באיזור Kabuki-cho', lat: 35.6948, lng: 139.7030, type: 'attraction' },
            { name: 'שוגון בורגר שינג׳וקו', time: '13:30', desc: 'המבורגר 100% וואגיו בקאבוקי-צ׳ו – ממש ליד ראש הגודזילה', lat: 35.6952, lng: 139.7038, type: 'restaurant' },
            { name: 'KAKEKOMI – בר גיוזות צמחוני', time: '15:00', desc: 'גיוזות צמחוניות מטוגנות ומאודות – ג׳ם מוסתר בשינג׳וקו', lat: 35.6948, lng: 139.7018, type: 'cafe' },
            { name: 'אומואידה יוקוצ׳ו', time: '19:00', desc: 'סמטאות ניאון, יאקיטורי ובירה – ארוחת ערב', lat: 35.6934, lng: 139.6984, type: 'restaurant' },
            { name: 'גולדן גאי – ברי לילה', time: '21:00', desc: 'מבוך של 200 ברים קטנים ומיוחדים – ערב שישי בשינג׳וקו', lat: 35.6934, lng: 139.7030, type: 'restaurant' }
        ]
    },
    {
        day: 7, date: '3.10', weekday: 'שבת', city: 'kyoto',
        title: 'הגעה לקיוטו – ננזן-ג׳י, גיון ולילה',
        weather: '☀️ 21°C',
        activities: [
            { name: 'שינקנסן לקיוטו', time: '09:30', desc: 'רכבת קליע – שעתיים ו-15 דקות', lat: 35.6812, lng: 139.7671, type: 'attraction' },
            { name: 'צ׳ק-אין מלון סולריה נישיטטסו', time: '14:00', desc: 'מלון בסנג׳ו-קיאמאצ׳י – ממש על נהר הקאמו, 50 מ׳ מפונטוצ׳ו', lat: 35.0097, lng: 135.7722, type: 'attraction' },
            { name: 'מקדש ננזן-ג׳י', time: '15:00', desc: 'גן זן, שער סנמון ענק ותעלת מים עתיקה מלבנים אדומים', lat: 35.0116, lng: 135.7929, type: 'attraction' },
            { name: 'Panel Café', time: '17:00', desc: 'קפה קטן ומקסים בסמוך לגיון-שיג׳ו – פנקייקים וקרוופלים', lat: 35.0035, lng: 135.7736, type: 'cafe' },
            { name: 'רובע גיון וסמטאות פונטוצ׳ו', time: '18:00', desc: 'בתי עץ, פנסי נייר וגיישות', lat: 35.0037, lng: 135.7756, type: 'attraction' },
            { name: 'DE FRITES STAAN', time: '19:30', desc: 'ציפס הולנדי קריספי עם רטבים מיוחדים ובירות קראפט', lat: 35.0036, lng: 135.7679, type: 'cafe' },
            { name: 'Maumu Kiyamachi – יאקיניקו', time: '20:00', desc: 'יאקיניקו קוריאני-יפני על רחוב קיאמאצ׳י – ממש ליד המלון (אופציה לארוחה)', lat: 35.0090, lng: 135.7706, type: 'restaurant' },
            { name: 'צ׳או צ׳או גיוזה', time: '22:00', desc: 'גיוזות קריספיות במילויים מטורפים – נשנוש לילי בגיון', lat: 35.0041, lng: 135.7672, type: 'restaurant' },
            { name: "BEE'S KNEES – ספיקיזי בר", time: '23:00', desc: 'בר קוקטיילים נסתר מאחורי דלת צהובה – Asia\'s Best 50 Bars', lat: 35.0041, lng: 135.7665, type: 'restaurant' }
        ]
    },
    {
        day: 8, date: '4.10', weekday: 'ראשון', city: 'kyoto',
        title: 'יום מקדשים על אופניים 🚲',
        weather: '🌤️ 20°C',
        activities: [
            { name: 'השכרת אופניים', time: '08:00', desc: 'השכרת אופניים ליום שלם – ~¥1,500 ליום, הרבה חנויות ליד תחנת קיוטו', lat: 34.9858, lng: 135.7588, type: 'attraction' },
            { name: 'קיומיזו-דרה', time: '08:30', desc: 'מרפסת עץ מעל צמרות העצים – כניסה לפני ההמון', lat: 34.9949, lng: 135.7850, type: 'attraction' },
            { name: 'סמטאות נינינזאקה', time: '10:30', desc: 'רחובות אבן עתיקים + סטארבקס טטאמי', lat: 34.9981, lng: 135.7806, type: 'attraction' },
            { name: 'פגודת הוקאנגי – יאסקה', time: '11:30', desc: 'פגודה בת 5 קומות משנת 589 – אחד הצילומים הכי אייקוניים של קיוטו', lat: 34.9985, lng: 135.7793, type: 'attraction' },
            { name: 'קינקאקו-ג׳י – מקדש הזהב', time: '13:30', desc: 'רכיבה צפונה ~30 דקות – מקדש מצופה זהב טהור על אגם', lat: 35.0394, lng: 135.7292, type: 'attraction' },
            { name: 'le 14e – ביסטרו צרפתי', time: '19:00', desc: 'Michelin Selected 2024 – אוכל עונתי אורגני ויין טבעי', lat: 35.0121, lng: 135.7722, type: 'restaurant' }
        ]
    },
    {
        day: 9, date: '5.10', weekday: 'שני', city: 'kyoto',
        title: 'ארשייאמה – יער, קופים וגיוזות',
        weather: '☀️ 20°C',
        activities: [
            { name: 'יער הבמבוק', time: '08:30', desc: 'קני במבוק ענקיים מתנשאים לגובה', lat: 35.0170, lng: 135.6713, type: 'attraction' },
            { name: 'מקדש טנריוג׳י', time: '09:30', desc: 'מקדש זן מרהיב עם גן לאומי מסורתי – ממש בכניסה ליער הבמבוק', lat: 35.0167, lng: 135.6752, type: 'attraction' },
            { name: 'פארק הקופים איווטאיאמה', time: '11:00', desc: 'קופי מקאק חופשיים – מאכילים מהיד', lat: 35.0098, lng: 135.6770, type: 'attraction' },
            { name: 'שייט סירות חתירה – נהר אוי', time: '14:00', desc: 'השכרת סירת חתירה רומנטית ליד גשר טוגטסו – חוויה מושלמת לירח דבש', lat: 35.0108, lng: 135.6770, type: 'attraction' },
            { name: 'צ׳או צ׳או גיוזה', time: '19:00', desc: 'גיוזות קריספיות במילויים מטורפים', lat: 35.0041, lng: 135.7672, type: 'restaurant' }
        ]
    },
    {
        day: 10, date: '6.10', weekday: 'שלישי', city: 'kyoto',
        title: 'פושימי אינארי, נישיקי ויאקיניקו',
        weather: '⛅ 19°C',
        activities: [
            { name: 'פושימי אינארי – אלף השערים', time: '07:30', desc: 'מנהרות שערים כתומים על ההר – לפני ההמון', lat: 34.9671, lng: 135.7727, type: 'attraction' },
            { name: 'שוק נישיקי', time: '11:30', desc: 'שיפודי וואגיו, מוצ׳י ומאצ׳ה', lat: 35.0050, lng: 135.7649, type: 'attraction' },
            { name: 'MOTOI – גיוזות של שף מישלן', time: '13:30', desc: 'מסעדת גיוזות בוטיק – שף בוגר מישלן, גיוזות מטורפות ב-Karasuma ממש ליד נישיקי', lat: 35.0053, lng: 135.7609, type: 'restaurant' },
            { name: 'GOSYU – יאקיניקו וואגיו אומי', time: '18:00', desc: 'יאקיניקו עם נוף לגן יפני – נתחי וואגיו נדירים מחווה מיוחדת, חובה הזמנה', lat: 35.0411, lng: 135.7826, type: 'restaurant' }
        ]
    },
    {
        day: 11, date: '7.10', weekday: 'רביעי', city: 'osaka',
        title: 'יום שלם באוסקה – נמבה ודוטונבורי',
        weather: '🌤️ 21°C',
        activities: [
            { name: 'רכבת לאוסקה', time: '09:00', desc: 'חצי שעה בלבד מקיוטו – יוצאים בבוקר ומגיעים עם כל היום לפנינו', lat: 34.9858, lng: 135.7588, type: 'attraction' },
            { name: 'שוק קורמון איציבה', time: '10:00', desc: 'שוק האוכל הגדול של אוסקה – פירות ים טריים, קרפ ויובי – הכי טוב בבוקר', lat: 34.6634, lng: 135.5067, type: 'attraction' },
            { name: 'Truffle Bakery – נמבה סיטי', time: '12:00', desc: 'מאפיית הטרופל המפורסמת – לחמים ומאפים עם טרופל שחור', lat: 34.6641, lng: 135.5017, type: 'cafe' },
            { name: 'מקדש נמבה יאסקה שריין', time: '13:00', desc: 'מקדש שינטו עם ראש אריה ענק ומרהיב – אחד הצילומים הכי מיוחדים באוסקה', lat: 34.6618, lng: 135.4978, type: 'attraction' },
            { name: 'צ׳ק-אין מלון ניקו אוסקה', time: '14:00', desc: 'מלון יוקרה על שדרת מידוסוג׳י – ממש על תחנת שינסאיבאשי', lat: 34.6721, lng: 135.5003, type: 'attraction' },
            { name: 'Pablo – טארטים מפורסמים', time: '15:30', desc: 'טארט גבינה חם ונוזלי מבית Pablo – התור שווה', lat: 34.6730, lng: 135.5017, type: 'cafe' },
            { name: 'Strawberry Mania', time: '16:00', desc: 'חטיפי תות מטורפים – סנדוויצ׳ פרות ותות טבול שוקולד', lat: 34.6687, lng: 135.5013, type: 'cafe' },
            { name: 'דוטונבורי', time: '19:00', desc: 'ניאון, טאקויאקי ואוקונומיאקי – לב אוסקה בלילה', lat: 34.6687, lng: 135.5013, type: 'restaurant' }
        ]
    },
    {
        day: 12, date: '8.10', weekday: 'חמישי', city: 'osaka',
        title: 'יוניברסל סטודיוס יפן 🍄🎃',
        weather: '☀️ 22°C',
        activities: [
            { name: 'יוניברסל סטודיוס יפן', time: 'יום שלם', desc: 'סופר מריו + ליל כל הקדושים', lat: 34.6654, lng: 135.4323, type: 'attraction' }
        ]
    },
    {
        day: 13, date: '9.10', weekday: 'שישי', city: 'osaka',
        title: 'טירת אוסקה, שינסאיבאשי וטוקיטו',
        weather: '🌤️ 21°C',
        activities: [
            { name: 'Brooklyn Roasting Co. – קיטאהאמה', time: '09:30', desc: 'קפה ניו-יורקי על נהר אוסקה – התחלה מושלמת ליום', lat: 34.6902, lng: 135.5142, type: 'cafe' },
            { name: 'טירת אוסקה', time: '11:00', desc: 'טירה מרהיבה עם תצפית וגנים מסביב', lat: 34.6873, lng: 135.5262, type: 'attraction' },
            { name: 'שינסאיבאשי – קניות', time: '14:00', desc: 'רחוב הקניות המרכזי של אוסקה – מותגים, קוסמטיקה ואופנה', lat: 34.6722, lng: 135.5006, type: 'attraction' },
            { name: 'Tokito – איזאקאיה', time: '19:00', desc: 'בר-מסעדה יפני מוסתר בשכונת קרהורי – אווירה ייחודית ואוכל מדהים', lat: 34.6605, lng: 135.5153, type: 'restaurant' }
        ]
    },
    {
        day: 14, date: '10.10', weekday: 'שבת', city: 'osaka',
        title: 'יציאה לבנגקוק ✈️',
        weather: '☀️ 22°C',
        activities: [
            { name: 'צ׳ק-אאוט ויציאה למלון', time: '07:30', desc: 'הטיסה ב-10:30 – יוצאים מהמלון מוקדם לתחנת נמבה', lat: 34.6721, lng: 135.5003, type: 'attraction' },
            { name: 'רכבת ראפיט לנמל תעופה קאנסאי', time: '08:00', desc: 'Nankai Rapi:t – ~38 דקות מתחנת נמבה ל-KIX', lat: 34.6634, lng: 135.5017, type: 'attraction' },
            { name: 'טיסה לבנגקוק ✈️', time: '10:30', desc: 'שדה תעופה קאנסאי (KIX) – ממריאים לתחנה הבאה', lat: 34.4347, lng: 135.2440, type: 'attraction' }
        ]
    }
];
// __ITINERARY_DATA_END__

export const cityNames = { tokyo: '🗼 טוקיו', kyoto: '⛩️ קיוטו', osaka: '🎡 אוסקה' };
export const cityColors = { tokyo: '#E8A0BF', kyoto: '#9B72AA', osaka: '#F4A460' };

export const dayTitlesEn = {
    1:'Arrival + Spontaneous Walk', 2:'Shinjuku, Harajuku & Shibuya',
    3:'Tokyo DisneySea 🌋', 4:'Tsukiji, teamLab & Akihabara',
    5:'Asakusa, Ginza & Uniqlo', 6:'Full Shinjuku Day',
    7:'Arrival Kyoto – Nanzenji, Gion & Nightlife', 8:'Temple Day by Bike 🚲',
    9:'Arashiyama – Bamboo, Monkeys & Gyoza', 10:'Fushimi Inari, Nishiki & Yakiniku',
    11:'Arrival Osaka – Namba & Dotonbori', 12:'Universal Studios Japan 🍄🎃',
    13:'Nara, Osaka Castle & Shinsaibashi', 14:'Last Shopping & Flight to Bangkok ✈️'
};

export const weekdayEn = {
    ראשון:'Sunday', שני:'Monday', שלישי:'Tuesday', רביעי:'Wednesday',
    חמישי:'Thursday', שישי:'Friday', שבת:'Saturday'
};

export const TR = {
    he: {
        dir:'rtl', header_title:'ירח דבש ביפן 🇯🇵',
        subtitle:'27 בספטמבר – 10 באוקטובר | טוקיו · קיוטו · אוסקה',
        search_ph:'🔍  חפש יום, פעילות או מקום...',
        filter_all:'הכל', filter_tokyo:'🗼 טוקיו', filter_kyoto:'⛩️ קיוטו', filter_osaka:'🎡 אוסקה',
        days_lbl:'ימים', hours_lbl:'שעות', min_lbl:'דקות', sec_lbl:'שניות',
        trip_started:'✈️ הטיול התחיל!',
        stat_days:'ימים', stat_cities:'ערים', stat_acts:'פעילויות',
        legend_title:'מקרא', legend_tokyo:'טוקיו', legend_kyoto:'קיוטו', legend_osaka:'אוסקה',
        notes_ph:'הוסף הערות, טיפים, מספרי הזמנה...',
        lang_btn:'🇺🇸 EN', day_prefix:'יום '
    },
    en: {
        dir:'ltr', header_title:'Honeymoon in Japan 🇯🇵',
        subtitle:'Sep 27 – Oct 10 | Tokyo · Kyoto · Osaka',
        search_ph:'🔍  Search day, activity or place...',
        filter_all:'All', filter_tokyo:'🗼 Tokyo', filter_kyoto:'⛩️ Kyoto', filter_osaka:'🎡 Osaka',
        days_lbl:'Days', hours_lbl:'Hours', min_lbl:'Min', sec_lbl:'Sec',
        trip_started:'✈️ The trip has started!',
        stat_days:'days', stat_cities:'cities', stat_acts:'activities',
        legend_title:'Legend', legend_tokyo:'Tokyo', legend_kyoto:'Kyoto', legend_osaka:'Osaka',
        notes_ph:'Add notes, tips, booking numbers...',
        lang_btn:'🇮🇱 HE', day_prefix:'Day '
    }
};
