const fs = require('fs');
const path = require('path');

async function main() {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;

  if (!projectId || !dataset) {
    console.error('Missing SANITY_PROJECT_ID or SANITY_DATASET. Set them in the environment or .env.local');
    process.exit(1);
  }

  if (!token) {
    console.error('Missing SANITY_API_TOKEN — a write token is required to import documents.');
    console.error('Create a token in Sanity with write permissions and set SANITY_API_TOKEN in your environment.');
    process.exit(1);
  }

  let client;
  try {
    let createClientModule = require('@sanity/client');
    // Support both CJS and ESM default export shapes
    if (createClientModule && createClientModule.default) createClientModule = createClientModule.default;
    client = createClientModule({
      projectId,
      dataset,
      token,
      useCdn: false,
      apiVersion: '2024-01-01'
    });
  } catch (err) {
    console.error('Please run: npm install @sanity/client');
    console.error(err.message || err);
    process.exit(1);
  }

  const dataPath = path.join(__dirname, 'temp-places-db.json');
  if (!fs.existsSync(dataPath)) {
    console.error('No temp-places-db.json found in the chatbot folder.');
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, 'utf8');
  let docs;
  try {
    docs = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse temp-places-db.json:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(docs)) {
    console.error('temp-places-db.json must be an array of place objects.');
    process.exit(1);
  }

  // Normalize documents into Sanity-compatible docs
  const prepared = docs.map((d, i) => {
    const id = d._id || `place-${i}`;
    return {
      _id: id,
      _type: 'place',
      name: d.name || d.title || `Place ${i}`,
      address: d.address || '',
      rating: typeof d.rating === 'number' ? d.rating : (parseFloat(d.rating) || 0),
      cuisine: d.cuisine || '',
      buildingType: d.buildingType || d.type || '',
      phone: d.phone || d.phoneNumber || '',
      url: d.url || d.link || '',
      location: d.location || d.geo || null,
      // keep original payload under `sourceData` for traceability
      sourceData: d
    };
  });

  console.log(`Importing ${prepared.length} documents into Sanity project ${projectId}/${dataset}...`);

  for (const doc of prepared) {
    try {
      // createOrReplace ensures idempotent imports
      // eslint-disable-next-line no-await-in-loop
      await client.createOrReplace(doc);
      console.log('Imported', doc._id, '-', doc.name);
    } catch (err) {
      console.error('Failed to import', doc._id, err.message || err);
    }
  }

  console.log('Import complete.');
}

main().catch((err) => {
  console.error('Unhandled error:', err && err.message ? err.message : err);
  process.exit(1);
});
