/* Higgins — family command center. v0.5
   Single-page app, no build step. All data lives in localStorage under STORE_KEY. */
'use strict';

const STORE_KEY = 'higgins.v1';
const VERSION = 1;

/* ================= Utilities ================= */
const $ = (s, el = document) => el.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const addMonths = (s, n) => { const d = parseISO(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return iso(d); };
const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000);
const fmtDate = (s, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => s ? parseISO(s).toLocaleDateString(undefined, opts) : '';
const fmtTime = t => { if (!t) return ''; const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; return `${((h + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''}${ap}`; };
const money = n => (n === '' || n == null || isNaN(n)) ? '—' : Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: Number(n) % 1 ? 2 : 0 });
const weekStart = s => { const d = parseISO(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return iso(d); };
function rel(s) {
  if (!s) return '';
  const n = diffDays(s, today());
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${-n} days overdue`;
  if (n < 7) return `In ${n} days`;
  return fmtDate(s);
}
function dueTone(s) { if (!s) return ''; const n = diffDays(s, today()); return n < 0 ? 'rust' : n <= 3 ? 'mustard' : ''; }
function freqLabel(days) {
  if (!days) return 'One-time';
  if (days % 365 === 0) return days === 365 ? 'Yearly' : `Every ${days / 365} yrs`;
  if (days % 30 === 0) return days === 30 ? 'Monthly' : `Every ${days / 30} mo`;
  if (days % 7 === 0) return days === 7 ? 'Weekly' : `Every ${days / 7} wks`;
  return days === 1 ? 'Daily' : `Every ${days} days`;
}

const ICONS = {
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  upkeep: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  auto: '<path d="M4 16.5v-4l2.2-5h11.6l2.2 5v4z"/><circle cx="8" cy="16.5" r="1.8"/><circle cx="16" cy="16.5" r="1.8"/><path d="M4 12.5h16"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
  planning: '<path d="M6.5 3h8l4 4v14h-12z"/><path d="M14.5 3v4h4"/><path d="M9.5 12h6M9.5 16h6"/>',
  meals: '<circle cx="13" cy="13" r="6.5"/><circle cx="13" cy="13" r="3"/><path d="M4 3.5V9a1.5 1.5 0 0 0 3 0V3.5M5.5 10.5V20"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
  shopping: '<path d="M5.5 8h13l-1.2 12.5H6.7z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  family: '<circle cx="9" cy="8.5" r="3"/><circle cx="17" cy="9.5" r="2.4"/><path d="M3.5 20c0-3.3 2.4-5.8 5.5-5.8s5.5 2.5 5.5 5.8"/><path d="M15.5 14.5c.5-.2 1-.3 1.5-.3 2.3 0 3.5 1.8 3.5 4.3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  left: '<path d="m14.5 5-7 7 7 7"/>',
  right: '<path d="m9.5 5 7 7-7 7"/>',
  snooze: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M5 4 3 6M19 4l2 2"/>',
  cart: '<path d="M3 4h2.5l2 11h11l2-8H7"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  medal: '<circle cx="12" cy="14" r="5.5"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/>',
};
const icon = (n, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ================= Seed data ================= */
const ZONES = ['Kitchen', 'Laundry', 'Floors', 'Bathrooms', 'Bedrooms', 'Whole house', 'Exterior', 'Safety'];
const MEMBER_COLORS = ['#2553A6', '#D7412B', '#F2B705', '#2F7D57', '#1D1A17', '#E07B39'];
const OLD_COLORS = ['#1F5F5B', '#BF5436', '#D39B2A', '#6C7A36', '#4F7FA0', '#8A5A83'];

const SEED_TASKS = [
  ['Clean dishwasher filter', 'Kitchen', 30, 1],
  ['Dishwasher cleaning cycle (vinegar or tablet)', 'Kitchen', 60, 1],
  ['Replace refrigerator water filter', 'Kitchen', 180, 1],
  ['Degrease range hood filter', 'Kitchen', 90, 2],
  ['Vacuum refrigerator coils', 'Kitchen', 180, 2],
  ['Purge & wipe out fridge', 'Kitchen', 14, 2],
  ['Descale coffee maker', 'Kitchen', 60, 1],
  ['Disinfect sink & garbage disposal', 'Kitchen', 7, 1],
  ['Washer cleaning cycle + wipe gasket', 'Laundry', 30, 1],
  ['Clean dryer lint trap housing', 'Laundry', 90, 1],
  ['Clean dryer vent duct', 'Laundry', 365, 3],
  ['Deep vacuum whole house (all floors, rugs, stairs)', 'Floors', 7, 3],
  ['Mop hard floors', 'Floors', 14, 2],
  ['Vacuum under furniture & baseboards', 'Floors', 30, 3],
  ['Shampoo carpets & rugs', 'Floors', 180, 3],
  ['Deep clean bathrooms', 'Bathrooms', 7, 2],
  ['Descale showerheads & wash curtains', 'Bathrooms', 90, 2],
  ['Wash all bedding', 'Bedrooms', 7, 2],
  ['Rotate / flip mattresses', 'Bedrooms', 90, 2],
  ['Replace HVAC air filter', 'Whole house', 90, 1],
  ['Dust ceiling fans, vents & blinds', 'Whole house', 30, 2],
  ['Clean windows inside', 'Whole house', 90, 3],
  ['Flush water heater', 'Whole house', 365, 3],
  ['HVAC professional service', 'Whole house', 180, 1],
  ['Clean gutters', 'Exterior', 180, 3],
  ['Test smoke & CO detectors', 'Safety', 30, 1],
  ['Replace smoke & CO detector batteries', 'Safety', 365, 1],
  ['Check fire extinguishers', 'Safety', 365, 1],
];
const SEED_AUTO = [
  ['Oil change', 180, 1], ['Tire rotation', 180, 1], ['Check tire pressure', 30, 1],
  ['Replace wiper blades', 365, 1], ['Replace cabin air filter', 365, 1], ['Registration renewal', 365, 1],
];

const ESTATE_STEPS = [
  ['inventory', 'Inventory assets & accounts', 'List every account (bank, brokerage, retirement, HSA, 529), real estate, vehicles, insurance policies and debts. Note institution and the last 4 digits only — never full numbers here.'],
  ['guardians', 'Choose guardians for the kids', 'Pick a primary and backup guardian. Talk with them before you name them. Consider values, location, age, and whether money should be managed by someone else (a trustee).'],
  ['executor', 'Choose an executor & trustee', 'The executor settles the estate; the successor trustee manages the trust. Often the same person. Name a backup for each.'],
  ['will', 'Draft & sign wills', 'Each spouse needs their own will. If you use a trust, these are usually "pour-over" wills that send anything left outside the trust into it. Signing rules (witnesses, notary) vary by state.'],
  ['trustdecide', 'Decide on a revocable living trust', 'A trust avoids probate, keeps things private, and lets you control how and when kids inherit (for example in stages at 25/30/35). Talk it through with an estate attorney.'],
  ['trustsign', 'Establish the trust', 'Sign the trust agreement. Record the trust name, date, trustees and successor trustees in the Trust details card.'],
  ['trustfund', 'Fund the trust', 'Retitle assets into the trust: the house deed, non-retirement brokerage and bank accounts. An unfunded trust does nothing — this is the step people most often skip.'],
  ['beneficiaries', 'Review beneficiary designations', 'Retirement accounts, life insurance, HSAs and TOD/POD accounts go by their beneficiary form, not the will. Set primary and contingent beneficiaries for each and log them below.'],
  ['poa', 'Durable financial power of attorney', 'Names who can handle finances if you are incapacitated. Each adult needs one.'],
  ['health', 'Healthcare directive & HIPAA release', 'Living will, healthcare power of attorney and a HIPAA authorization so your agent can talk to doctors.'],
  ['insurance', 'Review life & disability insurance', 'Check coverage covers debts, income replacement and kids\' education. Consider making the trust the beneficiary for minor kids.'],
  ['letter', 'Letter of instruction & digital assets', 'A plain-language letter: where things are, who to call, final wishes. Set up password-manager emergency access and legacy contacts (Apple, Google).'],
  ['store', 'Store originals & tell key people', 'Fireproof safe or the attorney\'s vault. Make sure the executor knows where everything is. Log locations under "Where things are".'],
  ['review', 'Schedule reviews', 'Review every 3 years, or after a birth, death, move, marriage, divorce or big change in assets.'],
];

function seedState() {
  const t = today();
  const members = [
    { id: uid(), name: 'Parent 1', color: MEMBER_COLORS[0] },
    { id: uid(), name: 'Parent 2', color: MEMBER_COLORS[1] },
    { id: uid(), name: 'Kid 1', color: MEMBER_COLORS[2], role: 'Kid' },
    { id: uid(), name: 'Kid 2', color: MEMBER_COLORS[4], role: 'Kid' },
  ];
  const car = { id: uid(), name: 'Family car', year: '', make: '', model: '', mileage: '', notes: '' };
  // Spread first due dates over the next three weeks so day one isn't a wall of overdue items.
  const tasks = SEED_TASKS.map(([title, zone, freqDays, effort], i) => ({
    id: uid(), title, area: 'home', zone, freqDays, effort, assignee: '', notes: '',
    nextDue: addDays(t, Math.min(freqDays - 1, (i * 5) % 21)), lastDone: '',
  }));
  SEED_AUTO.forEach(([title, freqDays, effort], i) => tasks.push({
    id: uid(), title, area: 'auto', zone: 'Vehicles', vehicleId: car.id, freqDays, effort, assignee: '', notes: '',
    nextDue: addDays(t, 3 + i * 4), lastDone: '',
  }));
  return {
    version: VERSION,
    settings: { familyName: '', theme: 'light', weeklyGoal: 30, aiModel: 'haiku', aiCap: 0 },
    members, activeMember: members[0].id,
    tasks, log: [], vehicles: [car], bills: [],
    estate: {
      steps: Object.fromEntries(ESTATE_STEPS.map(([id]) => [id, { status: 'todo', notes: '', date: '' }])),
      trust: { name: '', type: 'Revocable living trust', established: '', grantors: '', trustees: '', successors: '', attorney: '', distribution: '', notes: '' },
      beneficiaries: [], people: [], locations: [], notes: [],
    },
    recipes: [
      { id: uid(), name: 'Sunday roast chicken', favorite: true, tags: ['Sunday', 'Comfort'], serves: 4, time: '1 hr 30', color: MEMBER_COLORS[2],
        ingredients: ['1 whole chicken (4–5 lb)', '2 lemons', '1 head garlic', '1 bunch thyme', '2 lb baby potatoes', '4 carrots', 'Olive oil', 'Kosher salt'],
        steps: 'Dry-brine chicken with salt the night before.\nRoast at 425°F on a bed of potatoes and carrots with lemon and garlic in the cavity, ~75 min.\nRest 15 min before carving.',
        notes: 'Example recipe — edit or delete.', lastMade: '', timesMade: 0 },
      { id: uid(), name: 'Taco night', favorite: true, tags: ['Weeknight', 'Kids love'], serves: 4, time: '30 min', color: MEMBER_COLORS[1],
        ingredients: ['1.5 lb ground beef', 'Taco seasoning', '12 tortillas', 'Shredded cheddar', 'Lettuce', '2 tomatoes', 'Sour cream', 'Salsa', '2 limes'],
        steps: 'Brown beef, add seasoning and a splash of water.\nWarm tortillas in a dry pan.\nSet out toppings.',
        notes: '', lastMade: '', timesMade: 0 },
    ],
    mealPlan: {}, grocery: [], events: [], purchases: [], inbox: [],
    healthHistory: {}, milestones: {},
  };
}

/* ================= State ================= */
let state;
function load() {
  try { state = JSON.parse(localStorage.getItem(STORE_KEY)); } catch { state = null; }
  if (!state || state.version !== VERSION) state = seedState();
  // v0.3 migrations: light by default, new palette
  if (!state.settings.v03) {
    state.settings.v03 = true;
    if (state.settings.theme === 'auto') state.settings.theme = 'light';
    const swap = c => { const i = OLD_COLORS.indexOf(c); return i >= 0 ? MEMBER_COLORS[i] : c; };
    state.members.forEach(m => m.color = swap(m.color));
    state.recipes.forEach(r => r.color = swap(r.color));
  }
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast('Could not save — storage unavailable'); } }
const member = id => state.members.find(m => m.id === id);
const memberName = id => member(id)?.name || '';
const memberDot = id => { const m = member(id); return m ? `<span class="dot" style="background:${m.color}" title="${esc(m.name)}"></span>` : ''; };
const memberOptions = (withAnyone = 'Anyone', adultsOnly = false) => [['', withAnyone], ...state.members.filter(m => !adultsOnly || m.role !== 'Kid').map(m => [m.id, m.name])];
const adults = () => state.members.filter(m => m.role !== 'Kid');
const isOverdue = t => !!t.nextDue && t.nextDue < today();
const isDue = t => !!t.nextDue && t.nextDue <= today();
const byDue = (a, b) => (a.nextDue || '9999').localeCompare(b.nextDue || '9999');

/* ================= Scoring & gamification ================= */
function taskHealth(t) {
  const over = -diffDays(t.nextDue, today());
  if (over <= 0) return 1;
  return Math.max(0, 1 - over / Math.max(t.freqDays, 7));
}
function healthOf(all) { const tasks = all.filter(t => !t.once); return tasks.length ? Math.round(100 * tasks.reduce((a, t) => a + taskHealth(t), 0) / tasks.length) : 100; }
const houseHealth = () => healthOf(state.tasks.filter(t => t.area === 'home'));
function recordHealth() {
  state.healthHistory[today()] = houseHealth();
  const keys = Object.keys(state.healthHistory).sort();
  if (keys.length > 400) keys.slice(0, keys.length - 400).forEach(k => delete state.healthHistory[k]);
}
function streak() {
  let n = 0, d = today();
  while ((state.healthHistory[d] ?? -1) >= 85) { n++; d = addDays(d, -1); }
  return n;
}
function weekPoints() {
  const since = addDays(today(), -6);
  const by = {};
  state.log.filter(l => l.date >= since).forEach(l => { by[l.memberId || ''] = (by[l.memberId || ''] || 0) + (l.points || 1); });
  return by;
}
function estateProgress() {
  const s = Object.values(state.estate.steps);
  return { done: s.filter(x => x.status === 'done').length, total: s.length };
}
const MILESTONES = [
  { id: 'first', name: 'First entry', desc: 'Logged the first completed task.', test: s => s.log.length >= 1 },
  { id: 'tended25', name: 'Twenty-five tended', desc: '25 tasks completed.', test: s => s.log.length >= 25 },
  { id: 'tended100', name: 'A hundred tended', desc: '100 tasks completed.', test: s => s.log.length >= 100 },
  { id: 'week', name: 'A steady week', desc: 'House health at 85+ for 7 days running.', test: () => streak() >= 7 },
  { id: 'month', name: 'A steady month', desc: 'House health at 85+ for 30 days running.', test: () => streak() >= 30 },
  { id: 'filters', name: 'Fresh filters', desc: 'Every filter in the house and cars changed on schedule.', test: s => { const f = s.tasks.filter(t => /filter/i.test(t.title)); return f.length && f.every(t => t.lastDone && diffDays(t.nextDue, today()) >= 0); } },
  { id: 'goal', name: 'Rhythm kept', desc: 'Hit the weekly household goal.', test: s => Object.values(weekPoints()).reduce((a, b) => a + b, 0) >= s.settings.weeklyGoal },
  { id: 'planned', name: 'Planned week', desc: 'Dinner planned all 7 nights of a week.', test: s => { const w = weekStart(today()); return [0, 1, 2, 3, 4, 5, 6].every(i => s.mealPlan[addDays(w, i)]); } },
  { id: 'cookbook', name: 'Family cookbook', desc: '10 recipes in the book.', test: s => s.recipes.length >= 10 },
  { id: 'paper', name: 'Paper trail', desc: 'Half the estate plan complete.', test: () => { const p = estateProgress(); return p.done / p.total >= .5; } },
  { id: 'affairs', name: 'Affairs in order', desc: 'Estate plan fully complete.', test: () => { const p = estateProgress(); return p.done === p.total; } },
];
function checkMilestones() {
  MILESTONES.forEach(m => {
    if (!state.milestones[m.id] && m.test(state)) {
      state.milestones[m.id] = today();
      setTimeout(() => toast(`Milestone reached — ${m.name}`), 400);
    }
  });
}

/* ================= Capture (text + voice) ================= */
const CATS = {
  grocery: 'Grocery list', purchase: 'Things to buy', event: 'Calendar', task: 'Home upkeep', auto: 'Vehicle upkeep',
  bill: 'Bills & payments', meal: 'Dinner plan', recipe: 'Recipe book', estate: 'Family planning note', note: 'Inbox note',
};
const FOOD = /\b(milk|eggs?|bread|butter|cheese|yogurt|apples?|bananas?|berries|strawberr\w*|lettuce|spinach|onions?|garlic|tomato\w*|potato\w*|carrots?|chicken|beef|pork|turkey|bacon|salmon|shrimp|rice|pasta|flour|sugar|coffee|tea|cereal|oats|juice|avocados?|lemons?|limes?|tortillas?|beans|snacks?|chips|crackers|cream|broth|paper towels?|toilet paper|dish soap|detergent|trash bags?|diapers|wipes|fruit|veggies|vegetables)\b/;
const KEYWORDS = {
  grocery: [[/\b(grocer(y|ies)|out of|running low|pick up|grocery list|shopping list)\b/, 3], [FOOD, 2]],
  purchase: [[/\b(order|amazon|target|costco|need (a |an |new )|buy (a |an |new )|replace (my|his|her|their|the kids'?) |shoes|jacket|clothes|charger|gift|birthday present)\b/, 3]],
  event: [[/\b(appointment|appt|dentist|doctor|dr\.?|pediatrician|vet|flight|fly|trip|travel|vacation|hotel|practice|game|recital|party|meeting|conference|haircut|school|pickup|drop ?off|playdate|visit)\b/, 3]],
  task: [[/\b(clean|deep clean|replace|fix|repair|wash|vacuum|mop|dust|filter|gutters?|hvac|detector|paint|every \d+|every (day|week|month|year))\b/, 2]],
  auto: [[/\b(oil change|tires?|auto|car|truck|suv|van|minivan|registration|brakes?|inspection|wipers?|smog|detail)\b/, 3]],
  bill: [[/\b(pay|bill|premium|insurance|loan|mortgage|rent|tax(es)?|tuition|subscription|renew)\b/, 3], [/\$\s?\d/, 2]],
  meal: [[/\b(for dinner|dinner on|dinner (mon|tues|wednes|thurs|fri|satur|sun)day|dinner tonight|dinner tomorrow|meal plan)\b/, 5]],
  recipe: [[/\b(recipe|how to make)\b/, 4]],
  estate: [[/\b(will|trust|trustee|beneficiar(y|ies)|executor|guardian|power of attorney|poa|estate|living will|attorney)\b/, 4]],
};
const DOW = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function parseCapture(raw) {
  const text = raw.trim().replace(/\b(auto|car|truck|vehicle|student|home|personal) load\b/gi, '$1 loan').replace(/\bot be\b/gi, 'to be');
  let t = ' ' + text.toLowerCase() + ' ';
  const out = { raw: text, date: '', time: '', amount: '', freqDays: '', remindDays: 0 };
  let strip = [];
  // date
  let m;
  if ((m = t.match(/\b(today|tonight)\b/))) { out.date = today(); strip.push(m[0]); }
  else if ((m = t.match(/\btomorrow\b/))) { out.date = addDays(today(), 1); strip.push(m[0]); }
  else if ((m = t.match(/\b(?:on |this |next )?(sun|mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?)(?:day)?\b/))) {
    const idx = DOW.findIndex(d => d.startsWith(m[1].slice(0, 3)));
    let n = (idx - new Date().getDay() + 7) % 7 || 7;
    if (/next /.test(m[0])) n += n < 7 ? 7 : 0;
    out.date = addDays(today(), n); strip.push(m[0]);
  } else if ((m = t.match(/\b(?:on )?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear();
    out.date = iso(new Date(y, +m[1] - 1, +m[2])); if (!m[3] && out.date < today()) out.date = iso(new Date(y + 1, +m[1] - 1, +m[2])); strip.push(m[0]);
  } else if ((m = t.match(/\b(?:on )?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? (\d{1,2})(?:st|nd|rd|th)?\b/))) {
    const y = new Date().getFullYear(); out.date = iso(new Date(y, MONTHS.indexOf(m[1]), +m[2]));
    if (out.date < today()) out.date = iso(new Date(y + 1, MONTHS.indexOf(m[1]), +m[2])); strip.push(m[0]);
  } else if ((m = t.match(/\b(?:on )?the (\d{1,2})(?:st|nd|rd|th)\b/))) {
    const d = new Date(); let c = new Date(d.getFullYear(), d.getMonth(), +m[1]); if (iso(c) < today()) c = new Date(d.getFullYear(), d.getMonth() + 1, +m[1]);
    out.date = iso(c); strip.push(m[0]);
  } else if ((m = t.match(/\bnext (week|month)\b/))) {
    out.date = m[1] === 'month' ? addMonths(today(), 1) : addDays(today(), 7); strip.push(m[0]);
  } else if ((m = t.match(/\bin (\d+) (day|week|month)s?\b/))) {
    out.date = m[2] === 'month' ? addMonths(today(), +m[1]) : addDays(today(), +m[1] * (m[2] === 'week' ? 7 : 1)); strip.push(m[0]);
  }
  // time
  if ((m = t.match(/\b(?:at |@ ?)?(\d{1,2})(?::(\d{2}))? ?(am|pm|a\.m\.|p\.m\.)/)) || (m = t.match(/\bat (\d{1,2})(?::(\d{2}))?\b/))) {
    let h = +m[1]; const mm = m[2] || '00'; const ap = (m[3] || '').replace(/\./g, '');
    if (ap === 'pm' && h < 12) h += 12; if (ap === 'am' && h === 12) h = 0; if (!ap && h < 8) h += 12;
    out.time = `${String(h).padStart(2, '0')}:${mm}`; strip.push(m[0]);
  }
  // amount
  if ((m = t.match(/\$\s?([\d,]+(?:\.\d{1,2})?)/))) { out.amount = +m[1].replace(/,/g, ''); strip.push(m[0]); }
  // recurrence
  if ((m = t.match(/\bremind(?:ed|er)?(?: me| us)?[^.,;]*?\b(\d+|a|an|one|two|three|four|five|six|seven|ten|fourteen)\s+(day|week)s?\s+(?:before|ahead|prior|early|in advance)\b/))) {
    const n = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10, fourteen: 14 }[m[1]] || +m[1];
    out.remindDays = n * (m[2] === 'week' ? 7 : 1);
  }
  if ((m = t.match(/\b(?:every|each) (\d+ )?(day|week|month|year)s?\b/))) {
    const n = +(m[1] || 1); out.freqDays = n * { day: 1, week: 7, month: 30, year: 365 }[m[2]]; strip.push(m[0]);
  } else if ((m = t.match(/\b(daily|weekly|monthly|quarterly|yearly|annually)\b/))) {
    out.freqDays = { daily: 1, weekly: 7, monthly: 30, quarterly: 90, yearly: 365, annually: 365 }[m[1]]; strip.push(m[0]);
  }
  // classify
  const scores = {};
  for (const [cat, rules] of Object.entries(KEYWORDS)) scores[cat] = rules.reduce((a, [re, w]) => a + (re.test(t) ? w : 0), 0);
  if (out.date || out.time) scores.event += 1;
  if (out.amount) scores.purchase += 1;
  if (out.freqDays) scores.task += 2;
  if (scores.auto && scores.task) scores.auto += 2;
  if (/\b(loan|insurance|premium|mortgage|payment|bill|tuition|subscription)\b/.test(t)) scores.bill += 4; // money words beat 'car'
  let best = 'todo', bestScore = 0;
  for (const [c, s] of Object.entries(scores)) if (s > bestScore) { best = c; bestScore = s; }
  out.cat = best;
  // clean title — drop "remind me…" clauses, then the date/amount phrases
  let title = ' ' + text.split(/[,;]|\band\b(?=[^,;]*remind)/i).filter(seg => !/remind|heads[- ]up/i.test(seg)).join(', ') + ' ';
  strip.forEach(s => { title = title.replace(new RegExp(s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' '); });
  title = title.replace(/\b(remind me to|remember to|we need to|i need to|need to|don'?t forget to|add|please)\b/gi, ' ')
    .replace(/\b(to|on) (the )?(grocery|shopping) list\b/gi, ' ').replace(/\s+/g, ' ').replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .replace(/(\s+\b(is|are|was|due|of|on|at|by|for)\b)+\s*$/i, '');
  out.title = title ? title[0].toUpperCase() + title.slice(1) : text;
  if (best === 'grocery') {
    const list = title.replace(/\b(we'?re |we are |i'?m )?(out of|running low on|low on|pick up|buy|get|grab|need)\b/gi, ' ')
      .split(/,|\band\b|\+|&/i).map(s => s.trim().replace(/^(some|more|a|an)\s+/i, '')).filter(Boolean);
    out.items = list.length ? list : [out.title];
  }
  if (best === 'meal') { const mt = title.replace(/\b(make|have|cook|for dinner|dinner)\b/gi, ' ').replace(/\s+/g, ' ').trim(); if (mt) out.title = mt[0].toUpperCase() + mt.slice(1); }
  if (best === 'bill') out.title = out.title.replace(/^pay (the |our )?/i, '').replace(/^./, c => c.toUpperCase());
  return out;
}

const CAT_SHORT = { grocery: 'Groceries', todo: 'To-dos', task: 'House', auto: 'Vehicles', event: 'Calendar', bill: 'Bills', meal: 'Dinner plan', purchase: 'To buy', recipe: 'Recipes', estate: 'Family plan', note: 'Inbox' };
const CAT_SHAPE = { grocery: 'ci y', todo: 'sq r', task: 'sq r', auto: 'sq ink', event: 'ci b', bill: 'tr y', meal: 'ci r', purchase: 'ci ink', recipe: 'ci r', estate: 'sq b', note: 'sq ink' };
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ZONE_WORDS = [
  ['Kitchen', /dishwasher|fridge|refrigerator|freezer|oven|stove|range|microwave|sink|disposal|kitchen|coffee|toaster/],
  ['Laundry', /washer|dryer|laundry|lint/],
  ['Floors', /vacuum|mop|carpet|rug|floor|baseboard/],
  ['Bathrooms', /bath|shower|toilet|tub|vanity/],
  ['Bedrooms', /bed|mattress|sheets|pillow|closet/],
  ['Safety', /smoke|detector|extinguisher|alarm|carbon monoxide|\bco\b/],
  ['Exterior', /gutter|lawn|yard|deck|fence|roof|garage|driveway|sprinkler|pool|patio|mow|leaves|snow|siding|hose/],
  ['Whole house', /hvac|furnace|\bac\b|air condition|water heater|window|paint|filter|vent|fan|outlet|light|bulb|door|lock|plumb|leak/],
];
const guessZone = low => (ZONE_WORDS.find(([, re]) => re.test(low)) || ['General'])[0];
const guessMembers = low => state.members.filter(m => m.name && new RegExp(`\\b${reEsc(m.name.toLowerCase())}('s)?\\b`).test(low)).map(m => m.id);
const guessEventType = low => /flight|fly|trip|travel|vacation|hotel|airport/.test(low) ? 'Travel' : /school|teacher|conference/.test(low) ? 'School'
  : /practice|game|lesson|recital|class|camp|tournament/.test(low) ? 'Activity' : /party|visit|playdate|dinner with|bbq|wedding|shower/.test(low) ? 'Social' : 'Appointment';
const guessBillCat = low => /insurance|premium|policy/.test(low) ? 'Insurance' : /mortgage|rent/.test(low) ? 'Mortgage / rent' : /loan|note|financing/.test(low) ? 'Loan'
  : /tax/.test(low) ? 'Tax' : /tuition|daycare|preschool|childcare/.test(low) ? 'Tuition / childcare' : /netflix|spotify|subscription|prime|hulu|disney|icloud/.test(low) ? 'Subscription'
  : /electric|gas|water|internet|phone|trash|sewer|utility/.test(low) ? 'Utility' : 'Other';
const guessVehicle = (low, force) => state.vehicles.find(v => [v.name, v.make, v.model].some(w => w && new RegExp(`\\b${reEsc(w.toLowerCase())}\\b`).test(low)))
  || ((force || /\b(auto|car|truck|suv|van|minivan|vehicle|registration)\b/.test(low)) && state.vehicles.length === 1 ? state.vehicles[0] : null);
const ord = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
const billWhen = b => ({ monthly: `monthly on the ${ord(parseISO(b.nextDue).getDate())}`, quarterly: 'quarterly', semiannual: 'every 6 months', annual: `yearly on ${fmtDate(b.nextDue, { month: 'short', day: 'numeric' })}`, once: `due ${fmtDate(b.nextDue, { month: 'short', day: 'numeric' })}` }[b.freq] || '');
const EVENT_TYPES = ['Appointment', 'Activity', 'Travel', 'School', 'Social', 'Reminder'];
const BILL_CATS = ['Insurance', 'Loan', 'Mortgage / rent', 'Utility', 'Subscription', 'Tax', 'Tuition / childcare', 'Other'];
const guessBillFreq = low => /annual|yearly|every year|per year|a year/.test(low) ? 'annual' : /quarter/.test(low) ? 'quarterly' : /6 months|six months|semi/.test(low) ? 'semiannual' : /one[- ]time|once/.test(low) ? 'once' : 'monthly';

// Creates the item for a category straight away. Returns { summary, undo, edit }.
function fileCapture(p, cat) {
  const low = p.raw.toLowerCase(), t = today();
  const pushUndo = (arr, x) => () => { const a = arr(); const i = a.indexOf(x); if (i >= 0) a.splice(i, 1); };
  switch (cat) {
    case 'grocery': {
      const made = (p.items || [p.title]).map(i => addGrocery(i)).filter(Boolean);
      return { summary: (p.items || [p.title]).join(', '), undo: () => { state.grocery = state.grocery.filter(g => !made.includes(g)); }, edit: () => { location.hash = '#/groceries'; } };
    }
    case 'todo': case 'task': case 'auto': {
      const car = cat === 'auto' ? (state.vehicles.find(v => v.id === p.vehicleId) || guessVehicle(low, true) || state.vehicles[0]) : null;
      const who = (p.memberIds || guessMembers(low)).find(id => adults().some(m => m.id === id)) || '';
      const x = { id: uid(), title: p.title, area: car ? 'auto' : 'home', zone: car ? 'Vehicles' : cat === 'todo' ? 'To-do' : (ZONES.includes(p.zone) ? p.zone : guessZone(low)), vehicleId: car?.id,
        freqDays: p.freqDays || 0, once: !p.freqDays, nextDue: p.date || (p.freqDays ? t : ''), effort: 1,
        assignee: who, notes: p.notes || '', lastDone: '' };
      state.tasks.push(x);
      return { summary: x.title + (x.nextDue ? ` · ${rel(x.nextDue)}` : '') + (x.once ? '' : ` · ${freqLabel(x.freqDays)}`), undo: pushUndo(() => state.tasks, x), edit: () => editTask(x) };
    }
    case 'event': {
      const x = { id: uid(), title: p.title, date: p.date || t, time: p.time, endDate: p.endDate || '', repeat: '', type: EVENT_TYPES.includes(p.category) ? p.category : guessEventType(low),
        members: p.memberIds || guessMembers(low), location: '', notes: p.notes || '', remindDays: p.remindDays || 0 };
      state.events.push(x);
      return { summary: `${x.title} · ${rel(x.date)}${x.time ? ' ' + fmtTime(x.time) : ''}`, undo: pushUndo(() => state.events, x), edit: () => editEvent(x) };
    }
    case 'bill': {
      const category = BILL_CATS.includes(p.category) ? p.category : guessBillCat(low);
      const car = state.vehicles.find(v => v.id === p.vehicleId) || (p.ai ? null : guessVehicle(low));
      let name = p.title;
      if (!p.ai) name = car && /loan|insurance|registration/i.test(low) ? `Pay ${car.name} ${/loan/i.test(low) ? 'auto loan' : /insurance/i.test(low) ? 'insurance' : 'registration'}`
        : /^pay\b/i.test(name) ? name : `Pay ${name.replace(/^./, c => c.toLowerCase())}`;
      const freq = p.billFreq || (p.freqDays ? ({ 30: 'monthly', 90: 'quarterly', 180: 'semiannual', 365: 'annual' }[p.freqDays] || 'monthly') : guessBillFreq(low));
      const x = { id: uid(), name, amount: p.amount, category, freq, nextDue: p.date || t, autopay: /auto-?pay/.test(low), owner: '', account: '', balance: '', notes: p.notes || '', paid: [],
        vehicleId: car?.id || '', remindDays: p.remindDays || 3 };
      state.bills.push(x);
      return { summary: `${x.name}${x.amount ? ' · ' + money(x.amount) : ''} · ${billWhen(x)}${p.remindDays ? ` · reminder ${p.remindDays % 7 ? p.remindDays + ' days' : p.remindDays / 7 === 1 ? 'a week' : p.remindDays / 7 + ' weeks'} before` : ''}`,
        where: car ? `Bills · ${car.name}` : '', undo: pushUndo(() => state.bills, x), edit: () => editBill(x) };
    }
    case 'meal': {
      const date = p.date || t, prev = state.mealPlan[date];
      const r = state.recipes.find(r => r.name.toLowerCase().includes(p.title.toLowerCase()) || p.title.toLowerCase().includes(r.name.toLowerCase()));
      state.mealPlan[date] = r ? { recipeId: r.id, text: '' } : { text: p.title };
      return { summary: `${r ? r.name : p.title} · ${rel(date)}`, undo: () => { if (prev) state.mealPlan[date] = prev; else delete state.mealPlan[date]; }, edit: () => editMeal(date) };
    }
    case 'purchase': {
      const who = (p.memberIds || guessMembers(low))[0] || '';
      const x = { id: uid(), item: p.title, forMember: who, category: who && member(who)?.role === 'Kid' ? 'Kids' : 'Household', priority: /asap|soon|urgent|this week/.test(low) ? 'Soon' : 'Normal',
        price: p.amount, store: '', size: '', status: 'needed', added: t };
      state.purchases.push(x);
      return { summary: x.item, undo: pushUndo(() => state.purchases, x), edit: () => editPurchase(x) };
    }
    case 'recipe': {
      const x = { id: uid(), name: p.title.replace(/^(recipe (for )?|how to make )/i, '').replace(/^./, c => c.toUpperCase()), favorite: false, tags: [], serves: 4, time: '', ingredients: p.ai && p.items ? p.items : [], steps: '', notes: '', lastMade: '', timesMade: 0, color: MEMBER_COLORS[state.recipes.length % MEMBER_COLORS.length] };
      state.recipes.push(x);
      return { summary: `${x.name} — tap Edit to add ingredients`, undo: pushUndo(() => state.recipes, x), edit: () => editRecipe(x) };
    }
    case 'estate': {
      const x = { id: uid(), text: p.raw, date: t }; state.estate.notes.unshift(x);
      return { summary: p.raw, undo: pushUndo(() => state.estate.notes, x), edit: () => { location.hash = '#/planning'; } };
    }
    default: {
      const x = { id: uid(), text: p.raw, date: t }; state.inbox.unshift(x);
      return { summary: p.raw, undo: pushUndo(() => state.inbox, x), edit: () => { location.hash = '#/home'; } };
    }
  }
}
// "Changed the HVAC filter" / "paid the car insurance" logs an existing task or bill instead of creating a new one.
const DONE_RE = /^\s*(?:(?:i|we|just|already|finally)\s+)*(changed|cleaned|replaced|did|finished|washed|vacuumed|mopped|flushed|tested|descaled|rotated|serviced|swapped|emptied|dusted|shampooed|scrubbed|wiped|checked|renewed|mowed|paid)\b/i;
const STOP = new Set('the and for our just already today yesterday this that with from was were have has all out new got did done finally also some its pay paid'.split(' '));
const sig = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w)).map(w => w.slice(0, 5));
function bestMatch(text, items, key) {
  // names of cars and people identify *which* thing, not *what* — they can't be the only overlap
  const names = new Set(sig([...state.vehicles.flatMap(v => [v.name, v.make, v.model]), ...state.members.map(m => m.name)].filter(Boolean).join(' ')));
  const q = new Set(sig(text)); let best = null, bs = 0;
  items.forEach(it => {
    const ws = sig(key(it)), hits = ws.filter(w => q.has(w));
    if (!hits.some(w => !names.has(w))) return;
    const score = hits.length + hits.length / Math.max(ws.length, 1); if (score > bs) { bs = score; best = it; }
  });
  return bs >= 1.25 ? best : null;
}
function tryLogDone(text) {
  const m = text.match(DONE_RE); if (!m) return null;
  const who = state.activeMember, t = today();
  const what = text.slice(m.index + m[0].length); // match on the object only, never the verb
  if (m[1].toLowerCase() === 'paid') { const b = bestMatch(what, activeBills(), b => b.name); return b ? logBillPaid(b) : null; }
  const task = bestMatch(what, state.tasks, x => x.title);
  if (!task) { // nothing scheduled matches — still count the effort
    if (m[1].toLowerCase() === 'paid') return null;
    const title = text.trim().replace(/^./, c => c.toUpperCase());
    const log = { id: uid(), taskId: '', title, memberId: who, date: t, points: 1 }; state.log.unshift(log);
    return { cat: 'task', summary: `✓ ${title} · logged`, undo: () => { state.log = state.log.filter(l => l !== log); }, edit: () => { location.hash = '#/upkeep'; } };
  }
  return logTaskDone(task);
}
function logBillPaid(b) {
  const t = today(), prev = { nextDue: b.nextDue, done: b.done };
  b.paid = b.paid || []; b.paid.unshift({ date: t, amount: b.amount, due: b.nextDue });
  if (b.freq === 'once') b.done = true; else b.nextDue = addMonths(b.nextDue, FREQ_MONTHS[b.freq]);
  return { cat: 'bill', summary: `✓ Paid ${b.name.replace(/^pay\s+/i, '')}${b.done ? '' : ' · next ' + fmtDate(b.nextDue, { month: 'short', day: 'numeric' })}`,
    undo: () => { b.paid.shift(); Object.assign(b, prev); }, edit: () => editBill(b) };
}
function logTaskDone(task) {
  const who = state.activeMember, t = today();
  const prev = { lastDone: task.lastDone, nextDue: task.nextDue };
  const log = { id: uid(), taskId: task.id, title: task.title, memberId: who, date: t, points: task.effort || 1 };
  state.log.unshift(log);
  if (task.once) state.tasks = state.tasks.filter(x => x !== task); else { task.lastDone = t; task.nextDue = addDays(t, task.freqDays); }
  recordHealth();
  return { cat: task.area === 'auto' ? 'auto' : 'task', summary: `✓ ${task.title}${task.once ? '' : ' · next ' + fmtDate(task.nextDue, { month: 'short', day: 'numeric' })}`,
    undo: () => { state.log = state.log.filter(l => l !== log); if (task.once) state.tasks.push(task); else Object.assign(task, prev); recordHealth(); }, edit: () => editTask(task) };
}
/* ---------- AI filing (Claude). The key lives only in this browser, never in backups or the repo. ---------- */
const AI_KEY_STORE = 'higgins.anthropicKey';
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.129.0/+esm';
// Prices are $ per million tokens (input / output), used for the in-app spending estimate.
const AI_MODELS = {
  haiku: { id: 'claude-haiku-4-5', label: 'Haiku 4.5 — economy (~0.3¢ a note)', inPrice: 1, outPrice: 5 },
  opus: { id: 'claude-opus-5-5', label: 'Opus 5.5 — best understanding (~1–2¢ a note)', inPrice: 4, outPrice: 20 },
};
const aiModelKey = () => AI_MODELS[state.settings.aiModel] ? state.settings.aiModel : 'haiku';
const thisMonth = () => today().slice(0, 7);
function aiUsage() { if (!state.aiUsage || state.aiUsage.month !== thisMonth()) state.aiUsage = { month: thisMonth(), notes: 0, cost: 0 }; return state.aiUsage; }
const overAICap = () => (state.settings.aiCap || 0) > 0 && aiUsage().cost >= state.settings.aiCap;
const getAIKey = () => { try { return localStorage.getItem(AI_KEY_STORE) || ''; } catch { return ''; } };
const setAIKey = k => { try { if (k) localStorage.setItem(AI_KEY_STORE, k); else localStorage.removeItem(AI_KEY_STORE); } catch { /* storage blocked */ } };
let Anthropic = null, aiClient = null, aiClientKey = '';
async function getAIClient() {
  const key = getAIKey(); if (!key) return null;
  if (!Anthropic) { const mod = await import(SDK_URL); Anthropic = mod.default || mod.Anthropic; }
  if (!aiClient || aiClientKey !== key) { aiClient = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 60000 }); aiClientKey = key; }
  return aiClient;
}
const AI_TYPES = ['grocery', 'todo', 'house_task', 'vehicle_task', 'event', 'bill', 'meal', 'purchase', 'recipe', 'estate_note', 'log_task_done', 'pay_bill', 'note'];
const AI_SCHEMA = { type: 'object', additionalProperties: false, required: ['actions'], properties: { actions: { type: 'array', items: {
  type: 'object', additionalProperties: false,
  required: ['type', 'title', 'items', 'date', 'time', 'end_date', 'repeat_days', 'bill_frequency', 'amount', 'remind_days_before', 'vehicle_id', 'member_ids', 'zone', 'category', 'match_id', 'notes'],
  properties: {
    type: { type: 'string', enum: AI_TYPES }, title: { type: 'string' }, items: { type: 'array', items: { type: 'string' } },
    date: { type: 'string' }, time: { type: 'string' }, end_date: { type: 'string' }, repeat_days: { type: 'integer' },
    bill_frequency: { type: 'string', enum: ['monthly', 'quarterly', 'semiannual', 'annual', 'once'] }, amount: { type: 'number' }, remind_days_before: { type: 'integer' },
    vehicle_id: { type: 'string' }, member_ids: { type: 'array', items: { type: 'string' } }, zone: { type: 'string' }, category: { type: 'string' }, match_id: { type: 'string' }, notes: { type: 'string' },
  } } } } };
const AI_SYSTEM = `You are Higgins, the executive assistant inside a family's household app. A parent types or dictates a quick note — often casual, with typos or speech-to-text errors. Work out what they mean and turn it into actions the app files for them. Return one action per distinct thing; most notes are a single action.

Action types:
- grocery: food or household consumables to pick up at the store. Put each item in items, cleaned up and capitalized ("Milk", "Paper towels").
- todo: a one-off errand or chore with no schedule.
- house_task: recurring home upkeep. Set repeat_days (7 weekly, 30 monthly, 90 quarterly, 365 yearly) and zone (Kitchen, Laundry, Floors, Bathrooms, Bedrooms, Whole house, Exterior, Safety, or General).
- vehicle_task: car maintenance or paperwork (oil change, tires, inspection). Set vehicle_id; repeat_days if it recurs, otherwise 0.
- event: something happening at a time or on dates — appointments, activities, school, travel. end_date for multi-day trips, member_ids for who is involved, category one of Appointment, Activity, School, Travel, Social, Reminder.
- bill: any payment that recurs or comes due — loans, insurance, mortgage, utilities, subscriptions, taxes, tuition. Set bill_frequency, amount (0 if not given), date = the next due date, category one of Insurance, Loan, Mortgage / rent, Utility, Subscription, Tax, Tuition / childcare, Other. When the payment belongs to a car (auto loan, car insurance, registration fee), set vehicle_id.
- meal: a dinner plan for a date; title is the dish.
- purchase: a non-grocery thing to buy or order (shoes, a gift, a replacement part); member_ids for who it is for.
- recipe: a recipe to save; title is the dish, ingredients in items.
- estate_note: wills, trusts, beneficiaries, guardians, powers of attorney.
- log_task_done: they report having done something that matches a scheduled task in the context — set match_id to that task's id.
- pay_bill: they report having paid a bill in the context — set match_id to that bill's id.
- note: only when nothing else fits.

Titles: write each title the way a sharp executive assistant labels a list item — short, action-first, specific, sentence case. Use the household context (vehicle names, people) to make it specific. Never copy the note verbatim, and leave out filler such as "I want to be reminded". Bills start with "Pay". For example, "auto load is the 10th of each month, remind me a week before" in a household with one vehicle named Highlander becomes a bill titled "Pay Highlander auto loan", bill_frequency monthly, date the next 10th, remind_days_before 7, category Loan, vehicle_id the Highlander's id.

Dates: resolve relative dates against today's date from the context, always to the next future occurrence, formatted YYYY-MM-DD; time as 24-hour HH:MM. If they ask to be reminded some time before, set remind_days_before in days; otherwise 0. Use "" for unknown strings, 0 for unknown numbers, [] for empty lists. Only use ids that appear in the context.`;
function aiContext() {
  const t = today();
  return JSON.stringify({
    today: t, weekday: fmtDate(t, { weekday: 'long' }),
    people: state.members.map(m => ({ id: m.id, name: m.name, role: m.role || 'Parent' })),
    vehicles: state.vehicles.map(v => ({ id: v.id, name: v.name, year: v.year, make: v.make, model: v.model })),
    scheduled_tasks: state.tasks.map(x => ({ id: x.id, title: x.title, repeat: x.once ? 'one-time' : freqLabel(x.freqDays) })),
    bills: activeBills().map(b => ({ id: b.id, name: b.name, due: b.nextDue })),
    recipes: state.recipes.map(r => r.name),
  });
}
async function aiInterpret(text) {
  const client = await getAIClient(); if (!client) throw new Error('no-key');
  const key = aiModelKey(), model = AI_MODELS[key];
  const base = { model: model.id, max_tokens: 4000, system: AI_SYSTEM, messages: [{ role: 'user', content: `Household context:\n${aiContext()}\n\nNote:\n${text}` }] };
  // Opus: low effort + server-side refusal fallback. Haiku 4.5 takes neither, so it uses the plain endpoint.
  const res = key === 'opus'
    ? await client.beta.messages.create({ ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', output_config: { effort: 'low', format: { type: 'json_schema', schema: AI_SCHEMA } } })
    : await client.messages.create({ ...base, output_config: { format: { type: 'json_schema', schema: AI_SCHEMA } } });
  const u = aiUsage(); u.notes += 1; u.cost += ((res.usage?.input_tokens || 0) * model.inPrice + (res.usage?.output_tokens || 0) * model.outPrice) / 1e6;
  if (res.stop_reason === 'refusal') throw new Error('refusal');
  const out = JSON.parse(res.content.filter(b => b.type === 'text').map(b => b.text).join(''));
  return (out.actions || []).filter(a => AI_TYPES.includes(a.type));
}
function applyAIAction(a, raw) {
  const okDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : '';
  if (a.type === 'log_task_done') { const task = find(state.tasks, a.match_id); if (task) return { cat: task.area === 'auto' ? 'auto' : 'task', p: { raw, title: task.title }, ...logTaskDone(task) }; }
  if (a.type === 'pay_bill') { const b = find(state.bills, a.match_id); if (b) return { cat: 'bill', p: { raw, title: b.name }, ...logBillPaid(b) }; }
  const cat = { grocery: 'grocery', todo: 'todo', house_task: 'task', vehicle_task: 'auto', event: 'event', bill: 'bill', meal: 'meal', purchase: 'purchase', recipe: 'recipe', estate_note: 'estate' }[a.type] || 'todo';
  const p = { raw, ai: true, title: (a.title || raw).trim(), items: a.items?.length ? a.items : null, date: okDate(a.date), time: /^\d{2}:\d{2}$/.test(a.time || '') ? a.time : '',
    endDate: okDate(a.end_date), amount: a.amount || '', freqDays: Math.max(0, a.repeat_days || 0), billFreq: a.bill_frequency, remindDays: Math.max(0, a.remind_days_before || 0),
    vehicleId: state.vehicles.some(v => v.id === a.vehicle_id) ? a.vehicle_id : '', memberIds: (a.member_ids || []).filter(id => member(id)),
    zone: a.zone, category: a.category, notes: a.notes };
  if (cat === 'estate') p.raw = [p.title, p.notes].filter(Boolean).join(' — ');
  return { cat, p, ...fileCapture(p, cat) };
}
function aiErrorMessage(e) {
  if (Anthropic && e instanceof Anthropic.AuthenticationError) return 'AI key was rejected — filed with quick rules. Check it under More → Family.';
  if (Anthropic && e instanceof Anthropic.PermissionDeniedError) return 'That AI key lacks permission — filed with quick rules.';
  if (Anthropic && e instanceof Anthropic.RateLimitError) return 'AI is busy right now — filed with quick rules.';
  if (Anthropic && e instanceof Anthropic.BadRequestError && /credit balance/i.test(e.message)) return 'AI credits used up — filed with quick rules. Top up at console.anthropic.com.';
  if (Anthropic && e instanceof Anthropic.BadRequestError) return `AI request problem (${e.message.slice(0, 80)}) — filed with quick rules.`;
  if (Anthropic && e instanceof Anthropic.APIError) return `AI unavailable (${e.status || 'network'}) — filed with quick rules.`;
  return 'AI unavailable — filed with quick rules.';
}
function pushReceipt(r) { ui.receipts.unshift({ id: uid(), ...r }); ui.receipts = ui.receipts.slice(0, 3); }
async function captureText(text) {
  if (getAIKey() && overAICap() && !ui.capNoticeShown) { ui.capNoticeShown = true; toast('This month’s AI cap is reached — using quick rules'); }
  if (getAIKey() && !overAICap() && navigator.onLine !== false) {
    const pending = { id: uid(), pending: true, summary: text, cat: 'note' };
    ui.receipts.unshift(pending); renderReceipts();
    try {
      const acts = await aiInterpret(text);
      ui.receipts = ui.receipts.filter(r => r !== pending);
      if (!acts.length) throw new Error('empty');
      acts.reverse().forEach(a => pushReceipt(applyAIAction(a, text)));
      navigator.vibrate?.(12); commit(); return;
    } catch (e) {
      ui.receipts = ui.receipts.filter(r => r !== pending);
      console.warn('AI filing failed', e);
      toast(aiErrorMessage(e));
    }
  }
  const p = parseCapture(text);
  const res = tryLogDone(text) || fileCapture(p, p.cat);
  pushReceipt({ p, cat: p.cat, ...res });
  navigator.vibrate?.(12);
  commit();
}
function renderReceipts() {
  $('#receipts').innerHTML = ui.receipts.map(r => r.pending ? `<div class="receipt pending"><div class="receipt-main"><span class="spinner"></span><span class="grow">Higgins is filing “${esc(r.summary)}”…</span></div></div>` : `<div class="receipt" style="border-left-color:${{ y: 'var(--yellow)', r: 'var(--red)', b: 'var(--blue)', ink: 'var(--ink)' }[CAT_SHAPE[r.cat].split(' ')[1]]}">
    <div class="receipt-main"><span class="shape ${CAT_SHAPE[r.cat]}"></span><span class="grow"><b>${esc(r.summary)}</b> → ${esc(r.where || CAT_SHORT[r.cat])}</span>
      <span class="receipt-actions"><button class="link" data-act="undoReceipt" data-id="${r.id}">Undo</button><button class="link" data-act="moveReceipt" data-id="${r.id}">Move</button>
      <button class="link" data-act="editReceipt" data-id="${r.id}">Edit</button><button class="iconbtn" data-act="dismissReceipt" data-id="${r.id}" title="Dismiss">✕</button></span></div>
    ${r.moving ? `<div class="movechips">${Object.entries(CAT_SHORT).filter(([k]) => k !== r.cat).map(([k, v]) => `<button class="chip" data-act="moveTo" data-id="${r.id}" data-cat="${k}">${v}</button>`).join('')}</div>` : ''}
  </div>`).join('');
}

let recognizer = null;
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const input = $('#captureInput');
  const fallback = () => { input.focus(); toast('Tap the 🎤 on your keyboard to dictate'); };
  if (!SR) return fallback();
  if (recognizer) { recognizer.stop(); return; }
  const rec = recognizer = new SR(); rec.lang = navigator.language || 'en-US'; rec.interimResults = true; rec.continuous = false;
  const btns = [$('#micBtn'), $('.fab')].filter(Boolean);
  btns.forEach(b => b.classList.add('listening'));
  input.placeholder = 'Listening…';
  let finalText = '', failed = false;
  rec.onresult = e => { const r = [...e.results].map(x => x[0].transcript).join(' '); input.value = r; if (e.results[e.results.length - 1].isFinal) finalText = r; };
  rec.onerror = e => { failed = true; if (e.error === 'not-allowed' || e.error === 'service-not-allowed') fallback(); else if (e.error !== 'aborted') toast('Didn’t catch that — try again'); };
  rec.onend = () => {
    recognizer = null; [$('#micBtn'), $('.fab')].filter(Boolean).forEach(b => b.classList.remove('listening'));
    input.placeholder = placeholder();
    if (finalText.trim()) { input.value = ''; captureText(finalText); } else if (!failed) input.value = '';
  };
  try { rec.start(); } catch { recognizer = null; fallback(); }
}
const placeholder = () => matchMedia('(max-width: 860px)').matches ? 'Tell Higgins anything…' : 'Tell Higgins anything — “out of milk and eggs”, “dentist Tuesday 3pm”, “car insurance $140 on the 15th”';
function initCapture() {
  const input = $('#captureInput');
  $('#micBtn').innerHTML = icon('mic');
  input.placeholder = placeholder();
  $('#captureForm').onsubmit = e => { e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ''; input.blur(); captureText(v); };
  $('#micBtn').onclick = startVoice;
}

/* ================= Modal & form builder ================= */
const modal = () => $('#modal');
function showModal(html) { const m = modal(); m.innerHTML = `<div class="modal">${html}</div>`; if (!m.open) m.showModal(); if (matchMedia('(pointer: fine)').matches) m.querySelector('input,textarea,select:not([data-refile])')?.focus(); }
function closeModal() { const m = modal(); if (m.open) m.close(); }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); }

function fieldHTML(f, val) {
  const cls = `field ${f.half ? 'half' : ''}`;
  const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
  const opts = (f.options || []).map(o => Array.isArray(o) ? o : [o, o]);
  switch (f.type) {
    case 'textarea': return `<label class="${cls}"><span>${esc(f.label)}</span><textarea name="${f.key}" rows="${f.rows || 4}" placeholder="${esc(f.placeholder || '')}">${esc(val ?? '')}</textarea>${hint}</label>`;
    case 'select': return `<label class="${cls}"><span>${esc(f.label)}</span><select name="${f.key}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${hint}</label>`;
    case 'checkbox': return `<label class="${cls} inline"><input type="checkbox" name="${f.key}" ${val ? 'checked' : ''}><span>${esc(f.label)}</span></label>`;
    case 'members': return `<div class="${cls}"><span>${esc(f.label)}</span><div class="membercheck">${state.members.map(m => `<label><input type="checkbox" name="${f.key}" value="${m.id}" ${(val || []).includes(m.id) ? 'checked' : ''}><span class="dot" style="background:${m.color}"></span>${esc(m.name)}</label>`).join('')}</div></div>`;
    default: return `<label class="${cls}"><span>${esc(f.label)}</span><input type="${f.type || 'text'}" name="${f.key}" value="${esc(val ?? '')}" placeholder="${esc(f.placeholder || '')}" ${f.required ? 'required' : ''} ${f.step ? `step="${f.step}"` : ''} ${f.list ? `list="dl-${f.key}"` : ''}>${f.list ? `<datalist id="dl-${f.key}">${f.list.map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}${hint}</label>`;
  }
}
function readField(form, f) {
  if (f.type === 'checkbox') return form.elements[f.key].checked;
  if (f.type === 'members') return [...form.querySelectorAll(`input[name="${f.key}"]:checked`)].map(i => i.value);
  const v = form.elements[f.key].value;
  if (f.type === 'number') return v === '' ? '' : Number(v);
  return v.trim();
}
function openForm({ title, fields, values = {}, onSave, onDelete, saveLabel = 'Save', prefix = '' }) {
  showModal(`<h2>${esc(title)}</h2>${prefix}<form id="mform"><div class="fields">${fields.map(f => fieldHTML(f, values[f.key])).join('')}</div>
    <div class="modal-actions">${onDelete ? `<button type="button" class="btn ghost danger" data-mdel>${icon('trash')}Delete</button>` : ''}<span class="grow"></span>
    <button type="button" class="btn ghost" data-mclose>Cancel</button><button class="btn primary">${esc(saveLabel)}</button></div></form>`);
  const form = $('#mform');
  form.onsubmit = e => {
    e.preventDefault();
    const out = {}; fields.forEach(f => out[f.key] = readField(form, f));
    if (onSave(out) === false) return;
    closeModal(); commit();
  };
  form.querySelector('[data-mclose]').onclick = closeModal;
  const del = form.querySelector('[data-mdel]');
  if (del) del.onclick = () => { if (confirm('Delete this? This can’t be undone.')) { onDelete(); closeModal(); commit(); } };
}
function commit() { checkMilestones(); save(); render(); }

/* ================= Editors ================= */
function freqFields(days) {
  if (!days) return { freqN: '', freqUnit: 'once' };
  const unit = days % 365 === 0 ? 'years' : days % 30 === 0 ? 'months' : days % 7 === 0 ? 'weeks' : 'days';
  const n = days / { days: 1, weeks: 7, months: 30, years: 365 }[unit];
  return { freqN: n, freqUnit: unit };
}
const toDays = (n, unit) => Math.max(1, Math.round(Number(n || 1) * { days: 1, weeks: 7, months: 30, years: 365 }[unit]));

function editTask(task, preset = {}, prefix = '', after) {
  const v = task || { area: 'home', zone: 'General', freqDays: 30, effort: 1, nextDue: today(), ...preset };
  const isAuto = v.area === 'auto';
  const fields = [
    { key: 'title', label: 'Task', required: true },
    isAuto ? { key: 'vehicleId', label: 'Vehicle', type: 'select', half: true, options: state.vehicles.map(c => [c.id, c.name]) }
      : { key: 'zone', label: 'Zone', half: true, list: ZONES },
    { key: 'assignee', label: 'Usually done by', type: 'select', half: true, options: memberOptions('Anyone', true) },
    { key: 'freqN', label: 'Repeat every', type: 'number', half: true, step: 'any' },
    { key: 'freqUnit', label: ' ', type: 'select', half: true, options: [['once', 'Doesn’t repeat'], 'days', 'weeks', 'months', 'years'] },
    { key: 'nextDue', label: 'Due', type: 'date', half: true },
    { key: 'effort', label: 'Effort', type: 'select', half: true, options: [[1, 'Quick — 1 pt'], [2, 'Moderate — 2 pts'], [3, 'Big job — 3 pts']] },
    { key: 'notes', label: 'Notes, how-to, part numbers', type: 'textarea', rows: 3 },
  ];
  if (isAuto && !state.vehicles.length) { toast('Add a vehicle first'); location.hash = '#/auto'; return; }
  openForm({
    title: task ? (task.once ? 'Edit to-do' : 'Edit task') : isAuto ? 'New vehicle task' : 'New task', prefix, fields,
    values: { ...v, vehicleId: v.vehicleId || state.vehicles[0]?.id, ...freqFields(v.freqDays) },
    onSave: o => {
      const t = task || { id: uid(), area: v.area, lastDone: '' };
      const once = o.freqUnit === 'once';
      Object.assign(t, { title: o.title, assignee: o.assignee, once, freqDays: once ? 0 : toDays(o.freqN, o.freqUnit), nextDue: o.nextDue || (once ? '' : today()), effort: Number(o.effort), notes: o.notes });
      if (isAuto) { t.vehicleId = o.vehicleId; t.zone = 'Vehicles'; } else t.zone = o.zone || 'Whole house';
      if (!task) state.tasks.push(t);
      after?.(); if (!task) toast('Task added');
    },
    onDelete: task ? () => { state.tasks = state.tasks.filter(x => x !== task); } : null,
  });
}
function completeTask(id) {
  const t = state.tasks.find(x => x.id === id); if (!t) return;
  const who = state.activeMember;
  state.log.unshift({ id: uid(), taskId: t.id, title: t.title, memberId: who, date: today(), points: t.effort || 1 });
  if (t.once) { state.tasks = state.tasks.filter(x => x !== t); toast(`Done · +${t.effort || 1} for ${memberName(who) || 'the house'}`); recordHealth(); commit(); return; }
  t.lastDone = today(); t.nextDue = addDays(today(), t.freqDays);
  toast(`Done — next ${fmtDate(t.nextDue, { month: 'short', day: 'numeric' })} · +${t.effort || 1} for ${memberName(who) || 'the house'}`);
  recordHealth(); commit();
}
function snoozeTask(id, days = 3) { const t = state.tasks.find(x => x.id === id); t.nextDue = addDays(!t.nextDue || t.nextDue < today() ? today() : t.nextDue, days); toast(`Moved to ${fmtDate(t.nextDue)}`); commit(); }

function editBill(bill, preset = {}, prefix = '', after) {
  const v = bill ? { remindDays: 3, ...bill } : { category: 'Insurance', freq: 'monthly', nextDue: today(), autopay: false, remindDays: 3, ...preset };
  openForm({
    title: bill ? 'Edit bill' : 'New bill or payment', prefix,
    fields: [
      { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Auto insurance — State Farm' },
      { key: 'category', label: 'Category', type: 'select', half: true, options: ['Insurance', 'Loan', 'Mortgage / rent', 'Utility', 'Subscription', 'Tax', 'Tuition / childcare', 'Other'] },
      { key: 'amount', label: 'Amount', type: 'number', half: true, step: '0.01' },
      { key: 'freq', label: 'How often', type: 'select', half: true, options: [['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Every 6 months'], ['annual', 'Yearly'], ['once', 'One time']] },
      { key: 'nextDue', label: 'Next due', type: 'date', half: true },
      { key: 'autopay', label: 'On autopay', type: 'checkbox', half: true },
      { key: 'owner', label: 'Who handles it', type: 'select', half: true, options: memberOptions('Shared', true) },
      { key: 'account', label: 'Account / policy (last 4 only)', half: true, placeholder: '…1234' },
      { key: 'balance', label: 'Loan balance (optional)', type: 'number', half: true, step: '0.01' },
      { key: 'vehicleId', label: 'For a vehicle?', type: 'select', half: true, options: [['', '—'], ...state.vehicles.map(v => [v.id, v.name])] },
      { key: 'remindDays', label: 'Remind me (days before)', type: 'number', half: true },
      { key: 'notes', label: 'Notes', type: 'textarea', rows: 2, placeholder: 'Pay via, renewal date, agent phone…' },
    ],
    values: v,
    onSave: o => { const b = bill || { id: uid(), paid: [] }; Object.assign(b, o); if (!bill) state.bills.push(b); after?.(); if (!bill) toast('Bill added'); },
    onDelete: bill ? () => { state.bills = state.bills.filter(x => x !== bill); } : null,
  });
}
const FREQ_MONTHS = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 };
function payBill(id) {
  const b = state.bills.find(x => x.id === id);
  b.paid = b.paid || []; b.paid.unshift({ date: today(), amount: b.amount, due: b.nextDue });
  if (b.freq === 'once') { b.done = true; toast('Marked paid'); }
  else { b.nextDue = addMonths(b.nextDue, FREQ_MONTHS[b.freq]); toast(`Paid — next due ${fmtDate(b.nextDue)}`); }
  commit();
}

function editEvent(ev, preset = {}, prefix = '', after) {
  const v = ev || { type: 'Appointment', date: today(), members: [], ...preset };
  openForm({
    title: ev ? 'Edit event' : 'New event', prefix,
    fields: [
      { key: 'title', label: 'What', required: true },
      { key: 'type', label: 'Type', type: 'select', half: true, options: ['Appointment', 'Activity', 'Travel', 'School', 'Social', 'Reminder'] },
      { key: 'location', label: 'Where', half: true },
      { key: 'date', label: 'Date', type: 'date', half: true },
      { key: 'time', label: 'Time', type: 'time', half: true },
      { key: 'endDate', label: 'Ends (multi-day, e.g. trips)', type: 'date', half: true },
      { key: 'repeat', label: 'Repeats', type: 'select', half: true, options: [['', 'Doesn’t repeat'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']] },
      { key: 'members', label: 'Who', type: 'members' },
      { key: 'notes', label: 'Notes (confirmation #, what to bring…)', type: 'textarea', rows: 2 },
    ],
    values: v,
    onSave: o => { if (o.endDate && o.endDate < o.date) o.endDate = ''; const e = ev || { id: uid() }; Object.assign(e, o); if (!ev) state.events.push(e); after?.(); if (!ev) toast(`Added to ${fmtDate(o.date)}`); },
    onDelete: ev ? () => { state.events = state.events.filter(x => x !== ev); } : null,
  });
}
function editPurchase(p, preset = {}, prefix = '', after) {
  const v = p || { status: 'needed', priority: 'Normal', category: 'Household', ...preset };
  openForm({
    title: p ? 'Edit item' : 'Something to buy', prefix,
    fields: [
      { key: 'item', label: 'Item', required: true },
      { key: 'forMember', label: 'For', type: 'select', half: true, options: memberOptions('The house') },
      { key: 'category', label: 'Category', type: 'select', half: true, options: ['Household', 'Clothing', 'Kids', 'School', 'Health', 'Tools & repair', 'Gifts', 'Electronics', 'Other'] },
      { key: 'priority', label: 'Priority', type: 'select', half: true, options: ['Soon', 'Normal', 'Someday'] },
      { key: 'price', label: 'Est. price', type: 'number', half: true, step: '0.01' },
      { key: 'store', label: 'Store or link', placeholder: 'Costco, or paste a URL' },
      { key: 'size', label: 'Size / model / details', half: true },
      { key: 'status', label: 'Status', type: 'select', half: true, options: [['needed', 'Needed'], ['ordered', 'Ordered'], ['received', 'Received']] },
    ],
    values: v,
    onSave: o => { const x = p || { id: uid(), added: today() }; Object.assign(x, o); if (!p) state.purchases.push(x); after?.(); if (!p) toast('Added to Things to buy'); },
    onDelete: p ? () => { state.purchases = state.purchases.filter(x => x !== p); } : null,
  });
}
function editRecipe(r, preset = {}, prefix = '', after) {
  const v = r ? { ...r, ingredients: r.ingredients.join('\n'), tags: r.tags.join(', ') } : { favorite: false, serves: 4, ...preset };
  openForm({
    title: r ? 'Edit recipe' : 'New family recipe', prefix,
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'favorite', label: 'Family favorite', type: 'checkbox', half: true },
      { key: 'tags', label: 'Labels', half: true, placeholder: 'Weeknight, Grandma’s, Holiday' },
      { key: 'serves', label: 'Serves', type: 'number', half: true },
      { key: 'time', label: 'Total time', half: true, placeholder: '45 min' },
      { key: 'ingredients', label: 'Ingredients (one per line)', type: 'textarea', rows: 6 },
      { key: 'steps', label: 'Steps', type: 'textarea', rows: 5 },
      { key: 'notes', label: 'Notes & family lore', type: 'textarea', rows: 2, placeholder: 'Who taught us, tweaks, what to serve it with' },
    ],
    values: v,
    onSave: o => {
      const x = r || { id: uid(), timesMade: 0, lastMade: '', color: MEMBER_COLORS[state.recipes.length % MEMBER_COLORS.length] };
      Object.assign(x, o, { ingredients: o.ingredients.split('\n').map(s => s.trim()).filter(Boolean), tags: o.tags.split(',').map(s => s.trim()).filter(Boolean) });
      if (!r) state.recipes.push(x); after?.(); if (!r) toast('Recipe saved');
    },
    onDelete: r ? () => { state.recipes = state.recipes.filter(x => x !== r); } : null,
  });
}
function editMeal(date, preset = {}, prefix = '', after) {
  const cur = state.mealPlan[date] || preset;
  openForm({
    title: `Dinner · ${fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}`, prefix,
    fields: [
      { key: 'date', label: 'Night', type: 'date', half: true },
      { key: 'recipeId', label: 'From the recipe book', type: 'select', half: true, options: [['', '— none —'], ...[...state.recipes].sort((a, b) => (b.favorite - a.favorite) || a.name.localeCompare(b.name)).map(r => [r.id, (r.favorite ? '★ ' : '') + r.name])] },
      { key: 'text', label: 'Or just write it', placeholder: 'Leftovers, takeout, pasta…' },
      { key: 'cook', label: 'Who’s cooking', type: 'select', half: true, options: memberOptions('—', true) },
    ],
    values: { date, ...cur },
    onSave: o => { if (o.date !== date) delete state.mealPlan[date]; if (!o.recipeId && !o.text) delete state.mealPlan[o.date]; else state.mealPlan[o.date] = { recipeId: o.recipeId, text: o.text, cook: o.cook }; after?.(); },
    onDelete: state.mealPlan[date] ? () => { delete state.mealPlan[date]; } : null,
  });
}
function editVehicle(c) {
  openForm({
    title: c ? 'Edit vehicle' : 'Add vehicle',
    fields: [
      { key: 'name', label: 'Nickname', required: true, placeholder: 'The Subaru' },
      { key: 'year', label: 'Year', half: true }, { key: 'make', label: 'Make', half: true }, { key: 'model', label: 'Model', half: true },
      { key: 'mileage', label: 'Current mileage', type: 'number', half: true },
      { key: 'plate', label: 'Plate', half: true }, { key: 'driver', label: 'Main driver', type: 'select', half: true, options: memberOptions('Shared') },
      { key: 'notes', label: 'Notes (tire size, oil type, VIN last 6…)', type: 'textarea', rows: 2 },
    ],
    values: c || {},
    onSave: o => {
      if (c) Object.assign(c, o);
      else {
        const car = { id: uid(), ...o }; state.vehicles.push(car);
        SEED_AUTO.forEach(([title, freqDays, effort], i) => state.tasks.push({ id: uid(), title, area: 'auto', zone: 'Vehicles', vehicleId: car.id, freqDays, effort, assignee: '', notes: '', nextDue: addDays(today(), 7 + i * 5), lastDone: '' }));
        toast('Vehicle added with a starter maintenance schedule');
      }
    },
    onDelete: c ? () => { state.vehicles = state.vehicles.filter(x => x !== c); state.tasks = state.tasks.filter(t => t.vehicleId !== c.id); } : null,
  });
}

/* ================= Grocery helpers ================= */
const AISLES = [
  ['Household', /(paper towel|toilet paper|detergent|dish soap|soap|trash bag|foil|plastic wrap|sponge|cleaner|batteries|diapers|wipes|tissues)/],
  ['Frozen', /(frozen|ice cream)/],
  ['Meat & seafood', /(chicken|beef|pork|turkey|bacon|sausage|salmon|shrimp|fish|steak|lamb|ham)/],
  ['Dairy & eggs', /(milk|cheese|cheddar|parmesan|mozzarella|butter|yogurt|sour cream|cream|egg)/],
  ['Bakery', /(bread|buns?|rolls?|tortilla|bagel|pita|baguette|muffin)/],
  ['Produce', /(apple|banana|lettuce|spinach|kale|onion|garlic|tomato|potato|carrot|celery|bell pepper|lemon|lime|avocado|berr|fruit|herb|cilantro|parsley|basil|thyme|rosemary|ginger|cucumber|zucchini|broccoli|mushroom|squash|grape|orange|pear|peach|salad|scallion)/],
  ['Pantry', /(rice|pasta|flour|sugar|oil|vinegar|salt|spice|seasoning|cumin|paprika|sauce|stock|broth|beans|canned|cereal|oats|honey|syrup|coffee|tea|nuts|peanut|chips|crackers|salsa|snack|bar)/],
];
const AISLE_ORDER = ['Produce', 'Bakery', 'Meat & seafood', 'Dairy & eggs', 'Pantry', 'Frozen', 'Household', 'Other'];
const guessAisle = item => (AISLES.find(([, re]) => re.test(item.toLowerCase())) || ['Other'])[0];
function addGrocery(item, recipeId = '') {
  const clean = item.trim().replace(/^./, c => c.toUpperCase()); if (!clean) return;
  if (state.grocery.some(g => !g.done && g.item.toLowerCase() === clean.toLowerCase())) return;
  const g = { id: uid(), item: clean, aisle: guessAisle(clean), done: false, recipeId, addedBy: state.activeMember };
  state.grocery.push(g); return g;
}

/* ================= Views ================= */
const ROUTES = [
  ['home', 'Home', 'home'], ['upkeep', 'House', 'upkeep'], ['calendar', 'Calendar', 'calendar'], ['groceries', 'Groceries', 'cart'],
  ['meals', 'Meals', 'meals'], ['money', 'Bills', 'money'], ['auto', 'Vehicles', 'auto'], ['shopping', 'To buy', 'shopping'],
  ['planning', 'Family plan', 'planning'], ['family', 'Family', 'family'],
];
const TABS = ['home', 'upkeep', null, 'calendar'];
const MORE = ['groceries', 'meals', 'money', 'auto', 'shopping', 'planning', 'family'];
const ui = { receipts: [], zone: 'All', recipeTag: 'All', recipeQ: '', mealWeek: null, calMonth: null, openStep: null, shopFor: 'All' };

function head(eyebrow, title, actions = '') {
  return `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><span class="grow"></span>${actions}</div>`;
}
function taskRow(t, opts = {}) {
  const car = t.vehicleId ? state.vehicles.find(c => c.id === t.vehicleId) : null;
  const tone = dueTone(t.nextDue);
  return `<div class="row">
    <button class="check ${car ? 'auto' : ''}" data-act="doneTask" data-id="${t.id}" title="Mark done">${icon('check')}</button>
    <div class="body"><div class="title">${esc(t.title)}</div>
      <div class="meta">${car ? esc(car.name) : esc(t.zone)} · ${freqLabel(t.freqDays)} ${t.lastDone ? `· last ${fmtDate(t.lastDone, { month: 'short', day: 'numeric' })}` : ''}</div></div>
    ${t.assignee ? memberDot(t.assignee) : ''}
    ${t.nextDue ? `<span class="pill ${tone}">${rel(t.nextDue)}</span>` : ''}
    ${opts.noSnooze ? '' : `<button class="iconbtn" data-act="snooze" data-id="${t.id}" title="Push 3 days">${icon('snooze')}</button>`}
    <button class="iconbtn" data-act="editTask" data-id="${t.id}" title="Edit">${icon('edit')}</button>
  </div>`;
}
function ring(pct, color = 'var(--blue)', size = 92) {
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="8"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * pct / 100} ${c}"/></svg><div class="val" style="font-size:${Math.round(size * .24)}px">${pct}</div></div>`;
}
function eventsOn(d) {
  return state.events.filter(e => {
    const end = e.endDate || e.date;
    if (d >= e.date && d <= end) return true;
    if (!e.repeat || d < e.date) return false;
    const a = parseISO(e.date), b = parseISO(d);
    if (e.repeat === 'weekly') return diffDays(d, e.date) % 7 === 0;
    if (e.repeat === 'monthly') return a.getDate() === b.getDate();
    if (e.repeat === 'yearly') return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
    return false;
  }).sort((x, y) => (x.time || '99').localeCompare(y.time || '99'));
}
const activeBills = () => state.bills.filter(b => !b.done);
function groceryCard() {
  const groc = state.grocery;
  const byAisle = AISLE_ORDER.map(a => [a, groc.filter(g => g.aisle === a && !g.done)]).filter(([, l]) => l.length);
  const doneItems = groc.filter(g => g.done);
  return `<div class="card" style="align-self:start"><div class="card-head"><h2>Grocery list</h2><span class="grow"></span><span class="pill">${groc.length - doneItems.length}</span></div>
          <form data-form="grocery" style="display:flex;gap:6px;margin-bottom:12px"><input name="item" class="search" style="min-width:0;flex:1" placeholder="Add item…"><button class="btn">${icon('plus')}</button></form>
          ${byAisle.map(([a, l]) => `<div class="aisle"><div class="section-title">${a}</div>${l.map(g => `<div class="row"><button class="check grocery" data-act="toggleGroc" data-id="${g.id}">${icon('check')}</button><div class="body"><div>${esc(g.item)}</div>${g.recipeId ? `<div class="meta">${esc(state.recipes.find(r => r.id === g.recipeId)?.name || '')}</div>` : ''}</div><button class="iconbtn" data-act="delGroc" data-id="${g.id}">${icon('trash')}</button></div>`).join('')}</div>`).join('') || '<div class="muted small">List is empty.</div>'}
          ${doneItems.length ? `<div class="section-title" style="display:flex">In the cart · ${doneItems.length}<span class="grow"></span><button class="btn sm ghost" data-act="clearGroc">Clear</button></div>${doneItems.map(g => `<div class="row done"><button class="check grocery on" data-act="toggleGroc" data-id="${g.id}">${icon('check')}</button><div class="body"><div class="title" style="font-weight:400">${esc(g.item)}</div></div></div>`).join('')}` : ''}
          <div style="margin-top:12px"><button class="btn sm ghost" data-act="copyGroc">Copy list as text</button></div>
        </div>`;
}

const views = {
  home() {
    const t = today();
    const hour = new Date().getHours(); const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const due = state.tasks.filter(isDue).sort(byDue);
    const evToday = eventsOn(t);
    const billsSoon = activeBills().filter(b => diffDays(b.nextDue, t) <= (b.remindDays ?? 3)).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
    const todos = state.tasks.filter(x => x.once && !x.nextDue);
    const meal = state.mealPlan[t]; const mealRecipe = meal?.recipeId && state.recipes.find(r => r.id === meal.recipeId);
    const weekEnd = addDays(t, 6);
    let evWeek = 0; for (let i = 0; i < 7; i++) evWeek += eventsOn(addDays(t, i)).length;
    const houseWeek = state.tasks.filter(x => x.nextDue && x.nextDue <= weekEnd && x.area === 'home').length;
    const bills14 = activeBills().filter(b => b.nextDue <= addDays(t, 14));
    const billTotal = bills14.reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const groceryLeft = state.grocery.filter(g => !g.done).length;
    const needed = state.purchases.filter(p => p.status === 'needed').length;
    const coming = [];
    for (let i = 1; i < 8; i++) { const d = addDays(t, i); eventsOn(d).forEach(e => coming.push({ d, kind: 'event', e })); activeBills().filter(b => b.nextDue === d && !billsSoon.includes(b)).forEach(b => coming.push({ d, kind: 'bill', b })); }
    const eventRow = e => `<div class="row"><span class="shape ci b" style="margin:0 4px"></span><div class="body" data-act="editEvent" data-id="${e.id}" style="cursor:pointer"><div class="title">${esc(e.title)}</div><div class="meta">${e.time ? fmtTime(e.time) : 'All day'}${e.location ? ' · ' + esc(e.location) : ''}${(e.members || []).length ? ' · ' + e.members.map(memberName).join(', ') : ''}</div></div></div>`;
    const billRow = b => `<div class="row"><button class="shape tr y" data-act="payBill" data-id="${b.id}" title="Mark paid"></button><div class="body" data-act="editBill" data-id="${b.id}" style="cursor:pointer"><div class="title">${esc(b.name)}${b.amount ? ' · ' + money(b.amount) : ''}</div><div class="meta">${rel(b.nextDue)}${b.autopay ? ' · autopay' : ' · tap ▲ when paid'}</div></div></div>`;
    const todayCount = evToday.length + due.length + billsSoon.length;
    const tile = (href, cls, n, label, sub = '', txt = false) => `<a class="tile ${cls}" href="#/${href}"><div class="n ${txt ? 'txt' : ''}">${n}</div><div><div class="l">${label}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div></a>`;
    return `<div class="hello">
        <svg class="deco" viewBox="0 0 120 120" aria-hidden="true"><circle cx="120" cy="0" r="78" fill="var(--red)"/><rect x="18" y="66" width="34" height="34" rx="4" fill="var(--blue)"/><circle cx="92" cy="96" r="12" fill="var(--yellow)"/></svg>
        <div class="eyebrow">${fmtDate(t, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1>${greet}${state.settings.familyName ? ',<br>' + esc(state.settings.familyName) : ''}.</h1></div>
      <div class="tiles">
        ${tile('groceries', 'y', groceryLeft, 'Groceries')}
        ${tile('upkeep', 'r', houseWeek, 'House this week', houseHealth() < 100 ? `Health ${houseHealth()}` : '')}
        ${tile('calendar', 'b', evWeek, 'Events this week')}
        ${tile('money', 'k', bills14.length, 'Bills · 14 days', billTotal ? money(billTotal) : '')}
        ${tile('meals', 'w', meal ? esc(mealRecipe ? mealRecipe.name : meal.text) : 'Plan it →', 'Tonight’s dinner', '', true)}
        ${tile('shopping', 'w', needed, 'To buy')}
      </div>
      <div class="grid g3">
        <div class="card span2">
          <div class="card-head"><h2>TODAY${todayCount ? ` — ${todayCount}` : ''}</h2></div>
          <div class="rule">${evToday.map(eventRow).join('')}${due.map(x => taskRow(x)).join('')}${billsSoon.map(billRow).join('')}</div>
          ${todayCount ? '' : '<div class="empty"><h3>Nothing on the docket.</h3>Tell Higgins what’s on your mind — it’ll file it.</div>'}
          ${todos.length ? `<div class="section-title">To-dos · ${todos.length}</div><div class="rule">${todos.map(x => taskRow(x, { noSnooze: true })).join('')}</div>` : ''}
        </div>
        <div class="grid" style="align-content:start">
          <div class="card"><div class="card-head"><h2>COMING UP</h2></div>
            ${coming.length ? coming.slice(0, 8).map(c => c.kind === 'event'
              ? `<div class="row" data-act="editEvent" data-id="${c.e.id}" style="cursor:pointer"><span class="shape ci b"></span><div class="body"><div class="title">${esc(c.e.title)}</div><div class="meta">${fmtDate(c.d)}${c.e.time ? ' · ' + fmtTime(c.e.time) : ''}</div></div></div>`
              : `<div class="row" data-act="editBill" data-id="${c.b.id}" style="cursor:pointer"><span class="shape tr y"></span><div class="body"><div class="title">${esc(c.b.name)}</div><div class="meta">${fmtDate(c.d)}${c.b.amount ? ' · ' + money(c.b.amount) : ''}</div></div></div>`).join('')
              : '<div class="muted small">A clear week ahead.</div>'}</div>
          ${state.inbox.length ? `<div class="card"><div class="card-head"><h2>INBOX</h2><span class="pill mustard">${state.inbox.length}</span></div>
            ${state.inbox.map(i => `<div class="row"><div class="body"><div class="title" style="font-weight:400">${esc(i.text)}</div><div class="meta">${fmtDate(i.date)}</div></div><button class="btn sm" data-act="fileInbox" data-id="${i.id}">File</button><button class="iconbtn" data-act="delInbox" data-id="${i.id}">${icon('trash')}</button></div>`).join('')}</div>` : ''}
        </div>
      </div>`;
  },

  upkeep() {
    const home = state.tasks.filter(t => t.area === 'home');
    const zones = [...new Set([...ZONES, ...home.map(t => t.zone)])].filter(z => home.some(t => t.zone === z));
    const list = home.filter(t => ui.zone === 'All' || t.zone === ui.zone).sort(byDue);
    const t = today();
    const hh = houseHealth(), st = streak(), pts = weekPoints(), total = Object.values(pts).reduce((a, b) => a + b, 0), goal = state.settings.weeklyGoal || 30;
    const groups = [['To-dos', list.filter(x => !x.nextDue)], ['Overdue', list.filter(isOverdue)], ['Due today', list.filter(x => x.nextDue === t)], ['Next 14 days', list.filter(x => x.nextDue > t && x.nextDue <= addDays(t, 14))], ['Later', list.filter(x => x.nextDue > addDays(t, 14))]];
    const recent = state.log.filter(l => { const tk = state.tasks.find(x => x.id === l.taskId); return !tk || tk.area === 'home'; }).slice(0, 8);
    return head('Home upkeep', 'The house', `<button class="btn primary" data-act="newTask">${icon('plus')}New task</button>`) + `
      <div class="card strip">${ring(hh, hh >= 85 ? 'var(--blue)' : hh >= 65 ? 'var(--yellow)' : 'var(--red)', 76)}
        <div><div class="stat"><span class="lbl">House health</span></div><div style="margin-top:4px">${hh >= 85 ? 'In good order.' : hh >= 65 ? 'A few things slipping.' : 'Time for a reset day.'}</div><div class="small muted">${st ? `${st} day${st > 1 ? 's' : ''} steady at 85+` : 'Reach 85 to start a streak'}</div></div>
        <span class="grow"></span>
        <div class="contrib"><div class="small"><b>${total}</b> <span class="muted">/ ${goal} pts this week</span></div><div class="bar"><i style="width:${Math.min(100, total / goal * 100)}%;background:${total >= goal ? 'var(--green)' : 'var(--blue)'}"></i></div>
          ${adults().map(m => `<div class="who"><span>${esc(m.name)}</span><div class="bar"><i style="width:${total ? (pts[m.id] || 0) / total * 100 : 0}%;background:${m.color}"></i></div><span class="muted small">${pts[m.id] || 0}</span></div>`).join('')}</div></div>
      <div class="zones">
        <button class="zone ${ui.zone === 'All' ? 'on' : ''}" data-act="zone" data-zone="All"><div class="zn">Whole home <span>${houseHealth()}</span></div><div class="bar"><i style="width:${houseHealth()}%"></i></div></button>
        ${zones.map(z => { const h = healthOf(home.filter(x => x.zone === z)); return `<button class="zone ${ui.zone === z ? 'on' : ''}" data-act="zone" data-zone="${esc(z)}"><div class="zn">${esc(z)} <span>${h}</span></div><div class="bar"><i style="width:${h}%;background:${h >= 85 ? 'var(--teal)' : h >= 65 ? 'var(--mustard)' : 'var(--rust)'}"></i></div></button>`; }).join('')}
      </div>
      <div class="grid g3">
        <div class="card span2">${groups.filter(([, l]) => l.length).map(([n, l]) => `<div class="section-title">${n} · ${l.length}</div>${l.map(x => taskRow(x)).join('')}`).join('') || '<div class="empty"><h3>No tasks here yet.</h3></div>'}</div>
        <div class="card" style="align-self:start"><div class="card-head"><h2>Recently done</h2></div>
          ${recent.length ? recent.map(l => `<div class="row"><div class="body"><div class="title" style="font-weight:400">${esc(l.title)}</div><div class="meta">${fmtDate(l.date)}</div></div>${memberDot(l.memberId)}<span class="small muted">+${l.points}</span></div>`).join('') : '<div class="muted small">Tick something off and it shows up here.</div>'}
          <div class="notice" style="margin-top:14px">Health scores drop gradually as tasks go past due, relative to how often they recur — a weekly vacuum 3 days late hurts more than a yearly gutter clean 3 days late.</div></div>
      </div>`;
  },

  auto() {
    return head('Vehicles', 'Cars & upkeep', `<button class="btn" data-act="newAutoTask">${icon('plus')}Task</button><button class="btn primary" data-act="newVehicle">${icon('plus')}Vehicle</button>`) +
      (state.vehicles.length ? `<div class="grid g2">${state.vehicles.map(c => {
        const tasks = state.tasks.filter(t => t.vehicleId === c.id).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
        const h = healthOf(tasks);
        return `<div class="card"><div class="card-head">${ring(h, h >= 85 ? 'var(--teal)' : h >= 65 ? 'var(--mustard)' : 'var(--rust)', 56)}<div><h2>${esc(c.name)}</h2><div class="muted small">${esc([c.year, c.make, c.model].filter(Boolean).join(' ')) || 'Add year, make & model'}${c.mileage ? ` · ${Number(c.mileage).toLocaleString()} mi` : ''}${c.driver ? ` · ${esc(memberName(c.driver))}` : ''}</div></div><span class="grow"></span>
          <button class="btn sm" data-act="mileage" data-id="${c.id}">Update miles</button><button class="iconbtn" data-act="editVehicle" data-id="${c.id}">${icon('edit')}</button></div>
          ${tasks.map(t => taskRow(t)).join('') || '<div class="muted small">No tasks.</div>'}
          ${(() => { const bl = activeBills().filter(b => b.vehicleId === c.id); return bl.length ? `<div class="section-title">Payments</div>${bl.map(b => `<div class="row" data-act="editBill" data-id="${b.id}" style="cursor:pointer"><span class="shape tr y"></span><div class="body"><div class="title">${esc(b.name)}</div><div class="meta">${b.amount ? money(b.amount) + ' · ' : ''}${billWhen(b)}</div></div><span class="pill ${dueTone(b.nextDue)}">${rel(b.nextDue)}</span></div>`).join('')}` : ''; })()}
          ${c.notes ? `<div class="notice" style="margin-top:12px">${esc(c.notes)}</div>` : ''}</div>`;
      }).join('')}</div>` : `<div class="card empty"><h3>No vehicles yet</h3>Add one and Higgins sets up a starter schedule (oil, tires, wipers, registration).</div>`) +
      `<div class="notice" style="margin-top:20px">Insurance and car loans live under <a href="#/money">Bills</a> so all payments are in one place. Tip: log mileage monthly — the next release can switch oil changes to "every 5,000 mi or 6 months, whichever first".</div>`;
  },

  money() {
    const bills = activeBills().sort((a, b) => a.nextDue.localeCompare(b.nextDue));
    const monthly = bills.reduce((a, b) => a + (Number(b.amount) || 0) / (FREQ_MONTHS[b.freq] || Infinity), 0);
    const monthEnd = iso(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
    const thisMonth = bills.filter(b => b.nextDue <= monthEnd).reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const debt = bills.reduce((a, b) => a + (Number(b.balance) || 0), 0);
    const cats = [...new Set(bills.map(b => b.category))];
    const quick = ['Mortgage', 'Home insurance', 'Auto insurance', 'Life insurance', 'Car loan', 'Property tax', 'Electric', 'Internet', 'Phone', 'Umbrella policy'].filter(q => !state.bills.some(b => b.name.toLowerCase().includes(q.toLowerCase())));
    return head('Money', 'Bills, insurance & loans', `<button class="btn primary" data-act="newBill">${icon('plus')}New bill</button>`) + `
      <div class="grid g3" style="margin-bottom:20px">
        <div class="card stat"><div><div class="lbl">Averaged per month</div><div class="num" style="margin-top:6px">${money(Math.round(monthly))}</div></div></div>
        <div class="card stat"><div><div class="lbl">Still due this month</div><div class="num" style="margin-top:6px">${money(thisMonth)}</div></div></div>
        <div class="card stat"><div><div class="lbl">Loan balances</div><div class="num" style="margin-top:6px">${debt ? money(debt) : '—'}</div></div></div>
      </div>
      ${quick.length ? `<div class="chips"><span class="small muted" style="align-self:center;margin-right:4px">Quick add:</span>${quick.map(q => `<button class="chip" data-act="quickBill" data-name="${esc(q)}">+ ${esc(q)}</button>`).join('')}</div>` : ''}
      <div class="card">${bills.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Bill</th><th>Category</th><th>Amount</th><th>How often</th><th>Next due</th><th></th></tr></thead><tbody>
        ${bills.map(b => `<tr><td class="click" data-act="editBill" data-id="${b.id}" style="cursor:pointer"><b>${esc(b.name)}</b>${b.account ? ` <span class="muted small">${esc(b.account)}</span>` : ''}${b.owner ? ' ' + memberDot(b.owner) : ''}${b.balance ? `<div class="small muted">${money(b.balance)} remaining</div>` : ''}</td>
          <td>${esc(b.category)}</td><td>${money(b.amount)}</td><td>${{ monthly: 'Monthly', quarterly: 'Quarterly', semiannual: '6 months', annual: 'Yearly', once: 'Once' }[b.freq]}${b.autopay ? ' <span class="pill teal">autopay</span>' : ''}</td>
          <td><span class="pill ${dueTone(b.nextDue)}">${rel(b.nextDue)}</span></td><td style="text-align:right"><button class="btn sm" data-act="payBill" data-id="${b.id}">${b.autopay ? 'Confirm paid' : 'Mark paid'}</button></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty"><h3>No bills yet</h3>Use the quick-add chips above, or say “car insurance $140 every month on the 15th”.</div>`}</div>
      ${cats.length > 1 ? `<div class="notice" style="margin-top:16px">By category per month: ${cats.map(c => `${esc(c)} ${money(Math.round(bills.filter(b => b.category === c).reduce((a, b) => a + (Number(b.amount) || 0) / (FREQ_MONTHS[b.freq] || Infinity), 0)))}`).join(' · ')}</div>` : ''}`;
  },

  meals() {
    const ws = ui.mealWeek || weekStart(today());
    const days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(ws, i));
    const tags = ['All', 'Favorites', ...new Set(state.recipes.flatMap(r => r.tags))];
    const q = ui.recipeQ.toLowerCase();
    const recipes = state.recipes.filter(r => (ui.recipeTag === 'All' || (ui.recipeTag === 'Favorites' ? r.favorite : r.tags.includes(ui.recipeTag))) && (!q || (r.name + r.ingredients.join(' ') + r.tags.join(' ')).toLowerCase().includes(q)))
      .sort((a, b) => (b.favorite - a.favorite) || a.name.localeCompare(b.name));
    return head('Meals', 'What’s for dinner', `<button class="btn" data-act="newRecipe">${icon('plus')}Recipe</button>`) + `
      <div class="card" style="margin-bottom:20px"><div class="card-head"><button class="iconbtn" data-act="mealWeek" data-d="-7">${icon('left')}</button>
        <h2>${fmtDate(ws, { month: 'short', day: 'numeric' })} – ${fmtDate(addDays(ws, 6), { month: 'short', day: 'numeric' })}</h2><button class="iconbtn" data-act="mealWeek" data-d="7">${icon('right')}</button><span class="grow"></span>
        <button class="btn sm" data-act="weekToGrocery" title="Add this week’s recipe ingredients to the grocery list">${icon('cart')}Shop this week</button></div>
        <div class="week">${days.map(d => { const m = state.mealPlan[d]; const r = m?.recipeId && state.recipes.find(x => x.id === m.recipeId);
          return `<div class="day ${d === today() ? 'today' : ''}" data-act="planMeal" data-date="${d}"><span class="dn">${fmtDate(d, { weekday: 'short' })}</span><span class="dd">${parseISO(d).getDate()}</span>
            <span class="meal ${m ? '' : 'none'}">${m ? (r?.favorite ? '<span class="star">★</span> ' : '') + esc(r ? r.name : m.text) : '+ Plan'}</span>${m?.cook ? `<span class="small muted">${memberDot(m.cook)} ${esc(memberName(m.cook))}</span>` : ''}</div>`; }).join('')}</div></div>
      <div class="grid g3">
        <div class="span2">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><h2 style="font-size:24px">Family recipe book</h2><span class="grow"></span><input class="search" placeholder="Search recipes or ingredients" data-input="recipeQ" value="${esc(ui.recipeQ)}"></div>
          <div class="chips">${tags.map(t => `<button class="chip ${ui.recipeTag === t ? 'on' : ''}" data-act="recipeTag" data-tag="${esc(t)}">${t === 'Favorites' ? '★ ' : ''}${esc(t)}</button>`).join('')}</div>
          <div class="recipes">${recipes.map(r => `<div class="card recipe" data-act="viewRecipe" data-id="${r.id}"><div class="swatch" style="background:${r.color || 'var(--mustard)'}"></div>
            <div style="display:flex;gap:8px;align-items:start"><h3 class="grow">${esc(r.name)}</h3>${r.favorite ? '<span class="star" title="Family favorite">★</span>' : ''}</div>
            <div class="small muted">${[r.time, r.serves && `serves ${r.serves}`, `${r.ingredients.length} ingredients`].filter(Boolean).join(' · ')}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">${r.tags.map(t => `<span class="pill">${esc(t)}</span>`).join('')}</div>
            <div class="small muted" style="margin-top:auto">${r.timesMade ? `Made ${r.timesMade}× · last ${fmtDate(r.lastMade, { month: 'short', day: 'numeric' })}` : 'Not made yet'}</div></div>`).join('') || '<div class="muted">No recipes match.</div>'}</div>
        </div>
        ${groceryCard()}
      </div>`;
  },

  groceries() {
    return head('Groceries', 'The list', `<a class="btn" href="#/meals">${icon('meals')}Meal plan</a>`) + `<div style="max-width:640px">${groceryCard()}</div>
      <div class="notice" style="margin-top:16px;max-width:640px">Tip: just say “we’re out of milk, eggs and coffee” in the bar up top — items land here sorted by aisle.</div>`;
  },

  calendar() {
    const base = ui.calMonth || today().slice(0, 7) + '-01';
    const first = parseISO(base); const start = weekStart(base);
    const last = iso(new Date(first.getFullYear(), first.getMonth() + 1, 0));
    const cells = []; for (let d = start; cells.length < 42 && (d <= last || cells.length % 7); d = addDays(d, 1)) cells.push(d);
    const t = today();
    const upcoming = []; for (let i = 0; i < 30; i++) { const d = addDays(t, i); eventsOn(d).filter(e => e.date === d || i === 0 || e.repeat).forEach(e => upcoming.push({ d, e })); }
    const typeColor = { Travel: 'var(--mustard)', Appointment: 'var(--sky)', Activity: 'var(--olive)', School: 'var(--teal)', Social: 'var(--rust)', Reminder: 'var(--ink-3)' };
    return head('Calendar', fmtDate(base, { month: 'long', year: 'numeric' }), `<button class="iconbtn" data-act="calMonth" data-d="-1">${icon('left')}</button><button class="btn sm" data-act="calMonth" data-d="0">Today</button><button class="iconbtn" data-act="calMonth" data-d="1">${icon('right')}</button><button class="btn primary" data-act="newEvent">${icon('plus')}Event</button>`) + `
      <div class="grid g4"><div class="span2" style="grid-column:span 3">
        <div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dow">${d}</div>`).join('')}
        ${cells.map(d => { const evs = eventsOn(d); const bills = activeBills().filter(b => b.nextDue === d); const tasks = state.tasks.filter(x => x.nextDue === d);
          return `<div class="cell ${d.slice(0, 7) !== base.slice(0, 7) ? 'out' : ''} ${d === t ? 'today' : ''} ${evs.length || bills.length ? 'has' : ''}" data-act="calDay" data-date="${d}"><span class="n">${parseISO(d).getDate()}</span>
            ${evs.slice(0, 3).map(e => `<div class="ev" style="border-left-color:${typeColor[e.type] || 'var(--sky)'}" data-act="editEvent" data-id="${e.id}">${e.time ? fmtTime(e.time) + ' ' : ''}${esc(e.title)}</div>`).join('')}
            ${bills.map(b => `<div class="ev bill" data-act="editBill" data-id="${b.id}">${esc(b.name)}</div>`).join('')}
            ${tasks.length ? `<div class="ev task">${tasks.length} upkeep task${tasks.length > 1 ? 's' : ''}</div>` : ''}
            ${evs.length > 3 ? `<div class="small muted">+${evs.length - 3} more</div>` : ''}</div>`; }).join('')}</div>
        <div class="chips" style="margin-top:12px">${Object.entries(typeColor).map(([k, c]) => `<span class="pill"><span class="dot" style="background:${c}"></span>${k}</span>`).join('')}<span class="pill"><span class="dot" style="background:var(--rust)"></span>Bill due</span></div>
      </div>
      <div class="card" style="align-self:start"><div class="card-head"><h2>Next 30 days</h2></div>
        ${upcoming.length ? upcoming.map(({ d, e }) => `<div class="row" data-act="editEvent" data-id="${e.id}" style="cursor:pointer"><div class="body"><div class="title">${esc(e.title)}</div><div class="meta">${fmtDate(d)}${e.time ? ' · ' + fmtTime(e.time) : ''}${e.endDate ? ' → ' + fmtDate(e.endDate, { month: 'short', day: 'numeric' }) : ''}</div></div>${(e.members || []).map(memberDot).join('')}</div>`).join('') : '<div class="muted small">Nothing scheduled.</div>'}
      </div></div>`;
  },

  shopping() {
    const f = ui.shopFor;
    const items = state.purchases.filter(p => f === 'All' || (f === 'house' ? !p.forMember : p.forMember === f));
    const col = (status, label, next, nextLabel) => {
      const l = items.filter(p => p.status === status).sort((a, b) => ['Soon', 'Normal', 'Someday'].indexOf(a.priority) - ['Soon', 'Normal', 'Someday'].indexOf(b.priority));
      return `<div class="kcol"><h3>${label} <span class="pill">${l.length}</span></h3>${l.map(p => `<div class="kcard"><div style="display:flex;gap:8px"><div class="grow"><div class="title">${esc(p.item)}</div>
        <div class="small muted">${p.forMember ? memberDot(p.forMember) + ' ' + esc(memberName(p.forMember)) : 'The house'} · ${esc(p.category)}${p.size ? ' · ' + esc(p.size) : ''}${p.price ? ' · ' + money(p.price) : ''}</div>
        ${p.store ? (/^https?:/.test(p.store) ? `<a class="small" href="${esc(p.store)}" target="_blank" rel="noopener">Open link</a>` : `<div class="small muted">${esc(p.store)}</div>`) : ''}</div>
        ${p.priority === 'Soon' ? '<span class="pill rust">Soon</span>' : p.priority === 'Someday' ? '<span class="pill">Someday</span>' : ''}</div>
        <div class="actions">${next ? `<button class="btn sm" data-act="movePurchase" data-id="${p.id}" data-to="${next}">${nextLabel}</button>` : `<button class="btn sm ghost" data-act="archivePurchase" data-id="${p.id}">Clear</button>`}<button class="iconbtn" data-act="editPurchase" data-id="${p.id}">${icon('edit')}</button></div></div>`).join('') || '<div class="muted small">Nothing here.</div>'}</div>`;
    };
    const spend = items.filter(p => p.status === 'needed').reduce((a, p) => a + (Number(p.price) || 0), 0);
    return head('Things to buy', 'Needs & orders', `<button class="btn primary" data-act="newPurchase">${icon('plus')}Add item</button>`) + `
      <div class="chips"><button class="chip ${f === 'All' ? 'on' : ''}" data-act="shopFor" data-f="All">Everyone</button><button class="chip ${f === 'house' ? 'on' : ''}" data-act="shopFor" data-f="house">The house</button>
      ${state.members.map(m => `<button class="chip ${f === m.id ? 'on' : ''}" data-act="shopFor" data-f="${m.id}">${esc(m.name)}</button>`).join('')}
      ${spend ? `<span class="small muted" style="align-self:center;margin-left:auto">Estimated to buy: <b>${money(spend)}</b></span>` : ''}</div>
      <div class="kanban">${col('needed', 'Needed', 'ordered', 'Ordered')}${col('ordered', 'Ordered', 'received', 'Arrived')}${col('received', 'Arrived', null)}</div>
      <div class="notice" style="margin-top:20px">Food and consumables go on the <a href="#/meals">grocery list</a>; this board is for things that get ordered or bought once — shoes, a new filter, a birthday gift.</div>`;
  },

  planning() {
    const e = state.estate; const ep = estateProgress();
    const tr = e.trust;
    return head('Family planning', 'Estate & legacy', '') + `
      <div class="notice" style="margin-bottom:20px">A guided checklist to organize your thinking and paperwork — not legal advice. Work through it with an estate-planning attorney. Everything here is stored only on this device; record account <b>last 4 digits only</b>.</div>
      <div class="grid g3">
        <div class="card span2"><div class="card-head"><h2>The path</h2><span class="grow"></span><span class="muted small">${ep.done} of ${ep.total} complete</span></div>
          <div class="bar" style="margin-bottom:12px"><i style="width:${ep.done / ep.total * 100}%;background:var(--mustard)"></i></div>
          <div class="steps">${ESTATE_STEPS.map(([id, name, guide], i) => { const s = e.steps[id];
            return `<div class="step ${s.status === 'done' ? 'done' : s.status === 'progress' ? 'progress' : ''} ${ui.openStep === id ? 'open' : ''}">
              <div class="step-head" data-act="openStep" data-id="${id}"><span class="step-num">${s.status === 'done' ? icon('check') : i + 1}</span><span class="grow title" style="font-weight:500">${esc(name)}</span>
                <span class="pill ${s.status === 'done' ? 'teal' : s.status === 'progress' ? 'mustard' : ''}">${{ todo: 'Not started', progress: 'In progress', done: s.date ? 'Done ' + fmtDate(s.date, { month: 'short', year: 'numeric' }) : 'Done' }[s.status]}</span></div>
              <div class="step-body"><p>${esc(guide)}</p>
                <div style="display:flex;gap:6px;margin-bottom:10px">${[['todo', 'Not started'], ['progress', 'In progress'], ['done', 'Done']].map(([v, l]) => `<button class="chip ${s.status === v ? 'on' : ''}" data-act="stepStatus" data-id="${id}" data-v="${v}">${l}</button>`).join('')}</div>
                <textarea data-step-notes="${id}" placeholder="Decisions, names, attorney notes, next action…">${esc(s.notes)}</textarea></div></div>`; }).join('')}</div></div>
        <div class="grid" style="align-content:start">
          <div class="card"><div class="card-head"><h2>Trust details</h2><span class="grow"></span><button class="iconbtn" data-act="editTrust">${icon('edit')}</button></div>
            ${tr.name ? `<dl class="kv">${[['Name', tr.name], ['Type', tr.type], ['Established', tr.established && fmtDate(tr.established, { month: 'long', day: 'numeric', year: 'numeric' })], ['Grantors', tr.grantors], ['Trustees', tr.trustees], ['Successor trustees', tr.successors], ['Attorney', tr.attorney], ['Distribution', tr.distribution], ['Notes', tr.notes]].filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
              : `<div class="muted small">Record the trust once it's drafted: name, trustees, successors, how and when the kids inherit.</div><button class="btn sm" style="margin-top:10px" data-act="editTrust">Add trust details</button>`}</div>
          <div class="card"><div class="card-head"><h2>Key people</h2><span class="grow"></span><button class="iconbtn" data-act="newPerson">${icon('plus')}</button></div>
            ${e.people.length ? e.people.map(p => `<div class="row" data-act="editPerson" data-id="${p.id}" style="cursor:pointer"><div class="body"><div class="title">${esc(p.name)}</div><div class="meta">${esc(p.role)}${p.contact ? ' · ' + esc(p.contact) : ''}</div></div></div>`).join('') : '<div class="muted small">Executor, guardians, attorney, financial advisor, insurance agent.</div>'}</div>
          <div class="card"><div class="card-head"><h2>Where things are</h2><span class="grow"></span><button class="iconbtn" data-act="newLocation">${icon('plus')}</button></div>
            ${e.locations.length ? e.locations.map(p => `<div class="row" data-act="editLocation" data-id="${p.id}" style="cursor:pointer"><div class="body"><div class="title">${esc(p.name)}</div><div class="meta">${esc(p.location)}</div></div></div>`).join('') : '<div class="muted small">Original wills, trust binder, deeds, titles, passports, safe-deposit key.</div>'}</div>
        </div>
      </div>
      <div class="card" style="margin-top:20px"><div class="card-head"><h2>Beneficiary designations</h2><span class="grow"></span><button class="btn sm" data-act="newBenef">${icon('plus')}Account</button></div>
        ${e.beneficiaries.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Account</th><th>Institution</th><th>Owner</th><th>Primary</th><th>Contingent</th><th>Last reviewed</th></tr></thead><tbody>
          ${e.beneficiaries.map(b => { const stale = !b.reviewed || diffDays(today(), b.reviewed) > 3 * 365;
            return `<tr class="click" data-act="editBenef" data-id="${b.id}"><td><b>${esc(b.account)}</b><div class="small muted">${esc(b.type)}${b.last4 ? ' · …' + esc(b.last4) : ''}</div></td><td>${esc(b.institution)}</td><td>${esc(b.owner)}</td><td>${esc(b.primary)}</td><td>${esc(b.contingent) || '<span class="pill rust">None set</span>'}</td><td>${b.reviewed ? fmtDate(b.reviewed, { month: 'short', year: 'numeric' }) : ''} ${stale ? '<span class="pill mustard">Review</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div>`
          : '<div class="empty"><h3>No accounts logged</h3>Add each retirement account, life insurance policy, HSA and TOD/POD account with its primary and contingent beneficiaries.</div>'}</div>
      ${e.notes.length ? `<div class="card" style="margin-top:20px"><div class="card-head"><h2>Notes</h2></div>${e.notes.map(n => `<div class="row"><div class="body"><div>${esc(n.text)}</div><div class="meta">${fmtDate(n.date)}</div></div><button class="iconbtn" data-act="delEstateNote" data-id="${n.id}">${icon('trash')}</button></div>`).join('')}</div>` : ''}`;
  },

  family() {
    const s = state.settings;
    return head('Settings', 'The family', '') + `
      <div class="grid g2">
        <div class="card"><div class="card-head"><h2>Members</h2><span class="grow"></span><button class="btn sm" data-act="newMember">${icon('plus')}Add</button></div>
          ${state.members.map(m => `<div class="row" data-act="editMember" data-id="${m.id}" style="cursor:pointer"><span class="dot" style="background:${m.color};width:14px;height:14px"></span><div class="body"><div class="title">${esc(m.name)}</div><div class="meta">${m.role === 'Kid' ? 'Kid · tracked for calendar, sizes & purchases' : `${esc(m.role || 'Adult')} · ${state.log.filter(l => l.memberId === m.id).length} tasks logged all time`}</div></div></div>`).join('')}
          <div class="section-title">Household</div>
          <form data-form="settings" class="fields">${fieldHTML({ key: 'familyName', label: 'Family name (e.g. the Parkers)', half: true }, s.familyName)}${fieldHTML({ key: 'weeklyGoal', label: 'Weekly rhythm goal (pts)', type: 'number', half: true }, s.weeklyGoal)}
            ${fieldHTML({ key: 'theme', label: 'Appearance', type: 'select', half: true, options: [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Match phone setting']] }, s.theme)}
            <div class="field half" style="justify-content:end"><button class="btn primary">Save</button></div></form></div>
        <div class="card"><div class="card-head"><h2>Milestones</h2><span class="grow"></span><span class="muted small">${Object.keys(state.milestones).length} of ${MILESTONES.length}</span></div>
          ${MILESTONES.map(m => `<div class="milestone-row"><span class="medal ${state.milestones[m.id] ? 'earned' : ''}">${icon('medal')}</span><div><div class="title" style="font-weight:500">${esc(m.name)}</div><div class="small muted">${esc(m.desc)}${state.milestones[m.id] ? ' · ' + fmtDate(state.milestones[m.id], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div></div></div>`).join('')}</div>
        <div class="card span2"><div class="card-head"><h2>AI filing</h2><span class="grow"></span><span class="pill ${getAIKey() ? 'olive' : ''}">${getAIKey() ? 'On' : 'Off'}</span></div>
          <p class="muted" style="margin-top:0">With AI on, Higgins reads each note with Claude — it understands typos, dates like “the 10th of each month”, reminders, and your cars and people, and writes a proper title (“Pay Highlander auto loan”). Without a key, or if anything goes wrong, Higgins files with quick keyword rules instead. Your key stays on this device and is never in backups; the note and a summary of your lists are sent to Anthropic when you file.</p>
          <form data-form="aikey" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input name="key" type="password" autocomplete="off" class="search" style="flex:1;min-width:220px" placeholder="${getAIKey() ? 'Key saved — paste a new one to replace' : 'Paste your Anthropic API key'}">
            <button class="btn primary">Save key</button>${getAIKey() ? '<button type="button" class="btn" data-act="testAI">Test</button><button type="button" class="btn ghost danger" data-act="removeAI">Remove</button>' : ''}</form>
          <form data-form="aiprefs" class="fields" style="margin-top:14px">
            ${fieldHTML({ key: 'aiModel', label: 'Model', type: 'select', half: true, options: Object.entries(AI_MODELS).map(([k, m]) => [k, m.label]) }, aiModelKey())}
            ${fieldHTML({ key: 'aiCap', label: 'Monthly cap in Higgins ($, 0 = none)', type: 'number', half: true, step: '0.5', hint: 'When reached, Higgins switches to quick rules until next month.' }, state.settings.aiCap || 0)}
            <div class="field"><button class="btn" style="align-self:flex-start">Save AI settings</button></div></form>
          <div class="notice" style="margin-top:12px"><b>This month:</b> ${aiUsage().notes} note${aiUsage().notes === 1 ? '' : 's'} · about ${money(Math.round(aiUsage().cost * 100) / 100)} (estimated from token counts)${state.settings.aiCap ? ` of your ${money(state.settings.aiCap)} cap` : ''}</div>
          <div class="small muted" style="margin-top:10px"><b>Keep it flat:</b> at console.anthropic.com → Billing, buy prepaid credits (e.g. $10) and leave <b>auto-reload off</b>. You can never be charged more than you prepaid — when credits run out, Higgins tells you and falls back to quick rules until you top up.</div></div>
        <div class="card span2"><div class="card-head"><h2>Your data</h2></div>
          <p class="muted" style="margin-top:0">Higgins keeps everything on this device only. Export a backup now and then (save it to Files or iCloud Drive) — it’s how you’d move to a new phone, or into sync later.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="exportData">Export backup (.json)</button><label class="btn">Import backup<input type="file" accept=".json" data-import hidden></label><span class="grow"></span><button class="btn ghost danger" data-act="resetData">Reset everything</button></div></div>
      </div>`;
  },
};

/* ================= Actions ================= */
const find = (arr, id) => arr.find(x => x.id === id);
const actions = {
  doneTask: d => completeTask(d.id),
  voice: () => startVoice(),
  removeAI: () => { setAIKey(''); aiClient = null; toast('AI filing turned off'); render(); },
  testAI: async () => {
    toast('Testing…');
    try { const acts = await aiInterpret('we are out of milk'); toast(acts.length ? `Works — it read that as: ${acts[0].type}, “${acts[0].title || acts[0].items.join(', ')}”` : 'Connected, but got an empty answer'); }
    catch (e) { console.warn(e); toast(aiErrorMessage(e).replace(' — filed with quick rules', '')); }
  },
  undoReceipt: d => { const r = find(ui.receipts, d.id); r.undo(); ui.receipts = ui.receipts.filter(x => x !== r); toast('Undone'); commit(); },
  moveReceipt: d => { const r = find(ui.receipts, d.id); r.moving = !r.moving; renderReceipts(); },
  moveTo: d => { const r = find(ui.receipts, d.id); r.undo(); Object.assign(r, { where: '' }, fileCapture(r.p, d.cat), { cat: d.cat, moving: false }); toast(`Moved to ${CAT_SHORT[d.cat]}`); commit(); },
  editReceipt: d => find(ui.receipts, d.id).edit(),
  dismissReceipt: d => { ui.receipts = ui.receipts.filter(x => x.id !== d.id); renderReceipts(); },
  snooze: d => snoozeTask(d.id),
  editTask: d => editTask(find(state.tasks, d.id)),
  newTask: () => editTask(null, { zone: ui.zone !== 'All' ? ui.zone : 'General' }),
  newAutoTask: () => editTask(null, { area: 'auto', freqDays: 180 }),
  zone: d => { ui.zone = d.zone; render(); },
  newVehicle: () => editVehicle(null),
  editVehicle: d => editVehicle(find(state.vehicles, d.id)),
  mileage: d => { const c = find(state.vehicles, d.id); const v = prompt(`Current mileage for ${c.name}`, c.mileage || ''); if (v && !isNaN(v)) { c.mileage = Number(v); commit(); } },
  newBill: () => editBill(null),
  quickBill: d => editBill(null, { name: d.name, category: /insurance|policy/i.test(d.name) ? 'Insurance' : /loan/i.test(d.name) ? 'Loan' : /mortgage/i.test(d.name) ? 'Mortgage / rent' : /tax/i.test(d.name) ? 'Tax' : 'Utility', freq: /tax|umbrella|life/i.test(d.name) ? 'annual' : 'monthly' }),
  editBill: d => editBill(find(state.bills, d.id)),
  payBill: d => payBill(d.id),
  newEvent: () => editEvent(null),
  editEvent: d => editEvent(find(state.events, d.id)),
  calDay: d => editEvent(null, { date: d.date }),
  calMonth: d => { const base = parseISO(ui.calMonth || today().slice(0, 7) + '-01'); ui.calMonth = +d.d === 0 ? null : iso(new Date(base.getFullYear(), base.getMonth() + +d.d, 1)); render(); },
  planMeal: d => editMeal(d.date),
  mealWeek: d => { ui.mealWeek = addDays(ui.mealWeek || weekStart(today()), +d.d); render(); },
  weekToGrocery: () => {
    const ws = ui.mealWeek || weekStart(today()); let n = 0;
    for (let i = 0; i < 7; i++) { const m = state.mealPlan[addDays(ws, i)]; const r = m?.recipeId && find(state.recipes, m.recipeId); if (r) r.ingredients.forEach(ing => { const before = state.grocery.length; addGrocery(ing, r.id); n += state.grocery.length - before; }); }
    toast(n ? `Added ${n} ingredients` : 'No recipe-linked dinners this week'); commit();
  },
  newRecipe: () => editRecipe(null),
  recipeTag: d => { ui.recipeTag = d.tag; render(); },
  viewRecipe: d => viewRecipe(find(state.recipes, d.id)),
  toggleGroc: d => { const g = find(state.grocery, d.id); g.done = !g.done; commit(); },
  delGroc: d => { state.grocery = state.grocery.filter(g => g.id !== d.id); commit(); },
  clearGroc: () => { state.grocery = state.grocery.filter(g => !g.done); commit(); },
  copyGroc: () => {
    const txt = AISLE_ORDER.map(a => [a, state.grocery.filter(g => g.aisle === a && !g.done)]).filter(([, l]) => l.length).map(([a, l]) => `${a}\n${l.map(g => '- ' + g.item).join('\n')}`).join('\n\n');
    navigator.clipboard?.writeText(txt).then(() => toast('Copied — paste into Messages or Notes'), () => toast('Copy failed'));
  },
  newPurchase: () => editPurchase(null, { forMember: ['All', 'house'].includes(ui.shopFor) ? '' : ui.shopFor }),
  editPurchase: d => editPurchase(find(state.purchases, d.id)),
  movePurchase: d => { const p = find(state.purchases, d.id); p.status = d.to; if (d.to === 'ordered') p.ordered = today(); commit(); },
  archivePurchase: d => { state.purchases = state.purchases.filter(p => p.id !== d.id); commit(); },
  shopFor: d => { ui.shopFor = d.f; render(); },
  openStep: d => { ui.openStep = ui.openStep === d.id ? null : d.id; render(); },
  stepStatus: d => { const s = state.estate.steps[d.id]; s.status = d.v; s.date = d.v === 'done' ? today() : ''; commit(); },
  editTrust: () => openForm({ title: 'Trust details', fields: [
    { key: 'name', label: 'Trust name', placeholder: 'The Smith Family Revocable Trust' }, { key: 'type', label: 'Type', half: true, list: ['Revocable living trust', 'Irrevocable trust', 'Special needs trust', 'ILIT (life insurance trust)'] },
    { key: 'established', label: 'Date established', type: 'date', half: true }, { key: 'grantors', label: 'Grantors', half: true }, { key: 'trustees', label: 'Trustees', half: true },
    { key: 'successors', label: 'Successor trustees (in order)' }, { key: 'attorney', label: 'Drafting attorney' },
    { key: 'distribution', label: 'How the kids inherit', type: 'textarea', rows: 2, placeholder: 'e.g. held in trust until 25; 1/3 at 25, 1/3 at 30, rest at 35' },
    { key: 'notes', label: 'Assets funded / notes', type: 'textarea', rows: 3 }], values: state.estate.trust, onSave: o => { Object.assign(state.estate.trust, o); } }),
  newBenef: () => editBenef(null), editBenef: d => editBenef(find(state.estate.beneficiaries, d.id)),
  newPerson: () => editSimple('people', null), editPerson: d => editSimple('people', find(state.estate.people, d.id)),
  newLocation: () => editSimple('locations', null), editLocation: d => editSimple('locations', find(state.estate.locations, d.id)),
  delEstateNote: d => { state.estate.notes = state.estate.notes.filter(n => n.id !== d.id); commit(); },
  fileInbox: d => {
    const i = find(state.inbox, d.id); const p = parseCapture(i.text);
    ui.receipts.unshift({ id: uid(), p, cat: 'note', summary: i.text, undo: () => { state.inbox = state.inbox.filter(x => x !== i); }, edit: () => {}, moving: true });
    renderReceipts(); window.scrollTo(0, 0);
  },
  delInbox: d => { state.inbox = state.inbox.filter(i => i.id !== d.id); commit(); },
  newMember: () => editMember(null), editMember: d => editMember(find(state.members, d.id)),
  exportData: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })); a.download = `higgins-backup-${today()}.json`; a.click(); },
  more: () => {
    showModal(`<h2>More</h2><div class="morelist">${MORE.map(id => { const [, label, ic] = ROUTES.find(x => x[0] === id); return `<a href="#/${id}" data-close>${icon(ic)}<span>${label}</span></a>`; }).join('')}</div>
      <label class="field" style="margin-top:16px"><span>Logging as</span><select data-who>${adults().map(m => `<option value="${m.id}" ${m.id === state.activeMember ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>`);
    modal().querySelectorAll('[data-close]').forEach(a => a.onclick = () => closeModal());
    modal().querySelector('[data-who]').onchange = e => { state.activeMember = e.target.value; save(); render(); };
  },
  resetData: () => { if (confirm('Erase all Higgins data in this browser and start over? Export a backup first if unsure.')) { state = seedState(); commit(); } },
};
function editBenef(b) {
  openForm({ title: b ? 'Edit designation' : 'Beneficiary designation', fields: [
    { key: 'account', label: 'Account', required: true, placeholder: '401(k), Term life policy, Roth IRA…' },
    { key: 'type', label: 'Type', type: 'select', half: true, options: ['Retirement', 'Life insurance', 'HSA', 'Bank (POD)', 'Brokerage (TOD)', '529', 'Annuity', 'Other'] },
    { key: 'institution', label: 'Institution', half: true }, { key: 'owner', label: 'Owner', half: true }, { key: 'last4', label: 'Last 4 digits', half: true },
    { key: 'primary', label: 'Primary beneficiary (with %)', placeholder: 'Spouse 100%' }, { key: 'contingent', label: 'Contingent beneficiary (with %)', placeholder: 'The Family Trust 100%' },
    { key: 'reviewed', label: 'Last reviewed', type: 'date', half: true }, { key: 'notes', label: 'Notes', half: true }],
    values: b || { reviewed: today(), type: 'Retirement' },
    onSave: o => { if (/^\d{5,}$/.test(o.last4)) o.last4 = o.last4.slice(-4); const x = b || { id: uid() }; Object.assign(x, o); if (!b) state.estate.beneficiaries.push(x); },
    onDelete: b ? () => { state.estate.beneficiaries = state.estate.beneficiaries.filter(x => x !== b); } : null });
}
function editSimple(kind, item) {
  const people = kind === 'people';
  openForm({ title: people ? 'Key person' : 'Where it’s kept', fields: people
    ? [{ key: 'name', label: 'Name', required: true }, { key: 'role', label: 'Role', list: ['Executor', 'Backup executor', 'Guardian', 'Backup guardian', 'Successor trustee', 'Estate attorney', 'Financial advisor', 'CPA', 'Insurance agent', 'Healthcare agent'] }, { key: 'contact', label: 'Phone / email' }]
    : [{ key: 'name', label: 'Document or item', required: true }, { key: 'location', label: 'Location', placeholder: 'Fireproof safe, top shelf of office closet' }],
    values: item || {},
    onSave: o => { const x = item || { id: uid() }; Object.assign(x, o); if (!item) state.estate[kind].push(x); },
    onDelete: item ? () => { state.estate[kind] = state.estate[kind].filter(x => x !== item); } : null });
}
function editMember(m) {
  openForm({ title: m ? 'Edit member' : 'Add family member', fields: [
    { key: 'name', label: 'Name', required: true, half: true }, { key: 'role', label: 'Role', half: true, list: ['Parent', 'Kid', 'Grandparent', 'Nanny / helper'], hint: 'Kids appear in the calendar and to-buy lists but don’t log chores.' },
    { key: 'color', label: 'Color', type: 'select', options: MEMBER_COLORS.map((c, i) => [c, ['Teal', 'Rust', 'Mustard', 'Olive', 'Sky', 'Plum'][i]]) }],
    values: m || { color: MEMBER_COLORS[state.members.length % MEMBER_COLORS.length] },
    onSave: o => { if (m) Object.assign(m, o); else state.members.push({ id: uid(), ...o }); },
    onDelete: m && state.members.length > 1 ? () => { state.members = state.members.filter(x => x !== m); if (state.activeMember === m.id) state.activeMember = state.members[0].id; } : null });
}
function viewRecipe(r) {
  const planned = Object.entries(state.mealPlan).filter(([, m]) => m.recipeId === r.id).map(([d]) => d).filter(d => d >= today()).sort();
  showModal(`<div style="display:flex;gap:10px;align-items:start"><h2 class="grow">${r.favorite ? '<span class="star">★</span> ' : ''}${esc(r.name)}</h2><button class="iconbtn" data-act="toggleFav" data-id="${r.id}" title="Favorite">${icon('star')}</button></div>
    <div class="small muted" style="margin:-8px 0 14px">${[r.time, r.serves && `Serves ${r.serves}`, r.timesMade ? `Made ${r.timesMade}×` : ''].filter(Boolean).join(' · ')}${planned.length ? ` · planned ${fmtDate(planned[0])}` : ''}</div>
    <div class="section-title">Ingredients</div><ul style="margin:0 0 8px;padding-left:18px">${r.ingredients.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    ${r.steps ? `<div class="section-title">Steps</div><ol style="margin:0;padding-left:18px">${r.steps.split('\n').filter(Boolean).map(s => `<li style="margin-bottom:6px">${esc(s)}</li>`).join('')}</ol>` : ''}
    ${r.notes ? `<div class="notice" style="margin-top:14px">${esc(r.notes)}</div>` : ''}
    <div class="modal-actions" style="flex-wrap:wrap"><button class="btn" data-act="recipeEdit" data-id="${r.id}">${icon('edit')}Edit</button><button class="btn" data-act="recipeMade" data-id="${r.id}">We made this</button><span class="grow"></span>
      <button class="btn" data-act="recipeToList" data-id="${r.id}">${icon('cart')}Ingredients to list</button><button class="btn primary" data-act="recipePlan" data-id="${r.id}">Plan it</button></div>`);
}
Object.assign(actions, {
  toggleFav: d => { const r = find(state.recipes, d.id); r.favorite = !r.favorite; commit(); viewRecipe(r); },
  recipeEdit: d => { closeModal(); editRecipe(find(state.recipes, d.id)); },
  recipeMade: d => { const r = find(state.recipes, d.id); r.timesMade = (r.timesMade || 0) + 1; r.lastMade = today(); closeModal(); toast(`Logged — made ${r.timesMade}×`); commit(); },
  recipeToList: d => { const r = find(state.recipes, d.id); r.ingredients.forEach(i => addGrocery(i, r.id)); closeModal(); toast(`${r.ingredients.length} ingredients added`); commit(); },
  recipePlan: d => {
    const r = find(state.recipes, d.id); let dt = today();
    while (state.mealPlan[dt] && diffDays(dt, today()) < 14) dt = addDays(dt, 1);
    closeModal(); editMeal(dt, { recipeId: r.id });
  },
});

/* ================= Render & events ================= */
function route() { const r = location.hash.replace(/^#\/?/, '') || 'home'; return views[r] ? r : 'home'; }
function applyTheme() { document.documentElement.dataset.theme = state.settings.theme || 'light'; }
function render() {
  const r = route();
  applyTheme();
  $('#familyName').textContent = state.settings.familyName || 'Family HQ';
  const badges = { upkeep: state.tasks.filter(t => t.area === 'home' && isOverdue(t)).length, auto: state.tasks.filter(t => t.area === 'auto' && isOverdue(t)).length, money: activeBills().filter(b => b.nextDue < today()).length };
  $('#nav').innerHTML = ROUTES.map(([id, label, ic]) => `<a href="#/${id}" class="${r === id ? 'active' : ''}">${icon(ic)}<span class="lbl">${label}</span>${badges[id] ? `<span class="badge">${badges[id]}</span>` : ''}</a>`).join('');
  $('#tabbar').innerHTML = TABS.map(id => { if (!id) return `<button class="fab" data-act="voice" title="Tell Higgins">${icon('mic')}</button>`; const [, label, ic] = ROUTES.find(x => x[0] === id); return `<a href="#/${id}" class="${r === id ? 'active' : ''}">${icon(ic)}<span>${label}</span>${badges[id] ? '<i></i>' : ''}</a>`; }).join('')
    + `<a href="#" data-act="more" class="${TABS.includes(r) ? '' : 'active'}">${icon('more')}<span>More</span>${MORE.some(id => badges[id]) ? '<i></i>' : ''}</a>`;
  $('#who').innerHTML = adults().map(m => `<option value="${m.id}" ${m.id === state.activeMember ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
  $('#view').innerHTML = views[r]();
  renderReceipts();
  document.title = `Higgins · ${ROUTES.find(x => x[0] === r)[1]}`;
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) { if (e.target === modal()) closeModal(); return; }
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); e.stopPropagation(); fn(el.dataset, el); }
});
document.addEventListener('submit', e => {
  const f = e.target.dataset.form; if (!f) return;
  e.preventDefault();
  if (f === 'grocery') { const v = e.target.elements.item.value; v.split(',').forEach(s => addGrocery(s)); commit(); $('[data-form="grocery"] input')?.focus(); }
  if (f === 'aikey') { const k = e.target.elements.key.value.trim(); if (!k) return; setAIKey(k); aiClient = null; toast('Key saved — AI filing is on'); render(); return; }
  if (f === 'aiprefs') { const el = e.target.elements; state.settings.aiModel = el.aiModel.value; state.settings.aiCap = Math.max(0, Number(el.aiCap.value) || 0); ui.capNoticeShown = false; toast('AI settings saved'); commit(); return; }
  if (f === 'settings') { const el = e.target.elements; Object.assign(state.settings, { familyName: el.familyName.value.trim(), weeklyGoal: Number(el.weeklyGoal.value) || 30, theme: el.theme.value }); toast('Saved'); commit(); }
});
document.addEventListener('input', e => {
  const k = e.target.dataset.input;
  if (k) { ui[k] = e.target.value; const pos = e.target.selectionStart; render(); const el = $(`[data-input="${k}"]`); el.focus(); el.setSelectionRange(pos, pos); }
});
document.addEventListener('change', e => {
  const sn = e.target.dataset.stepNotes; if (sn) { state.estate.steps[sn].notes = e.target.value; const s = state.estate.steps[sn]; if (s.status === 'todo' && s.notes) s.status = 'progress'; commit(); }
  if (e.target.id === 'who') { state.activeMember = e.target.value; save(); render(); }
  if (e.target.matches('[data-import]')) {
    const file = e.target.files[0]; if (!file) return;
    file.text().then(txt => { const d = JSON.parse(txt); if (d.version !== VERSION || !d.tasks) throw new Error(); if (confirm('Replace everything here with this backup?')) { state = d; commit(); toast('Backup restored'); } }).catch(() => toast('That file isn’t a Higgins backup'));
  }
});
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
modal().addEventListener('close', () => { modal().innerHTML = ''; });

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
navigator.storage?.persist?.().catch(() => {});

load();
if (!adults().some(m => m.id === state.activeMember)) state.activeMember = adults()[0]?.id;
recordHealth(); checkMilestones(); save();
initCapture();
render();
