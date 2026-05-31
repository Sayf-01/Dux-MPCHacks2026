const path = require('path');
const { loadPlacesFromMongoDB, findPlacesFromMongoDB } = require('./mongodb');

// Keep the TEMP_PLACES_PATH for backward compatibility during transition
const TEMP_PLACES_PATH = path.join(__dirname, 'temp-places-db.json');

function normalize(text) {
  return String(text || '').trim().toLowerCase();
}

function tokenize(text) {
  return normalize(text).split(/\W+/).filter(Boolean);
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

async function loadTempPlaces() {
  try {
    return await loadPlacesFromMongoDB();
  } catch (error) {
    console.warn('Failed to load places from MongoDB, falling back to local file', error);
    // Fallback to local file if MongoDB fails
    try {
      const fs = require('fs');
      const raw = fs.readFileSync(TEMP_PLACES_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (fallbackError) {
      console.warn('Failed to load places from local file as well', fallbackError);
      return [];
    }
  }
}

function getPlaceKeywords(place) {
  return [place?.name, place?.address, place?.cuisine, place?.buildingType]
    .filter(Boolean)
    .map(normalize)
    .flatMap((s) => s.split(/\W+/).filter(Boolean));
}

function tokenOverlapScore(tokens, phrases) {
  if (!tokens || !tokens.length) return 0;
  const set = new Set(tokens);
  let count = 0;
  for (const p of phrases) {
    const parts = normalize(p).split(/\W+/).filter(Boolean);
    for (const t of parts) if (set.has(t)) count += 1;
  }
  return count;
}

function scorePlace(place, analysis) {
  const preferences = Array.isArray(analysis?.preferences) ? analysis.preferences : [];
  const rating = Number(place?.rating || 0);

  // Start with rating-based score (scaled)
  let score = rating * 20;

  const keywords = getPlaceKeywords(place); // tokenized keywords

  // Reward token overlap between place keywords and preference words (diminishing)
  const overlap = tokenOverlapScore(keywords, preferences);
  score += overlap * 25; // each token match gives +25

  // Boost if buildingType or cuisine contains preference keywords
  for (const pref of preferences) {
    const p = normalize(pref);
    if (normalize(place?.buildingType).includes(p) || normalize(place?.cuisine).includes(p)) score += 18;
  }

  // Preference -> expected building types mapping
  const prefToTypes = {
    'nightlife': ['bar', 'club', 'lounge'],
    'food': ['restaurant', 'cafe', 'diner'],
    'outdoor': ['park', 'garden', 'outdoor', 'trail', 'beach'],
    'indoor': ['museum', 'gallery', 'exhibit', 'indoor'],
    'shopping': ['market', 'mall', 'store'],
    'culture': ['museum', 'historic', 'memorial']
  };

  for (const pref of preferences) {
    const types = prefToTypes[pref] || [];
    if (types.some((t) => normalize(place?.buildingType).includes(t) || keywords.includes(t))) {
      score += 30;
    }
  }

  // Slight boost if place category matches target category (helps like-for-like replacements)
  if (analysis?.targetLocationCategory) {
    const targetCategory = normalize(analysis.targetLocationCategory);
    if (normalize(place?.buildingType).includes(targetCategory) || keywords.includes(targetCategory)) {
      score += 12;
    }
  }

  // Small penalty for exact same name as target (avoid returning same place)
  if (analysis?.targetLocationName && normalize(place?.name) === normalize(analysis.targetLocationName)) {
    score -= 100;
  }

  return score;
}

async function recommendReplacement(analysis) {
  const places = await loadTempPlaces();

  if (!places.length) {
    return null;
  }

  const ranked = [...places].sort((left, right) => scorePlace(right, analysis) - scorePlace(left, analysis));
  return ranked[0] || null;
}

async function retrieveTopCandidates(analysis, topN = 5) {
  const places = await loadTempPlaces();
  if (!places.length) return [];

  const apiKey = process.env.OPENAI_API_KEY;
  // Always build lightweight local vectors (TF-IDF) for fallback or hybrid ranking
  let placeVectors = null;
  try {
    // Build TF-IDF vectors
    const docs = places.map((p) => getPlaceKeywords(p).join(' '));
    const docTokens = docs.map((d) => tokenize(d));
    const df = {};
    for (const toks of docTokens) {
      const seen = new Set();
      for (const t of toks) {
        if (!seen.has(t)) { df[t] = (df[t] || 0) + 1; seen.add(t); }
      }
    }
    const N = docs.length;
    placeVectors = docTokens.map((toks) => {
      const tf = {};
      for (const t of toks) tf[t] = (tf[t] || 0) + 1;
      // tf-idf
      const vec = {};
      for (const [token, count] of Object.entries(tf)) {
        const idf = Math.log((N + 1) / ((df[token] || 0) + 1)) + 1;
        vec[token] = (count / toks.length) * idf;
      }
      return vec;
    });
    var globalDF = df;
  } catch (err) {
    placeVectors = null;
  }

  // If no API key, use TF-IDF based ranking combined with heuristic scorer
  if (!apiKey) {
    const queryText = (analysis && analysis.suggestedSearchTerms && analysis.suggestedSearchTerms.join(' ')) || (analysis && analysis.preferences && analysis.preferences.join(' ')) || '';
    const qTokens = tokenize(queryText);
    const qTf = {};
    for (const t of qTokens) qTf[t] = (qTf[t] || 0) + 1;
    const qVec = {};
    if (placeVectors && globalDF) {
      const N = places.length;
      for (const [token, count] of Object.entries(qTf)) {
        const idf = Math.log((N + 1) / ((globalDF[token] || 0) + 1)) + 1;
        qVec[token] = (count / qTokens.length) * idf;
      }
    }

    const dot = (a, b) => {
      let s = 0;
      for (const k in a) if (b[k]) s += a[k] * b[k];
      return s;
    };
    const norm = (a) => Math.sqrt(Object.values(a).reduce((acc, v) => acc + v * v, 0));

    const scored = places.map((p, i) => {
      const base = scorePlace(p, analysis);
      let sim = 0;
      if (placeVectors && Object.keys(qVec).length) {
        const pv = placeVectors[i] || {};
        const denom = (norm(qVec) * norm(pv)) || 1;
        sim = dot(qVec, pv) / denom;
      }
      const combined = base + sim * 80;
      return { place: p, score: combined };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN).map((s) => s.place);
  }

  // Try embeddings-based retrieval using OpenAI if available.
  // We'll compute embeddings for the user query (suggestedSearchTerms or preferences) and for each candidate (cached),
  // then rank by cosine similarity and combine with local score.
  const queryText = (analysis && analysis.suggestedSearchTerms && analysis.suggestedSearchTerms.join(' ')) || (analysis && analysis.preferences && analysis.preferences.join(' ')) || '';

  try {
    const fetchEmb = async (text) => {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ input: text, model: 'text-embedding-3-small' })
      });
      if (!res.ok) return null;
      const d = await res.json();
      return d.data && d.data[0] && d.data[0].embedding ? d.data[0].embedding : null;
    };

    const qEmb = await fetchEmb(queryText || analysis.preferences.join(' '));
    if (!qEmb) {
      // fallback
      const scored = places.map((p) => ({ place: p, score: scorePlace(p, analysis) }));
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topN).map((s) => s.place);
    }

    // compute embeddings for candidates (in series to avoid large parallel requests)
    const candEmbeddings = [];
    for (const p of places) {
      const text = `${p.name} ${p.cuisine || ''} ${p.buildingType || ''} ${p.address || ''}`.trim();
      const emb = await fetchEmb(text);
      candEmbeddings.push({ place: p, emb });
    }

    const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
    const norm = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));

    const scored = candEmbeddings.map(({ place, emb }) => {
      if (!emb) return { place, score: scorePlace(place, analysis) };
      const sim = dot(qEmb, emb) / (norm(qEmb) * norm(emb) || 1);
      // combine semantic similarity with heuristic score
      const combined = scorePlace(place, analysis) + sim * 80; // weight semantic sim
      return { place, score: combined };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN).map((s) => s.place);
  } catch (err) {
    console.warn('Embeddings retrieval failed, falling back to heuristic scorer', err && err.message);
    const scored = places.map((p) => ({ place: p, score: scorePlace(p, analysis) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN).map((s) => s.place);
  }
}

function detectIntent(message) {
  const text = normalize(message);
  if (/\b(replace|swap|switch|change|instead|another|rather go to|instead of|rather than|different place|other place)\b/.test(text)) {
    return 'replace_location';
  }

  if (/\b(remove|delete|skip|omit|drop|take out|get rid of|leave out)\b/.test(text)) {
    return 'remove_location';
  }

  if (/\b(rebuild|regenerate|redo|restart|new plan|fresh plan|start over|from scratch)\b/.test(text)) {
    return 'regenerate_plan';
  }

  if (/\b(prefer|want|would like|would rather|make it|make|less|more|cheap|cheaper|budget|family|kids|outdoor|indoors?|nightlife|food|shopping|culture|relaxing|faster|quieter|closer|better|nicer)\b/.test(text) || includesAny(text, ["i'd rather", 'i would rather', 'something more', 'something less'])) {
    return 'add_preference';
  }

  return 'clarify';
}

function extractPreferences(message) {
  const text = normalize(message);
  const preferences = [];

  const preferenceMap = [
    ['outdoor', ['outdoor', 'outdoors', 'park', 'nature', 'scenic']],
    ['indoor', ['indoor', 'inside', 'museum', 'gallery']],
    ['budget-friendly', ['cheap', 'cheaper', 'budget', 'affordable']],
    ['family-friendly', ['family', 'kids', 'children']],
    ['nightlife', ['nightlife', 'bar', 'club', 'party']],
    ['food', ['food', 'restaurant', 'cafe', 'eat']],
    ['shopping', ['shopping', 'mall', 'market', 'store']],
    ['culture', ['culture', 'history', 'historical']]
  ];

  for (const [label, keywords] of preferenceMap) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      preferences.push(label);
    }
  }

  return [...new Set(preferences)];
}

function findTargetLocation(message, itinerary) {
  if (!itinerary || !Array.isArray(itinerary.stops)) {
    return { stop: null, index: null };
  }

  const text = normalize(message);

  for (let index = 0; index < itinerary.stops.length; index += 1) {
    const stop = itinerary.stops[index];
    if (text.includes(normalize(stop.name))) {
      return { stop, index };
    }
  }

  for (let index = 0; index < itinerary.stops.length; index += 1) {
    const stop = itinerary.stops[index];
    if (stop.category && text.includes(normalize(stop.category))) {
      return { stop, index };
    }
  }

  return { stop: null, index: null };
}

function buildChatAnalysis(message, currentItinerary) {
  const intent = detectIntent(message);
  const preferences = extractPreferences(message);
  const target = findTargetLocation(message, currentItinerary);
  const replacementCandidate = intent === 'replace_location' && !((intent === 'replace_location' || intent === 'remove_location') && !target.stop)
    ? recommendReplacement({ intent, preferences, targetLocationCategory: target.stop?.category || null })
    : null;
  const needsClarification = intent === 'clarify' || ((intent === 'replace_location' || intent === 'remove_location') && !target.stop);

  return {
    intent: needsClarification ? 'clarify' : intent,
    reply: needsClarification
      ? 'Tell me which location you want to change, and I will find a replacement.'
      : intent === 'replace_location'
        ? `I will replace ${target.stop?.name || 'that location'} using your preferences: ${preferences.join(', ') || 'none specified'}.`
        : intent === 'remove_location'
          ? `I will remove ${target.stop?.name || 'that location'} from the plan.`
          : intent === 'regenerate_plan'
            ? 'I will rebuild the full plan with your updated preferences.'
            : `I will treat ${preferences.join(', ') || 'your request'} as a planning preference.`,
    targetLocationName: needsClarification ? null : target.stop?.name || null,
    targetLocationIndex: needsClarification ? null : target.index,
    targetLocationCategory: needsClarification ? null : target.stop?.category || null,
    preferences,
    suggestedSearchTerms: preferences.length > 0 ? preferences : ['similar place'],
    replacementRequired: intent === 'replace_location' || intent === 'remove_location',
    needsClarification,
    extractedLocationNames: target.stop ? [target.stop.name] : [],
    suggestedReplacement: replacementCandidate
  };
}

function applyPlanUpdate(currentItinerary, analysis, replacementCandidate) {
  const stops = Array.isArray(currentItinerary?.stops) ? [...currentItinerary.stops] : [];

  if (analysis.intent === 'remove_location' && analysis.targetLocationIndex !== null) {
    stops.splice(analysis.targetLocationIndex, 1);
  }

  if (analysis.intent === 'replace_location' && analysis.targetLocationIndex !== null && replacementCandidate) {
    stops.splice(analysis.targetLocationIndex, 1, replacementCandidate);
  }

  return {
    ...currentItinerary,
    stops,
    updatedAt: new Date().toISOString()
  };
}

function handleChatRequest(requestBody) {
  const message = requestBody && typeof requestBody.message === 'string' ? requestBody.message : '';
  const currentItinerary = requestBody && typeof requestBody.currentItinerary === 'object' ? requestBody.currentItinerary : null;
  const analysis = buildChatAnalysis(message, currentItinerary);
  const updatedItinerary = analysis.suggestedReplacement ? applyPlanUpdate(currentItinerary, analysis, analysis.suggestedReplacement) : null;

  return {
    analysis,
    updatedItinerary
  };
}

async function analyzeChatWithQwen(message, currentItinerary = null) {
  // Configure for Qwen-only usage
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.LLM_MODEL || 'qwen-plus';
  const baseUrl = process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

  const localAnalysis = buildChatAnalysis(message, currentItinerary);

  // If no API key, return local analysis
  if (!apiKey) return localAnalysis;

  // Retrieve top local candidates to pass as context to the LLM
  const candidates = await retrieveTopCandidates(localAnalysis, 6);

  const candidateText = candidates.map((c, i) => `${i + 1}. ${c.name} — ${c.buildingType || ''} — ${c.cuisine || ''} — Rating: ${c.rating || 'N/A'} — ${c.address || ''}`).join('\n');

  const system = `You are a friendly, helpful travel itinerary assistant.
Given a user request and a short list of candidate places, do two things:
1) Return a concise, natural-language suggestion in the field 'humanReply' (1-2 short sentences) suitable to show directly to the user (no JSON, just plain readable text).
2) Return machine-readable JSON ONLY (no extra prose) containing these fields: intent, reply, targetLocationName, targetLocationIndex, targetLocationCategory, preferences, suggestedSearchTerms, replacementRequired, needsClarification, extractedLocationNames, suggestedReplacement.

The suggestedReplacement must be an object with the fields name, address, rating, cuisine, buildingType, phone, url when available.
Always produce well-formed JSON. If no good candidate exists, set suggestedReplacement to null and make humanReply explain briefly why and ask a clarifying question.`;

  const user = `User message: ${message}\nCurrent itinerary: ${currentItinerary ? JSON.stringify(currentItinerary) : 'No itinerary provided.'}\n\nCandidate places:\n${candidateText}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    console.warn(`LLM RAG request failed (Qwen), falling back to local analysis`, response.status, response.statusText);
    return localAnalysis;
  }

  const data = await response.json();
  const rawText = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '{}';

  try {
    const parsed = JSON.parse(rawText);
    // If parsed suggestedReplacement is minimal (name only), try to enrich from candidates
    if (parsed && parsed.suggestedReplacement && typeof parsed.suggestedReplacement.name === 'string') {
      const match = candidates.find((c) => normalize(c.name) === normalize(parsed.suggestedReplacement.name)) || candidates[0];
      if (match) {
        parsed.suggestedReplacement = {
          name: match.name,
          address: match.address,
          rating: match.rating,
          cuisine: match.cuisine,
          buildingType: match.buildingType,
          phone: match.phone,
          url: match.url
        };
      }
    }
    // Ensure we always have a humanReply for display
    if (!parsed.humanReply) {
      parsed.humanReply = parsed.reply || `${parsed.intent || 'I'} found a suggestion.`;
    }

    return Object.assign({}, localAnalysis, parsed);
  } catch (err) {
    console.warn('Failed to parse Qwen output as JSON, falling back to local analysis');
    return localAnalysis;
  }
}

// Removed Sanity integration for the minimal local-only demo.

module.exports = {
  detectIntent,
  extractPreferences,
  findTargetLocation,
  buildChatAnalysis,
  applyPlanUpdate,
  handleChatRequest,
  analyzeChatWithOpenAI
};

if (require.main === module) {
  const demoRequest = {
    message: 'Replace the museum with something outdoors',
    currentItinerary: {
      stops: [
        { name: 'City Museum', category: 'museum' },
        { name: 'Central Park', category: 'park' }
      ]
    }
  };

  console.log(JSON.stringify(handleChatRequest(demoRequest), null, 2));
}
