// Лента новостей для главной: RSS без ключей и без собственной БД.
// Хакатоны по регионам Казахстана — через поиск Google News (RSS), IT-новости
// страны — RSS DigitalBusiness.kz. Каждый запрос кэшируется Next на час
// (fetch + revalidate), так что главная не ходит во внешние сервисы на
// каждый визит; любая ошибка источника просто даёт пустой список.

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  date: string; // ISO
  region?: string;
};

type Region = { name: string; pattern: RegExp };

// Регион определяем по заголовку — поиск Google иногда подмешивает чужие города.
export const REGIONS: Region[] = [
  { name: "Астана", pattern: /астан|нур-султан\b|astana/i },
  { name: "Алматы", pattern: /алмат|almaty/i },
  { name: "Шымкент", pattern: /шымкент|shymkent/i },
  { name: "Караганда", pattern: /караганд|karaganda/i },
  { name: "Актобе", pattern: /актобе|актюбин/i },
  { name: "Атырау", pattern: /атырау/i },
  { name: "Павлодар", pattern: /павлодар/i },
  { name: "Костанай", pattern: /костанай|қостанай/i },
  { name: "Усть-Каменогорск", pattern: /усть-камен|өскемен|оскемен|восточно-казахстан/i },
  { name: "Актау", pattern: /актау|мангистау/i },
  { name: "Уральск", pattern: /уральск|западно-казахстан/i },
  { name: "Семей", pattern: /семей/i },
];

const KZ_PATTERN = /казахстан|қазақстан|kazakh|\bkz\b|астан|алмат|шымкент|караганд|актобе|атырау|павлодар|костанай|актау|уральск|семей|өскемен|оскемен/i;

const EVENT_PATTERN = /хакатон|hackathon|challenge|кубок|конкурс|чемпионат|олимпиад|стартап|startup|кодинг|coding/i;
// Короткие слова (ИТ, ИИ, IT, AI) — только как отдельные слова, иначе
// «ит» совпадёт с половиной русского языка.
const IT_PATTERN = /(?<![а-яёa-z])(?:ит|it|ии|ai)(?![а-яёa-z])|цифров|искусственн|технолог|стартап|программ|кибер|данн|робот|приложен|финтех|хакатон|дрон|нейросет|разработ|платформ|digital|интернет|смартфон|гаджет/i;

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

const googleNews = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ru&gl=KZ&ceid=KZ:ru`;

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

export async function getHackathonNews(): Promise<NewsItem[]> {
  const [general, ...perRegion] = await Promise.all([
    fetchRss(googleNews("хакатон Казахстан when:120d"), "Google News"),
    ...REGIONS.map((r) => fetchRss(googleNews(`хакатон ${r.name} when:120d`), "Google News")),
  ]);

  const tagged: NewsItem[] = [];
  const isEvent = (i: NewsItem) => EVENT_PATTERN.test(i.title);
  perRegion.forEach((items, i) => {
    const region = REGIONS[i];
    for (const item of items) {
      if (isEvent(item) && region.pattern.test(item.title)) tagged.push({ ...item, region: region.name });
    }
  });
  // Общий поиск по стране: оставляем только то, что относится к Казахстану,
  // и пробуем присвоить регион по заголовку.
  for (const item of general) {
    if (!isEvent(item) || !KZ_PATTERN.test(item.title)) continue;
    const region = REGIONS.find((r) => r.pattern.test(item.title));
    tagged.push({ ...item, region: region?.name });
  }

  return dedupe(tagged.sort(byDateDesc)).slice(0, 40);
}

export async function getItNews(): Promise<NewsItem[]> {
  const [feed, search] = await Promise.all([
    fetchRss("https://digitalbusiness.kz/feed/", "DigitalBusiness.kz"),
    fetchRss(googleNews("IT технологии Казахстан when:14d"), "Google News"),
  ]);
  const kz = search.filter((i) => KZ_PATTERN.test(i.title));
  const it = feed.filter((i) => IT_PATTERN.test(i.title));
  return dedupe([...it, ...kz].sort(byDateDesc)).slice(0, 8);
}
