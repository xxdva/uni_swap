// Лента новостей для главной: RSS без ключей и без собственной БД.
// Источник — поиск Google News (RSS) на языке интерфейса (ru/en/kk) плюс
// RSS DigitalBusiness.kz для русского. Каждый запрос кэшируется Next на час
// (fetch + revalidate), так что главная не ходит во внешние сервисы на
// каждый визит; любая ошибка источника просто даёт пустой список.
// Это не машинный перевод: для en/kk берутся статьи, опубликованные на этих
// языках; если их мало, список добирается русскими.
import { regionLabel } from "./i18n/labels";

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  date: string; // ISO
  region?: string; // русское название региона — ключ (подпись переводится при показе)
};

type Lang = "ru" | "en" | "kk";
type Region = { name: string; pattern: RegExp };

// Регион определяем по заголовку (на трёх языках) — поиск Google иногда
// подмешивает чужие города.
export const REGIONS: Region[] = [
  { name: "Астана", pattern: /астан|нур-султан|astana|nur-sultan/i },
  { name: "Алматы", pattern: /алмат|almaty/i },
  { name: "Шымкент", pattern: /шымкент|shymkent/i },
  { name: "Караганда", pattern: /караганд|қарағанд|karaganda|qaraghandy/i },
  { name: "Актобе", pattern: /актобе|актюбин|ақтөбе|aktobe/i },
  { name: "Атырау", pattern: /атырау|atyrau/i },
  { name: "Павлодар", pattern: /павлодар|pavlodar/i },
  { name: "Костанай", pattern: /костанай|қостанай|kostanay|kostanai/i },
  { name: "Усть-Каменогорск", pattern: /усть-камен|өскемен|оскемен|восточно-казахстан|ust-kamenogorsk|oskemen/i },
  { name: "Актау", pattern: /актау|мангистау|ақтау|aktau|mangystau/i },
  { name: "Уральск", pattern: /уральск|западно-казахстан|орал|uralsk|oral\b/i },
  { name: "Семей", pattern: /семей|semey|semipalatinsk/i },
];

const KZ_PATTERN =
  /казахстан|қазақстан|kazakh|qazaq|\bkz\b|астан|astana|алмат|almaty|шымкент|shymkent|караганд|қарағанд|karaganda|актобе|ақтөбе|aktobe|атырау|atyrau|павлодар|pavlodar|костанай|қостанай|kostanay|актау|ақтау|aktau|уральск|орал\b|uralsk|семей|semey|өскемен|оскемен|oskemen/i;

const EVENT_PATTERN =
  /хакатон|hackathon|challenge|кубок|конкурс|чемпионат|олимпиад|стартап|startup|кодинг|coding|байқау|жарыс|contest|competition|championship|olympiad|\bcup\b/i;

// Короткие слова (ИТ, ИИ, IT, AI) — только как отдельные слова, иначе
// «ит» совпадёт с половиной русского языка.
const IT_PATTERN =
  /(?<![а-яёa-z])(?:ит|it|ии|ai|жи)(?![а-яёa-z])|цифров|санды|искусственн|технолог|стартап|программ|кибер|данн|робот|приложен|финтех|хакатон|дрон|нейросет|разработ|платформ|digital|интернет|смартфон|гаджет|software|tech|startup|cyber|fintech|drone|robot|data|internet|app\b/i;

// Казахские буквы, которых нет в русском — по ним отличаем kk-статьи от ru.
const KAZAKH_LETTERS = /[әғқңөұүһі]/i;

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .trim();

const tag = (block: string, name: string) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};

function parseRss(xml: string, fallbackSource: string): NewsItem[] {
  const items: NewsItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1];
    let title = tag(block, "title");
    const url = tag(block, "link");
    const time = Date.parse(tag(block, "pubDate"));
    if (!title || !/^https?:\/\//.test(url) || Number.isNaN(time)) continue;

    // У Google News источник добавлен в конец заголовка: «Заголовок - Издание».
    const rawSource = tag(block, "source") || fallbackSource;
    const suffix = ` - ${rawSource}`;
    if (title.endsWith(suffix)) title = title.slice(0, -suffix.length);
    const source = /^https?:\/\//.test(rawSource) ? new URL(rawSource).hostname.replace(/^www\./, "") : rawSource;

    items.push({ title, url, source, date: new Date(time).toISOString() });
  }
  return items;
}

async function fetchRss(url: string, fallbackSource: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (UniSwap news)" },
    });
    if (!res.ok) return [];
    return parseRss(await res.text(), fallbackSource);
  } catch {
    return [];
  }
}

const EDITION: Record<Lang, string> = {
  ru: "hl=ru&gl=KZ&ceid=KZ:ru",
  en: "hl=en&gl=KZ&ceid=KZ:en",
  kk: "hl=kk&gl=KZ&ceid=KZ:kk",
};

const googleNews = (query: string, lang: Lang) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${EDITION[lang]}`;

const QUERY: Record<Lang, { hackathon: string; country: string; it: string }> = {
  ru: { hackathon: "хакатон", country: "Казахстан", it: "IT технологии Казахстан" },
  en: { hackathon: "hackathon", country: "Kazakhstan", it: "IT technology Kazakhstan" },
  kk: { hackathon: "хакатон", country: "Қазақстан", it: "ақпараттық технологиялар Қазақстан" },
};

const byDateDesc = (a: NewsItem, b: NewsItem) => b.date.localeCompare(a.date);

function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = i.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Для kk оставляем в приоритете статьи с казахскими буквами в заголовке.
function languageFilter(items: NewsItem[], lang: Lang): NewsItem[] {
  if (lang === "kk") return items.filter((i) => KAZAKH_LETTERS.test(i.title));
  if (lang === "en") return items.filter((i) => !/[а-яё]/i.test(i.title));
  return items;
}

async function hackathonsFor(lang: Lang): Promise<NewsItem[]> {
  const q = QUERY[lang];
  const [general, ...perRegion] = await Promise.all([
    fetchRss(googleNews(`${q.hackathon} ${q.country} when:120d`, lang), "Google News"),
    ...REGIONS.map((r) =>
      fetchRss(googleNews(`${q.hackathon} ${regionLabel(r.name, lang)} when:120d`, lang), "Google News")
    ),
  ]);

  const tagged: NewsItem[] = [];
  const isEvent = (i: NewsItem) => EVENT_PATTERN.test(i.title);
  perRegion.forEach((items, i) => {
    const region = REGIONS[i];
    for (const item of languageFilter(items, lang)) {
      if (isEvent(item) && region.pattern.test(item.title)) tagged.push({ ...item, region: region.name });
    }
  });
  // Общий поиск по стране: оставляем только то, что относится к Казахстану,
  // и пробуем присвоить регион по заголовку.
  for (const item of languageFilter(general, lang)) {
    if (!isEvent(item) || !KZ_PATTERN.test(item.title)) continue;
    const region = REGIONS.find((r) => r.pattern.test(item.title));
    tagged.push({ ...item, region: region?.name });
  }

  return dedupe(tagged.sort(byDateDesc));
}

async function itNewsFor(lang: Lang): Promise<NewsItem[]> {
  const [feed, search] = await Promise.all([
    lang === "ru" ? fetchRss("https://digitalbusiness.kz/feed/", "DigitalBusiness.kz") : Promise.resolve([]),
    fetchRss(googleNews(`${QUERY[lang].it} when:14d`, lang), "Google News"),
  ]);
  const kz = languageFilter(search, lang).filter((i) => KZ_PATTERN.test(i.title));
  const it = feed.filter((i) => IT_PATTERN.test(i.title));
  return dedupe([...it, ...kz].sort(byDateDesc));
}

// Если на en/kk нашлось мало статей, добираем русскими, чтобы блок не был пустым.
const MIN_LOCALIZED = 4;

export async function getHackathonNews(lang: Lang = "ru"): Promise<NewsItem[]> {
  const own = await hackathonsFor(lang);
  if (lang === "ru" || own.length >= MIN_LOCALIZED) return own.slice(0, 40);
  const ru = await hackathonsFor("ru");
  return dedupe([...own, ...ru]).slice(0, 40);
}

export async function getItNews(lang: Lang = "ru"): Promise<NewsItem[]> {
  const own = await itNewsFor(lang);
  if (lang === "ru" || own.length >= MIN_LOCALIZED) return own.slice(0, 8);
  const ru = await itNewsFor("ru");
  return dedupe([...own, ...ru]).slice(0, 8);
}
