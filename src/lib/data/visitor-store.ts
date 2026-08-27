import fs from 'node:fs';
import path from 'node:path';

interface PersistedVisitorData {
  total_visitors: number;
  unique_hashes: string[];
  last_updated: string;
}

// Store data in a persistent location
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'visitors.json');

// In-memory active presence tracker: sessionId/visitorKey -> lastSeenTimestamp
export const activePresenceMap = new Map<string, number>();

// In-memory cache for fast lookups
let totalVisitors = 0;
const uniqueHashesSet = new Set<string>();
let isLoaded = false;
let saveTimeout: NodeJS.Timeout | null = null;

function loadPersistedData() {
  if (isLoaded) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: PersistedVisitorData = JSON.parse(raw);
      totalVisitors = Math.max(parsed.total_visitors || 0, parsed.unique_hashes?.length || 0);
      if (Array.isArray(parsed.unique_hashes)) {
        for (const h of parsed.unique_hashes) {
          uniqueHashesSet.add(h);
        }
      }
    } else {
      // Initialize with base visitors
      totalVisitors = 1;
      const initial: PersistedVisitorData = {
        total_visitors: 1,
        unique_hashes: [],
        last_updated: new Date().toISOString(),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error loading visitor data from disk:', err);
    totalVisitors = Math.max(1, totalVisitors);
  }
  isLoaded = true;
}

function scheduleSave() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave: PersistedVisitorData = {
        total_visitors: Math.max(totalVisitors, uniqueHashesSet.size),
        unique_hashes: Array.from(uniqueHashesSet).slice(-50000), // Retain last 50k unique hashes
        last_updated: new Date().toISOString(),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving visitor data to disk:', err);
    }
  }, 1500);
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
