import { MONDAY_BOARD } from './monday-config.js';
import { normalizeTimeToSlot, suggestEndTime } from './time-options.js';

const API = 'https://api.monday.com/v2';
const C = MONDAY_BOARD.columns;

function readItem(item) {
  const cv = Object.fromEntries((item.column_values || []).map(c => [c.id, c]));
  const get = (key) => {
    const col = cv[C[key]];
    if (!col) return null;
    if (col.text != null && col.text !== '') {
      if (['day_number', 'lat', 'lng', 'sort_order', 'food_day'].includes(key)) return Number(col.text);
      return col.text;
    }
    if (col.type === 'long_text' && col.value) {
      try { return JSON.parse(col.value).text || null; } catch { return null; }
    }
    return null;
  };

  return {
    mondayId: item.id,
    name: item.name,
    recordType: get('record_type'),
    country: get('country'),
    city: get('city'),
    dayNumber: get('day_number'),
    date: get('date'),
    weekday: get('weekday'),
    title: get('title'),
    weather: get('weather'),
    hotel: get('hotel'),
    time: get('time'),
    timeEnd: get('time_end'),
    desc: get('desc'),
    lat: get('lat'),
    lng: get('lng'),
    placeType: get('place_type'),
    sortOrder: get('sort_order'),
    area: get('area'),
    category: get('category'),
    foodDay: get('food_day'),
  };
}

export async function mondayQuery(token, query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      'API-Version': '2024-10',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export async function verifyToken(token) {
  const data = await mondayQuery(token, 'query { me { id name account { slug } } }');
  return data.me;
}

/** Lightweight change detector — board updated_at + item count */
export async function fetchBoardFingerprint(token) {
  const data = await mondayQuery(token,
    `query($id:[ID!]!) {
      boards(ids:$id) {
        updated_at
        items_count
      }
    }`,
    { id: [String(MONDAY_BOARD.boardId)] },
  );
  const board = data.boards?.[0];
  if (!board) throw new Error('Board not found');
  return `${board.updated_at}|${board.items_count}`;
}

export async function fetchAllItems(token) {
  const items = [];
  let cursor = null;
  do {
    const data = await mondayQuery(token,
      `query($id:[ID!]!,$cursor:String) {
        boards(ids:$id) {
          items_page(limit:500,cursor:$cursor) {
            cursor
            items {
              id name
              column_values { id text value type }
            }
          }
        }
      }`,
      { id: [String(MONDAY_BOARD.boardId)], cursor },
    );
    const page = data.boards[0].items_page;
    items.push(...page.items.map(readItem));
    cursor = page.cursor;
  } while (cursor);
  return items;
}

export function buildDataFromItems(items, country) {
  const countryLabel = MONDAY_BOARD.countries[country];
  const filtered = items.filter(i =>
    i.country === countryLabel &&
    i.recordType &&
    !i.name.startsWith('Task 1'),
  );

  const days = filtered
    .filter(i => i.recordType === MONDAY_BOARD.recordTypes.day)
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map(d => ({
      mondayId: d.mondayId,
      day: d.dayNumber,
      date: d.date,
      weekday: d.weekday,
      city: d.city,
      title: d.title,
      weather: d.weather,
      hotel: d.hotel || undefined,
      activities: [],
    }));

  const dayMap = Object.fromEntries(days.map(d => [d.day, d]));

  filtered
    .filter(i => i.recordType === MONDAY_BOARD.recordTypes.activity)
    .sort((a, b) => (a.dayNumber - b.dayNumber) || (a.sortOrder - b.sortOrder))
    .forEach(a => {
      const day = dayMap[a.dayNumber];
      if (!day) return;
      const start = normalizeTimeToSlot(a.time, { emptyAs: '' });
      const end = normalizeTimeToSlot(a.timeEnd, { emptyAs: '' }) || (start ? suggestEndTime(start) : '');
      day.activities.push({
        mondayId: a.mondayId,
        name: a.name,
        time: start || '?',
        timeEnd: end,
        desc: a.desc || '',
        lat: a.lat,
        lng: a.lng,
        type: a.placeType || 'attraction',
      });
    });

  const foodGuide = filtered
    .filter(i => i.recordType === MONDAY_BOARD.recordTypes.food)
    .map(f => ({
      mondayId: f.mondayId,
      name: f.name,
      city: f.city,
      area: f.area || '',
      category: f.category || 'street',
      desc: f.desc || '',
      ...(f.foodDay ? { day: f.foodDay } : {}),
    }));

  return { days, foodGuide };
}

function colVal(key, value, type) {
  if (value === undefined || value === null || value === '') return null;
  const id = C[key];
  if (type === 'status') return { [id]: { label: value } };
  if (type === 'dropdown') return { [id]: { labels: [value] } };
  if (type === 'long_text') return { [id]: { text: String(value) } };
  return { [id]: String(value) };
}

function mergeCols(...parts) {
  return JSON.stringify(Object.assign({}, ...parts.filter(Boolean)));
}

export async function createDayItem(token, country, day) {
  const countryLabel = MONDAY_BOARD.countries[country];
  const cols = mergeCols(
    colVal('record_type', MONDAY_BOARD.recordTypes.day, 'status'),
    colVal('country', countryLabel, 'dropdown'),
    colVal('city', day.city, 'dropdown'),
    colVal('day_number', day.day),
    colVal('date', day.date),
    colVal('weekday', day.weekday),
    colVal('title', day.title),
    colVal('weather', day.weather),
    colVal('hotel', day.hotel),
  );
  const data = await mondayQuery(token,
    `mutation($boardId:ID!,$name:String!,$cols:JSON!) {
      create_item(board_id:$boardId, item_name:$name, column_values:$cols, create_labels_if_missing:true) { id }
    }`,
    { boardId: String(MONDAY_BOARD.boardId), name: `${countryLabel} Day ${day.day}: ${day.title}`, cols },
  );
  return data.create_item.id;
}

function activityTimeForBoard(time) {
  if (!time || time === '?') return '';
  return normalizeTimeToSlot(time, { emptyAs: '' });
}

export async function createActivityItem(token, country, dayNum, city, activity, sortOrder) {
  const countryLabel = MONDAY_BOARD.countries[country];
  const cols = mergeCols(
    colVal('record_type', MONDAY_BOARD.recordTypes.activity, 'status'),
    colVal('country', countryLabel, 'dropdown'),
    colVal('city', city, 'dropdown'),
    colVal('day_number', dayNum),
    colVal('time', activityTimeForBoard(activity.time)),
    colVal('time_end', activityTimeForBoard(activity.timeEnd)),
    colVal('desc', activity.desc, 'long_text'),
    colVal('lat', activity.lat),
    colVal('lng', activity.lng),
    colVal('place_type', activity.type || 'attraction', 'status'),
    colVal('sort_order', sortOrder),
  );
  const data = await mondayQuery(token,
    `mutation($boardId:ID!,$name:String!,$cols:JSON!) {
      create_item(board_id:$boardId, item_name:$name, column_values:$cols, create_labels_if_missing:true) { id }
    }`,
    { boardId: String(MONDAY_BOARD.boardId), name: activity.name, cols },
  );
  return data.create_item.id;
}

export async function updateActivityItem(token, itemId, activity) {
  const cols = mergeCols(
    colVal('time', activityTimeForBoard(activity.time)),
    colVal('time_end', activityTimeForBoard(activity.timeEnd)),
    colVal('desc', activity.desc, 'long_text'),
    colVal('lat', activity.lat),
    colVal('lng', activity.lng),
    colVal('place_type', activity.type || 'attraction', 'status'),
  );
  await mondayQuery(token,
    `mutation($itemId:ID!,$boardId:ID!,$cols:JSON!) {
      change_multiple_column_values(item_id:$itemId, board_id:$boardId, column_values:$cols) { id }
    }`,
    { itemId: String(itemId), boardId: String(MONDAY_BOARD.boardId), cols },
  );
  if (activity.name) {
    await mondayQuery(token,
      `mutation($itemId:ID!,$name:String!) { change_simple_column_value(item_id:$itemId, column_id:"name", value:$name) { id } }`,
      { itemId: String(itemId), name: activity.name },
    );
  }
}

export async function deleteItem(token, itemId) {
  await mondayQuery(token,
    `mutation($itemId:ID!) { delete_item(item_id:$itemId) { id } }`,
    { itemId: String(itemId) },
  );
}

export async function createFoodItem(token, country, entry) {
  const countryLabel = MONDAY_BOARD.countries[country];
  const cols = mergeCols(
    colVal('record_type', MONDAY_BOARD.recordTypes.food, 'status'),
    colVal('country', countryLabel, 'dropdown'),
    colVal('city', entry.city, 'dropdown'),
    colVal('area', entry.area),
    colVal('category', entry.category, 'dropdown'),
    colVal('desc', entry.desc, 'long_text'),
    colVal('food_day', entry.day),
  );
  const data = await mondayQuery(token,
    `mutation($boardId:ID!,$name:String!,$cols:JSON!) {
      create_item(board_id:$boardId, item_name:$name, column_values:$cols, create_labels_if_missing:true) { id }
    }`,
    { boardId: String(MONDAY_BOARD.boardId), name: entry.name, cols },
  );
  return data.create_item.id;
}
