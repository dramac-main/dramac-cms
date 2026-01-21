import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import chokidar from 'chokidar';
import os from 'os';
import { loadConfig } from '../utils/config.js';

export const devCommand = new Command('dev')
  .description('Start local development server')
  .option('-p, --port <port>', 'Server port', '3001')
  .option('--host', 'Expose to network')
  .option('--open', 'Open browser')
  .action(async (options) => {
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'dramac.config.ts');
    
    // Check for config file
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red('❌ dramac.config.ts not found'));
      console.log('');
      console.log('Make sure you are in a Dramac module directory.');
      console.log('Run ' + chalk.cyan('dramac create') + ' to create a new module.');
      process.exit(1);
    }
    
    const spinner = ora('Loading configuration...').start();
    
    try {
      const config = await loadConfig(cwd);
      spinner.succeed(`Loaded ${chalk.cyan(config.name)}`);
      
      // Create Express app
      const app = express();
      app.use(express.json());
      const port = parseInt(options.port);
      
      // Create Vite server
      const vite = await createViteServer({
        root: cwd,
        server: { 
          middlewareMode: true,
          hmr: true
        },
        appType: 'custom'
      });
      
      app.use(vite.middlewares);
      
      // Mock Supabase client for local dev
      app.use('/api/supabase', (_req: Request, res: Response) => {
        res.json({
          url: 'http://localhost:54321',
          anonKey: 'local-dev-key'
        });
      });
      
      // Mock module context
      app.use('/api/context', (_req: Request, res: Response) => {
        res.json({
          user: { id: 'dev-user-id', email: 'dev@example.com' },
          site: { id: 'dev-site-id', name: 'Development Site' },
          module: config
        });
      });
      
      // Mock module API endpoints
      app.use('/api/modules/:moduleId/*', async (req: Request, res: Response) => {
        const apiPath = req.path.replace(`/api/modules/${req.params.moduleId}`, '');
        
        console.log(chalk.gray(`→ ${req.method} ${apiPath}`));
        
        // Try to load local handler
        const handlerFile = path.join(cwd, 'src', 'api', `${apiPath || 'index'}.ts`);
        const indexHandler = path.join(cwd, 'src', 'api', 'index.ts');
        
        const fileToLoad = fs.existsSync(handlerFile) ? handlerFile : 
                          (apiPath === '' || apiPath === '/') && fs.existsSync(indexHandler) ? indexHandler : null;
        
        if (fileToLoad) {
          try {
            const module = await vite.ssrLoadModule(fileToLoad);
            const handler = module[req.method.toLowerCase()];
            
            if (handler) {
              const result = await handler({
                body: req.body,
                params: req.params,
                query: req.query,
                db: createMockDb(),
                user: { id: 'dev-user-id' },
                site: { id: 'dev-site-id' }
              });
              
              return res.json(result);
            }
          } catch (error: any) {
            console.error(chalk.red(`Handler error: ${error.message}`));
            return res.status(500).json({ error: error.message });
          }
        }
        
        res.status(404).json({ error: 'Not found' });
      });
      
      // Serve module preview
      app.get('*', async (req: Request, res: Response) => {
        try {
          const indexPath = path.join(cwd, 'index.html');
          
          if (!fs.existsSync(indexPath)) {
            return res.status(404).send('index.html not found');
          }
          
          let html = fs.readFileSync(indexPath, 'utf-8');
          html = await vite.transformIndexHtml(req.url, html);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (error: any) {
          vite.ssrFixStacktrace(error);
          console.error(error);
          res.status(500).end(error.message);
        }
      });
      
      // Watch config file
      chokidar.watch(configPath).on('change', async () => {
        console.log(chalk.yellow('⚡ Config changed, reloading...'));
        try {
          const newConfig = await loadConfig(cwd);
          console.log(chalk.green(`✓ Reloaded ${newConfig.name} v${newConfig.version}`));
        } catch (error: any) {
          console.error(chalk.red(`Config reload error: ${error.message}`));
        }
      });
      
      // Start server
      const host = options.host ? '0.0.0.0' : 'localhost';
      
      app.listen(port, host, () => {
        const localUrl = `http://localhost:${port}`;
        const networkUrl = options.host ? `http://${getLocalIp()}:${port}` : null;
        
        console.log('');
        console.log(chalk.cyan('╔═══════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.bold.white('  🚀 Dramac Dev Server                     ') + chalk.cyan('║'));
        console.log(chalk.cyan('╠═══════════════════════════════════════════╣'));
        console.log(chalk.cyan('║') + `  Module:  ${chalk.green(config.name)}`.padEnd(52) + chalk.cyan('║'));
        console.log(chalk.cyan('║') + `  Version: ${chalk.gray(config.version)}`.padEnd(52) + chalk.cyan('║'));
        console.log(chalk.cyan('╠═══════════════════════════════════════════╣'));
        console.log(chalk.cyan('║') + `  Local:   ${chalk.cyan(localUrl)}`.padEnd(52) + chalk.cyan('║'));
        if (networkUrl) {
          console.log(chalk.cyan('║') + `  Network: ${chalk.cyan(networkUrl)}`.padEnd(52) + chalk.cyan('║'));
        }
        console.log(chalk.cyan('╠═══════════════════════════════════════════╣'));
        console.log(chalk.cyan('║') + chalk.gray('  Press Ctrl+C to stop                     ') + chalk.cyan('║'));
        console.log(chalk.cyan('╚═══════════════════════════════════════════╝'));
        console.log('');
        
        if (options.open) {
          import('open').then(open => open.default(localUrl));
        }
      });
      
    } catch (error) {
      spinner.fail('Failed to start dev server');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

function createMockDb() {
  const data: Record<string, any[]> = {};
  
  return {
    from: (table: string) => {
      const tableData = data[table] || [];
      
      return {
        select: (columns = '*') => ({
          data: tableData,
          error: null,
          eq: (col: string, val: any) => ({
            data: tableData.filter((r: any) => r[col] === val),
            error: null,
            single: () => ({
              data: tableData.find((r: any) => r[col] === val) || null,
              error: null
            }),
            maybeSingle: () => ({
              data: tableData.find((r: any) => r[col] === val) || null,
              error: null
            })
          }),
          order: (col: string, opts?: { ascending?: boolean }) => ({
            data: [...tableData].sort((a, b) => {
              const asc = opts?.ascending ?? true;
              return asc ? a[col] - b[col] : b[col] - a[col];
            }),
            error: null
          }),
          limit: (n: number) => ({
            data: tableData.slice(0, n),
            error: null
          }),
          single: () => ({
            data: tableData[0] || null,
            error: null
          })
        }),
        insert: (record: any) => {
          const newRecord = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...record };
          data[table] = [...tableData, newRecord];
          return {
            data: newRecord,
            error: null,
            select: () => ({ data: newRecord, error: null, single: () => ({ data: newRecord, error: null }) })
          };
        },
        update: (record: any) => ({
          data: record,
          error: null,
          eq: (col: string, val: any) => {
            const index = tableData.findIndex((r: any) => r[col] === val);
            if (index >= 0) {
              data[table][index] = { ...data[table][index], ...record };
            }
            return { data: record, error: null };
          }
        }),
        delete: () => ({
          error: null,
          eq: (col: string, val: any) => {
            data[table] = tableData.filter((r: any) => r[col] !== val);
            return { error: null };
          }
        }),
        upsert: (record: any) => {
          const existing = tableData.find((r: any) => r.id === record.id);
          if (existing) {
            Object.assign(existing, record);
          } else {
            data[table] = [...tableData, { id: crypto.randomUUID(), ...record }];
          }
          return { data: record, error: null };
        }
      };
    }
  };
}

function getLocalIp(): string {
  const nets = os.networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (!netList) continue;
    
    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}
