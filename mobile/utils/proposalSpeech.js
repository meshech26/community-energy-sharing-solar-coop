import { formatEstimatedCost } from './community';

export const speechLanguages = { 'en-AU': 'English', 'si-LK': 'Sinhala', 'ta-LK': 'Tamil' };

export function detectSpeechLanguage(text = '') {
  const sinhala = (text.match(/[\u0D80-\u0DFF]/g) || []).length;
  const tamil = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
  const latin = (text.match(/[a-z]/gi) || []).length;
  // Allow English names/technical terms without overriding substantial local script.
  // Ties between local scripts consistently prefer Sinhala.
  if (Math.max(sinhala, tamil) >= 3 && Math.max(sinhala, tamil) >= latin * 0.2) {
    return sinhala >= tamil ? 'si-LK' : 'ta-LK';
  }
  return 'en-AU';
}

const labels = {
  'en-AU': ['Proposal', 'Summary', 'About this proposal', 'Expected benefits', 'Estimated cost', 'Household impact', 'Proposed by', 'Voting starts', 'Voting closes'],
  'si-LK': ['යෝජනාව', 'සාරාංශය', 'යෝජනාව පිළිබඳව', 'අපේක්ෂිත ප්‍රතිලාභ', 'ඇස්තමේන්තුගත පිරිවැය', 'නිවසට ඇති බලපෑම', 'යෝජනා කළේ', 'ඡන්දය ආරම්භ වන්නේ', 'ඡන්දය අවසන් වන්නේ'],
  'ta-LK': ['முன்மொழிவு', 'சுருக்கம்', 'முன்மொழிவு பற்றி', 'எதிர்பார்க்கப்படும் நன்மைகள்', 'மதிப்பிடப்பட்ட செலவு', 'குடும்பத்தின் மீதான தாக்கம்', 'முன்மொழிந்தவர்', 'வாக்குப்பதிவு தொடங்கும் நேரம்', 'வாக்குப்பதிவு முடியும் நேரம்'],
};
const clean = (value) => typeof value === 'string' && !['null', 'undefined', 'nan'].includes(value.trim().toLowerCase()) ? value.trim() : '';

const sinhalaNumbers = ['බිංදුව', 'එක', 'දෙක', 'තුන', 'හතර', 'පහ', 'හය', 'හත', 'අට', 'නවය', 'දහය', 'එකොළහ', 'දොළහ', 'දහතුන', 'දාහතර', 'පහළොව', 'දහසය', 'දාහත', 'දහඅට', 'දහනවය'];
const sinhalaTens = ['', '', 'විසි', 'තිස්', 'හතළිස්', 'පනස්', 'හැට', 'හැත්තෑ', 'අසූ', 'අනූ'];
const sinhalaRoundTens = ['', '', 'විස්ස', 'තිහ', 'හතළිහ', 'පනහ', 'හැට', 'හැත්තෑව', 'අසූව', 'අනූව'];
const sinhalaMonths = ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'];
function sinhalaNumber(value) {
  if (value < 20) return sinhalaNumbers[value];
  if (value < 100) return value % 10 ? `${sinhalaTens[Math.floor(value / 10)]} ${sinhalaNumbers[value % 10]}` : sinhalaRoundTens[value / 10];
  if (value < 1000) {
    const hundreds = ['', 'එක්සිය', 'දෙසිය', 'තුන්සිය', 'හාරසිය', 'පන්සිය', 'හයසිය', 'හත්සිය', 'අටසිය', 'නවසිය'];
    return `${hundreds[Math.floor(value / 100)]}${value % 100 ? ` ${sinhalaNumber(value % 100)}` : ''}`;
  }
  if (value < 10000) {
    const thousands = ['', 'එක්දහස්', 'දෙදහස්', 'තුන්දහස්', 'හාරදහස්', 'පන්දහස්', 'හයදහස්', 'හත්දහස්', 'අටදහස්', 'නවදහස්'];
    return `${thousands[Math.floor(value / 1000)]}${value % 1000 ? ` ${sinhalaNumber(value % 1000)}` : ''}`;
  }
  return String(value).split('').map((digit) => sinhalaNumbers[Number(digit)]).join(' ');
}

// Use named place-value groups instead of asking the device to interpret commas.
// The cost field has no currency metadata, so do not invent a currency here.
export function formatSinhalaSpeechCost(value) {
  if (value === null || value === undefined || typeof value === 'boolean' || String(value).trim() === '') return '';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return '';
  // Match the existing whole-number cost display; never change the stored value.
  let remaining = Math.round(amount);
  if (!Number.isSafeInteger(remaining)) return '';
  if (remaining === 0) return sinhalaNumbers[0];
  const groups = [];
  for (const [size, label] of [[10000000, 'කෝටි'], [100000, 'ලක්ෂ'], [1000, 'දහස්']]) {
    const count = Math.floor(remaining / size);
    if (count) groups.push(`${label} ${count >= 10000 ? formatSinhalaSpeechCost(count) : sinhalaNumber(count)}`);
    remaining %= size;
  }
  if (remaining) groups.push(sinhalaNumber(remaining));
  return groups.join(', ');
}

// Speech-only formatting: retain the device-local timezone used by the visible date.
export function formatSinhalaSpeechDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1) return '';
  const period = date.getHours() < 12 ? 'පෙරවරු' : 'පස්වරු';
  const time = `${period} පැය ${sinhalaNumber(date.getHours() % 12 || 12)}${date.getMinutes() ? ` මිනිත්තු ${sinhalaNumber(date.getMinutes())}` : ' හරියටම'}ට`;
  return `වර්ෂය ${sinhalaNumber(date.getFullYear())}, ${sinhalaMonths[date.getMonth()]} මස, දින ${sinhalaNumber(date.getDate())}, ${time}`;
}

// Normalize only unambiguous, standalone numeric expressions, not IDs, URLs or
// slash-separated dates. Fractional digits are preserved, including trailing zeros.
export function normalizeSinhalaSpeechNumbers(text) {
  const number = (raw) => {
    const unsigned = raw.replace(/^[+-]/, '').replace(/,/g, '');
    const [whole, fraction] = unsigned.split('.');
    if (/^0\d/.test(whole) || !Number.isSafeInteger(Number(whole))) return null;
    const words = Number(whole) < 10000 ? sinhalaNumber(Number(whole)) : formatSinhalaSpeechCost(whole);
    return `${raw.startsWith('-') ? 'ඍණ ' : raw.startsWith('+') ? 'ධන ' : ''}${words}${fraction ? ` දශම ${fraction.split('').map((digit) => sinhalaNumbers[Number(digit)]).join(' ')}` : ''}`;
  };
  const units = { W: 'වොට්', kW: 'කිලෝවොට්', MW: 'මෙගාවොට්', Wh: 'වොට් පැය', kWh: 'කිලෝවොට් පැය', MWh: 'මෙගාවොට් පැය', '%': 'සියයට' };
  return text.replace(/(^|[\s(])((?:\d{4}-\d{2}-\d{2})|(?:\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)|(?:(?:LKR|Rs\.)\s*)?[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\s*(?:kWh|MWh|Wh|kW|MW|W|%))?)(?![.,]\d)(?=$|[\s),;.!?])/g, (match, prefix, expression) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(expression)) {
      const [year, month, day] = expression.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (year < 100 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return match;
      return `${prefix}වර්ෂය ${sinhalaNumber(year)}, ${sinhalaMonths[month - 1]} මස, දින ${sinhalaNumber(day)}`;
    }
    const time = expression.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
    if (time) {
      let hour = Number(time[1]); const minute = Number(time[2]);
      if (minute > 59 || hour > (time[3] ? 12 : 23) || (time[3] && hour === 0)) return match;
      if (time[3]) hour = hour % 12 + (time[3] === 'PM' ? 12 : 0);
      return `${prefix}${hour < 12 ? 'පෙරවරු' : 'පස්වරු'} පැය ${sinhalaNumber(hour % 12 || 12)}${minute ? ` මිනිත්තු ${sinhalaNumber(minute)}` : ' හරියටම'}`;
    }
    const parsed = expression.match(/^(?:(LKR|Rs\.)\s*)?([+-]?[\d,]+(?:\.\d+)?)(?:\s*(kWh|MWh|Wh|kW|MW|W|%))?$/);
    if (!parsed) return match;
    const spoken = number(parsed[2]);
    if (!spoken || (parsed[1] && parsed[3])) return match;
    return `${prefix}${parsed[1] ? 'රුපියල් ' : ''}${parsed[3] === '%' ? 'සියයට ' : ''}${spoken}${parsed[3] && parsed[3] !== '%' ? ` ${units[parsed[3]]}` : ''}`;
  });
}

export function buildProposalSpeech(proposal = {}, speechLocale) {
  const content = [proposal.title, proposal.summary, proposal.description, proposal.benefits, proposal.householdImpact].map(clean);
  const language = speechLocale || detectSpeechLanguage(content.join(' '));
  const date = (value) => {
    if (!value || !['string', 'number'].includes(typeof value) && !(value instanceof Date) || Number.isNaN(new Date(value).getTime())) return '';
    if (language === 'si-LK') return formatSinhalaSpeechDate(value);
    return new Date(value).toLocaleString(language, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  const cost = language === 'si-LK' ? formatSinhalaSpeechCost(proposal.estimatedCost) : proposal.estimatedCost !== null && proposal.estimatedCost !== undefined && String(proposal.estimatedCost).trim() !== '' && Number.isFinite(Number(proposal.estimatedCost)) ? formatEstimatedCost(proposal.estimatedCost) : '';
  const spokenContent = language === 'si-LK' ? content.map(normalizeSinhalaSpeechNumbers) : content;
  const values = [...spokenContent.slice(0, 4), cost, spokenContent[4], clean(proposal.proposer?.name), date(proposal.votingStartDate), date(proposal.votingDeadline)];
  return { language, text: values.map((value, index) => value ? `${labels[language][index]}: ${value}${/[.!?។]$/.test(value) ? '' : '.'}` : '').filter(Boolean).join('\n\n') };
}

// Playback-only segments follow the existing visible content order.
export function buildProposalSpeechSegments(proposal = {}) {
  const fallback = detectSpeechLanguage([proposal.title, proposal.summary, proposal.description, proposal.benefits, proposal.householdImpact].map(clean).join(' '));
  return [
    ['title', 'Title', proposal.title], ['summary', 'Summary', proposal.summary],
    ['votingStartDate', 'Voting starts', proposal.votingStartDate],
    ['votingDeadline', 'Voting deadline', proposal.votingDeadline],
    ['description', 'About this proposal', proposal.description],
    ['benefits', 'Expected benefits', proposal.benefits],
    ['estimatedCost', 'Estimated cost', proposal.estimatedCost],
    ['householdImpact', 'Household impact', proposal.householdImpact],
    ['proposer', 'Proposed by', proposal.proposer?.name],
  ].flatMap(([key, label, value]) => {
    const numeric = key === 'estimatedCost';
    const date = key === 'votingStartDate' || key === 'votingDeadline';
    if (numeric ? !['number', 'string'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 : !date && !clean(value)) return [];
    const language = numeric || date ? fallback : detectSpeechLanguage(clean(value));
    const text = buildProposalSpeech({ [key]: key === 'proposer' ? { name: value } : value }, language).text;
    return text ? [{ key, label, text, language }] : [];
  });
}

export function selectSpeechVoice(voices, language) {
  const normalize = (locale) => String(locale || '').replace(/_/g, '-').toLowerCase();
  const matching = voices.filter((voice) => normalize(voice.language).split('-')[0] === language.split('-')[0]);
  const score = (voice) => (normalize(voice.language) === normalize(language) ? 2 : 0) + (voice.quality === 'Enhanced' ? 1 : 0);
  // Prefer the requested regional pronunciation, then enhanced quality when offered.
  return matching.sort((a, b) => score(b) - score(a))[0];
}

export function chunkSpeech(text, limit = 1000) {
  const chunks = [];
  let remaining = text.trim();
  const max = Math.max(2, Math.min(1000, Number(limit) || 1000));
  while (remaining.length > max) {
    const sentenceEnds = [...remaining.slice(0, max).matchAll(/[.!?។](?:\s|$)|\n\n/g)];
    const sentenceEnd = sentenceEnds.length ? sentenceEnds.at(-1).index + sentenceEnds.at(-1)[0].length : 0;
    let end = sentenceEnd >= max / 2 ? sentenceEnd : remaining.lastIndexOf(' ', max);
    if (end < max / 2) end = max;
    // Do not separate a UTF-16 surrogate pair at a hard boundary.
    if (/[\uD800-\uDBFF]/.test(remaining[end - 1])) end -= 1;
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}
