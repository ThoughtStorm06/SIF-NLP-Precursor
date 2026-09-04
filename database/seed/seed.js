import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadSeedData() {
  const seedPath = path.join(__dirname, 'seedData.json');
  const raw = fs.readFileSync(seedPath, 'utf8');
  return JSON.parse(raw);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = loadSeedData();
  console.log(`Loaded ${data.reports.length} reports, ${data.taxonomy.length} taxonomy items, ${data.capa_actions.length} CAPA actions.`);
}
