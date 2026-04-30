import fs from "node:fs/promises";
import path from "node:path";

const outDir = new URL("./", import.meta.url);
const api = "https://witcher.fandom.com/api.php";

const sources = [
  {
    faction: "monsters",
    category: "Monsters gwent deck cards",
    page: "https://witcher.fandom.com/wiki/Monsters_Gwent_deck",
  },
  {
    faction: "nilfgaard",
    category: "Nilfgaardian Empire gwent deck cards",
    page: "https://witcher.fandom.com/wiki/Nilfgaardian_Empire_Gwent_deck",
  },
  {
    faction: "northern_realms",
    category: "Northern Realms gwent deck cards",
    page: "https://witcher.fandom.com/wiki/Northern_Realms_Gwent_deck",
  },
  {
    faction: "scoiatael",
    category: "Scoia'tael gwent deck cards",
    page: "https://witcher.fandom.com/wiki/Scoia%27tael_Gwent_deck",
  },
  {
    faction: "skellige",
    category: "Skellige gwent deck cards",
    page: "https://witcher.fandom.com/wiki/Skellige_Gwent_deck",
  },
  {
    faction: "neutral",
    category: "Neutral gwent cards",
    page: "https://witcher.fandom.com/wiki/Gwent_neutral_cards",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (params) => {
  const url = new URL(api);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: {
      "user-agent": "gwent-learning-project catalog audit",
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
};

const categoryMembers = async (category) => {
  const titles = [];
  let cmcontinue;
  do {
    const json = await fetchJson({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category}`,
      cmlimit: "500",
      format: "json",
      ...(cmcontinue ? { cmcontinue } : {}),
    });
    titles.push(...json.query.categorymembers.map((member) => member.title));
    cmcontinue = json.continue?.cmcontinue;
  } while (cmcontinue);
  return titles.filter((title) => !title.startsWith("Category:")).sort();
};

const pageWikitext = async (title) => {
  const json = await fetchJson({
    action: "parse",
    page: title,
    prop: "wikitext",
    format: "json",
  });
  return json.parse?.wikitext?.["*"] ?? "";
};

const findTemplate = (text, name) => {
  const start = text.indexOf(`{{${name}`);
  if (start < 0) return "";
  let depth = 0;
  for (let index = start; index < text.length - 1; index += 1) {
    const pair = text.slice(index, index + 2);
    if (pair === "{{") {
      depth += 1;
      index += 1;
      continue;
    }
    if (pair === "}}") {
      depth -= 1;
      index += 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return "";
};

const cleanWiki = (value = "") =>
  value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\{Gwent close combat\}\}/gi, "close")
    .replace(/\{\{Gwent ranged combat\}\}/gi, "ranged")
    .replace(/\{\{Gwent siege combat\}\}/gi, "siege")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/'''/g, "")
    .replace(/''/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const parseInfobox = (text) => {
  const box = findTemplate(text, "Infobox Gwent Card");
  if (!box) return null;
  const fields = {};
  let currentKey = null;
  for (const rawLine of box.split(/\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^\|([^=]+)=\s*(.*)$/);
    if (match) {
      currentKey = match[1].trim();
      fields[currentKey] = match[2].trim();
    } else if (currentKey && line) {
      fields[currentKey] += ` ${line}`;
    }
  }
  const typeRaw = cleanWiki(fields.type ?? "");
  const abilityRaw = cleanWiki(fields.spec_ability ?? "");
  const rowRaw = cleanWiki(fields.row ?? "");
  return {
    name: cleanWiki(fields.name ?? ""),
    deck: cleanWiki(fields.deck ?? ""),
    typeRaw,
    kind: /hero/i.test(typeRaw) ? "hero" : /special/i.test(typeRaw) ? "special" : "unit",
    rowRaw,
    rows: [
      /close/i.test(rowRaw) ? "close" : null,
      /ranged/i.test(rowRaw) ? "ranged" : null,
      /siege/i.test(rowRaw) ? "siege" : null,
    ].filter(Boolean),
    strength: Number.parseInt(cleanWiki(fields.strength ?? ""), 10),
    abilityRaw,
    inferredAbilities: inferAbilities(abilityRaw, typeRaw, fields.name ?? ""),
    sourceRaw: cleanWiki(fields.source ?? ""),
    image: cleanWiki(fields.image ?? ""),
  };
};

function inferAbilities(abilityRaw, typeRaw, name) {
  const text = `${abilityRaw} ${typeRaw} ${name}`.toLowerCase();
  const abilities = [];
  if (/tight.?bond/.test(text)) abilities.push("tight_bond");
  if (/medic/.test(text)) abilities.push("medic");
  if (/morale/.test(text)) abilities.push("morale_boost");
  if (/\bspy\b/.test(text)) abilities.push("spy");
  if (/muster|summon all|swarm/.test(text)) abilities.push("muster");
  if (/roach/.test(text) && /summon/.test(text)) abilities.push("muster_roach");
  if (/agile|either close.*ranged|close.*or.*ranged/.test(text)) abilities.push("agile");
  if (/scorch/.test(text)) abilities.push("scorch");
  if (/commander.?s horn|double/.test(text)) abilities.push("commanders_horn");
  if (/decoy/.test(text)) abilities.push("decoy");
  if (/mardroeme/.test(text)) abilities.push("mardroeme");
  if (/berserker/.test(text)) abilities.push("berserker");
  if (/removed from the battlefield|take its place|bovine|hemdall|transform/.test(text)) {
    abilities.push("summon");
  }
  if (/clear weather/.test(text)) abilities.push("clear_weather");
  if (/biting frost|sets.*close/.test(text)) abilities.push("frost");
  if (/impenetrable fog|sets.*ranged/.test(text)) abilities.push("fog");
  if (/torrential rain|sets.*siege/.test(text)) abilities.push("rain");
  if (/skellige storm/.test(text)) abilities.push("skellige_storm");
  return [...new Set(abilities.length ? abilities : ["none"])];
}

const normalizeName = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parseCurrentCatalog = async () => {
  const cardDir = path.resolve("src/data/catalog/cards");
  const files = (await fs.readdir(cardDir)).filter(
    (file) => file.endsWith(".ts") && !["index.ts", "official-promotion.ts"].includes(file),
  );
  const records = [];
  for (const file of files) {
    const text = await fs.readFile(path.join(cardDir, file), "utf8");
    const blocks = text.match(/\{\n\s+sourceId:[\s\S]*?\n\s+\}/g) ?? [];
    for (const block of blocks) {
      const sourceId = block.match(/sourceId: "([^"]+)"/)?.[1];
      const name = block.match(/name: "([^"]+)"/)?.[1];
      if (!sourceId || !name) continue;
      const kind = block.match(/kind: "([^"]+)"/)?.[1];
      const strength = Number.parseInt(block.match(/strength: ([0-9-]+)/)?.[1] ?? "", 10);
      const rows = [...(block.match(/rows: \[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map(
        (match) => match[1],
      );
      const abilities = [
        ...(block.match(/abilities: \[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g),
      ].map((match) => match[1]);
      const linkedSourceIds = [
        ...(block.match(/linkedSourceIds: \[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g),
      ].map((match) => match[1]);
      const deckLimit = Number.parseInt(block.match(/deckLimit: ([0-9-]+)/)?.[1] ?? "", 10);
      records.push({
        sourceId,
        faction: sourceId.split(".")[0],
        name,
        normalizedName: normalizeName(name),
        kind,
        strength,
        rows,
        abilities,
        linkedSourceIds,
        deckLimit,
      });
    }
  }
  return records;
};

const compare = (wikiCards, currentCards) => {
  const currentByName = new Map();
  currentCards.forEach((card) => {
    const list = currentByName.get(card.normalizedName) ?? [];
    list.push(card);
    currentByName.set(card.normalizedName, list);
  });
  const missingInCatalog = [];
  const matched = [];
  const mismatches = [];
  for (const wiki of wikiCards) {
    const candidates = currentByName.get(normalizeName(wiki.name)) ?? [];
    const current =
      candidates.find((candidate) => candidate.faction === wiki.faction) ??
      candidates.find((candidate) => candidate.faction === "neutral" || wiki.faction === "neutral") ??
      candidates[0];
    if (!current) {
      missingInCatalog.push(wiki);
      continue;
    }
    matched.push({ wiki, current });
    const issues = [];
    if (wiki.kind && current.kind && wiki.kind !== current.kind) {
      issues.push({ field: "kind", wiki: wiki.kind, current: current.kind });
    }
    if (Number.isFinite(wiki.strength) && Number.isFinite(current.strength) && wiki.strength !== current.strength) {
      issues.push({ field: "strength", wiki: wiki.strength, current: current.strength });
    }
    const wikiRows = wiki.rows.join(",");
    const currentRows = current.rows.join(",");
    if (wikiRows && currentRows && wikiRows !== currentRows) {
      issues.push({ field: "rows", wiki: wiki.rows, current: current.rows });
    }
    const wikiAbilities = wiki.inferredAbilities.filter((ability) => ability !== "none").sort();
    const currentAbilities = current.abilities.filter((ability) => ability !== "none").sort();
    const missingAbilities = wikiAbilities.filter((ability) => !currentAbilities.includes(ability));
    const extraAbilities = currentAbilities.filter((ability) => !wikiAbilities.includes(ability));
    if (missingAbilities.length || extraAbilities.length) {
      issues.push({ field: "abilities", wiki: wikiAbilities, current: currentAbilities, missingAbilities, extraAbilities });
    }
    if (issues.length) mismatches.push({ wiki, current, issues });
  }
  return { missingInCatalog, matched, mismatches };
};

const main = async () => {
  await fs.mkdir(outDir, { recursive: true });
  const wikiCards = [];
  const categorySnapshots = {};
  for (const source of sources) {
    const titles = await categoryMembers(source.category);
    categorySnapshots[source.category] = titles;
    for (const title of titles) {
      await sleep(35);
      const text = await pageWikitext(title);
      const parsed = parseInfobox(text);
      if (!parsed) continue;
      wikiCards.push({
        ...parsed,
        title,
        pageUrl: `https://witcher.fandom.com/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
        faction: source.faction,
        sourcePage: source.page,
      });
    }
  }
  const currentCards = await parseCurrentCatalog();
  const comparison = compare(wikiCards, currentCards);
  const snapshot = {
    generatedAt: new Date().toISOString(),
    source: "witcher.fandom.com MediaWiki API",
    sources,
    categorySnapshots,
    wikiCards,
    currentCards,
    comparison,
  };
  await fs.writeFile(new URL("fandom-card-snapshot.json", outDir), JSON.stringify(snapshot, null, 2));
  const lines = [];
  lines.push("# Witcher Fandom Card Source Triage - 2026-04-30", "");
  lines.push("Source: Witcher Fandom MediaWiki API snapshots from the six pages requested by the user.", "");
  lines.push("## Counts", "");
  lines.push(`- Wiki card pages parsed: ${wikiCards.length}`);
  lines.push(`- Current catalog cards parsed: ${currentCards.length}`);
  lines.push(`- Name matches: ${comparison.matched.length}`);
  lines.push(`- Wiki cards missing in current catalog by name: ${comparison.missingInCatalog.length}`);
  lines.push(`- Matched records with inferred field differences: ${comparison.mismatches.length}`);
  lines.push("");
  lines.push("## High-Signal Missing Wiki Cards", "");
  comparison.missingInCatalog
    .filter((card) => ["Hemdall", "Clear Weather", "Biting Frost", "Impenetrable Fog", "Torrential Rain"].includes(card.name) || /Hemdall|Kambi|Cow|Bovine/i.test(card.name))
    .forEach((card) => lines.push(`- ${card.name} (${card.faction}, ${card.kind}, ${card.rows.join("/") || "no row"}, ${Number.isFinite(card.strength) ? card.strength : "n/a"}): ${card.abilityRaw}`));
  lines.push("");
  lines.push("## Selected Mismatches / Review Items", "");
  comparison.mismatches
    .filter(({ wiki, current, issues }) =>
      /Kambi|Cerys|Schirru|Clan Dimun|Cow|Bovine|Arachas|Roach|Geralt|Cirilla|Isengrim/i.test(`${wiki.name} ${current.sourceId}`) ||
      issues.some((issue) => ["kind", "strength", "rows"].includes(issue.field)),
    )
    .slice(0, 80)
    .forEach(({ wiki, current, issues }) => {
      lines.push(`- ${wiki.name} -> ${current.sourceId}`);
      lines.push(`  - Wiki: ${wiki.kind}, rows=${wiki.rows.join("/") || "-"}, strength=${Number.isFinite(wiki.strength) ? wiki.strength : "-"}, inferred=${wiki.inferredAbilities.join(", ")}`);
      lines.push(`  - Current: ${current.kind}, rows=${current.rows.join("/") || "-"}, strength=${Number.isFinite(current.strength) ? current.strength : "-"}, abilities=${current.abilities.join(", ")}`);
      lines.push(`  - Raw ability: ${wiki.abilityRaw || "-"}`);
      lines.push(`  - Issues: ${issues.map((issue) => issue.field).join(", ")}`);
    });
  await fs.writeFile(new URL("fandom-current-catalog-triage.md", outDir), lines.join("\n"));
  console.log(JSON.stringify({
    wikiCards: wikiCards.length,
    currentCards: currentCards.length,
    missing: comparison.missingInCatalog.length,
    mismatches: comparison.mismatches.length,
    output: "audit/scrapes/2026-04-30-witcher-fandom/fandom-card-snapshot.json",
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
