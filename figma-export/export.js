const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = 'figd_FEQcpSINXOK-4guhEij0Sa3qfVQ-W4ru_AFT0Nln';
const FILE_ID = 'JpwMNbRS2nShxg5g6aTvvP';
const OUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'X-Figma-Token': TOKEN, ...headers } };
    https.get(url, opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      // follow redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

// Walk node tree and collect all TEXT nodes
function collectText(node, results = []) {
  if (node.type === 'TEXT' && node.characters) {
    results.push({ id: node.id, name: node.name, text: node.characters });
  }
  if (node.children) node.children.forEach(c => collectText(c, results));
  return results;
}

// Collect top-level frames (pages → frames)
function collectFrames(doc) {
  const frames = [];
  for (const page of doc.children) {
    for (const node of (page.children || [])) {
      if (['FRAME', 'COMPONENT', 'GROUP'].includes(node.type)) {
        frames.push({ id: node.id, name: node.name });
      }
    }
  }
  return frames;
}

async function main() {
  console.log('Fetching file...');
  const fileRes = await get(`https://api.figma.com/v1/files/${FILE_ID}`);
  const file = JSON.parse(fileRes.body);

  if (file.err) { console.error('Figma API error:', file.err); process.exit(1); }

  // --- Extract text ---
  const texts = collectText(file.document);
  const textOutput = texts.map(t => `[${t.name}]\n${t.text}`).join('\n\n---\n\n');
  fs.writeFileSync(path.join(OUT_DIR, 'text.txt'), textOutput, 'utf8');
  console.log(`Extracted ${texts.length} text nodes → output/text.txt`);

  // --- Export frames as PNG ---
  const frames = collectFrames(file.document);
  console.log(`Found ${frames.length} frames. Requesting image exports...`);

  // Batch into groups of 10 to avoid render timeout
  const BATCH_SIZE = 10;
  const allImages = {};
  for (let i = 0; i < frames.length; i += BATCH_SIZE) {
    const batch = frames.slice(i, i + BATCH_SIZE);
    const ids = batch.map(f => f.id).join(',');
    console.log(`  Requesting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(frames.length / BATCH_SIZE)}...`);
    const imgRes = await get(`https://api.figma.com/v1/images/${FILE_ID}?ids=${encodeURIComponent(ids)}&format=png&scale=2`);
    const imgData = JSON.parse(imgRes.body);
    if (imgData.err) { console.error('Image export error:', imgData.err); process.exit(1); }
    Object.assign(allImages, imgData.images);
  }

  const entries = Object.entries(allImages);
  console.log(`Downloading ${entries.length} images...`);

  for (const [id, url] of entries) {
    if (!url) { console.warn(`No URL for ${id}`); continue; }
    const frame = frames.find(f => f.id === id);
    const safeName = (frame ? frame.name : id).replace(/[^a-z0-9_-]/gi, '_');
    const dest = path.join(OUT_DIR, `${safeName}.png`);
    process.stdout.write(`  Downloading ${safeName}.png...`);
    await downloadFile(url, dest);
    console.log(' done');
  }

  console.log('\nAll done! Check figma-export/output/');
}

main().catch(console.error);
