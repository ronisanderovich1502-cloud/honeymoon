#!/usr/bin/env node
/**
 * Fill time + time_end on every Activity.
 * - "night" / לילה → 21:00–23:00
 * - full day / יום שלם / empty specials → 09:00–18:00
 * - otherwise end = start + 90m (clamped)
 *
 * Usage: MONDAY_TOKEN=xxx node scripts/migrate-time-end.mjs [--dry-run]
 */
import { MONDAY_BOARD } from '../monday-config.js';
import {
  normalizeTimeToSlot,
  suggestEndTime,
  parseTimeToMinutes,
  DEFAULT_NIGHT_START,
  DEFAULT_NIGHT_END,
  DEFAULT_FULL_DAY_START,
  DEFAULT_FULL_DAY_END,
} from '../time-options.js';

const TOKEN = process.env.MONDAY_TOKEN;
const BOARD_ID = String(MONDAY_BOARD.boardId);
const TIME_COL = MONDAY_BOARD.columns.time;
const END_COL = MONDAY_BOARD.columns.time_end;
const TYPE_COL = MONDAY_BOARD.columns.record_type;
const DRY = process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('Set MONDAY_TOKEN env var');
  process.exit(1);
}

async function gql(query, variables = {}, retries = 10) {
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

function planTimes(name, startRaw, endRaw) {
  const n = String(name || '');
  const startTxt = String(startRaw || '').trim();
  const endTxt = String(endRaw || '').trim();

  // Known former free-text / empty specials
  const looksNight = /לילה|night/i.test(startTxt) || (/סיבוב ספונטני|לילה/.test(n) && !parseTimeToMinutes(startTxt));
  const looksFullDay = /יום שלם|full\s*day/i.test(startTxt)
    || (/דיסני|יוניברסל|universal|disney/i.test(n) && !parseTimeToMinutes(startTxt));

  let start = normalizeTimeToSlot(startTxt, { emptyAs: '' });
  let end = normalizeTimeToSlot(endTxt, { emptyAs: '' });

  if (looksNight || (!start && /לילה|night/i.test(n))) {
    start = DEFAULT_NIGHT_START;
    end = DEFAULT_NIGHT_END;
  } else if (looksFullDay) {
    start = DEFAULT_FULL_DAY_START;
    end = DEFAULT_FULL_DAY_END;
  } else if (!start) {
    // leftover empties — treat as short stop midday default
    start = '12:00';
    end = suggestEndTime(start);
  } else if (!end) {
    end = suggestEndTime(start);
  }

  // ensure end > start
  if (parseTimeToMinutes(end) <= parseTimeToMinutes(start)) {
    end = suggestEndTime(start);
  }

  return { start, end };
}

async function fetchActivities() {
  const items = [];
  let cursor = null;
  do {
    const data = await gql(
      `query($id:[ID!]!,$cursor:String) {
        boards(ids:$id) {
          items_page(limit:100, cursor:$cursor) {
            cursor
            items {
              id name
              column_values(ids:["${TYPE_COL}","${TIME_COL}","${END_COL}"]) { id text }
            }
          }
        }
      }`,
      { id: [BOARD_ID], cursor },
    );
    const page = data.boards[0].items_page;
    for (const it of page.items) {
      const cv = Object.fromEntries(it.column_values.map(c => [c.id, c.text || '']));
      if (cv[TYPE_COL] !== 'Activity') continue;
      items.push({ id: it.id, name: it.name, time: cv[TIME_COL], timeEnd: cv[END_COL] });
    }
    cursor = page.cursor;
  } while (cursor);
  return items;
}

async function updateItem(itemId, start, end) {
  const cols = JSON.stringify({ [TIME_COL]: start, [END_COL]: end });
  await gql(
    `mutation($itemId:ID!,$boardId:ID!,$cols:JSON!) {
      change_multiple_column_values(item_id:$itemId, board_id:$boardId, column_values:$cols) { id }
    }`,
    { itemId: String(itemId), boardId: BOARD_ID, cols },
  );
}

async function main() {
  console.log(DRY ? 'DRY RUN' : 'Migrating time + time_end…');
  console.log(`Night default: ${DEFAULT_NIGHT_START}–${DEFAULT_NIGHT_END}`);
  console.log(`Full-day default: ${DEFAULT_FULL_DAY_START}–${DEFAULT_FULL_DAY_END}`);
  console.log(`Default duration: +90m`);

  const acts = await fetchActivities();
  console.log(`Activities: ${acts.length}`);

  const changes = [];
  for (const a of acts) {
    const next = planTimes(a.name, a.time, a.timeEnd);
    if (a.time === next.start && a.timeEnd === next.end) continue;
    changes.push({ ...a, ...next });
  }

  console.log(`Need update: ${changes.length}`);
  for (const c of changes.slice(0, 40)) {
    console.log(`  ${c.id} ${c.name}: ${JSON.stringify(c.time)}→${c.start} | end ${JSON.stringify(c.timeEnd)}→${c.end}`);
  }
  if (changes.length > 40) console.log(`  … +${changes.length - 40} more`);

  if (DRY || !changes.length) {
    console.log('Done (no writes).');
    return;
  }

  let ok = 0;
  for (const c of changes) {
    await updateItem(c.id, c.start, c.end);
    ok++;
    if (ok % 10 === 0) {
      console.log(`  … ${ok}/${changes.length}`);
      await new Promise(r => setTimeout(r, 400));
    }
  }
  console.log(`Updated ${ok} activities.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
