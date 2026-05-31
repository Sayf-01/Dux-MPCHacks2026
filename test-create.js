const {createClient} = require('@sanity/client');

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

async function run() {
  try {
    const doc = {
      _type: 'place',
      name: 'Permission test place ' + Date.now()
    };
    const res = await client.create(doc);
    console.log('CREATED:', res._id);
  } catch (err) {
    console.error('CREATE ERROR:', err && err.response && err.response.body ? JSON.stringify(err.response.body,null,2) : (err && err.message ? err.message : err));
    process.exit(1);
  }
}

run();
