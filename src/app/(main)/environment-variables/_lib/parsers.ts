export function parseJsonToItems(json: unknown): { key: string; value: string }[] {
  if (!json || typeof json !== 'object') return [];
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.items)) {
    const items: { key: string; value: string }[] = [];
    for (const x of obj.items) {
      if (!x || typeof x !== 'object') continue;
      const entry = x as { name?: string; key?: string; value?: unknown };
      const key = String((entry.key ?? entry.name) ?? '').trim();
      if (!key) continue;
      items.push({ key, value: entry.value != null ? String(entry.value) : '' });
    }
    return items;
  }
  const items: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const trimmed = key.trim();
    if (!trimmed) continue;
    items.push({ key: trimmed, value: value != null ? String(value) : '' });
  }
  return items;
}

export function parseEnvToItems(text: string): { key: string; value: string }[] {
  const items: { key: string; value: string }[] = [];
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) {
      i++;
      continue;
    }
    const key = trimmed.slice(0, eqIdx).trim();
    if (!key) {
      i++;
      continue;
    }
    let valueStr = trimmed.slice(eqIdx + 1).trim();
    if (valueStr.startsWith('"')) {
      let val = '';
      let j = 1;
      while (j < valueStr.length) {
        const c = valueStr[j];
        if (c === '\\' && j + 1 < valueStr.length) {
          const next = valueStr[j + 1];
          if (next === 'n') val += '\n';
          else if (next === 'r') val += '\r';
          else if (next === 't') val += '\t';
          else if (next === '"') val += '"';
          else val += next;
          j += 2;
          continue;
        }
        if (c === '"') break;
        val += c;
        j++;
      }
      valueStr = val;
    } else if (valueStr.startsWith("'")) {
      const end = valueStr.indexOf("'", 1);
      valueStr = end >= 0 ? valueStr.slice(1, end).replace(/''/g, "'") : valueStr.slice(1);
    }
    items.push({ key, value: valueStr });
    i++;
  }
  return items;
}
