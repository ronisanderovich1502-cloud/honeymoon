#!/usr/bin/env node
/**
 * One-time setup: create columns + seed items on Monday board.
 * Usage: MONDAY_TOKEN=xxx node scripts/setup-monday-board.mjs
 * NEVER commit tokens. Token is read from env only.
 */
import { days, foodGuide } from '../data.js';
import { thailandDays, thailandFoodGuide } from '../thailand-data.js';

const TOKEN = process.env.MONDAY_TOKEN;
const BOARD_ID = Number(process.env.MONDAY_BOARD_ID || 18430342548);

if (!TOKEN) {
  console.error('Set MONDAY_TOKEN env var');
  process.exit(1);
}

async function gql(query, variables = {}, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        Authorization: TOKEN,
        'Content-Type': 'application/json',
        'API-Version': '2024-10',
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    const exhausted = json.errors?.find(e => e.extensions?.code === 'COMPLEXITY_BUDGET_EXHAUSTED');
    if (exhausted) {
      const wait = (exhausted.extensions.retry_in_seconds || 20) * 1000 + 500;
      console.log(`Rate limited, waiting ${Math.round(wait / 1000)}s...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
    return json.data;
  }
  throw new Error('Max retries exceeded');
}

const COLUMN_DEFS = [
  { title: 'record_type', type: 'status', settings: { labels: { 0: 'Day', 1: 'Activity', 2: 'Food' } } },
  { title: 'country', type: 'dropdown', settings: { labels: [{ name: 'Japan' }, { name: 'Thailand' }] } },
  {
    title: 'city', type: 'dropdown',
    settings: {
      labels: [
        { name: 'tokyo' }, { name: 'kyoto' }, { name: 'osaka' },
        { name: 'bangkok' }, { name: 'samui' }, { name: 'krabi' }, { name: 'phiphi' }, { name: 'phuket' },
      ],
    },
  },
  { title: 'day_number', type: 'numbers' },
  { title: 'date', type: 'text' },
  { title: 'weekday', type: 'text' },
  { title: 'title', type: 'text' },
  { title: 'weather', type: 'text' },
  { title: 'hotel', type: 'text' },
  { title: 'time', type: 'text' },
  { title: 'desc', type: 'long_text' },
  { title: 'lat', type: 'numbers' },
  { title: 'lng', type: 'numbers' },
  {
    title: 'place_type', type: 'status',
    settings: {
      labels: {
        0: 'attraction', 1: 'restaurant', 2: 'cafe', 3: 'hotel', 4: 'transport',
      },
    },
  },
  { title: 'sort_order', type: 'numbers' },
  { title: 'area', type: 'text' },
  {
    title: 'category', type: 'dropdown',
    settings: {
      labels: [
        'cafe', 'icecream', 'ramen', 'sushi', 'yakiniku', 'katsu', 'gyoza', 'burger',
        'pizza', 'pasta', 'bar', 'street', 'thai', 'seafood', 'rooftop',
      ].map(name => ({ name })),
    },
  },
  { title: 'food_day', type: 'numbers' },
];

async function createColumns() {
  const existing = await gql(`query($id:[ID!]!) { boards(ids:$id) { columns { id title type } } }`, { id: [String(BOARD_ID)] });
  const cols = existing.boards[0].columns;
  const byTitle = Object.fromEntries(cols.map(c => [c.title, c.id]));
  const map = { ...byTitle };

  for (const def of COLUMN_DEFS) {
    if (map[def.title]) continue;
    const settings = def.settings ? JSON.stringify(def.settings) : undefined;
    const data = await gql(
      `mutation($boardId:ID!,$title:String!,$type:ColumnType!,$settings:JSON) {
        create_column(board_id:$boardId, title:$title, column_type:$type, defaults:$settings) { id title }
      }`,
      { boardId: String(BOARD_ID), title: def.title, type: def.type, settings },
    );
    map[def.title] = data.create_column.id;
    console.log('Created column', def.title, map[def.title]);
  }
  return map;
}

function col(cols, title, value) {
  if (value === undefined || value === null || value === '') return null;
  const id = cols[title];
  if (!id) return null;
  if (title === 'record_type' || title === 'place_type') return { [id]: { label: value } };
  if (title === 'country' || title === 'city' || title === 'category') return { [id]: { labels: [value] } };
  if (title === 'desc') return { [id]: { text: String(value) } };
  if (['day_number', 'lat', 'lng', 'sort_order', 'food_day'].includes(title)) return { [id]: String(value) };
  return { [id]: String(value) };
}

function mergeCols(...parts) {
  return JSON.stringify(Object.assign({}, ...parts.filter(Boolean)));
}

function buildItems(cols) {
  const items = [];

  for (const d of days) {
    items.push({
      name: `Japan Day ${d.day}: ${d.title}`,
      columnValues: mergeCols(
        col(cols, 'record_type', 'Day'),
        col(cols, 'country', 'Japan'),
        col(cols, 'city', d.city),
        col(cols, 'day_number', d.day),
        col(cols, 'date', d.date),
        col(cols, 'weekday', d.weekday),
        col(cols, 'title', d.title),
        col(cols, 'weather', d.weather),
      ),
    });
    d.activities.forEach((a, i) => {
      items.push({
        name: a.name,
        columnValues: mergeCols(
          col(cols, 'record_type', 'Activity'),
          col(cols, 'country', 'Japan'),
          col(cols, 'city', d.city),
          col(cols, 'day_number', d.day),
          col(cols, 'time', a.time),
          col(cols, 'desc', a.desc),
          col(cols, 'lat', a.lat),
          col(cols, 'lng', a.lng),
          col(cols, 'place_type', a.type || 'attraction'),
          col(cols, 'sort_order', i),
        ),
      });
    });
  }

  for (const f of foodGuide) {
    items.push({
      name: f.name,
      columnValues: mergeCols(
        col(cols, 'record_type', 'Food'),
        col(cols, 'country', 'Japan'),
        col(cols, 'city', f.city),
        col(cols, 'area', f.area),
        col(cols, 'category', f.category),
        col(cols, 'desc', f.desc),
        col(cols, 'food_day', f.day),
      ),
    });
  }

  for (const d of thailandDays) {
    items.push({
      name: `Thailand Day ${d.day}: ${d.title}`,
      columnValues: mergeCols(
        col(cols, 'record_type', 'Day'),
        col(cols, 'country', 'Thailand'),
        col(cols, 'city', d.city),
        col(cols, 'day_number', d.day),
        col(cols, 'date', d.date),
        col(cols, 'weekday', d.weekday),
        col(cols, 'title', d.title),
        col(cols, 'weather', d.weather),
        col(cols, 'hotel', d.hotel),
      ),
    });
    d.activities.forEach((a, i) => {
      items.push({
        name: a.name,
        columnValues: mergeCols(
          col(cols, 'record_type', 'Activity'),
          col(cols, 'country', 'Thailand'),
          col(cols, 'city', d.city),
          col(cols, 'day_number', d.day),
          col(cols, 'time', a.time),
          col(cols, 'desc', a.desc),
          col(cols, 'lat', a.lat),
          col(cols, 'lng', a.lng),
          col(cols, 'place_type', a.type || 'attraction'),
          col(cols, 'sort_order', i),
        ),
      });
    });
  }

  for (const f of thailandFoodGuide) {
    items.push({
      name: f.name,
      columnValues: mergeCols(
        col(cols, 'record_type', 'Food'),
        col(cols, 'country', 'Thailand'),
        col(cols, 'city', f.city),
        col(cols, 'area', f.area),
        col(cols, 'category', f.category),
        col(cols, 'desc', f.desc),
        col(cols, 'food_day', f.day),
      ),
    });
  }

  return items;
}

async function getExistingCount() {
  const data = await gql(`query($id:[ID!]!) { boards(ids:$id) { items_count } }`, { id: [String(BOARD_ID)] });
  return data.boards[0].items_count;
}

async function createItems(items, startAt = 0) {
  for (let i = startAt; i < items.length; i++) {
    const it = items[i];
    await gql(
      `mutation($boardId:ID!,$name:String!,$cols:JSON!) {
        create_item(board_id:$boardId, item_name:$name, column_values:$cols, create_labels_if_missing:true) { id }
      }`,
      { boardId: String(BOARD_ID), name: it.name, cols: it.columnValues },
    );
    if ((i + 1) % 20 === 0 || i === items.length - 1) {
      console.log(`Created items ${i + 1} / ${items.length}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
}

async function main() {
  const cols = await createColumns();
  console.log('\nColumn map:', JSON.stringify(cols, null, 2));
  if (process.argv.includes('--columns-only')) {
    console.log('\nColumns ready. Board ID:', BOARD_ID);
    console.log('Board URL: https://shahar-monday.monday.com/boards/' + BOARD_ID);
    return;
  }
  const items = buildItems(cols);
  const existing = await getExistingCount();
  const startAt = Math.max(0, existing - 1); // subtract default Task 1
  console.log(`Seeding ${items.length} items (resume from ${startAt}, existing ~${existing})...`);
  await createItems(items, startAt);
  console.log('Done. Board ID:', BOARD_ID);
}

main().catch(e => { console.error(e); process.exit(1); });
