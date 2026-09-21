import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.join(__dirname, 'locales', 'en.json');
const taPath = path.join(__dirname, 'locales', 'ta.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ta = JSON.parse(fs.readFileSync(taPath, 'utf8'));

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

const enKeys = new Set(getKeys(en));
const taKeys = new Set(getKeys(ta));

const missingInTa = [...enKeys].filter((k) => !taKeys.has(k));
const missingInEn = [...taKeys].filter((k) => !enKeys.has(k));

console.log('Total EN keys:', enKeys.size);
console.log('Total TA keys:', taKeys.size);

if (missingInTa.length > 0) {
  console.error('❌ Keys missing in Tamil (ta.json):', missingInTa);
}

if (missingInEn.length > 0) {
  console.error('❌ Keys missing in English (en.json):', missingInEn);
}

if (missingInTa.length === 0 && missingInEn.length === 0) {
  console.log('✅ PERFECT 100% KEY PARITY BETWEEN EN AND TA!');
}
