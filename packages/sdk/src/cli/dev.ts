/**
 * @dramac/sdk - CLI Dev Server
 * 
 * Local development server for module preview
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';

export interface DevServerOptions {
  port?: number;
  moduleDir?: string;
  open?: boolean;
}

/**
 * Start local development server for module preview
 */
export async function startDevServer(options: DevServerOptions = {}): Promise<void> {
  const {
    port = 3001,
    moduleDir = process.cwd(),
    open = false,
  } = options;

  // Check for config file
  const configPath = path.join(moduleDir, 'dramac.config.ts');
  if (!fs.existsSync(configPath)) {
    console.error('❌ dramac.config.ts not found');
    console.error('   Make sure you are in a Dramac module directory.');
    process.exit(1);
  }

  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Create Vite dev server for HMR
  const vite = await createViteServer({
    root: moduleDir,
    server: { 
      middlewareMode: true,
      hmr: {
        port: port + 1,
      },
    },
    appType: 'spa',
  });

  // Use Vite middlewares
  app.use(vite.middlewares);

  // Mock data storage
  const mockData: Record<string, Record<string, unknown[]>> = {};

  // Mock API endpoints
  app.use('/api/modules/:moduleId', async (req, res, next) => {
    const { moduleId } = req.params;
    const apiPath = req.path;

    console.log(`📡 ${req.method} /api/modules/${moduleId}${apiPath}`);

    // Try to load local handler
    const handlersDir = path.join(moduleDir, 'src', 'api');
    const handlerPath = path.join(handlersDir, `${apiPath}.ts`);

    if (fs.existsSync(handlerPath)) {
      try {
        const handler = await vite.ssrLoadModule(handlerPath);
        const method = req.method.toLowerCase();
        
        if (handler[method]) {
          const context = {
            moduleId,
            siteId: 'dev-site',
            userId: 'dev-user',
            db: createMockDb(mockData, moduleId),
          };

          const result = await handler[method](req, context);
          return res.json(result);
        }
      } catch (error) {
        console.error('❌ Handler error:', error);
        return res.status(500).json({ 
          error: 'Handler error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Default mock handlers
    const tableName = apiPath.replace(/^\//, '').split('/')[0];
    
    if (!mockData[moduleId]) {
      mockData[moduleId] = {};
    }

    if (!mockData[moduleId][tableName]) {
      mockData[moduleId][tableName] = [];
    }

    const data = mockData[moduleId][tableName];

    switch (req.method) {
      case 'GET': {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        return res.json({
          data: data.slice(offset, offset + limit),
          total: data.length,
          page,
          pageSize: limit,
        });
      }

      case 'POST': {
        const newItem = {
          id: generateId(),
          ...req.body,
          site_id: 'dev-site',
          created_at: new Date().toISOString(),
        };
        data.push(newItem);
        return res.status(201).json(newItem);
      }

      case 'PUT':
      case 'PATCH': {
        const id = apiPath.split('/')[1];
        const index = data.findIndex((item: any) => item.id === id);
        if (index === -1) {
          return res.status(404).json({ error: 'Not found' });
        }
        data[index] = { 
          ...(data[index] as object), 
          ...req.body, 
          updated_at: new Date().toISOString() 
        };
        return res.json(data[index]);
      }

      case 'DELETE': {
        const deleteId = apiPath.split('/')[1];
        const deleteIndex = data.findIndex((item: any) => item.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Not found' });
        }
        data.splice(deleteIndex, 1);
        return res.status(204).send();
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  });

  // Mock auth endpoint
  app.get('/api/modules/:moduleId/auth', (req, res) => {
    res.json({
      user: { id: 'dev-user', email: 'dev@example.com' },
      roles: [
        { slug: 'admin', permissions: ['*'] },
      ],
    });
  });

  // Mock settings endpoint
  app.get('/api/modules/:moduleId/settings', (req, res) => {
    res.json({});
  });

  app.patch('/api/modules/:moduleId/settings', (req, res) => {
    console.log('📝 Settings updated:', req.body);
    res.json(req.body);
  });

  // Serve index.html for all other routes
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template = fs.readFileSync(
        path.join(moduleDir, 'index.html'),
        'utf-8'
      );

      template = await vite.transformIndexHtml(url, template);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  // Watch for changes and log
  const watcher = chokidar.watch(moduleDir, {
    ignored: [/node_modules/, /dist/, /\.git/],
    persistent: true,
  });

  watcher.on('change', (filePath) => {
    const relativePath = path.relative(moduleDir, filePath);
    console.log(`♻️  File changed: ${relativePath}`);
  });

  // Start server
  const server = app.listen(port, () => {
    console.log('');
    console.log('🚀 Dramac Module Dev Server');
    console.log('');
    console.log(`   Preview:     http://localhost:${port}`);
    console.log(`   API Mock:    http://localhost:${port}/api/modules/dev`);
    console.log(`   HMR Port:    ${port + 1}`);
    console.log('');
    console.log('   Watching for changes...');
    console.log('');

    if (open) {
      import('open').then((openModule: { default: (url: string) => void }) => {
        openModule.default(`http://localhost:${port}`);
      }).catch(() => {
        // open package not available, ignore
      });
    }
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down dev server...');
    watcher.close();
    server.close();
    process.exit(0);
  });
}

/**
 * Create a mock database client for dev server
 */
function createMockDb(storage: Record<string, Record<string, unknown[]>>, moduleId: string) {
  if (!storage[moduleId]) {
    storage[moduleId] = {};
  }

  return {
    from(tableName: string) {
      if (!storage[moduleId][tableName]) {
        storage[moduleId][tableName] = [];
      }

      const data = storage[moduleId][tableName];

      return {
        async select() {
          return { data, error: null };
        },
        async insert(record: unknown) {
          const newItem = {
            id: generateId(),
            ...(record as object),
            created_at: new Date().toISOString(),
          };
          data.push(newItem);
          return { data: [newItem], error: null };
        },
        async update(id: string, updates: unknown) {
          const index = data.findIndex((item: any) => item.id === id);
          if (index !== -1) {
            data[index] = { ...(data[index] as object), ...(updates as object), updated_at: new Date().toISOString() };
          }
          return { data: data[index], error: null };
        },
        async delete(id: string) {
          const index = data.findIndex((item: any) => item.id === id);
          if (index !== -1) {
            data.splice(index, 1);
          }
          return { error: null };
        },
      };
    },
  };
}

/**
 * Generate a random ID
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
