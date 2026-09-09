import { MONDAY_BOARD } from './monday-config.js';
import { normalizeTimeToSlot, suggestEndTime, sortActivitiesByTime } from './time-options.js';
import { normalizePlaceType } from './validate.js';

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
      notes: [],
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
        type: normalizePlaceType(a.placeType, 'attraction'),
        sortOrder: a.sortOrder ?? day.activities.length,
      });
    });

  days.forEach(d => sortActivitiesByTime(d.activities));

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

/** Fetch Monday updates (comments) for Day items, keyed by item id */
export async function fetchUpdatesForItems(token, itemIds) {
  const ids = [...new Set((itemIds || []).filter(Boolean).map(String))];
  const byItem = {};
  if (!ids.length) return byItem;

  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    const data = await mondayQuery(token,
      `query($ids:[ID!]!) {
        items(ids:$ids) {
          id
          updates(limit: 50) {
            id
            text_body
            body
            created_at
            creator { name }
          }
        }
      }`,
      { ids: chunk },
    );
    for (const item of data.items || []) {
      const notes = (item.updates || [])
        .map(u => ({
          id: u.id,
          text: (u.text_body || '').trim() || stripHtml(u.body || ''),
          createdAt: u.created_at,
          author: u.creator?.name || '',
        }))
        .filter(n => n.text)
        .reverse(); // oldest first
      byItem[String(item.id)] = notes;
    }
  }
  return byItem;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function toUpdateHtml(text) {
  const esc = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
  return `<p>${esc}</p>`;
}

/** Create a Monday update (comment) on a Day item */
export async function createItemUpdate(token, itemId, text) {
  const data = await mondayQuery(token,
    `mutation($itemId:ID!,$body:String!) {
      create_update(item_id:$itemId, body:$body) {
        id
        text_body
        created_at
        creator { name }
      }
    }`,
    { itemId: String(itemId), body: toUpdateHtml(text) },
  );
  const u = data.create_update;
  return {
    id: u.id,
    text: (u.text_body || '').trim() || String(text).trim(),
    createdAt: u.created_at,
    author: u.creator?.name || '',
  };
}

/** Edit an existing Monday update */
export async function editItemUpdate(token, updateId, text) {
  const data = await mondayQuery(token,
    `mutation($id:ID!,$body:String!) {
      edit_update(id:$id, body:$body) {
        id
        text_body
        created_at
        creator { name }
      }
    }`,
    { id: String(updateId), body: toUpdateHtml(text) },
  );
  const u = data.edit_update;
  return {
    id: u.id,
    text: (u.text_body || '').trim() || String(text).trim(),
    createdAt: u.created_at,
    author: u.creator?.name || '',
  };
}

/** Delete a Monday update */
export async function deleteItemUpdate(token, updateId) {
  await mondayQuery(token,
    `mutation($id:ID!) { delete_update(id:$id) { id } }`,
    { id: String(updateId) },
  );
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
    colVal('place_type', normalizePlaceType(activity.type, 'attraction'), 'status'),
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

export async function updateActivityItem(token, itemId, activity, { dayNum, city } = {}) {
  const cols = mergeCols(
    activity.name ? { name: activity.name } : null,
    dayNum != null ? colVal('day_number', dayNum) : null,
    city ? colVal('city', city, 'dropdown') : null,
    colVal('time', activityTimeForBoard(activity.time)),
    colVal('time_end', activityTimeForBoard(activity.timeEnd)),
    colVal('desc', activity.desc, 'long_text'),
    colVal('lat', activity.lat),
    colVal('lng', activity.lng),
    colVal('place_type', normalizePlaceType(activity.type, 'attraction'), 'status'),
    activity.sortOrder != null ? colVal('sort_order', activity.sortOrder) : null,
  );
  await mondayQuery(token,
    `mutation($itemId:ID!,$boardId:ID!,$cols:JSON!) {
      change_multiple_column_values(item_id:$itemId, board_id:$boardId, column_values:$cols, create_labels_if_missing:true) { id }
    }`,
    { itemId: String(itemId), boardId: String(MONDAY_BOARD.boardId), cols },
  );
}

/** Persist only sort_order for an activity */
export async function updateActivitySortOrder(token, itemId, sortOrder) {
  const cols = mergeCols(colVal('sort_order', sortOrder));
  await mondayQuery(token,
    `mutation($itemId:ID!,$boardId:ID!,$cols:JSON!) {
      change_multiple_column_values(item_id:$itemId, board_id:$boardId, column_values:$cols) { id }
    }`,
    { itemId: String(itemId), boardId: String(MONDAY_BOARD.boardId), cols },
  );
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
