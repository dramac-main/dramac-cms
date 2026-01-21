import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'database/index': 'src/database/index.ts',
    'ui/index': 'src/ui/index.ts',
    'ui/hooks': 'src/ui/hooks.ts',
    'auth/index': 'src/auth/index.ts',
    'testing/index': 'src/testing/index.ts',
    'cli/index': 'src/cli/index.ts',
    'cli/bin': 'src/cli/bin.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@supabase/supabase-js',
    'lucide-react',
  ],
  treeshake: true,
  minify: false,
});
