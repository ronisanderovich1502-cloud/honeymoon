// Live itinerary data is loaded from Monday — these arrays start empty.
export const foodCategories = {
    cafe:     { emoji: '☕', label: 'בתי קפה ומאפיות' },
    icecream: { emoji: '🍦', label: 'גלידה ומתוקים' },
    ramen:    { emoji: '🍜', label: 'ראמן ואודון' },
    sushi:    { emoji: '🍣', label: 'סושי ופירות ים' },
    yakiniku: { emoji: '🔥', label: 'יאקיניקו ובשרים' },
    katsu:    { emoji: '🥩', label: 'קטסו ובשר מטוגן' },
    gyoza:    { emoji: '🥟', label: 'גיוזות' },
    burger:   { emoji: '🍔', label: 'המבורגרים' },
    pizza:    { emoji: '🍕', label: 'פיצה ואיטלקי' },
    pasta:    { emoji: '🍝', label: 'פסטה' },
    bar:      { emoji: '🍸', label: 'ברים וספיקיזי' },
    street:   { emoji: '🥡', label: 'אוכל רחוב ונשנושים' },
};

export const foodGuide = [];
export const days = [];

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
