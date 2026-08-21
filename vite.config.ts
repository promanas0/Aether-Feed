import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function databaseApiPlugin(): Plugin {
  const dbFilePath = path.resolve(process.cwd(), 'data', 'database.json');

  const readDb = () => {
    try {
      if (fs.existsSync(dbFilePath)) {
        const raw = fs.readFileSync(dbFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[API Server] Failed to read database.json:', e);
    }
    return { users: [], posts: [], votes: [], notifications: [], pending_otps: [] };
  };

  const writeDb = (data: any) => {
    try {
      const dir = path.dirname(dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('[API Server] Failed to write database.json:', e);
      return false;
    }
  };

  return {
    name: 'aether-database-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Enable CORS for LAN and multi-device access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0].replace(/\/+$/, '') || '/';

        // Endpoint: GET /api/data
        if (pathname === '/api/data' && req.method === 'GET') {
          const db = readDb();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(db));
          return;
        }

        // Endpoint: GET /api/users
        if (pathname === '/api/users' && req.method === 'GET') {
          const db = readDb();
          const FAKE_MOCK_IDS = ['usr_manas_01', 'usr_elena_02', 'usr_marcus_03'];
          const users = (db.users || []).filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, users }));
          return;
        }

        // Endpoint: GET /api/posts
        if (pathname === '/api/posts' && req.method === 'GET') {
          const db = readDb();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, posts: db.posts || [] }));
          return;
        }

        // Endpoint: POST /api/posts (Create new post)
        if (pathname === '/api/posts' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body || '{}');
              const post = incoming.post || incoming;
              const db = readDb();

              if (post && post.id) {
                const existingIdx = (db.posts || []).findIndex((p: any) => p.id === post.id);
                if (existingIdx !== -1) {
                  db.posts[existingIdx] = { ...db.posts[existingIdx], ...post };
                } else {
                  db.posts = [post, ...(db.posts || [])];
                }
                writeDb(db);
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, post }));
            } catch (e: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, message: e.message }));
            }
          });
          return;
        }

        // Endpoint: POST /api/auth/login
        if (pathname === '/api/auth/login' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { email, password } = JSON.parse(body || '{}');
              const db = readDb();
              const cleanEmail = (email || '').toLowerCase().trim();
              const user = (db.users || []).find((u: any) => (u.email || '').toLowerCase().trim() === cleanEmail);

              if (!user) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: false, message: 'No registered account found with this email. Please create an account first.' }));
                return;
              }

              if (user.password_hash && user.password_hash !== String(password || '').trim()) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: false, message: 'Incorrect password. Please try again.' }));
                return;
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, user, message: 'Signed in successfully.' }));
            } catch (e: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, message: e.message }));
            }
          });
          return;
        }

        // Endpoint: POST /api/auth/register
        if (pathname === '/api/auth/register' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body || '{}');
              const db = readDb();
              const user = incoming.user || incoming;
              if (!user || !user.email) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Invalid user data' }));
                return;
              }

              const cleanEmail = user.email.toLowerCase().trim();
              const existingIdx = (db.users || []).findIndex((u: any) => (u.email || '').toLowerCase().trim() === cleanEmail);

              if (existingIdx !== -1) {
                db.users[existingIdx] = { ...db.users[existingIdx], ...user };
              } else {
                db.users = [user, ...(db.users || [])];
              }

              writeDb(db);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, user, message: 'Account registered successfully.' }));
            } catch (e: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, message: e.message }));
            }
          });
          return;
        }

        // Endpoint: POST /api/sync (Two-way merger)
        if (pathname === '/api/sync' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body || '{}');
              const db = readDb();

              const FAKE_MOCK_IDS = ['usr_manas_01', 'usr_elena_02', 'usr_marcus_03'];
              const currentUsers = (db.users || []).filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));
              const incomingUsers = (incoming.users || []).filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));

              const userMap = new Map<string, any>();
              const emailMap = new Map<string, string>();

              // Index existing users
              currentUsers.forEach((u: any) => {
                if (u && u.id) {
                  userMap.set(u.id, u);
                  if (u.email) {
                    emailMap.set(u.email.toLowerCase().trim(), u.id);
                  }
                }
              });

              // Merge incoming users
              incomingUsers.forEach((u: any) => {
                if (!u) return;
                const userEmail = (u.email || '').toLowerCase().trim();
                if (userEmail && emailMap.has(userEmail)) {
                  const existingId = emailMap.get(userEmail)!;
                  const existing = userMap.get(existingId) || {};
                  userMap.set(existingId, { ...existing, ...u, id: existingId });
                } else if (u.id) {
                  userMap.set(u.id, u);
                  if (userEmail) {
                    emailMap.set(userEmail, u.id);
                  }
                }
              });

              // Merge Posts
              const postMap = new Map<string, any>();
              (db.posts || []).forEach((p: any) => postMap.set(p.id, p));
              (incoming.posts || []).forEach((p: any) => {
                if (postMap.has(p.id)) {
                  postMap.set(p.id, { ...postMap.get(p.id), ...p });
                } else {
                  postMap.set(p.id, p);
                }
              });

              // Merge Votes
              const voteMap = new Map<string, any>();
              (db.votes || []).forEach((v: any) => voteMap.set(v.id, v));
              (incoming.votes || []).forEach((v: any) => voteMap.set(v.id, v));

              // Merge Notifications
              const notifMap = new Map<string, any>();
              (db.notifications || []).forEach((n: any) => notifMap.set(n.id, n));
              (incoming.notifications || []).forEach((n: any) => notifMap.set(n.id, n));

              // Merge Pending OTPs
              const pendingMap = new Map<string, any>();
              (db.pending_otps || []).forEach((o: any) => pendingMap.set(`${o.email}_${o.otp_code}`, o));
              (incoming.pending_otps || []).forEach((o: any) => pendingMap.set(`${o.email}_${o.otp_code}`, o));

              const mergedDb = {
                users: Array.from(userMap.values()),
                posts: Array.from(postMap.values()).sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ),
                votes: Array.from(voteMap.values()),
                notifications: Array.from(notifMap.values()),
                pending_otps: Array.from(pendingMap.values()),
              };

              writeDb(mergedDb);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, data: mergedDb }));
            } catch (e: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), databaseApiPlugin()],
  server: {
    host: true,
    port: 5173,
  },
});
