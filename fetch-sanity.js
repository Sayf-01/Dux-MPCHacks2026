const {createClient} = require('@sanity/client');

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

client.fetch('*[_type == "place"][0]{_id,name}').then(r => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}).catch(e => {
  console.error('ERROR:', e && e.message ? e.message : e);
  process.exit(1);
});
