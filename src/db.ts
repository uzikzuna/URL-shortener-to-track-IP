import fs from 'fs/promises';
import path from 'path';
import { Link, Visit, AnalyticsSummary, ActivityLog, AdminUser } from './types';

// Database state & Driver Selection
let useJsonFallback = false;
let dbInstance: any = null;

// JSON Fallback Storage Paths
const jsonDbPath = path.resolve(process.cwd(), 'data_fallback.json');

// Memory State for Fallback Driver
let jsonDbState: {
  links: Link[];
  visits: Visit[];
  activityLogs: ActivityLog[];
  admins: any[];
} = {
  links: [],
  visits: [],
  activityLogs: [],
  admins: []
};

// --- Fallback JSON Driver Helpers ---
async function loadJsonDb() {
  try {
    const content = await fs.readFile(jsonDbPath, 'utf-8');
    jsonDbState = JSON.parse(content);
    if (!jsonDbState.links) jsonDbState.links = [];
    if (!jsonDbState.visits) jsonDbState.visits = [];
    if (!jsonDbState.activityLogs) jsonDbState.activityLogs = [];
    if (!jsonDbState.admins) jsonDbState.admins = [];
  } catch (error) {
    // Start fresh
    jsonDbState = { links: [], visits: [], activityLogs: [], admins: [] };
    await saveJsonDb();
  }
}

async function saveJsonDb() {
  try {
    await fs.writeFile(jsonDbPath, JSON.stringify(jsonDbState, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to persist JSON fallback database:', error);
  }
}

// --- Combined Database Initializer ---
export async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;

  // Try dynamic loading of native SQLite
  try {
    const sqliteModule = await import('sqlite');
    const sqlite3Module = await import('sqlite3');
    
    const dbPath = path.resolve(process.cwd(), 'data.db');
    dbInstance = await sqliteModule.open({
      filename: dbPath,
      driver: sqlite3Module.default.Database,
    });

    // Enable foreign keys
    await dbInstance.run('PRAGMA foreign_keys = ON');

    // Create tables with newly required columns
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        title TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        clicks_count INTEGER DEFAULT 0,
        expires_at TEXT,
        password TEXT,
        enable_preview INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        one_time_use INTEGER DEFAULT 0,
        category TEXT DEFAULT 'Uncategorized',
        tags TEXT,
        clicks_limit INTEGER DEFAULT NULL,
        custom_description TEXT,
        custom_image_url TEXT,
        custom_preview_json TEXT,
        custom_theme_json TEXT
      );

      CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        link_id INTEGER NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        country TEXT DEFAULT 'Unknown',
        region TEXT DEFAULT 'Unknown',
        city TEXT DEFAULT 'Unknown',
        latitude REAL DEFAULT NULL,
        longitude REAL DEFAULT NULL,
        browser TEXT DEFAULT 'Unknown',
        device TEXT DEFAULT 'Unknown',
        referrer TEXT DEFAULT 'Direct',
        ip_hash TEXT,
        FOREIGN KEY (link_id) REFERENCES links (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        action TEXT NOT NULL,
        details TEXT,
        ip TEXT
      );

      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
      CREATE INDEX IF NOT EXISTS idx_visits_link_id ON visits(link_id);
      CREATE INDEX IF NOT EXISTS idx_visits_timestamp ON visits(timestamp);
    `);

    // Safe incremental migrations for existing DB schemas
    const migrations = [
      'ALTER TABLE links ADD COLUMN expires_at TEXT',
      'ALTER TABLE links ADD COLUMN password TEXT',
      'ALTER TABLE links ADD COLUMN enable_preview INTEGER DEFAULT 1',
      'ALTER TABLE links ADD COLUMN is_active INTEGER DEFAULT 1',
      'ALTER TABLE links ADD COLUMN one_time_use INTEGER DEFAULT 0',
      "ALTER TABLE links ADD COLUMN category TEXT DEFAULT 'Uncategorized'",
      'ALTER TABLE links ADD COLUMN tags TEXT',
      'ALTER TABLE links ADD COLUMN clicks_limit INTEGER DEFAULT NULL',
      'ALTER TABLE links ADD COLUMN custom_description TEXT',
      'ALTER TABLE links ADD COLUMN custom_image_url TEXT',
      'ALTER TABLE links ADD COLUMN custom_preview_json TEXT',
      'ALTER TABLE links ADD COLUMN custom_theme_json TEXT',
      "ALTER TABLE visits ADD COLUMN city TEXT DEFAULT 'Unknown'",
      'ALTER TABLE visits ADD COLUMN latitude REAL DEFAULT NULL',
      'ALTER TABLE visits ADD COLUMN longitude REAL DEFAULT NULL',
      'ALTER TABLE visits ADD COLUMN ip_hash TEXT'
    ];

    for (const sql of migrations) {
      try {
        await dbInstance.run(sql);
      } catch (_) {
        // Safe to ignore if column already exists
      }
    }

    console.log('Successfully connected to SQLite database using native sqlite3 driver.');
    useJsonFallback = false;
    return dbInstance;
  } catch (err: any) {
    console.warn(
      'Native sqlite3 module load failed (or build environment missing binary). ' +
      'Falling back to 100% pure JavaScript JSON storage to prevent server crash. Error detail:',
      err?.message || err
    );
    
    useJsonFallback = true;
    await loadJsonDb();
    
    dbInstance = {
      isFallback: true,
      exec: async () => {},
      run: async () => ({ lastID: Date.now() }),
    };
    return dbInstance;
  }
}

// --- CRUD Database Helpers ---

export async function createLink(
  shortCode: string, 
  originalUrl: string, 
  title?: string,
  expiresAt?: string | null,
  password?: string | null,
  enablePreview?: number,
  is_active = 1,
  one_time_use = 0,
  category = 'Uncategorized',
  tags: string | null = null,
  clicks_limit: number | null = null,
  customDescription: string | null = null,
  customImageUrl: string | null = null,
  customPreviewJson: string | null = null,
  customThemeJson: string | null = null
): Promise<Link> {
  await getDb();
  const cleanUrl = originalUrl.trim();
  const cleanTitle = title?.trim() || null;
  const previewVal = enablePreview !== undefined ? enablePreview : 1;
  const activeVal = is_active !== undefined ? is_active : 1;
  const oneTimeVal = one_time_use !== undefined ? one_time_use : 0;
  const catVal = category ? category.trim() : 'Uncategorized';
  const tagsVal = tags ? tags.trim() : null;

  if (useJsonFallback) {
    const nextId = jsonDbState.links.length > 0 ? Math.max(...jsonDbState.links.map(l => l.id)) + 1 : 1;
    const newLink: Link = {
      id: nextId,
      short_code: shortCode,
      original_url: cleanUrl,
      title: cleanTitle || undefined,
      created_at: new Date().toISOString(),
      clicks_count: 0,
      expires_at: expiresAt || null,
      password: password || null,
      enable_preview: previewVal,
      is_active: activeVal,
      one_time_use: oneTimeVal,
      category: catVal,
      tags: tagsVal,
      clicks_limit: clicks_limit,
      custom_description: customDescription,
      custom_image_url: customImageUrl,
      custom_preview_json: customPreviewJson,
      custom_theme_json: customThemeJson
    };
    jsonDbState.links.push(newLink);
    await saveJsonDb();
    return newLink;
  } else {
    const result = await dbInstance.run(
      `INSERT INTO links (short_code, original_url, title, expires_at, password, enable_preview, is_active, one_time_use, category, tags, clicks_limit, custom_description, custom_image_url, custom_preview_json, custom_theme_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shortCode, cleanUrl, cleanTitle, expiresAt || null, password || null, previewVal, activeVal, oneTimeVal, catVal, tagsVal, clicks_limit, customDescription, customImageUrl, customPreviewJson, customThemeJson]
    );
    const id = result.lastID!;
    return {
      id,
      short_code: shortCode,
      original_url: cleanUrl,
      title: cleanTitle || undefined,
      created_at: new Date().toISOString(),
      clicks_count: 0,
      expires_at: expiresAt || null,
      password: password || null,
      enable_preview: previewVal,
      is_active: activeVal,
      one_time_use: oneTimeVal,
      category: catVal,
      tags: tagsVal,
      clicks_limit: clicks_limit,
      custom_description: customDescription,
      custom_image_url: customImageUrl,
      custom_preview_json: customPreviewJson,
      custom_theme_json: customThemeJson
    };
  }
}

export async function updateLink(id: number, fields: Partial<Link>): Promise<boolean> {
  await getDb();
  if (useJsonFallback) {
    const link = jsonDbState.links.find(l => l.id === id);
    if (!link) return false;
    Object.assign(link, fields);
    await saveJsonDb();
    return true;
  } else {
    const keys = Object.keys(fields).filter(k => k !== 'id' && k !== 'clicks_count');
    if (keys.length === 0) return false;
    const values = keys.map(k => (fields as any)[k]);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const result = await dbInstance.run(`UPDATE links SET ${setClause} WHERE id = ?`, [...values, id]);
    return (result.changes ?? 0) > 0;
  }
}

export async function getLinkByCode(shortCode: string): Promise<Link | null> {
  await getDb();
  if (useJsonFallback) {
    const link = jsonDbState.links.find(l => l.short_code.toLowerCase() === shortCode.toLowerCase());
    return link ? { ...link } : null;
  } else {
    const link = await dbInstance.get('SELECT * FROM links WHERE LOWER(short_code) = LOWER(?)', [shortCode]);
    return link || null;
  }
}

export async function getLinks(): Promise<Link[]> {
  await getDb();
  if (useJsonFallback) {
    return [...jsonDbState.links].sort((a, b) => b.id - a.id);
  } else {
    return dbInstance.all('SELECT * FROM links ORDER BY id DESC');
  }
}

export async function deleteLink(id: number): Promise<boolean> {
  await getDb();
  if (useJsonFallback) {
    const initialLen = jsonDbState.links.length;
    jsonDbState.links = jsonDbState.links.filter(l => l.id !== id);
    jsonDbState.visits = jsonDbState.visits.filter(v => v.link_id !== id);
    await saveJsonDb();
    return jsonDbState.links.length < initialLen;
  } else {
    const result = await dbInstance.run('DELETE FROM links WHERE id = ?', [id]);
    return (result.changes ?? 0) > 0;
  }
}

export async function recordVisit(
  linkId: number,
  info: { 
    country: string; 
    region: string; 
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
    browser: string; 
    device: string; 
    referrer: string; 
    ip_hash?: string; 
  }
): Promise<void> {
  await getDb();
  const visitorHash = info.ip_hash || 'anonymous_hash';
  const cityVal = info.city || 'Unknown';
  const latVal = info.latitude || null;
  const lonVal = info.longitude || null;

  if (useJsonFallback) {
    const link = jsonDbState.links.find(l => l.id === linkId);
    if (!link) return;

    link.clicks_count++;
    
    // Check one-time-use or clicks limit
    if (link.one_time_use === 1 || (link.clicks_limit && link.clicks_count >= link.clicks_limit)) {
      link.is_active = 0;
    }

    const nextVisitId = jsonDbState.visits.length > 0 ? Math.max(...jsonDbState.visits.map(v => v.id)) + 1 : 1;
    const newVisit: Visit = {
      id: nextVisitId,
      link_id: linkId,
      timestamp: new Date().toISOString(),
      country: info.country,
      region: info.region,
      city: cityVal,
      latitude: latVal,
      longitude: lonVal,
      browser: info.browser,
      device: info.device,
      referrer: info.referrer,
      ip_hash: visitorHash
    };
    jsonDbState.visits.push(newVisit);
    await saveJsonDb();
  } else {
    await dbInstance.exec('BEGIN TRANSACTION');
    try {
      await dbInstance.run(
        `INSERT INTO visits (link_id, country, region, city, latitude, longitude, browser, device, referrer, timestamp, ip_hash) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
        [linkId, info.country, info.region, cityVal, latVal, lonVal, info.browser, info.device, info.referrer, visitorHash]
      );

      // Increment click count
      await dbInstance.run(
        'UPDATE links SET clicks_count = clicks_count + 1 WHERE id = ?',
        [linkId]
      );

      // Query updated link to check thresholds
      const link = await dbInstance.get('SELECT * FROM links WHERE id = ?', [linkId]);
      if (link) {
        if (link.one_time_use === 1 || (link.clicks_limit && link.clicks_count >= link.clicks_limit)) {
          await dbInstance.run('UPDATE links SET is_active = 0 WHERE id = ?', [linkId]);
        }
      }

      await dbInstance.exec('COMMIT');
    } catch (error) {
      await dbInstance.exec('ROLLBACK');
      throw error;
    }
  }
}

// --- Dynamic Analytics Engines ---

function processVisitsAnalytics(visits: Visit[], links: Link[]): AnalyticsSummary {
  const totalClicks = visits.length;
  const totalLinks = links.length;

  const uniqueIpHashes = new Set(visits.map(v => v.ip_hash || `${v.id}`));
  const uniqueVisits = uniqueIpHashes.size;

  // Clicks over time (grouped by last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { date: dateStr, clicks: 0 };
  }).reverse();

  visits.forEach(v => {
    const visitDate = v.timestamp.split('T')[0];
    const match = last7Days.find(d => d.date === visitDate);
    if (match) match.clicks++;
  });

  // Top Countries
  const countryCounts: Record<string, number> = {};
  visits.forEach(v => {
    countryCounts[v.country || 'Unknown'] = (countryCounts[v.country || 'Unknown'] || 0) + 1;
  });
  const topCountries = Object.entries(countryCounts)
    .map(([country, clicks]) => ({ country, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Top Regions
  const regionCounts: Record<string, number> = {};
  visits.forEach(v => {
    regionCounts[v.region || 'Unknown'] = (regionCounts[v.region || 'Unknown'] || 0) + 1;
  });
  const topRegions = Object.entries(regionCounts)
    .map(([region, clicks]) => ({ region, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Top Cities
  const cityCounts: Record<string, number> = {};
  visits.forEach(v => {
    cityCounts[v.city || 'Unknown'] = (cityCounts[v.city || 'Unknown'] || 0) + 1;
  });
  const topCities = Object.entries(cityCounts)
    .map(([city, clicks]) => ({ city, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Top Browsers
  const browserCounts: Record<string, number> = {};
  visits.forEach(v => {
    browserCounts[v.browser || 'Unknown'] = (browserCounts[v.browser || 'Unknown'] || 0) + 1;
  });
  const topBrowsers = Object.entries(browserCounts)
    .map(([browser, clicks]) => ({ browser, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // Top Devices
  const deviceCounts: Record<string, number> = {};
  visits.forEach(v => {
    deviceCounts[v.device || 'Unknown'] = (deviceCounts[v.device || 'Unknown'] || 0) + 1;
  });
  const topDevices = Object.entries(deviceCounts)
    .map(([device, clicks]) => ({ device, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // Top Referrers
  const referrerCounts: Record<string, number> = {};
  visits.forEach(v => {
    referrerCounts[v.referrer || 'Direct'] = (referrerCounts[v.referrer || 'Direct'] || 0) + 1;
  });
  const topReferrers = Object.entries(referrerCounts)
    .map(([referrer, clicks]) => ({ referrer, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  // Category Distribution
  const categoryCounts: Record<string, number> = {};
  links.forEach(l => {
    const cat = l.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categoryDistribution = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Tag Distribution
  const tagCounts: Record<string, number> = {};
  links.forEach(l => {
    if (l.tags) {
      l.tags.split(',').forEach(t => {
        const tag = t.trim();
        if (tag) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    }
  });
  const tagDistribution = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    totalClicks,
    totalLinks,
    uniqueVisits,
    clicksOverTime: last7Days,
    topCountries,
    topRegions,
    topCities,
    topBrowsers,
    topDevices,
    topReferrers,
    categoryDistribution,
    tagDistribution,
    rawVisits: visits
  };
}

export async function getLinkAnalytics(linkId: number): Promise<AnalyticsSummary & { link: Link }> {
  await getDb();
  if (useJsonFallback) {
    const link = jsonDbState.links.find(l => l.id === linkId);
    if (!link) {
      throw new Error('Link not found');
    }
    const matchingVisits = jsonDbState.visits.filter(v => v.link_id === linkId);
    const summary = processVisitsAnalytics(matchingVisits, [link]);
    return {
      link: { ...link },
      ...summary
    };
  } else {
    const link = await dbInstance.get('SELECT * FROM links WHERE id = ?', [linkId]);
    if (!link) {
      throw new Error('Link not found');
    }

    const visits = await dbInstance.all('SELECT * FROM visits WHERE link_id = ? ORDER BY id DESC', [linkId]);
    const summary = processVisitsAnalytics(visits, [link]);

    return {
      link,
      ...summary
    };
  }
}

export async function getAggregateAnalytics(): Promise<AnalyticsSummary> {
  await getDb();
  if (useJsonFallback) {
    return processVisitsAnalytics(jsonDbState.visits, jsonDbState.links);
  } else {
    const links = await dbInstance.all('SELECT * FROM links');
    const visits = await dbInstance.all('SELECT * FROM visits');
    return processVisitsAnalytics(visits, links);
  }
}

// --- Admin Panel helper DB functions ---

export async function createActivityLog(action: string, details: string, ip: string): Promise<void> {
  await getDb();
  if (useJsonFallback) {
    if (!jsonDbState.activityLogs) jsonDbState.activityLogs = [];
    const nextId = jsonDbState.activityLogs.length > 0 ? Math.max(...jsonDbState.activityLogs.map(l => l.id)) + 1 : 1;
    jsonDbState.activityLogs.push({
      id: nextId,
      timestamp: new Date().toISOString(),
      action,
      details,
      ip
    });
    await saveJsonDb();
  } else {
    await dbInstance.run(
      'INSERT INTO activity_logs (action, details, ip) VALUES (?, ?, ?)',
      [action, details, ip]
    );
  }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  await getDb();
  if (useJsonFallback) {
    if (!jsonDbState.activityLogs) jsonDbState.activityLogs = [];
    return [...jsonDbState.activityLogs].sort((a, b) => b.id - a.id).slice(0, 100);
  } else {
    return dbInstance.all('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 100');
  }
}

export async function getAdmins(): Promise<AdminUser[]> {
  await getDb();
  if (useJsonFallback) {
    if (!jsonDbState.admins) jsonDbState.admins = [];
    return jsonDbState.admins.map(a => ({
      id: a.id,
      username: a.username,
      created_at: a.created_at || new Date().toISOString(),
      role: a.role || 'admin'
    }));
  } else {
    return dbInstance.all('SELECT id, username, role, created_at FROM admins ORDER BY id ASC');
  }
}

export async function createAdmin(username: string, passwordHash: string, role = 'admin'): Promise<AdminUser> {
  await getDb();
  const cleanUsername = username.trim().toLowerCase();
  if (useJsonFallback) {
    if (!jsonDbState.admins) jsonDbState.admins = [];
    const exists = jsonDbState.admins.some(a => a.username === cleanUsername);
    if (exists) throw new Error('Admin username already exists');
    const nextId = jsonDbState.admins.length > 0 ? Math.max(...jsonDbState.admins.map(a => a.id)) + 1 : 1;
    const newAdmin = {
      id: nextId,
      username: cleanUsername,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString()
    };
    jsonDbState.admins.push(newAdmin);
    await saveJsonDb();
    return {
      id: newAdmin.id,
      username: newAdmin.username,
      role: newAdmin.role,
      created_at: newAdmin.created_at
    };
  } else {
    const exists = await dbInstance.get('SELECT * FROM admins WHERE username = ?', [cleanUsername]);
    if (exists) throw new Error('Admin username already exists');

    const result = await dbInstance.run(
      'INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)',
      [cleanUsername, passwordHash, role]
    );
    return { 
      id: result.lastID!, 
      username: cleanUsername, 
      role,
      created_at: new Date().toISOString()
    };
  }
}

export async function deleteAdmin(id: number): Promise<boolean> {
  await getDb();
  if (useJsonFallback) {
    if (!jsonDbState.admins) return false;
    const initialLen = jsonDbState.admins.length;
    jsonDbState.admins = jsonDbState.admins.filter(a => a.id !== id);
    await saveJsonDb();
    return jsonDbState.admins.length < initialLen;
  } else {
    const result = await dbInstance.run('DELETE FROM admins WHERE id = ?', [id]);
    return (result.changes ?? 0) > 0;
  }
}

export async function validateAdmin(username: string, passwordHash: string): Promise<AdminUser | null> {
  await getDb();
  const cleanUsername = username.trim().toLowerCase();
  if (useJsonFallback) {
    if (!jsonDbState.admins) return null;
    const admin = jsonDbState.admins.find(a => a.username === cleanUsername && a.password_hash === passwordHash);
    if (!admin) return null;
    return {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      created_at: admin.created_at
    };
  } else {
    const admin = await dbInstance.get('SELECT * FROM admins WHERE username = ? AND password_hash = ?', [cleanUsername, passwordHash]);
    if (!admin) return null;
    return {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      created_at: admin.created_at
    };
  }
}

// Backup & Restore Database content
export async function backupDatabase(): Promise<string> {
  await getDb();
  if (useJsonFallback) {
    return JSON.stringify(jsonDbState, null, 2);
  } else {
    const links = await dbInstance.all('SELECT * FROM links');
    const visits = await dbInstance.all('SELECT * FROM visits');
    const activityLogs = await dbInstance.all('SELECT * FROM activity_logs');
    const admins = await dbInstance.all('SELECT * FROM admins');
    return JSON.stringify({ links, visits, activityLogs, admins }, null, 2);
  }
}

export async function restoreDatabase(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data.links)) return false;

    await getDb();
    if (useJsonFallback) {
      jsonDbState.links = data.links;
      jsonDbState.visits = Array.isArray(data.visits) ? data.visits : [];
      jsonDbState.activityLogs = Array.isArray(data.activityLogs) ? data.activityLogs : [];
      jsonDbState.admins = Array.isArray(data.admins) ? data.admins : [];
      await saveJsonDb();
      return true;
    } else {
      await dbInstance.exec('BEGIN TRANSACTION');
      try {
        await dbInstance.run('DELETE FROM links');
        await dbInstance.run('DELETE FROM visits');
        await dbInstance.run('DELETE FROM activity_logs');
        await dbInstance.run('DELETE FROM admins');

        for (const l of data.links) {
          await dbInstance.run(
            `INSERT INTO links (id, short_code, original_url, title, created_at, clicks_count, expires_at, password, enable_preview, is_active, one_time_use, category, tags, clicks_limit) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [l.id, l.short_code, l.original_url, l.title, l.created_at, l.clicks_count || 0, l.expires_at, l.password, l.enable_preview ?? 1, l.is_active ?? 1, l.one_time_use ?? 0, l.category || 'Uncategorized', l.tags, l.clicks_limit]
          );
        }

        if (Array.isArray(data.visits)) {
          for (const v of data.visits) {
            await dbInstance.run(
              `INSERT INTO visits (id, link_id, country, region, city, latitude, longitude, browser, device, referrer, timestamp, ip_hash) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [v.id, v.link_id, v.country, v.region, v.city || 'Unknown', v.latitude, v.longitude, v.browser, v.device, v.referrer, v.timestamp, v.ip_hash]
            );
          }
        }

        if (Array.isArray(data.activityLogs)) {
          for (const al of data.activityLogs) {
            await dbInstance.run(
              `INSERT INTO activity_logs (id, timestamp, action, details, ip) VALUES (?, ?, ?, ?, ?)`,
              [al.id, al.timestamp, al.action, al.details, al.ip]
            );
          }
        }

        if (Array.isArray(data.admins)) {
          for (const a of data.admins) {
            await dbInstance.run(
              `INSERT INTO admins (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)`,
              [a.id, a.username, a.password_hash, a.role || 'admin', a.created_at]
            );
          }
        }

        await dbInstance.exec('COMMIT');
        return true;
      } catch (err) {
        await dbInstance.exec('ROLLBACK');
        throw err;
      }
    }
  } catch (error) {
    console.error('Failed to restore database:', error);
    return false;
  }
}

// Ensure the admin account always has the passcode 2025
export async function ensureDefaultAdminPasscode(): Promise<void> {
  await getDb();
  const username = 'admin';
  const newPasscode = '2025';
  
  if (useJsonFallback) {
    if (!jsonDbState.admins) {
      jsonDbState.admins = [];
    }
    const adminIndex = jsonDbState.admins.findIndex(a => a.username === username);
    if (adminIndex >= 0) {
      jsonDbState.admins[adminIndex].password_hash = newPasscode;
    } else {
      jsonDbState.admins.push({
        id: 1,
        username,
        password_hash: newPasscode,
        role: 'admin',
        created_at: new Date().toISOString()
      });
    }
    await saveJsonDb();
  } else {
    try {
      const admin = await dbInstance.get('SELECT * FROM admins WHERE username = ?', [username]);
      if (admin) {
        await dbInstance.run('UPDATE admins SET password_hash = ? WHERE username = ?', [newPasscode, username]);
      } else {
        await dbInstance.run(
          'INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)',
          [username, newPasscode, 'admin']
        );
      }
    } catch (err) {
      console.error('Error ensuring default admin passcode:', err);
    }
  }
}

// Seed helper
export async function seedMockDataIfEmpty(): Promise<void> {
  await getDb();
  
  // Ensure the default admin password is always "2025" regardless of empty links
  try {
    await ensureDefaultAdminPasscode();
  } catch (_) {}

  if (useJsonFallback) {
    if (jsonDbState.links.length > 0) return;
  } else {
    const linkCount = await dbInstance.get('SELECT COUNT(*) as count FROM links');
    if (linkCount && linkCount.count > 0) return;
  }

  console.log('Seeding mock links and analytics data to active database driver...');

  // Create default admin user
  try {
    await createAdmin('admin', '2025', 'admin');
    await createActivityLog('Admin Created', 'Default system admin user created', '127.0.0.1');
  } catch (_) {}

  // Create sample links
  const sampleLinks = [
    { short: 'youtube-hud', original: 'https://youtube.com', title: 'Stark Tech Video HUD Channel', category: 'Media', tags: 'tech,tony,stark,video' },
    { short: 'github-stark', original: 'https://github.com', title: 'JARVIS Central Repository Node', category: 'Development', tags: 'code,repo,stark,ai' },
    { short: 'spotify-ambient', original: 'https://spotify.com', title: 'Tony Stark Lab Work Playlist', category: 'Music', tags: 'music,ambient,lab,work' },
    { short: 'instagram-stark', original: 'https://instagram.com', title: 'Stark Industries Marketing', category: 'Social Media', tags: 'brand,marketing,photos' },
    { short: 'ai-studio', original: 'https://ai.studio', title: 'Google AI Studio Core Interface', category: 'Artificial Intelligence', tags: 'ai,studio,google,deepmind' },
  ];

  const countries = [
    'Philippines', 'United States', 'United Kingdom', 'Germany', 'Canada', 
    'Australia', 'Japan', 'India', 'France', 'Singapore'
  ];
  const countryWeight = [0.35, 0.25, 0.10, 0.05, 0.05, 0.05, 0.05, 0.04, 0.03, 0.03]; 

  // Philippines Regions/Cities seed
  const phRegions = [
    { region: 'Metro Manila', city: 'Manila', lat: 14.5995, lon: 120.9842 },
    { region: 'Metro Manila', city: 'Quezon City', lat: 14.6760, lon: 121.0437 },
    { region: 'Metro Manila', city: 'Makati', lat: 14.5547, lon: 121.0244 },
    { region: 'Cebu', city: 'Cebu City', lat: 10.3157, lon: 123.8854 },
    { region: 'Davao', city: 'Davao City', lat: 7.1907, lon: 125.4553 },
    { region: 'Cavite', city: 'Bacoor', lat: 14.4614, lon: 120.9622 },
    { region: 'Laguna', city: 'Calamba', lat: 14.2128, lon: 121.1649 }
  ];

  // US Regions/Cities seed
  const usRegions = [
    { region: 'California', city: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
    { region: 'New York', city: 'New York City', lat: 40.7128, lon: -74.0060 },
    { region: 'Texas', city: 'Austin', lat: 30.2672, lon: -97.7431 },
    { region: 'Washington', city: 'Seattle', lat: 47.6062, lon: -122.3321 }
  ];

  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'];
  const browserWeight = [0.65, 0.20, 0.08, 0.05, 0.02];

  const devices = ['Desktop', 'Mobile', 'Tablet'];
  const deviceWeight = [0.55, 0.38, 0.07];

  const referrers = ['Direct', 'LinkedIn', 'Twitter', 'Google', 'GitHub', 'Newsletter'];
  const referrerWeight = [0.35, 0.20, 0.15, 0.15, 0.10, 0.05];

  function pickWeighted<T>(items: T[], weights: number[]): T {
    const r = Math.random();
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      sum += weights[i];
      if (r <= sum) return items[i];
    }
    return items[items.length - 1];
  }

  for (const item of sampleLinks) {
    const link = await createLink(
      item.short, 
      item.original, 
      item.title, 
      null, 
      null, 
      1, 
      1, 
      0, 
      item.category, 
      item.tags
    );

    const totalVisits = Math.floor(Math.random() * 120) + 40; 
    let actualClicks = 0;

    for (let d = 0; d < 7; d++) {
      const dayOffset = d;
      const visitsOnDay = Math.floor(Math.random() * (totalVisits / 4)) + 2;

      for (let v = 0; v < visitsOnDay; v++) {
        const country = pickWeighted(countries, countryWeight);
        const browser = pickWeighted(browsers, browserWeight);
        const device = pickWeighted(devices, deviceWeight);
        const referrer = pickWeighted(referrers, referrerWeight);
        const mockIpHash = `seeded_visitor_${Math.floor(Math.random() * 25)}`;

        let region = 'Unknown';
        let city = 'Unknown';
        let lat = null;
        let lon = null;

        if (country === 'Philippines') {
          const area = phRegions[Math.floor(Math.random() * phRegions.length)];
          region = area.region;
          city = area.city;
          lat = area.lat;
          lon = area.lon;
        } else if (country === 'United States') {
          const area = usRegions[Math.floor(Math.random() * usRegions.length)];
          region = area.region;
          city = area.city;
          lat = area.lat;
          lon = area.lon;
        } else {
          region = 'Capital District';
          city = 'Main City';
        }

        const hour = Math.floor(Math.random() * 24);
        const min = Math.floor(Math.random() * 60);
        
        const timestamp = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
        timestamp.setHours(hour, min, 0, 0);

        if (useJsonFallback) {
          const nextVisitId = jsonDbState.visits.length > 0 ? Math.max(...jsonDbState.visits.map(v => v.id)) + 1 : 1;
          jsonDbState.visits.push({
            id: nextVisitId,
            link_id: link.id,
            timestamp: timestamp.toISOString(),
            country,
            region,
            city,
            latitude: lat,
            longitude: lon,
            browser,
            device,
            referrer,
            ip_hash: mockIpHash
          });
          actualClicks++;
        } else {
          await dbInstance.run(
            `INSERT INTO visits (link_id, country, region, city, latitude, longitude, browser, device, referrer, timestamp, ip_hash) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [link.id, country, region, city, lat, lon, browser, device, referrer, timestamp.toISOString(), mockIpHash]
          );
          actualClicks++;
        }
      }
    }

    if (useJsonFallback) {
      const liveLink = jsonDbState.links.find(l => l.id === link.id);
      if (liveLink) {
        liveLink.clicks_count = actualClicks;
      }
    } else {
      await dbInstance.run(
        'UPDATE links SET clicks_count = ? WHERE id = ?',
        [actualClicks, link.id]
      );
    }
  }

  if (useJsonFallback) {
    await saveJsonDb();
  }

  console.log('Successfully seeded database with mock analytics data.');
}
