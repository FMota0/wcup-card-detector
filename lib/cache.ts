const inMemoryCache: { [key: string]: {
  content: string,
  ttl: number,
} } = {};

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function exists(key: string) {
  return key in inMemoryCache && inMemoryCache[key].ttl > Date.now();
}

export function get<T>(key: string) {
  if (!exists(key)) {
    return null;
  }
  return JSON.parse(inMemoryCache[key].content) as T;
}

export function set<T>(key: string, content: T) {
  inMemoryCache[key] = {
    content: JSON.stringify(content),
    ttl: Date.now() + CACHE_TTL,
  };
}

