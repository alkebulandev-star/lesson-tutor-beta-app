/* ════════════════════════════════════════════════════════════════
   THEORY-PAPER GENERATOR (canonical)
   ────────────────────────────────────────────────────────────────
   Generates fresh theory / Paper-2 exam papers that match the real
   structure of WAEC, NECO, JAMB, and BECE per subject and per
   syllabus area.

   Architecture:
     1. PAPER_SPEC[board][subject] = canonical structure
        (number of questions, sections, types, topics, marks, time)
     2. buildSystemPrompt(board, subject, lang) reads the spec and
        produces a precise system prompt for the AI.
     3. ExamGen.generate({board, subject, paperType}) runs Anthropic
        first, falls back to OpenAI on error. Returns a normalised
        list of theory questions in the same shape the existing
        startEssayWriting() expects.
     4. The language layer (lang-0.js) wraps the fetch and adds a
        "respond in [language]" instruction — so the same generator
        produces Yorùbá / Igbo / Hausa / English papers without code
        changes here.

   Public API:
     ExamGen.generate({board, subject, paperType, count?})
       → Promise<[{type, q, parts?, yr?}, ...]>
     ExamGen.hasSpec(board, subject) → bool
     ExamGen.getSpec(board, subject) → spec object or null

   Lessons + per-question AI continue to use Anthropic primarily
   (LT_SERVER='1' default) with OpenAI as fallback. Translation is
   the only thing that goes exclusively through OpenAI.
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

// ─── Paper specifications ─────────────────────────────────────
// Each spec describes: how many questions, what sections, what
// topic areas to draw from, which question types are valid, time
// allocation, and any board-specific quirks.

var WAEC_GENERIC = {
  board: 'WAEC',
  paperLabel: 'Paper 2 — Theory',
  duration: 90,           // minutes total
  questionsToShow: 5,     // candidates answer any 3 of these 5
  questionsToAnswer: 3,
  marksPerQuestion: 20,
  notes: [
    'Senior Secondary Certificate Examination (SSCE)',
    'WAEC Paper 2 is structured-essay style. Each question typically has parts (a), (b), (c) with marks indicated.',
    'Time per question approximately 30 minutes.'
  ]
};

var WAEC_ENG = {
  board:'WAEC', subject:'English Language', paperLabel:'Paper 2 — Composition, Comprehension, Summary & Lexis',
  duration: 120,
  // WAEC English Paper 2 has 4 sections — students complete all of them
  questionsToShow: 8, questionsToAnswer: 4,
  marksPerQuestion: 20, // average across sections (essay 50, comp 20, summary 20, lexis 10)
  sections: [
    { name:'Section 1 — Essay', count:5, choose:1, marks:50, instruction:'Choose ONE essay topic. 5 different essay TYPES (argumentative, narrative, formal letter, informal letter, article, speech, descriptive, report). Word count: not less than 450 words.' },
    { name:'Section 2 — Comprehension', count:1, choose:1, marks:20, instruction:'One passage (~400 words) followed by 5 sub-questions. Each sub-question worth 4 marks.' },
    { name:'Section 3 — Summary', count:1, choose:1, marks:20, instruction:'One passage (~300 words) with two summary tasks: (a) summarise X in 3 sentences; (b) summarise Y in 3 sentences.' },
    { name:'Section 4 — Lexis & Structure', count:1, choose:1, marks:10, instruction:'10 short fill-in or transformation sentences testing vocabulary, idioms, register, structure.' }
  ],
  essayTypes: ['Argumentative', 'Narrative', 'Formal letter', 'Informal letter', 'Article', 'Speech', 'Descriptive', 'Report'],
  wordCount: 'not less than 450 words',
  notes: [
    'WAEC English Paper 2 has FOUR sections. Generate questions for ALL sections.',
    'Each essay topic should be a different essay type.',
    'Topics should reflect Nigerian student life: school, community, current issues, personal experiences.',
    'WAEC essay topics are timeless prompts — avoid dated current-affairs references.',
    'Comprehension and summary passages should be original — never reproduce real WAEC past passages (copyright).',
    'Lexis questions test vocabulary in Nigerian English context (e.g. "tarry", "sober reflection", "kith and kin").'
  ]
};

var WAEC_MATH = {
  board:'WAEC', subject:'Mathematics', paperLabel:'Paper 2 — Theory',
  duration: 150,
  questionsToShow: 13, questionsToAnswer: 10,
  marksPerQuestion: 10,
  syllabusAreas: [
    'Number & Numeration (number bases, fractions, indices, logarithms, sequences, sets, surds)',
    'Algebraic Processes (equations, inequalities, variation, factorisation, simultaneous equations)',
    'Mensuration (length, area, volume, surface area)',
    'Plane Geometry (angles, polygons, circles, triangles, similarity, trigonometric ratios)',
    'Trigonometry (sine rule, cosine rule, bearings, heights and distances)',
    'Statistics & Probability (mean, median, mode, range, variance, std deviation, probability)',
    'Coordinate Geometry (gradient, distance, midpoint, equation of a line)',
    'Calculus (basic differentiation and integration — for general maths only at intro level)'
  ],
  notes: [
    'Each question must have parts (a) and (b), often (c). Show marks per part: e.g. (5 marks), (5 marks).',
    'Use Nigerian context for word problems: ₦ amounts, Lagos/Kano/Abuja, named characters (Ade, Bola, Chika, Musa, Ngozi).',
    'Number questions Q1, Q2, ... in the JSON.',
    'Mix calculation, proof, construction, and application — not all numerical.'
  ]
};

var WAEC_BIO = {
  board:'WAEC', subject:'Biology', paperLabel:'Paper 2 — Theory & Essay',
  duration: 120,
  questionsToShow: 6, questionsToAnswer: 5,
  marksPerQuestion: 20,
  syllabusAreas: [
    'The Cell (structure, organelles, division — mitosis & meiosis)',
    'Living and Non-Living Things (characteristics)',
    'Plant Kingdom (classification, anatomy, photosynthesis, transpiration)',
    'Animal Kingdom (classification, nutrition, respiration, circulation, excretion, nervous system, reproduction)',
    'Ecology (food chains, ecosystems, pollution, conservation)',
    'Reproduction in Plants and Animals (including human reproductive system)',
    'Genetics (Mendelian inheritance, sex determination, variation)',
    'Evolution (theories, evidence, natural selection)',
    'Microorganisms and Diseases'
  ],
  notes: [
    'Mix structured questions (with parts a, b, c, d) with diagram-labelling questions.',
    'At least one question should ask candidate to "draw and label" a diagram.',
    'Use Nigerian/West African examples for ecology questions (e.g. mangrove swamps, rain forest, savannah).',
    'For health questions, reference Nigerian disease context: malaria, typhoid, sickle cell, cholera.'
  ]
};

var WAEC_CHM = {
  board:'WAEC', subject:'Chemistry', paperLabel:'Paper 2 — Theory',
  duration: 120,
  questionsToShow: 6, questionsToAnswer: 5,
  marksPerQuestion: 20,
  syllabusAreas: [
    'Atomic Structure & Periodic Table',
    'Chemical Bonding',
    'States of Matter (gas laws, solids, liquids)',
    'Energy Changes (enthalpy, exothermic/endothermic)',
    'Acids, Bases, Salts (definitions, indicators, neutralisation)',
    'Oxidation–Reduction (redox reactions, oxidation numbers)',
    'Stoichiometry (mole concept, calculations, formulae)',
    'Electrochemistry (electrolysis, electrolytic cells, Faraday)',
    'Kinetics & Equilibrium',
    'Organic Chemistry (alkanes, alkenes, alkynes, alcohols, carboxylic acids, esters)',
    'Industrial Chemistry (Haber, contact, Solvay processes)'
  ],
  notes: [
    'Each question MUST allow numerical calculation in at least one part — chemistry is calculation-heavy.',
    'Use the exact periodic table values WAEC provides (relative atomic masses).',
    'Equations must be balanced. State symbols required: (s), (l), (g), (aq).',
    'Practical-style questions allowed (describe a test for, identify the gas evolved, etc).'
  ]
};

var WAEC_PHY = {
  board:'WAEC', subject:'Physics', paperLabel:'Paper 2 — Theory',
  duration: 120,
  questionsToShow: 6, questionsToAnswer: 5,
  marksPerQuestion: 20,
  syllabusAreas: [
    'Mechanics (motion, Newton\'s laws, friction, momentum, work, energy, power)',
    'Heat (temperature, thermal expansion, heat capacity, latent heat, gas laws)',
    'Waves & Sound',
    'Light (reflection, refraction, lenses, optical instruments)',
    'Electricity (current, voltage, resistance, Ohm\'s law, circuits, capacitance)',
    'Magnetism & Electromagnetism',
    'Modern Physics (atomic structure, radioactivity, nuclear reactions, photoelectric effect)',
    'Pressure, Density, Hydrostatics'
  ],
  notes: [
    'Most parts should require numerical calculation. Show units throughout.',
    'Use SI units strictly.',
    'Diagrams required for optics, circuits, and force-vector questions.',
    'g = 10 m/s² unless otherwise stated.'
  ]
};

var WAEC_GEO = {
  board:'WAEC', subject:'Geography', paperLabel:'Paper 2 — Theory',
  duration: 120,
  questionsToShow: 7, questionsToAnswer: 5,
  marksPerQuestion: 20,
  syllabusAreas: [
    'Physical Geography (earth structure, weather, climate, rocks, soils)',
    'Map Reading & Interpretation',
    'Population Geography',
    'Economic Geography (agriculture, mining, manufacturing, trade)',
    'Geography of Nigeria (relief, drainage, vegetation, climate, mineral resources)',
    'Geography of West Africa',
    'Settlement Geography (urban and rural)',
    'Transport and Communication'
  ],
  notes: [
    'Always include at least one map-related question (sketch, identify features, give bearings).',
    'Always include at least one Nigeria-specific question.',
    'Use case-study format for economic activities — name specific places.'
  ]
};

var WAEC_GOV = {
  board:'WAEC', subject:'Government', paperLabel:'Paper 2 — Theory & Essay',
  duration: 120,
  questionsToShow: 8, questionsToAnswer: 4,
  marksPerQuestion: 25,
  syllabusAreas: [
    'Basic Concepts (state, sovereignty, government, power, authority, legitimacy)',
    'Forms of Government (democracy, monarchy, federation, unitary, confederal)',
    'Political Ideologies (capitalism, socialism, communism)',
    'Constitution and Constitutionalism',
    'Organs of Government (executive, legislature, judiciary)',
    'Pre-Colonial Political Systems in Nigeria (Hausa-Fulani, Yoruba, Igbo)',
    'Nigerian Political History (1914 amalgamation, independence, republics, military rule)',
    'Public Service and Civil Service',
    'Political Parties & Pressure Groups',
    'Elections and Electoral Systems',
    'International Relations (ECOWAS, AU, UN, OPEC)'
  ],
  notes: [
    'Essay-style answers expected — at least 8-10 well-developed points per question.',
    'For Nigerian-history questions, give dates and specific actors.',
    'Define key terms before discussing — examiners reward this.'
  ]
};

var WAEC_ECO = {
  board:'WAEC', subject:'Economics', paperLabel:'Paper 2 — Theory',
  duration: 120,
  questionsToShow: 8, questionsToAnswer: 5,
  marksPerQuestion: 20,
  syllabusAreas: [
    'Basic Economic Concepts (scarcity, choice, opportunity cost)',
    'Demand, Supply, Price Determination, Elasticity',
    'Production (factors, types, scale)',
    'Money, Banking, Inflation',
    'Public Finance (taxation, government revenue and expenditure)',
    'National Income (GDP, GNP, NNP)',
    'International Trade and Balance of Payments',
    'Economic Development & Planning (Nigerian National Development Plans)',
    'Agriculture, Industry, and Petroleum in the Nigerian Economy',
    'Population and Labour'
  ],
  notes: [
    'Mix definitional, diagrammatic (demand/supply curves), and discussion-style questions.',
    'Use Nigerian context for examples: NNPC, CBN, Naira, recent budgets.'
  ]
};

var WAEC_LIT = {
  board:'WAEC', subject:'Literature in English', paperLabel:'Paper 2 — Drama, Poetry & Prose',
  duration: 120,
  questionsToShow: 9, questionsToAnswer: 4,
  marksPerQuestion: 25,
  sections: [
    { name:'Section A — African Drama', count:3, choose:1, marks:25, instruction:'Three questions on African drama (themes, characters, plot, dramatic devices). Reference "any ONE African drama text you have studied".' },
    { name:'Section B — Non-African Drama', count:3, choose:1, marks:25, instruction:'Three questions on Non-African drama. Reference "any ONE Non-African drama text".' },
    { name:'Section C — Poetry', count:3, choose:2, marks:25, instruction:'Three questions on poetry. Candidate answers any two. Reference "any TWO poems you have studied".' }
  ],
  notes: [
    'Three sections: African Drama, Non-African Drama, Poetry. Candidates answer 4 questions, one from each Drama section and TWO from Poetry.',
    'Questions ask candidates to discuss themes, characters, plot, language, and dramatic/poetic devices in a SET TEXT.',
    'Phrase questions abstractly enough that they apply to any text the candidate has studied.',
    'Use the wording: "any ONE text you have studied", "any TWO poems you have studied".',
    'Word count: not less than 400 words per essay.'
  ]
};

var WAEC_AGR = {
  board:'WAEC', subject:'Agricultural Science', paperLabel:'Paper 2 — Theory',
  duration: 120,
  questionsToShow: 6, questionsToAnswer: 5,
  marksPerQuestion: 20,
  syllabusAreas: [
    'Importance of Agriculture',
    'Agricultural Ecology and Soil Science',
    'Crop Production (cereals, legumes, root crops, vegetables, tree crops)',
    'Livestock Production (cattle, sheep, goats, pigs, poultry)',
    'Fisheries and Forestry',
    'Agricultural Economics, Marketing, Cooperatives',
    'Farm Mechanisation and Tools',
    'Pest, Diseases and Their Control',
    'Land Use and Tenure Systems in Nigeria'
  ],
  notes: [
    'Use Nigerian crops and livestock: yam, cassava, cocoa, oil palm, groundnut, rice, kainji cattle, west african dwarf goat.',
    'Practical, applied tone. Reference real Nigerian farming practices.'
  ]
};

// NECO mostly mirrors WAEC structure, with these differences applied per subject:
//   • 5 options for some objective papers (handled in Paper 1, not here)
//   • Slightly more questions in Paper 2 essay sections
//   • Identical syllabus areas for the most part
function fromWaec(spec, overrides){
  var out = Object.assign({}, spec, overrides || {});
  out.board = 'NECO';
  return out;
}

var NECO_SPECS = {
  eng: fromWaec(WAEC_ENG, { paperLabel:'NECO Paper 2 — Essay & Composition' }),
  mth: fromWaec(WAEC_MATH, { questionsToShow: 12, questionsToAnswer: 10, paperLabel:'NECO Paper 2 — Theory' }),
  bio: fromWaec(WAEC_BIO, {}),
  chm: fromWaec(WAEC_CHM, {}),
  phy: fromWaec(WAEC_PHY, {}),
  geo: fromWaec(WAEC_GEO, {}),
  gov: fromWaec(WAEC_GOV, {}),
  eco: fromWaec(WAEC_ECO, {}),
  lit: fromWaec(WAEC_LIT, {}),
  agr: fromWaec(WAEC_AGR, {})
};

// JAMB CBT — Paper 1 only, all objective. Theory papers don't apply.
// We still register specs so AI fallback knows JAMB has no theory paper.
var JAMB_NOTE = {
  board: 'JAMB',
  paperLabel: 'JAMB CBT — All questions are objective (Paper 1)',
  duration: 0,
  questionsToShow: 0, questionsToAnswer: 0,
  marksPerQuestion: 0,
  notes: [
    'JAMB CBT does not have a theory paper. The Paper-2 / Theory route should NOT be available for JAMB.',
    'If a user reaches this generator with board=JAMB, the response should explain JAMB is objective-only and redirect to Paper 1.'
  ]
};

// BECE — Junior Secondary Certificate. Different subject set.
var BECE_GENERIC = {
  board: 'BECE',
  paperLabel: 'BECE Paper 2 — Theory',
  duration: 90,
  questionsToShow: 5, questionsToAnswer: 4,
  marksPerQuestion: 20,
  notes: [
    'Junior Secondary level — JSS3 (ages 13-15).',
    'Use simpler vocabulary. Concrete, familiar examples.',
    'Time per question approximately 20 minutes.'
  ]
};

var BECE_ENG = Object.assign({}, BECE_GENERIC, {
  subject:'English Language',
  paperLabel: 'BECE Paper 2 — Essay & Comprehension',
  questionsToShow: 4, questionsToAnswer: 1, marksPerQuestion: 30,
  essayTypes: ['Narrative', 'Article', 'Letter to a friend', 'Description', 'Report'],
  wordCount: 'between 250 and 350 words',
  notes: [
    'JSS3-level essay topics. Familiar contexts only.',
    'Avoid topics that need adult experience (e.g. workplace, politics).'
  ]
});

var BECE_MATH = Object.assign({}, BECE_GENERIC, {
  subject:'Mathematics',
  questionsToShow: 6, questionsToAnswer: 5,
  syllabusAreas: [
    'Whole numbers, fractions, decimals, percentages',
    'Approximation and estimation',
    'Basic algebra (simple equations, substitution)',
    'Mensuration (perimeter, area, volume of basic shapes)',
    'Geometry (angles, triangles, quadrilaterals, basic constructions)',
    'Statistics (frequency tables, mean, mode, median, basic graphs)',
    'Number bases (binary)',
    'Sets',
    'Financial arithmetic (simple interest, profit, loss, ratio)'
  ],
  notes: [
    'Numbers should be small and friendly. Avoid scientific notation.',
    'Use Nigerian context: classroom, market, family.'
  ]
});

var BECE_BST = Object.assign({}, BECE_GENERIC, {
  subject:'Basic Science & Technology',
  syllabusAreas: [
    'Living and non-living things',
    'Plants and animals (basic classification)',
    'Human body (digestion, breathing, circulation — JSS level)',
    'Reproduction in humans (puberty, family life, HIV/AIDS basics)',
    'Energy and its uses',
    'Force, motion and simple machines',
    'Heat, light, sound (basics)',
    'Magnetism and electricity (basics)',
    'Environmental pollution and conservation',
    'Drug abuse and effects'
  ],
  notes: ['Define terms first; keep examples concrete and visual.']
});

var BECE_CRS = Object.assign({}, BECE_GENERIC, {
  subject:'Christian Religious Studies',
  syllabusAreas: [
    'Old Testament: creation, the patriarchs, Moses, the Judges, the kings (Saul, David, Solomon)',
    'New Testament: birth and ministry of Jesus, parables, miracles, the Crucifixion and Resurrection',
    'Early Church and Acts of the Apostles',
    'Christian moral living (honesty, love, forgiveness, hard work)',
    'Christian response to social issues'
  ],
  notes: ['Reference Bible passages with chapter and verse where appropriate.']
});

var BECE_NV = Object.assign({}, BECE_GENERIC, {
  subject:'National Values (Civic Education + Social Studies + Security Education)',
  syllabusAreas: [
    'Citizenship and rights and duties',
    'Democracy and constitution (basic)',
    'Federal character',
    'Drug abuse, cultism, examination malpractice',
    'Nigerian unity and national integration',
    'Values: honesty, integrity, discipline'
  ],
  notes: ['Use real Nigerian examples and recent civic education themes.']
});

// ─── Registry ─────────────────────────────────────────────────
// Lookup keyed by board + subjectKey-prefix (e.g. 'eng', 'mth', 'bio')
var REGISTRY = {
  WAEC: {
    eng:  WAEC_ENG,
    mth:  WAEC_MATH,
    bio:  WAEC_BIO,
    chm:  WAEC_CHM,
    phy:  WAEC_PHY,
    geo:  WAEC_GEO,
    gov:  WAEC_GOV,
    eco:  WAEC_ECO,
    lit:  WAEC_LIT,
    agr:  WAEC_AGR
  },
  NECO: NECO_SPECS,
  JAMB: { _note: JAMB_NOTE },
  BECE: {
    eng: BECE_ENG,
    mth: BECE_MATH,
    bsc: BECE_BST, bst: BECE_BST,
    crs: BECE_CRS,
    irs: Object.assign({}, BECE_GENERIC, { subject:'Islamic Religious Studies', syllabusAreas:[
      'Tawhid (oneness of Allah)','Pillars of Islam','The Prophet Muhammad (PBUH)','Qur\'an basics',
      'Hadith and Sunnah','Islamic ethics and moral conduct','Family life in Islam'
    ], notes:['Reference Qur\'an surahs and Hadiths where appropriate.'] }),
    nv:  BECE_NV
  }
};

// Generic fallback for any subject not in the registry — board-aware.
function genericSpec(board, subjectKey, subjectName){
  var bg = (board === 'BECE') ? BECE_GENERIC : WAEC_GENERIC;
  return Object.assign({}, bg, {
    subject: subjectName || subjectKey,
    syllabusAreas: ['Use the standard NERDC syllabus topics for ' + (subjectName || subjectKey) + ' at the appropriate level.'],
    notes: bg.notes.concat([
      'No board-specific spec is registered for this subject. Generate questions following the general structure and topic scope of the NERDC senior-secondary curriculum for ' + (subjectName || subjectKey) + '.'
    ])
  });
}

// ─── Subject key normalisation ────────────────────────────────
// The site uses keys like 'eng-s2', 'mth-s3', 'bio-p1'. Strip the
// suffix to get the base subject prefix.
function normaliseSubjectKey(rawKey){
  if (!rawKey) return '';
  return String(rawKey).toLowerCase().replace(/-[a-z0-9]+$/, '');
}

function normaliseBoard(b){
  return String(b||'').toUpperCase().replace(/[^A-Z]/g,'');
}

// ─── Public API ────────────────────────────────────────────────
var ExamGen = {
  hasSpec: function(board, subject){
    var b = normaliseBoard(board);
    var s = normaliseSubjectKey(subject);
    return !!(REGISTRY[b] && REGISTRY[b][s]);
  },
  getSpec: function(board, subject){
    var b = normaliseBoard(board);
    var s = normaliseSubjectKey(subject);
    if (REGISTRY[b] && REGISTRY[b][s]) return REGISTRY[b][s];
    return null;
  },
  // Returns [{ type:'...', q:'...', yr:'2024 (AI)' }, ...]
  generate: async function(opts){
    opts = opts || {};
    var board = normaliseBoard(opts.board || 'WAEC');
    var subjectKey = normaliseSubjectKey(opts.subject || 'eng');
    var subjectName = opts.subjectName || subjectKey;

    if (board === 'JAMB'){
      // JAMB has no theory paper.
      throw new Error('JAMB does not have a theory paper. Use Paper 1 (objective) instead.');
    }

    var spec = (REGISTRY[board] && REGISTRY[board][subjectKey]) || genericSpec(board, subjectKey, subjectName);
    // If the spec has sections, the total count is the sum of section counts.
    var count = opts.count || spec.questionsToShow || 5;
    if (spec.sections && spec.sections.length){
      count = spec.sections.reduce(function(s, sec){ return s + (sec.count || 1); }, 0);
    }

    // Look up questions/topics the student has already seen so the AI can
    // generate genuinely different ones. This dramatically reduces the
    // "AI keeps producing similar essays" complaint.
    var avoidTopics = [];
    try {
      if (typeof window.getSeenQuestions === 'function'){
        var seenObj = window.getSeenQuestions(board.toLowerCase(), subjectKey + '_essay');
        var seenObj2 = window.getSeenQuestions(board.toLowerCase(), subjectKey);
        avoidTopics = (seenObj || []).concat(seenObj2 || []).slice(-25);
      }
    } catch(e){}

    var system = buildSystemPrompt(spec, subjectName, count, avoidTopics, opts.yearStyle);
    var user = 'Generate ' + count + ' theory questions for a ' + spec.board + ' ' + (spec.subject || subjectName) + ' Paper 2. ';
    if (opts.yearStyle){
      user += 'Match the style and difficulty of the ' + opts.yearStyle + ' paper for this subject. ';
    }
    if (avoidTopics.length){
      user += 'IMPORTANT: This student has already seen these topics — generate DIFFERENT, fresh questions on other sub-topics: '
        + JSON.stringify(avoidTopics) + '. ';
    }
    user += 'Output ONLY the JSON array. No preamble.';

    // Try Anthropic primary, OpenAI fallback. Lessons + this generator
    // both use Anthropic primarily. Translation is the only thing that
    // exclusively goes through OpenAI.
    var raw = '';
    var arr = null;
    try {
      raw = await callAI(system, user);
      arr = parseJSON(raw);
    } catch(e){
      console.warn('[ExamGen] first AI call failed', e);
    }
    if (!arr || !arr.length){
      // Retry once with a more aggressive JSON-only instruction
      try {
        var sysHardened = system
          + '\n\nABSOLUTE REQUIREMENT: Your ENTIRE response must be a single valid JSON array starting with [ and ending with ]. '
          + 'No markdown fences. No preamble. No code blocks. No explanation. Just the JSON array.';
        var userHardened = 'Output ONLY the JSON array. Nothing else. Example shape: [{"type":"Essay","q":"Question text here..."}]. '
          + 'Generate ' + count + ' items for ' + spec.board + ' ' + (spec.subject || subjectName) + ' Paper 2.';
        raw = await callAI(sysHardened, userHardened);
        arr = parseJSON(raw);
      } catch(e){ console.warn('[ExamGen] hardened retry failed', e); }
    }
    if (!arr || !arr.length){
      // Last resort — build a syllabus-based fallback paper from the spec
      // so the user is NEVER shown a parse error.
      console.warn('[ExamGen] Falling back to syllabus-based skeleton paper.');
      arr = buildFallbackPaper(spec, subjectName, count);
    }
    // Normalise to the existing topic shape
    var defaultYr = opts.yearStyle || String(new Date().getFullYear());
    return arr.map(function(item, i){
      return {
        type: item.type || ('Question ' + (i + 1)),
        q: item.q || item.question || '',
        parts: item.parts || null,
        yr: item.yr || defaultYr
      };
    });
  }
};

// Builds a syllabus-driven skeleton paper from the spec when both AI
// providers fail. This guarantees students always see SOMETHING usable
// rather than an error screen. Questions come from the spec's
// syllabusAreas and essayTypes — original prompts that the student can
// still meaningfully practise on.
function buildFallbackPaper(spec, subjectName, count){
  var out = [];
  var subj = spec.subject || subjectName || 'this subject';
  // If sections are defined, generate one question per section item
  if (spec.sections && spec.sections.length){
    spec.sections.forEach(function(sec){
      var n = sec.count || 1;
      for (var i = 0; i < n; i++){
        out.push({
          type: sec.name + (n > 1 ? ' #' + (i+1) : ''),
          q: 'Following the ' + sec.name.replace(/^Section [A-Z0-9]+ — /,'') + ' format for ' + subj
            + ': ' + sec.instruction
            + (spec.essayTypes && i < spec.essayTypes.length ? ' Essay type: ' + spec.essayTypes[i] + '.' : '')
        });
      }
    });
    return out;
  }
  // Otherwise — one question per syllabus area
  var areas = spec.syllabusAreas || [];
  var types = spec.essayTypes || ['Essay'];
  for (var i = 0; i < count; i++){
    var area = areas[i % Math.max(1, areas.length)] || 'General';
    var type = types[i % types.length];
    out.push({
      type: type,
      q: 'Discuss key concepts in ' + area + ' as it relates to ' + subj + '. '
        + 'Define important terms, give examples from a Nigerian context, '
        + 'and explain how they connect to your everyday experience. (' + spec.marksPerQuestion + ' marks)'
    });
  }
  return out;
}

// ─── Prompt construction ──────────────────────────────────────
function buildSystemPrompt(spec, subjectName, count, avoidTopics, yearStyle){
  var lines = [
    'You are a senior examiner generating a fresh ' + spec.board + ' Paper 2 (Theory) for ' + (spec.subject || subjectName) + '.',
    'You will produce ORIGINAL, copyright-safe questions — never reproduce real past-paper text verbatim.',
    'Questions must follow the NERDC syllabus and the real ' + spec.board + ' marking scheme.',
    '',
    'PAPER STRUCTURE:',
    '- Number of questions to generate: ' + count,
    '- Marks per question (or avg across sections): ' + spec.marksPerQuestion,
    '- Questions candidates answer: ' + (spec.questionsToAnswer || count) + ' of ' + (spec.questionsToShow || count),
    '- Total time: ' + spec.duration + ' minutes',
    ''
  ];
  // If the spec has SECTIONS (e.g. English: essay + comprehension + summary + lexis),
  // describe them explicitly so the AI generates the FULL real paper structure.
  if (spec.sections && spec.sections.length){
    lines.push('THIS PAPER HAS ' + spec.sections.length + ' SECTIONS — generate questions for ALL sections:');
    spec.sections.forEach(function(sec, i){
      lines.push('  ' + (i+1) + '. ' + sec.name + ' (' + sec.marks + ' marks)');
      lines.push('     Items: ' + sec.count + (sec.choose < sec.count ? ' (candidate chooses ' + sec.choose + ')' : ''));
      lines.push('     Instruction: ' + sec.instruction);
    });
    lines.push('');
    lines.push('In the JSON output, set each item\'s "type" field to the section name (e.g. "Section 1 — Essay (Argumentative)").');
    lines.push('');
  }
  if (yearStyle){
    lines.push('YEAR STYLE: Match the difficulty, theme focus, and wording style of the ' + yearStyle + ' ' + spec.board + ' paper for this subject.');
    lines.push('Tag each question with yr:"' + yearStyle + '" so it displays as a ' + yearStyle + '-style paper.');
    lines.push('');
  }
  if (avoidTopics && avoidTopics.length){
    lines.push('UNIQUENESS REQUIREMENT — this student has already seen these topics/questions:');
    avoidTopics.slice(0, 20).forEach(function(t, i){
      lines.push('  ' + (i+1) + '. ' + String(t).slice(0, 80));
    });
    lines.push('Generate questions on DIFFERENT sub-topics. Do not repeat any of these.');
    lines.push('');
  }
  if (spec.essayTypes){
    lines.push('ESSAY TYPES (each question must use a different type):');
    spec.essayTypes.forEach(function(t){ lines.push('  • ' + t); });
    lines.push('');
    if (spec.wordCount) lines.push('Word count expected: ' + spec.wordCount);
    lines.push('');
  }
  if (spec.syllabusAreas && spec.syllabusAreas.length){
    lines.push('SYLLABUS AREAS — draw questions from these. Spread across different areas; do NOT clump in one topic:');
    spec.syllabusAreas.forEach(function(a, i){ lines.push('  ' + (i+1) + '. ' + a); });
    lines.push('');
  }
  if (spec.notes && spec.notes.length){
    lines.push('BOARD-SPECIFIC GUIDANCE:');
    spec.notes.forEach(function(n){ lines.push('  • ' + n); });
    lines.push('');
  }
  lines.push('OUTPUT FORMAT — JSON array, no preamble, no code fences.');
  lines.push('Each item: { "type": "<question type or topic area>", "q": "<full question text including parts (a)(b)(c) if structured>", "parts": [optional array of {label, text}] }');
  lines.push('');
  lines.push('EXAMPLE (English Paper 2, 1 essay topic):');
  lines.push('[{"type":"Argumentative","q":"Some say social media has done more harm than good to Nigerian youth. Write an article for a national newspaper expressing your view. Your article should not be less than 450 words."}]');
  lines.push('');
  lines.push('EXAMPLE (Mathematics Paper 2, 1 question):');
  lines.push('[{"type":"Algebra","q":"(a) Solve the simultaneous equations: 2x + 3y = 12 and 4x − y = 10. (5 marks) (b) A trader bought 60 oranges at ₦25 each. He sold 45 at ₦40 each and the rest at ₦20 each. Calculate his profit or loss. (5 marks)"}]');
  lines.push('');
  lines.push('CRITICAL: Output ONLY the JSON array. No explanation, no introduction, no closing remarks.');
  return lines.join('\n');
}

// ─── AI call with primary→fallback ────────────────────────────
async function callAI(system, user){
  var body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    system: system,
    messages: [{ role:'user', content: user }]
  };
  // Try Anthropic first
  try {
    var res = await fetch('/api/anthropic', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if (res.ok){
      var d = await res.json();
      var t = pluckText(d);
      if (t) return t;
    }
  } catch(e){
    console.warn('[ExamGen] anthropic failed, falling back to openai', e);
  }
  // Fallback OpenAI
  try {
    var res2 = await fetch('/api/openai', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if (res2.ok){
      var d2 = await res2.json();
      var t2 = pluckText(d2);
      if (t2) return t2;
    }
  } catch(e){
    console.warn('[ExamGen] openai also failed', e);
  }
  throw new Error('Both AI providers failed.');
}

function pluckText(data){
  if (!data) return '';
  if (data.content && data.content[0] && data.content[0].text) return data.content[0].text;
  if (typeof data.content === 'string') return data.content;
  if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) return data.choices[0].message.content;
  return '';
}

// Aggressively extracts JSON array from AI text. Handles:
//   - Markdown fences (```json, ```, single back-ticks)
//   - Prose preamble ("Here are the questions:")
//   - Trailing prose ("Hope this helps!")
//   - Smart quotes (curly quotes \u2192 straight)
//   - Trailing commas in objects/arrays
//   - Multiple JSON arrays in the same text (take the longest one)
//   - JSON wrapped in {"questions":[...]} or {"data":[...]}
//   - Single-object responses (wraps into a one-item array)
function parseJSON(text){
  if (!text) return null;
  var s = String(text).trim();

  // Strip code fences (```json...``` or ```...```)
  s = s.replace(/```(?:json|JSON)?\s*/g, '').replace(/```/g, '');
  s = s.trim();

  // Replace smart quotes everywhere
  s = s.replace(/[\u2018\u2019\u2032]/g, "'").replace(/[\u201C\u201D\u2033]/g, '"');

  // 1) Direct parse attempt \u2014 best case
  var attempts = [];
  attempts.push(s);

  // 2) Find the first [ ... ] balanced block (greedy for largest)
  var firstBracket = s.indexOf('[');
  if (firstBracket >= 0){
    var depth = 0, end = -1;
    for (var i = firstBracket; i < s.length; i++){
      var ch = s[i];
      if (ch === '"' || ch === "'"){
        // Skip strings
        var q = ch;
        i++;
        while (i < s.length && s[i] !== q){
          if (s[i] === '\\') i++;
          i++;
        }
        continue;
      }
      if (ch === '[') depth++;
      else if (ch === ']'){ depth--; if (depth === 0){ end = i; break; } }
    }
    if (end > firstBracket){
      attempts.push(s.slice(firstBracket, end + 1));
    }
  }

  // 3) Maybe it's a {"questions":[...]} or {"items":[...]} wrapper \u2014 find first { ... }
  var firstBrace = s.indexOf('{');
  if (firstBrace >= 0){
    var d = 0, e2 = -1;
    for (var j = firstBrace; j < s.length; j++){
      var c = s[j];
      if (c === '"' || c === "'"){
        var qu = c; j++;
        while (j < s.length && s[j] !== qu){
          if (s[j] === '\\') j++;
          j++;
        }
        continue;
      }
      if (c === '{') d++;
      else if (c === '}'){ d--; if (d === 0){ e2 = j; break; } }
    }
    if (e2 > firstBrace){
      attempts.push(s.slice(firstBrace, e2 + 1));
    }
  }

  // Try each attempt, cleaning trailing commas as we go
  for (var k = 0; k < attempts.length; k++){
    var slice = attempts[k].replace(/,(\s*[}\]])/g, '$1');
    try {
      var parsed = JSON.parse(slice);
      if (Array.isArray(parsed) && parsed.length) return parsed;
      // {"questions":[...]} wrapper
      if (parsed && typeof parsed === 'object'){
        var keys = ['questions','items','data','paper','topics','results'];
        for (var ki = 0; ki < keys.length; ki++){
          if (Array.isArray(parsed[keys[ki]]) && parsed[keys[ki]].length) return parsed[keys[ki]];
        }
        // Single object that looks like a question \u2014 wrap it
        if (parsed.q || parsed.question){ return [parsed]; }
      }
    } catch(e){
      // Try with one more aggressive cleanup
      try {
        // Newlines inside strings can break JSON.parse \u2014 escape them
        var alt = slice.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        var parsed2 = JSON.parse(alt);
        if (Array.isArray(parsed2) && parsed2.length) return parsed2;
      } catch(e2){}
    }
  }

  console.warn('[ExamGen] parseJSON: all parse attempts failed. Raw text head:', s.slice(0, 300));
  return null;
}

window.ExamGen = ExamGen;

})();
