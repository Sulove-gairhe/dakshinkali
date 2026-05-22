export type CompareField = {
  label: string;
  value: string;
};

export function extractCompareFieldsFromSpecs(specs: Record<string, unknown>): CompareField[] {
  const fields: CompareField[] = [];

  for (const [key, value] of Object.entries(specs)) {
    if (['features', 'badge', 'oldPrice', 'image', 'images', 'shortDescription', 'description'].includes(key)) {
      continue;
    }

    const rendered = renderSpecValue(value);
    if (!rendered) {
      continue;
    }

    fields.push({
      label: humanizeKey(key),
      value: rendered,
    });
  }

  return fields;
}

function renderSpecValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const rendered = value
      .map((item) => renderSpecValue(item))
      .filter((item): item is string => Boolean(item));

    return rendered.length > 0 ? rendered.join(', ') : null;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return null;
    }

    return entries
      .map(([entryKey, entryValue]) => `${humanizeKey(entryKey)}: ${renderSpecValue(entryValue) ?? '-'}`)
      .join(', ');
  }

  return null;
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
