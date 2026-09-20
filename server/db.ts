import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SEED_CATEGORIES } from './seedCategories.ts';
import { ALL_SEED_RESOURCES } from './seedAll.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'osint.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Helper for hashing passwords
export function hashPassword(password: string, salt: string = 'osint_secure_salt_2025'): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      parent_id INTEGER DEFAULT NULL,
      icon TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // 2. Resources table
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      usage_context TEXT,
      input_output TEXT,
      opsec_notes TEXT,
      tool_flags TEXT,
      is_free INTEGER DEFAULT 1,
      rating_avg REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // 3. Tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );
  `);

  // 4. Resource-Tag junction
  db.exec(`
    CREATE TABLE IF NOT EXISTS resource_tags (
      resource_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (resource_id, tag_id),
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // 5. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Bookmarks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );
  `);

  // 7. Ratings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      score INTEGER CHECK(score BETWEEN 1 AND 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );
  `);

  // 8. Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Performance Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
    CREATE INDEX IF NOT EXISTS idx_resources_name ON resources(name);
    CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
  `);

  // Seed default Admin user if not exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const defaultPasswordHash = hashPassword('osint2025!');
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin@osint-explorer.local', defaultPasswordHash, 'admin');

    // Also seed a default guest user id = 2 for public bookmarking/ratings
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('guest', 'guest@osint-explorer.local', hashPassword('guest123'), 'user');
  }

  // Seed categories and resources if categories table is empty
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (countStmt.count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  console.log('Seeding initial OSINT categories and resources...');

  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, slug, parent_id, icon, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const cat of SEED_CATEGORIES) {
    insertCat.run(cat.id, cat.name, cat.slug, cat.parentId, cat.icon, cat.description);
  }

  const getCatIdBySlug = db.prepare('SELECT id FROM categories WHERE slug = ?');
  const insertResource = db.prepare(`
    INSERT INTO resources (
      category_id, name, url, description, usage_context, input_output,
      opsec_notes, tool_flags, is_free, rating_avg, rating_count, views
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)
  `);
  const getTagId = db.prepare('SELECT id FROM tags WHERE slug = ?');
  const linkTag = db.prepare(`
    INSERT OR IGNORE INTO resource_tags (resource_id, tag_id) VALUES (?, ?)
  `);

  for (const item of ALL_SEED_RESOURCES) {
    const catRow = getCatIdBySlug.get(item.categorySlug) as { id: number } | undefined;
    const categoryId = catRow ? catRow.id : 1;

    const result = insertResource.run(
      categoryId,
      item.name,
      item.url,
      item.description,
      item.usageContext,
      item.inputOutput,
      item.opsecNotes,
      item.toolFlags,
      item.isFree,
      item.ratingAvg,
      item.ratingCount,
      item.views
    );

    const resourceId = Number(result.lastInsertRowid);

    if (item.tags && Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        const cleanTag = tag.trim().toLowerCase();
        const tagSlug = cleanTag.replace(/[^a-z0-9]+/g, '-');
        insertTag.run(cleanTag, tagSlug);
        const tagRow = getTagId.get(tagSlug) as { id: number } | undefined;
        if (tagRow) {
          linkTag.run(resourceId, tagRow.id);
        }
      }
    }
  }

  // Initial audit log
  db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run('SEED_DATABASE', 'system', 0, `Seeded ${ALL_SEED_RESOURCES.length} OSINT tools across ${SEED_CATEGORIES.length} categories`, '127.0.0.1');

  console.log(`Successfully seeded ${ALL_SEED_RESOURCES.length} resources into SQLite database.`);
}

// Data access operations
export interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon: string;
  description: string;
  resource_count: number;
}

export function getAllCategories(): CategoryWithCount[] {
  const query = `
    SELECT c.*, COUNT(r.id) as resource_count
    FROM categories c
    LEFT JOIN resources r ON r.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `;
  return db.prepare(query).all() as unknown as CategoryWithCount[];
}

export interface ResourceDetail {
  id: number;
  category_id: number;
  category_name: string;
  category_slug: string;
  category_icon: string;
  name: string;
  url: string;
  description: string;
  usage_context: string;
  input_output: string;
  opsec_notes: string;
  tool_flags: string;
  is_free: number;
  rating_avg: number;
  rating_count: number;
  views: number;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface ResourceFilterOptions {
  category?: string;
  q?: string;
  tag?: string;
  type?: string; // T, D, R, M
  cost?: string; // free, paid, freemium
  sort?: string; // views, rating, name_asc, newest
  bookmarked_user_id?: number;
}

export function getResources(options: ResourceFilterOptions = {}): ResourceDetail[] {
  let sql = `
    SELECT
      r.*,
      c.name as category_name,
      c.slug as category_slug,
      c.icon as category_icon,
      GROUP_CONCAT(t.name) as tags_str
    FROM resources r
    JOIN categories c ON r.category_id = c.id
    LEFT JOIN resource_tags rt ON r.id = rt.resource_id
    LEFT JOIN tags t ON rt.tag_id = t.id
  `;

  const whereClauses: string[] = [];
  const params: (string | number)[] = [];

  if (options.category && options.category !== 'all') {
    whereClauses.push('(c.slug = ? OR c.id = ?)');
    params.push(options.category, Number(options.category) || -1);
  }

  if (options.q && options.q.trim()) {
    const term = `%${options.q.trim()}%`;
    whereClauses.push(`(
      r.name LIKE ? OR
      r.description LIKE ? OR
      r.usage_context LIKE ? OR
      r.url LIKE ? OR
      c.name LIKE ?
    )`);
    params.push(term, term, term, term, term);
  }

  if (options.tag && options.tag.trim()) {
    whereClauses.push(`r.id IN (
      SELECT rt2.resource_id FROM resource_tags rt2
      JOIN tags t2 ON rt2.tag_id = t2.id
      WHERE t2.slug = ? OR t2.name LIKE ?
    )`);
    params.push(options.tag.toLowerCase(), `%${options.tag}%`);
  }

  if (options.type && options.type.trim()) {
    const flagChar = options.type.trim().toUpperCase();
    whereClauses.push('r.tool_flags LIKE ?');
    params.push(`%${flagChar}%`);
  }

  if (options.cost) {
    if (options.cost === 'free') {
      whereClauses.push('r.is_free = 1');
    } else if (options.cost === 'paid') {
      whereClauses.push('r.is_free = 0');
    } else if (options.cost === 'freemium') {
      whereClauses.push('r.is_free = 2');
    }
  }

  if (options.bookmarked_user_id) {
    whereClauses.push(`r.id IN (
      SELECT resource_id FROM bookmarks WHERE user_id = ?
    )`);
    params.push(options.bookmarked_user_id);
  }

  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  sql += ' GROUP BY r.id ';

  // Sorting
  switch (options.sort) {
    case 'rating':
      sql += ' ORDER BY r.rating_avg DESC, r.rating_count DESC, r.views DESC';
      break;
    case 'name_asc':
      sql += ' ORDER BY r.name ASC';
      break;
    case 'newest':
      sql += ' ORDER BY r.created_at DESC';
      break;
    case 'views':
    default:
      sql += ' ORDER BY r.views DESC, r.rating_avg DESC';
      break;
  }

  const rows = db.prepare(sql).all(...params) as any[];

  return rows.map(row => ({
    ...row,
    tags: row.tags_str ? row.tags_str.split(',') : []
  }));
}

export function getResourceById(id: number): ResourceDetail | null {
  const sql = `
    SELECT
      r.*,
      c.name as category_name,
      c.slug as category_slug,
      c.icon as category_icon,
      GROUP_CONCAT(t.name) as tags_str
    FROM resources r
    JOIN categories c ON r.category_id = c.id
    LEFT JOIN resource_tags rt ON r.id = rt.resource_id
    LEFT JOIN tags t ON rt.tag_id = t.id
    WHERE r.id = ?
    GROUP BY r.id
  `;

  const row = db.prepare(sql).get(id) as any;
  if (!row) return null;

  return {
    ...row,
    tags: row.tags_str ? row.tags_str.split(',') : []
  };
}

export function incrementResourceViews(id: number): number {
  db.prepare('UPDATE resources SET views = views + 1 WHERE id = ?').run(id);
  const row = db.prepare('SELECT views FROM resources WHERE id = ?').get(id) as { views: number } | undefined;
  return row ? row.views : 0;
}

export function toggleBookmark(userId: number, resourceId: number): { bookmarked: boolean } {
  const existing = db.prepare(`
    SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?
  `).get(userId, resourceId);

  if (existing) {
    db.prepare(`
      DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?
    `).run(userId, resourceId);
    return { bookmarked: false };
  } else {
    db.prepare(`
      INSERT INTO bookmarks (user_id, resource_id) VALUES (?, ?)
    `).run(userId, resourceId);
    return { bookmarked: true };
  }
}

export function getUserBookmarkIds(userId: number): number[] {
  const rows = db.prepare('SELECT resource_id FROM bookmarks WHERE user_id = ?').all(userId) as { resource_id: number }[];
  return rows.map(r => r.resource_id);
}

export function submitRating(userId: number, resourceId: number, score: number): { rating_avg: number; rating_count: number } {
  if (score < 1 || score > 5) {
    throw new Error('Rating score must be between 1 and 5');
  }

  // Insert or update rating
  db.prepare(`
    INSERT INTO ratings (user_id, resource_id, score)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, resource_id) DO UPDATE SET score = excluded.score
  `).run(userId, resourceId, score);

  // Recalculate stats for this resource
  const stats = db.prepare(`
    SELECT COUNT(*) as count, AVG(score) as avg
    FROM ratings
    WHERE resource_id = ?
  `).get(resourceId) as { count: number; avg: number | null };

  const newCount = stats.count;
  const newAvg = stats.avg ? Math.round(stats.avg * 10) / 10 : 0;

  db.prepare(`
    UPDATE resources
    SET rating_avg = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newAvg, newCount, resourceId);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?)
  `).run('SUBMIT_RATING', 'resource', resourceId, `User ${userId} rated ${score} stars`);

  return { rating_avg: newAvg, rating_count: newCount };
}

// Admin Operations
export function verifyAdminLogin(username: string, password: string): { id: number; username: string; role: string } | null {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) return null;

  const inputHash = hashPassword(password);
  if (user.password_hash !== inputHash) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
}

export function createResource(data: {
  category_id: number;
  name: string;
  url: string;
  description: string;
  usage_context?: string;
  input_output?: string;
  opsec_notes?: string;
  tool_flags?: string;
  is_free?: number;
  tags?: string[];
}): number {
  const result = db.prepare(`
    INSERT INTO resources (
      category_id, name, url, description, usage_context, input_output,
      opsec_notes, tool_flags, is_free, rating_avg, rating_count, views
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 1, 1)
  `).run(
    data.category_id,
    data.name,
    data.url,
    data.description || '',
    data.usage_context || '',
    data.input_output || '',
    data.opsec_notes || '',
    data.tool_flags || 'T',
    data.is_free ?? 1
  );

  const resourceId = Number(result.lastInsertRowid);

  if (data.tags && Array.isArray(data.tags)) {
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
    const getTagId = db.prepare('SELECT id FROM tags WHERE slug = ?');
    const linkTag = db.prepare('INSERT OR IGNORE INTO resource_tags (resource_id, tag_id) VALUES (?, ?)');

    for (const tag of data.tags) {
      const clean = tag.trim().toLowerCase();
      if (!clean) continue;
      const slug = clean.replace(/[^a-z0-9]+/g, '-');
      insertTag.run(clean, slug);
      const tagRow = getTagId.get(slug) as { id: number } | undefined;
      if (tagRow) {
        linkTag.run(resourceId, tagRow.id);
      }
    }
  }

  db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?)
  `).run('CREATE_RESOURCE', 'resource', resourceId, `Created resource: ${data.name}`);

  return resourceId;
}

export function updateResource(id: number, data: {
  category_id: number;
  name: string;
  url: string;
  description: string;
  usage_context?: string;
  input_output?: string;
  opsec_notes?: string;
  tool_flags?: string;
  is_free?: number;
  tags?: string[];
}) {
  db.prepare(`
    UPDATE resources SET
      category_id = ?,
      name = ?,
      url = ?,
      description = ?,
      usage_context = ?,
      input_output = ?,
      opsec_notes = ?,
      tool_flags = ?,
      is_free = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    data.category_id,
    data.name,
    data.url,
    data.description || '',
    data.usage_context || '',
    data.input_output || '',
    data.opsec_notes || '',
    data.tool_flags || 'T',
    data.is_free ?? 1,
    id
  );

  if (data.tags && Array.isArray(data.tags)) {
    db.prepare('DELETE FROM resource_tags WHERE resource_id = ?').run(id);

    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
    const getTagId = db.prepare('SELECT id FROM tags WHERE slug = ?');
    const linkTag = db.prepare('INSERT OR IGNORE INTO resource_tags (resource_id, tag_id) VALUES (?, ?)');

    for (const tag of data.tags) {
      const clean = tag.trim().toLowerCase();
      if (!clean) continue;
      const slug = clean.replace(/[^a-z0-9]+/g, '-');
      insertTag.run(clean, slug);
      const tagRow = getTagId.get(slug) as { id: number } | undefined;
      if (tagRow) {
        linkTag.run(id, tagRow.id);
      }
    }
  }

  db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?)
  `).run('UPDATE_RESOURCE', 'resource', id, `Updated resource: ${data.name}`);
}

export function deleteResource(id: number) {
  const resource = db.prepare('SELECT name FROM resources WHERE id = ?').get(id) as { name: string } | undefined;
  const name = resource ? resource.name : `#${id}`;

  db.prepare('DELETE FROM resources WHERE id = ?').run(id);

  db.prepare(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?)
  `).run('DELETE_RESOURCE', 'resource', id, `Deleted resource: ${name}`);
}

export function getAdminDashboardStats() {
  const totalResources = (db.prepare('SELECT COUNT(*) as count FROM resources').get() as any).count;
  const totalCategories = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as any).count;
  const totalViews = (db.prepare('SELECT SUM(views) as total FROM resources').get() as any).total || 0;
  const avgRating = (db.prepare('SELECT AVG(rating_avg) as avg FROM resources').get() as any).avg || 0;

  const topCategories = db.prepare(`
    SELECT c.name, COUNT(r.id) as count
    FROM categories c
    LEFT JOIN resources r ON r.category_id = c.id
    GROUP BY c.id
    ORDER BY count DESC
    LIMIT 6
  `).all();

  const mostViewed = db.prepare(`
    SELECT id, name, views, rating_avg, tool_flags
    FROM resources
    ORDER BY views DESC
    LIMIT 6
  `).all();

  const flagsDistribution = db.prepare(`
    SELECT
      SUM(CASE WHEN tool_flags LIKE '%T%' THEN 1 ELSE 0 END) as tools,
      SUM(CASE WHEN tool_flags LIKE '%D%' THEN 1 ELSE 0 END) as dorks,
      SUM(CASE WHEN tool_flags LIKE '%R%' THEN 1 ELSE 0 END) as registration,
      SUM(CASE WHEN tool_flags LIKE '%M%' THEN 1 ELSE 0 END) as manual
    FROM resources
  `).get();

  return {
    totalResources,
    totalCategories,
    totalViews,
    avgRating: Math.round(avgRating * 10) / 10,
    topCategories,
    mostViewed,
    flagsDistribution
  };
}

export function getAuditLogs(limit: number = 30) {
  return db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}
