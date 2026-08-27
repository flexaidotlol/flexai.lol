import fs from 'node:fs';
import path from 'node:path';

interface PersistedVisitorData {
  total_visitors: number;
  unique_hashes: string[];
  last_updated: string;
}

// In-memory active presence tracker: sessionId/visitorKey -> lastSeenTimestamp
export const activePresenceMap = new Map<string, number>();

// In-memory cache for fast lookups
let totalVisitors = 7;
const uniqueHashesSet = new Set<string>();
let isLoaded = false;
let saveTimeout: any = null;

function getStorePath(): string {
  try {
    return path.resolve(process.cwd(), 'data', 'visitors.json');
  } catch {
    return '/tmp/flexai_visitors.json';
  }
}

function loadPersistedData() {
  if (isLoaded) return;
  isLoaded = true;
  try {
    const filePath = getStorePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed: PersistedVisitorData = JSON.parse(raw);
      totalVisitors = Math.max(parsed.total_visitors || 7, parsed.unique_hashes?.length || 0);
      if (Array.isArray(parsed.unique_hashes)) {
        for (const h of parsed.unique_hashes) {
          uniqueHashesSet.add(h);
        }
      }
    }
  } catch (err) {
    // Non-fatal, fallback to memory
  }
}

function scheduleSave() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      const filePath = getStorePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const dataToSave: PersistedVisitorData = {
        total_visitors: Math.max(totalVisitors, uniqueHashesSet.size),
        unique_hashes: Array.from(uniqueHashesSet).slice(-20000),
        last_updated: new Date().toISOString(),
      };
      fs.writeFileSync(filePath, JSON.stringify(dataToSave), 'utf-8');
    } catch (err) {
      // Non-fatal
    }
  }, 2000);
}

export function recordVisitorHit(visitorKey: string): { online_users: number; total_visitors: number } {
  loadPersistedData();

  const now = Date.now();

  // 1. Update online presence timestamp
  activePresenceMap.set(visitorKey, now);

  // 2. Track unique visitor permanently
  if (!uniqueHashesSet.has(visitorKey)) {
    uniqueHashesSet.add(visitorKey);
    totalVisitors += 1;
    scheduleSave();
  }

  // 3. Prune sessions older than 45 seconds
  const cutoff = now - 45 * 1000;
  for (const [id, lastSeen] of activePresenceMap.entries()) {
    if (lastSeen < cutoff) {
      activePresenceMap.delete(id);
    }
  }

  const onlineCount = Math.max(1, activePresenceMap.size);

  return {
    online_users: onlineCount,
    total_visitors: Math.max(totalVisitors, uniqueHashesSet.size),
  };
}

export function getVisitorStats(): { online_users: number; total_visitors: number } {
  loadPersistedData();
  const now = Date.now();
  const cutoff = now - 45 * 1000;
  for (const [id, lastSeen] of activePresenceMap.entries()) {
    if (lastSeen < cutoff) {
      activePresenceMap.delete(id);
    }
  }
  return {
    online_users: Math.max(1, activePresenceMap.size),
    total_visitors: Math.max(totalVisitors, uniqueHashesSet.size),
  };
}
