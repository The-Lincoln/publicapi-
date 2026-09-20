import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  initDatabase,
  getAllCategories,
  getResources,
  getResourceById,
  incrementResourceViews,
  toggleBookmark,
  getUserBookmarkIds,
  submitRating,
  verifyAdminLogin,
  createResource,
  updateResource,
  deleteResource,
  getAdminDashboardStats,
  getAuditLogs
} from './server/db.ts';

const app = express();
const PORT = 3000;

// Initialize SQLite database
initDatabase();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple in-memory rate limiter (60 req/min per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
app.use('/api', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const current = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }

  current.count++;
  rateLimitMap.set(ip, current);

  if (current.count > 120) { // generous allowance for rapid browsing
    return res.status(429).json({ success: false, error: 'Rate limit exceeded. Please wait 1 minute.' });
  }

  next();
});

// ==================== API ENDPOINTS ====================

// 1. GET /api/categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = getAllCategories();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/resources
app.get('/api/resources', (req, res) => {
  try {
    const { category, q, tag, type, cost, sort, bookmarked } = req.query;

    const bookmarkedUserId = bookmarked === 'true' || bookmarked === '1' ? 1 : undefined;

    const resources = getResources({
      category: category as string,
      q: q as string,
      tag: tag as string,
      type: type as string,
      cost: cost as string,
      sort: sort as string,
      bookmarked_user_id: bookmarkedUserId
    });

    res.json({
      success: true,
      total: resources.length,
      data: resources
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/resources/:id
app.get('/api/resources/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid resource ID' });
    }

    const resource = getResourceById(id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    res.json({ success: true, data: resource });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/resources/:id/view
app.post('/api/resources/:id/view', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid resource ID' });
    }

    const views = incrementResourceViews(id);
    res.json({ success: true, views });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/bookmarks
app.get('/api/bookmarks', (req, res) => {
  try {
    const userId = 1; // Default session user
    const bookmarks = getUserBookmarkIds(userId);
    res.json({ success: true, data: bookmarks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/bookmarks
app.post('/api/bookmarks', (req, res) => {
  try {
    const { resourceId } = req.body;
    const resId = parseInt(resourceId, 10);
    if (isNaN(resId)) {
      return res.status(400).json({ success: false, error: 'Invalid resourceId' });
    }

    const userId = 1;
    const result = toggleBookmark(userId, resId);
    res.json({ success: true, bookmarked: result.bookmarked, resourceId: resId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. DELETE /api/bookmarks/:id
app.delete('/api/bookmarks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = 1;
    const result = toggleBookmark(userId, id);
    res.json({ success: true, bookmarked: false, resourceId: id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/ratings
app.post('/api/ratings', (req, res) => {
  try {
    const { resourceId, score } = req.body;
    const resId = parseInt(resourceId, 10);
    const starScore = parseInt(score, 10);

    if (isNaN(resId) || isNaN(starScore) || starScore < 1 || starScore > 5) {
      return res.status(400).json({ success: false, error: 'Score must be between 1 and 5' });
    }

    const userId = 1;
    const stats = submitRating(userId, resId, starScore);
    res.json({
      success: true,
      message: 'Rating recorded successfully',
      data: stats
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const user = verifyAdminLogin(username, password);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Return authenticated session token
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token: `admin_token_${Date.now()}`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. GET /api/admin/stats
app.get('/api/admin/stats', (req, res) => {
  try {
    const stats = getAdminDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. GET /api/admin/audit
app.get('/api/admin/audit', (req, res) => {
  try {
    const logs = getAuditLogs(40);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. POST /api/admin/resources
app.post('/api/admin/resources', (req, res) => {
  try {
    const {
      name, category_id, url, description, usage_context,
      input_output, opsec_notes, tool_flags, is_free, tags
    } = req.body;

    if (!name || !url || !category_id) {
      return res.status(400).json({ success: false, error: 'Name, URL, and category_id are required' });
    }

    const newId = createResource({
      name,
      category_id: parseInt(category_id, 10),
      url,
      description,
      usage_context,
      input_output,
      opsec_notes,
      tool_flags,
      is_free: parseInt(is_free ?? '1', 10),
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : [])
    });

    res.status(201).json({ success: true, message: 'Resource created', id: newId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. PUT /api/admin/resources/:id
app.put('/api/admin/resources/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid resource ID' });
    }

    const {
      name, category_id, url, description, usage_context,
      input_output, opsec_notes, tool_flags, is_free, tags
    } = req.body;

    updateResource(id, {
      name,
      category_id: parseInt(category_id, 10),
      url,
      description,
      usage_context,
      input_output,
      opsec_notes,
      tool_flags,
      is_free: parseInt(is_free ?? '1', 10),
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : [])
    });

    res.json({ success: true, message: 'Resource updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. DELETE /api/admin/resources/:id
app.delete('/api/admin/resources/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid resource ID' });
    }

    deleteResource(id);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. POST /api/admin/import (Bulk import JSON or CSV)
app.post('/api/admin/import', (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Array of items required' });
    }

    let importedCount = 0;
    for (const item of items) {
      if (!item.name || !item.url) continue;
      createResource({
        name: item.name,
        category_id: parseInt(item.category_id || '1', 10),
        url: item.url,
        description: item.description || '',
        usage_context: item.usage_context || '',
        input_output: item.input_output || '',
        opsec_notes: item.opsec_notes || '',
        tool_flags: item.tool_flags || 'T',
        is_free: item.is_free !== undefined ? Number(item.is_free) : 1,
        tags: item.tags || []
      });
      importedCount++;
    }

    res.json({ success: true, message: `Successfully imported ${importedCount} resources` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. GET /api/export
app.get('/api/export', (req, res) => {
  try {
    const { format = 'json', category, q, type, cost } = req.query;
    const resources = getResources({
      category: category as string,
      q: q as string,
      type: type as string,
      cost: cost as string
    });

    if (format === 'csv') {
      const headers = ['id', 'name', 'category', 'url', 'flags', 'is_free', 'rating', 'views', 'tags', 'description'];
      const csvRows = [headers.join(',')];

      for (const r of resources) {
        const row = [
          r.id,
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${(r.category_name || '').replace(/"/g, '""')}"`,
          `"${(r.url || '').replace(/"/g, '""')}"`,
          `"${r.tool_flags || ''}"`,
          r.is_free,
          r.rating_avg,
          r.views,
          `"${(r.tags || []).join('; ')}"`,
          `"${(r.description || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="osint-resources.csv"');
      return res.send(csvRows.join('\n'));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="osint-resources.json"');
    res.json(resources);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== VITE MIDDLEWARE ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OSINT Explorer Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
