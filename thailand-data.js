export const thailandDays = [
    // ── בנגקוק ──
    {
        day: 1, date: '10.10', weekday: 'שבת', city: 'bangkok',
        title: 'הגעה לבנגקוק 🛬',
        hotel: 'Pathumwan Princess Hotel',
        weather: '🌤️ 32°C',
        activities: [
            { name: 'נחיתה – שדה תעופה דון מואנג (DMK)', time: '14:30', desc: 'הגעה מאוסקה / KIX – לוקחות Grab Car למלון (כ-40 דק׳, ~350 THB)', lat: 13.9126, lng: 100.6067, type: 'attraction' },
            { name: 'Pathumwan Princess Hotel – צ׳ק-אין', time: '16:30', desc: 'ממוקם צמוד ל-MBK Center ו-Siam Paragon – לב בנגקוק', lat: 13.7468, lng: 100.5312, type: 'attraction' },
            { name: 'Banthat Thong Road – אוכל רחוב', time: '20:30', desc: 'רחוב קולינרי תוסס עם אוכל רחוב וקינוחים, במרחק נסיעה קצרה מהמלון. ארוחת ערב ראשונה בתאילנד!', lat: 13.7380, lng: 100.5240, type: 'restaurant' },
        ]
    },
    {
        day: 2, date: '11.10', weekday: 'ראשון', city: 'bangkok',
        title: 'בנגקוק – שוק ענק, קניונים וצ׳יינה טאון 🛍️',
        hotel: 'Pathumwan Princess Hotel',
        weather: '⛅ 32°C',
        activities: [
            { name: 'Chatuchak Weekend Market', time: '08:00', desc: 'השוק הגדול בתאילנד – רק בסוף שבוע! 15,000 דוכנים: ביגוד, עיצוב, אוכל ופריטי וינטג. תחנת BTS Mo Chit', lat: 13.7999, lng: 100.5503, type: 'attraction' },
            { name: 'MBK Center + CentralWorld', time: '12:00', desc: 'MBK – קניון אייקוני עם כל מה שצריך. ממשיכות ב-Skywalk ל-CentralWorld. ארוחת צהריים: Kozuri Modern Handroll Bar או Din Tai Fung', lat: 13.7469, lng: 100.5330, type: 'attraction' },
            { name: 'Yaowarat – Chinatown בנגקוק', time: '21:30', desc: 'שוק אוכל הלילה בצ׳יינה טאון – שיא ביום ראשון! בשרים, פירות ים וקינוחים סיניים. בשני רוב הדוכנים סגורים – תזמון מושלם', lat: 13.7403, lng: 100.5094, type: 'restaurant' },
        ]
    },
    // ── קו סמוי ──
    {
        day: 3, date: '12.10', weekday: 'שני', city: 'samui',
        title: 'טיסה לקו סמוי ✈️',
        hotel: 'Sareeraya Villas & Suites Chaweng',
        weather: '🌧️ 29°C',
        activities: [
            { name: 'טיסה DMK → USM', time: '09:00', desc: 'Don Mueang → Koh Samui, ~1.5 שעות (Bangkok Airways). מגיעות כ-11:00', lat: 13.9126, lng: 100.6067, type: 'attraction' },
            { name: 'Sareeraya Villas & Suites – צ׳ק-אין', time: '12:00', desc: 'מלון בוטיק בצ׳אוונג – ממש ליד החוף הראשי', lat: 9.5268, lng: 100.0613, type: 'attraction' },
            { name: 'Chaweng Beach – טבילה ראשונה', time: '14:30', desc: 'החוף הראשי של סמוי – 8 ק"מ חול לבן ומים טורקיז', lat: 9.5302, lng: 100.0614, type: 'attraction' },
            { name: 'Chi Beach Club / Arkbar Beach Club', time: '17:00', desc: 'שני ה-Beach clubs הכי טובים בסמוי – Chi (שקט ולוקסוס) או Arkbar (Fire Show אגדי כל ערב!). שניהם על Chaweng', lat: 9.5310, lng: 100.0630, type: 'cafe' },
            { name: 'Chaweng Walking Street', time: '20:00', desc: 'שוק לילי עם אוכל מקומי, ביגוד ואנרגיה – הכניסה ממש מהחוף', lat: 9.5280, lng: 100.0590, type: 'restaurant' },
        ]
    },
    {
        day: 4, date: '13.10', weekday: 'שלישי', city: 'samui',
        title: 'קו סמוי – פיג׳ אילנד וערב מדהים ♥',
        hotel: 'Sareeraya Villas & Suites Chaweng',
        weather: '🌧️ 29°C',
        activities: [
            { name: 'Pig Island (Koh Matsum) – טיול יום', time: '09:00', desc: 'אי קטן ושקט עם חזירים על החוף + שנורקלינג. לוקחות Long Tail Boat מחוף בן–ין (~600 THB). חזרה בשעות אחר הצהריים', lat: 9.4358, lng: 100.0447, type: 'attraction' },
            { name: 'Nomad Beach Bar – Fire Show', time: '18:30', desc: 'Fire Show מדהים ב-18:30 בדיוק! הגיעו מוקדם לתפוס מקום. | אלטרנטיבה: Arkbar Fire Show גם כל ערב באותה שעה', lat: 9.5295, lng: 100.0610, type: 'restaurant' },
            { name: "Cocotam's", time: '20:00', desc: "מסעדה מפורסמת בצ'אוונג – תאי מסורתי עם ריהוט מגניב ואווירה ייחודית. הזמינו מראש!", lat: 9.5275, lng: 100.0605, type: 'restaurant' },
            { name: 'The Cocoon Samui', time: '22:00', desc: 'הקלאב הכי מדובר בסמוי – מוזיקה, תאורה ואווירה. לסיום הלילה', lat: 9.5272, lng: 100.0582, type: 'restaurant' },
        ]
    },
    {
        day: 5, date: '14.10', weekday: 'רביעי', city: 'samui',
        title: 'קו סמוי – סיור Ang Thong 42 האיים 🐠',
        hotel: 'Sareeraya Villas & Suites Chaweng',
        weather: '⛅ 29°C',
        activities: [
            { name: 'יום שייט Ang Thong Marine Park', time: '08:00', desc: 'פארק ימי לאומי עם 42 איים! קיאקינג, שנורקלינג ועמוד מרשים שמוצל בסרט "הים". סיור מאורגן ~1,200 THB. יוצאים 08:00, חוזרים ~17:00', lat: 9.7580, lng: 100.0160, type: 'attraction' },
            { name: 'שוק כפר הדייגים – בופוט', time: '19:00', desc: 'Fisherman\'s Village בבופוט – כפר דייגים קסום עם בתים קולוניאליים, שוק ואוכל על שפת הים. אווירה שונה לגמרי מצ׳אוונג', lat: 9.5527, lng: 100.0074, type: 'restaurant' },
        ]
    },
    {
        day: 6, date: '15.10', weekday: 'חמישי', city: 'samui',
        title: 'קו סמוי – גן פילים, ציפלין ומסעדת גג 🐘🌿',
        hotel: 'Sareeraya Villas & Suites Chaweng',
        weather: '⛅ 29°C',
        activities: [
            { name: 'Jungle Sanctuary Koh Samui – פילים', time: '08:30', desc: 'מקלט פילים אתי – צועדות, מאכילות ורוחצות עם הפילים בג׳ונגל. הזמינו מראש! ~2,000 THB', lat: 9.5180, lng: 99.9820, type: 'attraction' },
            { name: 'Zipline האומגות – סמוי Zipline', time: '12:00', desc: 'ציפלין בג׳ונגל סמוי עם נוף לים – אדרנלין גבוה! ~1,500 THB לזוג', lat: 9.4550, lng: 100.0150, type: 'attraction' },
            { name: 'Yodyut Muay Thai – אימון / מופע', time: '16:00', desc: 'להצפות (או להצטרף!) באימון מואי תאי. אחד הג׳ימים הכי ידועים בסמוי', lat: 9.5240, lng: 100.0550, type: 'attraction' },
            { name: 'The Jungle Club – ארוחת ערב עם נוף', time: '18:30', desc: 'מסעדה על גבעה עם נוף פנורמי על כל סמוי והמפרץ. Iconic! מגיעות בסקוטר / Grab', lat: 9.5290, lng: 100.0155, type: 'restaurant' },
        ]
    },
    {
        day: 7, date: '16.10', weekday: 'שישי', city: 'samui',
        title: 'קו סמוי – יום אחרון: שוק שישי בבופוט 🌴',
        hotel: 'Sareeraya Villas & Suites Chaweng',
        weather: '☀️ 30°C',
        activities: [
            { name: 'Seen Beach Club / Lamai Beach', time: '09:30', desc: 'יום חוף שלו ב-Lamai – שקט יותר מצ׳אוונג, מים שקופים וכמה Beach clubs מגניבים', lat: 9.4750, lng: 100.0573, type: 'attraction' },
            { name: 'Central Samui', time: '13:00', desc: 'קניון המרכזי של סמוי – קניות אחרונות, סופרמרקט, קפה מזגן 😅', lat: 9.5260, lng: 100.0570, type: 'attraction' },
            { name: 'Dao Sushi', time: '16:00', desc: 'סושי מומלץ מאוד בסמוי – Fresh tuna ויצירתיות', lat: 9.5285, lng: 100.0598, type: 'restaurant' },
            { name: 'Fisherman\'s Village Friday Night Market – בופוט', time: '17:30', desc: 'שוק השישי הכי מפורסם בסמוי! אוכל מקומי, קישוטים ואווירה מיוחדת על שפת הים. אל תחמיצו!', lat: 9.5527, lng: 100.0074, type: 'attraction' },
        ]
    },
    // ── קראבי ──
    {
        day: 8, date: '17.10', weekday: 'שבת', city: 'krabi',
        title: 'סמוי → קראבי 🤿',
        hotel: 'BlueSotel SMART Krabi – Ao Nang',
        weather: '☀️ 30°C',
        activities: [
            { name: 'טיסה / מעבורת USM → KBV', time: '09:00', desc: 'Koh Samui → Krabi: טיסה ~50 דק׳ (Bangkok Airways) או מעבורת Lomprayah 4.5 שעות', lat: 9.5478, lng: 100.0620, type: 'attraction' },
            { name: 'BlueSotel SMART Krabi – צ׳ק-אין', time: '13:00', desc: 'מלון מעוצב באאו נאנג – הבסיס המושלם לקראבי', lat: 8.0373, lng: 98.8188, type: 'attraction' },
            { name: 'Ao Nang Beach – ראשון בקראבי', time: '15:00', desc: 'חוף פנורמי עם קירות גיר ירוקים – פשוט יפהפה', lat: 8.0373, lng: 98.8188, type: 'attraction' },
            { name: 'Reeve Beach Club / Bamboo Beach Club', time: '17:00', desc: 'Reeve – Beach Club מגניב עם בריכה ושקיעה | Bamboo – ישירות על הים עם חול. שניהם באאו נאנג, בחרו לפי מצב הרוח!', lat: 8.0330, lng: 98.8210, type: 'cafe' },
            { name: 'Landmark Night Market', time: '19:30', desc: 'שוק לילה באאו נאנג – פד תאי, סטיקס ואוכל רחוב מכל הסוגים', lat: 8.0388, lng: 98.8176, type: 'restaurant' },
        ]
    },
    {
        day: 9, date: '18.10', weekday: 'ראשון', city: 'krabi',
        title: 'קראבי – Railay Beach ✨',
        hotel: 'BlueSotel SMART Krabi – Ao Nang',
        weather: '☀️ 30°C',
        activities: [
            { name: 'Railay Beach – Long Tail Boat', time: '09:00', desc: 'החוף הנגיש רק בסירה – Railay West ו-East, Phra Nang Cave. ~100 THB לנפש', lat: 8.0118, lng: 98.8373, type: 'attraction' },
            { name: 'Phra Nang Cave Beach', time: '11:00', desc: 'אחד החופים הכי יפים בתאילנד – מערה, מים ירוקים וסלעים מרשימים', lat: 8.0072, lng: 98.8352, type: 'attraction' },
            { name: 'Much & Mellow Café – צהריים', time: '13:30', desc: 'Acai bowls וסמוזים טרופיים – קפה הכי טרנדי באאו נאנג', lat: 8.0378, lng: 98.8191, type: 'cafe' },
            { name: 'Monkey Trail – שביל הקופים', time: '15:00', desc: 'טיול רגלי קצר בג׳ונגל ליד אאו נאנג עם קופים פרים על הדרך! ~45 דק׳, קל יחסית', lat: 8.0510, lng: 98.8310, type: 'attraction' },
            { name: 'Tiger Cave Temple (Wat Tham Seua)', time: '16:30', desc: '1,237 מדרגות לתצפית פנורמית על קראבי ← שווה כל צעד! לצאת לפני השקיעה', lat: 8.0944, lng: 98.9104, type: 'attraction' },
            { name: 'Sababa – מסעדה ישראלית', time: '20:00', desc: 'כן, ישראלית בקראבי! פלאפל, חומוס ומנות מזרח תיכוניות – לגעגוע הביתה. באאו נאנג', lat: 8.0370, lng: 98.8182, type: 'restaurant' },
        ]
    },
    {
        day: 10, date: '19.10', weekday: 'שני', city: 'krabi',
        title: 'קראבי – Hong Island & מקדש 🏝️',
        hotel: 'BlueSotel SMART Krabi – Ao Nang',
        weather: '☀️ 31°C',
        activities: [
            { name: 'Hong Island (Koh Hong) – סיור יום', time: '08:30', desc: 'אי מדהים עם לגונה פנימית (Hong Bay) וחופים מוסתרים. ~1,200 THB כולל ציוד שנורקלינג', lat: 7.9600, lng: 98.7500, type: 'attraction' },
            { name: 'Karunaram Temple', time: '15:30', desc: 'מקדש בודהיסטי עם פסל בודהה ישן ומשמח – תצוגה של אמנות תאי מקומית', lat: 8.0500, lng: 98.8600, type: 'attraction' },
            { name: 'Ao Nang Fire Show', time: '19:30', desc: 'הופעת אש על החוף באאו נאנג – אקרובטיקה מרהיבה בשקיעה ולאחריה', lat: 8.0350, lng: 98.8210, type: 'attraction' },
            { name: 'ארוחת ים אחרונה בקראבי', time: '20:30', desc: 'פירות ים על החוף לפני המשך לפיפי מחר', lat: 8.0373, lng: 98.8188, type: 'restaurant' },
        ]
    },
    // ── קו פיפי ──
    {
        day: 11, date: '20.10', weekday: 'שלישי', city: 'phiphi',
        title: 'קראבי → קו פיפי 🏝️',
        hotel: 'PP Princess Resort',
        weather: '☀️ 31°C',
        activities: [
            { name: 'מעבורת Ao Nang → Koh Phi Phi', time: '09:00', desc: '~1.5–2 שעות בסירה מהירה – הנוף בדרך מדהים. ~350 THB', lat: 8.0373, lng: 98.8188, type: 'attraction' },
            { name: 'PP Princess Resort – צ׳ק-אין', time: '11:00', desc: 'אין רכבים באי! הכל ברגל. צ׳ק-אין ואז מיד לים', lat: 7.7404, lng: 98.7784, type: 'attraction' },
            { name: 'Viewpoint Phi Phi', time: '15:00', desc: 'הטיפוס 30 דק׳ שווה את זה – תצפית פנורמית על שני המפרצים של פיפי. אחת התמונות הכי אייקוניות בתאילנד', lat: 7.7426, lng: 98.7785, type: 'attraction' },
            { name: 'Loh Dalum Beach – שקיעה', time: '17:30', desc: 'החוף הפנימי של פיפי – שקיעה פנורמית עם רגליים בחול לבן', lat: 7.7423, lng: 98.7775, type: 'attraction' },
            { name: 'Reggae Bar – Fire Show & ערב', time: '20:00', desc: 'הבר הכי מפורסם בפיפי – להקות חי, תוכניות אקרובטיות עם אש ואנרגיה', lat: 7.7404, lng: 98.7784, type: 'restaurant' },
        ]
    },
    {
        day: 12, date: '21.10', weekday: 'רביעי', city: 'phiphi',
        title: 'קו פיפי – Maya Bay & שנורקלינג 🐠',
        hotel: 'PP Princess Resort',
        weather: '☀️ 31°C',
        activities: [
            { name: 'Maya Bay (Koh Phi Phi Leh)', time: '06:30', desc: 'יוצאות EARLY לפני ההמונים! המפרץ של "The Beach" (הסרט עם לאונרדו דיקפריו). עוצר נשימה. ~800 THB', lat: 7.6778, lng: 98.7634, type: 'attraction' },
            { name: 'Monkey Beach', time: '09:30', desc: 'חוף עם קופים חצופים – מגיעות בסירה, לא להאכיל אותם!', lat: 7.7551, lng: 98.7757, type: 'attraction' },
            { name: 'שנורקלינג Hin Klang & Bida Nok', time: '11:00', desc: 'שוניות אלמוגים עם דגי צבעים – אחד מאתרי השנורקלינג הכי טובים בתאילנד', lat: 7.6500, lng: 98.7700, type: 'attraction' },
            { name: 'Relax Bay – אחר הצהריים', time: '15:30', desc: 'החוף השקט של פיפי לי – מנוחה אחרי יום פעיל', lat: 7.7350, lng: 98.7680, type: 'attraction' },
            { name: 'ארוחת ערב מול הים', time: '19:00', desc: 'פירות ים טריים עם נוף לים – פיפי בשיא יופיה', lat: 7.7404, lng: 98.7784, type: 'restaurant' },
        ]
    },
    {
        day: 13, date: '22.10', weekday: 'חמישי', city: 'phiphi',
        title: 'קו פיפי – חוף חופשי ויציאה 🏖️',
        hotel: 'PP Princess Resort',
        weather: '☀️ 31°C',
        activities: [
            { name: 'Long Beach – בוקר שקט', time: '09:00', desc: 'החוף השקט של פיפי דון – פחות עמוס מהצד הראשי, מים שקופים', lat: 7.7330, lng: 98.7720, type: 'attraction' },
            { name: 'עיסוי תאי על החוף', time: '12:00', desc: 'כמעט כל חוף בפיפי יש עיסוי. תענוג מוחלט עם נוף לים – ~400 THB לשעה', lat: 7.7404, lng: 98.7784, type: 'cafe' },
            { name: 'קניות ומזכרות פיפי', time: '14:30', desc: 'האי הוא בועה קטנה – מגנטים, חולצות "I heart Phi Phi" ומה שבא בנפש', lat: 7.7404, lng: 98.7784, type: 'attraction' },
            { name: 'ארוחת ערב אחרונה בפיפי', time: '19:00', desc: 'להרגיש את הקסם האחרון לפני המעבורת לפוקט מחר', lat: 7.7404, lng: 98.7784, type: 'restaurant' },
        ]
    },
    // ── פוקט ──
    {
        day: 14, date: '23.10', weekday: 'שישי', city: 'phuket',
        title: 'קו פיפי → פוקט 🏖️',
        hotel: 'Crest Resort & Pool Villas Patong',
        weather: '⛅ 30°C',
        activities: [
            { name: 'מעבורת Phi Phi → Phuket (Rassada Pier)', time: '10:00', desc: '~2 שעות. ~400 THB. Grab Car ממזח ראסאדה למלון', lat: 7.7404, lng: 98.7784, type: 'attraction' },
            { name: 'Crest Resort & Pool Villas – צ׳ק-אין', time: '13:00', desc: 'מלון בבריכה בפאטונג – לצנוח אחרי שבוע של אי לאי', lat: 7.8967, lng: 98.2967, type: 'attraction' },
            { name: 'Patong Beach – ראשון בפוקט', time: '15:00', desc: '3 ק"מ חול וגלים – החוף הראשי של פוקט. שכרו אופנועי ים (Jet Ski) על החוף – ~800 THB לחצי שעה!', lat: 7.8967, lng: 98.2967, type: 'attraction' },
            { name: 'Carpe Diem Beach Club', time: '17:00', desc: 'Beach Club בפאטונג עם DJ, בריכה ים שקיעה – לחגוג שישי!', lat: 7.8975, lng: 98.2940, type: 'cafe' },
            { name: 'Bangla Road – לילה ראשון', time: '21:00', desc: 'רחוב הבידור הגדול של פוקט – מוזיקה חי, ברים ועולם לעצמו', lat: 7.8966, lng: 98.2947, type: 'restaurant' },
        ]
    },
    {
        day: 15, date: '24.10', weekday: 'שבת', city: 'phuket',
        title: 'פוקט – שייט 4 האיים ושוק נאקה 🏝️',
        hotel: 'Crest Resort & Pool Villas Patong',
        weather: '☀️ 31°C',
        activities: [
            { name: 'סיור 4 האיים – Coral Island & Friends', time: '08:00', desc: 'שייט יום שלם! קורל איילנד (Koh Hae), Koh Bon, Koh Racha Yai – שנורקלינג, חולות לבנים ומים טורקיז. יוצאים מנמל צ׳אלונג, ~1,500 THB', lat: 7.7760, lng: 98.3640, type: 'attraction' },
            { name: 'Naka Weekend Market', time: '17:00', desc: 'השוק הלילי הכי גדול בפוקט (שישי-שבת בלבד!) – בגדים, אוכל, מוזיקה חי. תזמון מושלם אחרי יום האיים', lat: 7.8880, lng: 98.3760, type: 'attraction' },
        ]
    },
    {
        day: 16, date: '25.10', weekday: 'ראשון', city: 'phuket',
        title: 'פוקט – אופנועי ים ו-Bangla Road 🛥️',
        hotel: 'Crest Resort & Pool Villas Patong',
        weather: '☀️ 31°C',
        activities: [
            { name: 'טיול חצי יום באופנועי ים (Jet Ski)', time: '09:00', desc: 'חצי יום של אדרנלין על אופנועי ים בחופי פוקט – ~800 THB לחצי שעה, שכרו ישירות על Patong Beach', lat: 7.8967, lng: 98.2967, type: 'attraction' },
            { name: 'Bangla Road', time: '21:00', desc: 'רחוב הבידור הגדול של פוקט – מוזיקה חי, ברים, תוכניות ואנרגיה שאין כמוה', lat: 7.8966, lng: 98.2947, type: 'restaurant' },
        ]
    },
    {
        day: 17, date: '26.10', weekday: 'שני', city: 'phuket',
        title: 'פוקט – פילים, עיר עתיקה ושוק Kata 🐘',
        hotel: 'Crest Resort & Pool Villas Patong',
        weather: '☀️ 30°C',
        activities: [
            { name: 'חווה טיפולית לפילים', time: '08:00', desc: 'מקלט אתי לפילים בפוקט – צועדות, מאכילות ורוחצות עם הפילים בג׳ונגל. הזמינו מראש! ~2,000 THB', lat: 8.0380, lng: 98.3570, type: 'attraction' },
            { name: 'Phuket Old Town', time: '13:00', desc: 'בתים פורטוגלים-סיניים צבעוניים, קפה בוטיק ואמנות רחוב – הכי Instagrammable בפוקט', lat: 7.8836, lng: 98.3923, type: 'attraction' },
            { name: 'Kata Night Market', time: '18:00', desc: 'שוק לילה קסום בקטה – אוכל מקומי, בגדים וקינוחים. אווירה מקומית אותנטית רחוק מהמולת פאטונג', lat: 7.8180, lng: 98.2985, type: 'restaurant' },
        ]
    },
    {
        day: 18, date: '27.10', weekday: 'שלישי', city: 'phuket',
        title: 'יציאה לישראל ✈️',
        hotel: '',
        weather: '☀️ 30°C',
        activities: [
            { name: 'Grab לשדה תעופה פוקט (HKT)', time: '05:00', desc: 'מגיעות שעתיים לפני טיסה – HKT הוא שדה תעופה בינלאומי. ~30 דק׳ מפאטונג (~300 THB)', lat: 8.1132, lng: 98.3169, type: 'attraction' },
            { name: 'טיסה חזרה לישראל ✈️', time: '07:00', desc: 'HKT → TLV – 28 ימים של ירח הדבש הגדול הגיעו לסיומם ♥ ביחד, תמיד ♥', lat: 8.1132, lng: 98.3169, type: 'attraction' },
        ]
    },
];

export const thailandCityNames = {
    bangkok: '🏙️ בנגקוק',
    samui:   '🌴 קו סמוי',
    krabi:   '🤿 קראבי',
    phiphi:  '🏝️ קו פיפי',
    phuket:  '🏖️ פוקט',
};

export const thailandCityColors = {
    bangkok: '#FF6B35',
    samui:   '#F9C74F',
    krabi:   '#7B2FBE',
    phiphi:  '#06D6A0',
    phuket:  '#00B4D8',
};

export const thailandFoodCategories = {
    thai:    { emoji: '🍜', label: 'אוכל תאי מסורתי' },
    seafood: { emoji: '🦐', label: 'פירות ים' },
    street:  { emoji: '🛺', label: 'אוכל רחוב ושווקים' },
    rooftop: { emoji: '🌆', label: 'מסעדות גג' },
    cafe:    { emoji: '☕', label: 'קפה ומתוקים' },
    bar:     { emoji: '🍹', label: 'ברים וקוקטיילים' },
};

export const thailandFoodGuide = [];
