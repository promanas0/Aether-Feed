import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function databaseApiPlugin(): Plugin {
  const storageDir = path.resolve(process.cwd(), 'storage');
  const usersFile = path.resolve(storageDir, 'users.json');
  const postsFile = path.resolve(storageDir, 'posts.json');
  const votesFile = path.resolve(storageDir, 'votes.json');
  const otpsFile = path.resolve(storageDir, 'otps.json');

  const ensureStorageDir = () => {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  };

  const readJson = (filePath: string, defaultValue: any) => {
    try {
      ensureStorageDir();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(`[API Server] Failed to read ${filePath}:`, e);
    }
    return defaultValue;
  };

  const writeJson = (filePath: string, data: any) => {
    try {
      ensureStorageDir();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error(`[API Server] Failed to write ${filePath}:`, e);
      return false;
    }
  };

  return {
    name: 'aether-database-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
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

        // GET /api/data
        if (pathname === '/api/data' && req.method === 'GET') {
          const users = readJson(usersFile, []);
          const posts = readJson(postsFile, []);
          const votes = readJson(votesFile, []);
          const otps = readJson(otpsFile, []);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ users, posts, votes, notifications: [], pending_otps: otps }));
          return;
        }

        // GET /api/users
        if (pathname === '/api/users' && req.method === 'GET') {
          const FAKE_MOCK_IDS = ['usr_manas_01', 'usr_elena_02', 'usr_marcus_03'];
          const users = readJson(usersFile, []).filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, users }));
          return;
        }

        // GET /api/posts
        if (pathname === '/api/posts' && req.method === 'GET') {
          const posts = readJson(postsFile, []);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, posts }));
          return;
        }

        // DELETE /api/posts (Permanent Post Deletion)
        if (pathname === '/api/posts' && req.method === 'DELETE') {
          const urlObj = new URL(rawUrl, 'http://localhost');
          const queryId = urlObj.searchParams.get('id');

          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              let targetId = queryId;
              if (!targetId && body) {
                const parsed = JSON.parse(body || '{}');
                targetId = parsed.id || parsed.postId;
              }

              if (targetId) {
                const currentPosts = readJson(postsFile, []);
                const filteredPosts = currentPosts.filter((p: any) => p.id !== targetId);
                writeJson(postsFile, filteredPosts);

                const currentVotes = readJson(votesFile, []);
                const filteredVotes = currentVotes.filter((v: any) => v.post_id !== targetId);
                writeJson(votesFile, filteredVotes);
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, deletedId: targetId }));
            } catch (e: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, message: e.message }));
            }
          });
          return;
        }

        // POST /api/posts
        if (pathname === '/api/posts' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body || '{}');
              const post = incoming.post || incoming;
              const posts = readJson(postsFile, []);

              if (post && post.id) {
                const existingIdx = posts.findIndex((p: any) => p.id === post.id);
                if (existingIdx !== -1) {
                  posts[existingIdx] = { ...posts[existingIdx], ...post };
                } else {
                  posts.unshift(post);
                }
                writeJson(postsFile, posts);
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

        // POST /api/auth/login
        if (pathname === '/api/auth/login' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { email, password } = JSON.parse(body || '{}');
              const users = readJson(usersFile, []);
              const cleanEmail = (email || '').toLowerCase().trim();
              const user = users.find((u: any) => (u.email || '').toLowerCase().trim() === cleanEmail);

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

        // POST /api/auth/register
        if (pathname === '/api/auth/register' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body || '{}');
              const user = incoming.user || incoming;
              if (!user || !user.email) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Invalid user data' }));
                return;
              }

              const users = readJson(usersFile, []);
              const cleanEmail = user.email.toLowerCase().trim();
              const existingIdx = users.findIndex((u: any) => (u.email || '').toLowerCase().trim() === cleanEmail);

              if (existingIdx !== -1) {
                users[existingIdx] = { ...users[existingIdx], ...user };
              } else {
                users.unshift(user);
              }

              writeJson(usersFile, users);

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

        // POST /api/sync
        if (pathname === '/api/sync' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body || '{}');
              const currentUsers = readJson(usersFile, []);
              const currentPosts = readJson(postsFile, []);
              const currentVotes = readJson(votesFile, []);
              const currentOtps = readJson(otpsFile, []);

              const deletedPostIds = new Set<string>(incoming.deleted_post_ids || []);

              const FAKE_MOCK_IDS = ['usr_manas_01', 'usr_elena_02', 'usr_marcus_03'];
              const filteredCurrentUsers = currentUsers.filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));
              const incomingUsers = (incoming.users || []).filter((u: any) => !FAKE_MOCK_IDS.includes(u.id));

              const userMap = new Map<string, any>();
              const emailMap = new Map<string, string>();

              filteredCurrentUsers.forEach((u: any) => {
                if (u && u.id) {
                  userMap.set(u.id, u);
                  if (u.email) {
                    emailMap.set(u.email.toLowerCase().trim(), u.id);
                  }
                }
              });

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

              const postMap = new Map<string, any>();
              currentPosts.forEach((p: any) => {
                if (!deletedPostIds.has(p.id)) {
                  postMap.set(p.id, p);
                }
              });
              (incoming.posts || []).forEach((p: any) => {
                if (!deletedPostIds.has(p.id)) {
                  if (postMap.has(p.id)) {
                    postMap.set(p.id, { ...postMap.get(p.id), ...p });
                  } else {
                    postMap.set(p.id, p);
                  }
                }
              });

              const voteMap = new Map<string, any>();
              currentVotes.forEach((v: any) => {
                if (!deletedPostIds.has(v.post_id)) {
                  voteMap.set(v.id, v);
                }
              });
              (incoming.votes || []).forEach((v: any) => {
                if (!deletedPostIds.has(v.post_id)) {
                  voteMap.set(v.id, v);
                }
              });

              const mergedUsers = Array.from(userMap.values());
              const mergedPosts = Array.from(postMap.values()).sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              const mergedVotes = Array.from(voteMap.values());

              writeJson(usersFile, mergedUsers);
              writeJson(postsFile, mergedPosts);
              writeJson(votesFile, mergedVotes);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  data: {
                    users: mergedUsers,
                    posts: mergedPosts,
                    votes: mergedVotes,
                    notifications: incoming.notifications || [],
                    pending_otps: incoming.pending_otps || currentOtps,
                  },
                })
              );
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
