import { saveMap, getMapsByDate } from './db.js';
import { FIREBASE_FUNCTION_URL } from './firebase-config.js';
import { renderMindmap } from './mindmap-svg.js';

const inputEl = document.getElementById('input');
const createBtn = document.getElementById('create');
const eodBtn = document.getElementById('eod');
const mapDiv = document.getElementById('map');

// -------------------------------------------------
// 1. Receive selection from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SELECTION') {
    inputEl.value = msg.text;
  }
});

// -------------------------------------------------
// 2. Helper: call Gemini Nano (if available)
async function callNano(prompt, options = {}) {
  if (!('Writer' in self)) throw new Error('Nano not supported');
  const avail = await Writer.availability();
  if (avail !== 'available') throw new Error('Nano not ready');

  const writer = await Writer.create(options);
  return await writer.write(prompt);
}

// -------------------------------------------------
// 3. Helper: fallback to Firebase AI Logic
async function callFirebase(prompt) {
  const res = await fetch(FIREBASE_FUNCTION_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  return data.response;
}

// -------------------------------------------------
// 4. Create a single mind-map
createBtn.onclick = async () => {
  const text = inputEl.value.trim();
  if (!text) return alert('Enter or select some text');

  const source = document.title || 'Untitled';
  let jsonStr;
  try {
    jsonStr = await callNano(
      `Turn the following text into a compact mind-map JSON (max 12 nodes). ` +
      `Root node title: "${source}". Return ONLY valid JSON.\n\n${text}`,
      { format: 'plain-text' }
    );
  } catch (e) {
    console.warn('Nano failed, using Firebase', e);
    jsonStr = await callFirebase(
      `Convert to mind-map JSON (max 12 nodes). Root: "${source}". Return ONLY JSON.\n${text}`
    );
  }

  let map;
  try { map = JSON.parse(jsonStr); }
  catch { alert('AI returned invalid JSON'); return; }

  const record = {
    source,
    timestamp: new Date().toISOString(),
    data: map
  };
  await saveMap(record);
  renderMindmap(map, mapDiv);
};

// -------------------------------------------------
// 5. EOD Summary
eodBtn.onclick = async () => {
  const today = new Date().toDateString();
  const dayMaps = await getMapsByDate(today);
  if (!dayMaps.length) return alert('No maps today');

  const mergedPrompt = `
You are an expert summarizer. Merge the following ${dayMaps.length} mind-maps into ONE compact EOD mind-map.
Keep only the 10 most important nodes. Title the root: "EOD – ${today}".
Return ONLY valid JSON.

Maps:
${JSON.stringify(dayMaps.map(m => m.data))}
`;

  let mergedJson;
  try {
    mergedJson = await callNano(mergedPrompt, { format: 'plain-text' });
  } catch {
    mergedJson = await callFirebase(mergedPrompt);
  }

  let merged;
  try { merged = JSON.parse(mergedJson); }
  catch { alert('EOD JSON error'); return; }

  renderMindmap(merged, mapDiv);
};