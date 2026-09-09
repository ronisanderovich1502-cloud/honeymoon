#!/usr/bin/env node
/**
 * Normalize activity times on Monday to HH:MM half-hour slots.
 * Usage: MONDAY_TOKEN=xxx node scripts/migrate-times.mjs
 * NEVER commit tokens.
 */
import { MONDAY_BOARD } from '../monday-config.js';
import { normalizeTimeToSlot, TIME_SLOTS } from '../time-options.js';

const TOKEN = process.env.MONDAY_TOKEN;
const BOARD_ID = String(MONDAY_BOARD.boardId);
const TIME_COL = MONDAY_BOARD.columns.time;
const TYPE_COL = MONDAY_BOARD.columns.record_type;
const DRY = process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('Set MONDAY_TOKEN env var');
  process.exit(1);
}

const SLOT_SET = new Set(TIME_SLOTS);

async function gql(query, variables = {}, retries = 8) {
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

function desiredTime(raw) {
  const slot = normalizeTimeToSlot(raw, { emptyAs: '' });
  if (slot && SLOT_SET.has(slot)) return slot;
  // free-text like יום שלם / לילה → clear to empty (app shows as ?)
  return '';
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
              column_values(ids:["${TYPE_COL}","${TIME_COL}"]) { id text }
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
      items.push({ id: it.id, name: it.name, time: cv[TIME_COL] });
    }
    cursor = page.cursor;
  } while (cursor);
  return items;
}

async function updateTime(itemId, time) {
  const cols = JSON.stringify({ [TIME_COL]: time });
  await gql(
    `mutation($itemId:ID!,$boardId:ID!,$cols:JSON!) {
      change_multiple_column_values(item_id:$itemId, board_id:$boardId, column_values:$cols) { id }
    }`,
    { itemId: String(itemId), boardId: BOARD_ID, cols },
  );
}

async function main() {
  console.log(DRY ? 'DRY RUN — no writes' : 'Migrating activity times…');
  const acts = await fetchActivities();
  console.log(`Activities: ${acts.length}`);

  const changes = [];
  for (const a of acts) {
    const next = desiredTime(a.time);
    const cur = (a.time || '').trim();
    if (cur === next) continue;
    // already valid slot
    if (SLOT_SET.has(cur) && cur === next) continue;
    changes.push({ ...a, next });
  }

  console.log(`Need update: ${changes.length}`);
  for (const c of changes) {
    console.log(`  ${c.id} ${c.name}: ${JSON.stringify(c.time)} → ${JSON.stringify(c.next)}`);
  }

  if (DRY || !changes.length) {
    console.log('Done (no writes).');
    return;
  }

  let ok = 0;
  for (const c of changes) {
    await updateTime(c.id, c.next);
    ok++;
    if (ok % 5 === 0) await new Promise(r => setTimeout(r, 300));
  }
  console.log(`Updated ${ok} items.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
