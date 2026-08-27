import fs from 'node:fs';
import path from 'node:path';

interface PersistedVisitorData {
  total_visitors: number;
  unique_hashes: string[];
  last_updated: string;
}

// In-memory active presence tracker: sessionId/visitorKey -> lastSeenTimestamp
export const activePresenceMap = new Map<string, number>();

// In-memory persistent tracking state
let totalVisitors = 13;
const uniqueHashesSet = new Set<string>();
let isLoaded = false;

const POSSIBLE_STORE_PATHS = [
  '/var/lib/flexai/visitors.json',
  '/var/tmp/flexai_visitors.json',
  path.resolve(process.cwd(), 'data', 'visitors.json'),
  '/tmp/flexai_visitors.json',
];

function getPrimaryStorePath(): string {
  try {
    if (fs.existsSync('/var/lib/flexai') || process.platform === 'linux') {
      return '/var/lib/flexai/visitors.json';
    }
  } catch {}
  try {
    return path.resolve(process.cwd(), 'data', 'visitors.json');
  } catch {
    return '/tmp/flexai_visitors.json';
  }
}

function loadPersistedData() {
  if (isLoaded) return;
  isLoaded = true;

  for (const filePath of POSSIBLE_STORE_PATHS) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed: PersistedVisitorData = JSON.parse(raw);
        if (parsed && typeof parsed.total_visitors === 'number') {
          totalVisitors = Math.max(totalVisitors, parsed.total_visitors, parsed.unique_hashes?.length || 0);
          if (Array.isArray(parsed.unique_hashes)) {
            for (const h of parsed.unique_hashes) {
              if (h) uniqueHashesSet.add(h);
            }
          }
        }
      }
    } catch {}
  }
}

// Load immediately on startup
loadPersistedData();

function saveToDiskSync() {
  const dataToSave: PersistedVisitorData = {
    total_visitors: Math.max(totalVisitors, uniqueHashesSet.size),
    unique_hashes: Array.from(uniqueHashesSet).slice(-50000),
    last_updated: new Date().toISOString(),
  };
  const jsonStr = JSON.stringify(dataToSave, null, 2);

  const targets = [
    getPrimaryStorePath(),
    path.resolve(process.cwd(), 'data', 'visitors.json'),
    '/var/tmp/flexai_visitors.json',
  ];

  for (const p of targets) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(p, jsonStr, 'utf-8');
    } catch {}
  }
}

export function recordVisitorHit(visitorKey: string): { online_users: number; total_visitors: number } {
  loadPersistedData();

  const now = Date.now();

  // 1. Update online presence timestamp
  if (visitorKey) {
    activePresenceMap.set(visitorKey, now);

    // 2. Track unique visitor permanently
    if (!uniqueHashesSet.has(visitorKey)) {
      uniqueHashesSet.add(visitorKey);
      totalVisitors = Math.max(totalVisitors + 1, uniqueHashesSet.size);
      saveToDiskSync();
    }
  }

  // 3. Prune sessions older than 25 seconds for snappy real-time presence
  const cutoff = now - 25 * 1000;
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
  const cutoff = now - 25 * 1000;
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
