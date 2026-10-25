/**
 * Re-rank + diversify candidates for the 0% CONET matching pipeline.
 * This file is the source of truth — its content is pasted into the
 * n8n "Re-rank & diversify" Code node.
 *
 * Testable standalone with: npx vitest run n8n/src/rerank.test.js
 */

/* ── Config ── */

const DEFAULT_WEIGHTS = {
  interest: 0.35,
  role: 0.35,
  avail: 0.30,
};

const ADJACENCY = {
  'fullstack developer': { 'frontend developer': 0.6, 'backend developer': 0.6 },
  'ml engineer':         { 'data scientist': 0.6 },
  'data scientist':      { 'ml engineer': 0.6 },
  'ux designer':         { 'ui designer': 0.8 },
  'ui designer':         { 'ux designer': 0.8 },
  'product manager':     { 'business': 0.6 },
  'business':            { 'product manager': 0.6 },
  'marketing':           { 'media': 0.6 },
  'media':               { 'marketing': 0.6 },
};

/* ── Helpers ── */

function normaliseWeights(w) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum === 0) return { ...DEFAULT_WEIGHTS };
  const out = {};
  for (const k of Object.keys(w)) out[k] = w[k] / sum;
  return out;
}

function roleFit(userRoles, neededRoles) {
  if (!neededRoles || neededRoles.length === 0) return { score: 0, matched: null };
  const needed = new Set(neededRoles.map(r => r.toLowerCase()));

  // Check primary role (first in list)
  const primary = (userRoles[0] || '').toLowerCase();
  if (needed.has(primary)) return { score: 1.0, matched: primary };

  // Check adjacent roles for primary
  const adj = ADJACENCY[primary] || {};
  for (const [adjRole, strength] of Object.entries(adj)) {
    if (needed.has(adjRole)) return { score: strength, matched: adjRole };
  }

  // Check secondary roles
  for (let i = 1; i < userRoles.length; i++) {
    const role = userRoles[i].toLowerCase();
    if (needed.has(role)) return { score: 0.8, matched: role };

    const adjSec = ADJACENCY[role] || {};
    for (const [adjRole, strength] of Object.entries(adjSec)) {
      if (needed.has(adjRole)) return { score: strength * 0.8, matched: adjRole };
    }
  }

  return { score: 0, matched: null };
}

function dupPenalty(userRoles, memberRoles) {
  if (!memberRoles || memberRoles.length === 0) return 0;
  const memberSet = new Set(memberRoles.map(r => r.toLowerCase()));
  let overlapping = 0;
  for (const r of userRoles) {
    if (memberSet.has(r.toLowerCase())) overlapping++;
  }
  return Math.min(0.3, 0.15 * overlapping);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/* ── Main ── */

/**
 * @param {Object} profile - Extracted user profile
 * @param {Array}  candidates - Rows from hybrid_search RPC
 * @param {Object} opts - { weights, excludeIds, limit, declined }
 * @returns {Array} Top ranked results with factors
 */
function rerank(profile, candidates, opts = {}) {
  const weights = normaliseWeights(opts.weights || DEFAULT_WEIGHTS);
  const excludeSet = new Set(opts.excludeIds || []);
  const limit = opts.limit || 5;
  const userRoles = (profile.roles || []).map(r => r.toLowerCase());

  // Filter excluded
  let filtered = candidates.filter(c => !excludeSet.has(c.id));

  // Score each candidate
  const scored = filtered.map(c => {
    // Interest: use the RRF score from hybrid_search, normalised to [0,1]
    const interest = clamp(c.rrf || 0, 0, 1);

    // Role fit
    const rf = roleFit(userRoles, c.needed_roles);

    // Availability (default 1.0 — all weekend hackathon)
    const rawAvail = c.overlap != null ? c.overlap : 1.0;
    const avail = clamp((rawAvail - 0.5) / 0.5, 0, 1);

    // Duplicate penalty
    const penalty = dupPenalty(userRoles, c.member_roles);

    // Final score
    const raw = weights.interest * interest
              + weights.role * rf.score
              + weights.avail * avail
              - penalty;
    const score = clamp(raw, 0, 1);

    return {
      id: c.id,
      name: c.name,
      challenge: c.challenge,
      zone: c.zone,
      members: c.members || 0,
      max_size: c.max_size || 5,
      needed_roles: c.needed_roles || [],
      fit: Math.round(score * 100),
      factors: {
        interest: Math.round(interest * 100) / 100,
        role: Math.round(rf.score * 100) / 100,
        avail: Math.round(avail * 100) / 100,
      },
      matched_role: rf.matched,
      score,
    };
  });

  // Sort descending
  scored.sort((a, b) => b.score - a.score);

  // MMR diversify: penalise same challenge in top picks
  const picked = [];
  const remaining = [...scored];

  while (picked.length < limit && remaining.length > 0) {
    // Adjust scores based on already-picked challenges
    for (const r of remaining) {
      let challengePenalty = 0;
      for (const p of picked) {
        if (p.challenge && r.challenge && p.challenge.toLowerCase() === r.challenge.toLowerCase()) {
          challengePenalty += 0.1;
        }
      }
      r._adjusted = r.score - challengePenalty;
    }
    remaining.sort((a, b) => b._adjusted - a._adjusted);

    const best = remaining.shift();
    if (best) {
      delete best._adjusted;
      picked.push(best);
    }
  }

  return picked;
}

/* ── Exports (for testing; n8n Code node uses the functions directly) ── */

if (typeof module !== 'undefined') {
  module.exports = { rerank, roleFit, dupPenalty, normaliseWeights, DEFAULT_WEIGHTS, ADJACENCY };
}
