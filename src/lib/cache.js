/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 * 
 * In-memory cache helper suited for short-lived Serverless containers
 */
let cacheStore = new Map();

class Cache {
  constructor(defaultTtlSeconds = 300) {
    this.defaultTtl = defaultTtlSeconds * 1000;
  }

  get(key) {
    const item = cacheStore.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      cacheStore.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttlSeconds = null) {
    const ttl = ttlSeconds !== null ? ttlSeconds * 1000 : this.defaultTtl;
    const expiresAt = Date.now() + ttl;
    cacheStore.set(key, { value, expiresAt });
  }

  clear() {
    cacheStore.clear();
  }
}

export default Cache;
