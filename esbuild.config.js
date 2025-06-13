import { context, build } from 'esbuild';
import postcss from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';
import fs from 'fs/promises';
import { solidPlugin } from 'esbuild-plugin-solid';

// Plugin to handle CSS with Tailwind
const cssPlugin = {
  name: 'css',
  setup(build) {
    // Handle CSS files
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.readFile(args.path, 'utf8');
      const result = await postcss([tailwindcssPostcss()]).process(css, { from: args.path });
      
      // Export CSS as base64 to avoid string literal issues in ServiceNow
      const base64Css = Buffer.from(result.css, 'utf8').toString('base64');
      
      return {
        contents: `
          const base64Css = "${base64Css}";
          const css = typeof atob !== 'undefined' 
            ? atob(base64Css) 
            : Buffer.from(base64Css, 'base64').toString('utf8');
          export default css;
        `,
        loader: 'js',
      };
    });
  },
};

// Common build options
const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  sourcemap: true,
  target: ['es2015'],
  plugins: [
    solidPlugin(),
    cssPlugin
  ],
  logLevel: 'info',
};

// Main function
async function main() {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // Development mode with watch
    const ctx = await context({
      ...buildOptions,
      sourcemap: true,
    });
    
    // Start watching
    await ctx.watch();
    console.log('Watching for changes...');
    
    // Serve files
    const serveResult = await ctx.serve({
      servedir: '.',
    });
    
    // Use the actual values from serveResult
    if (serveResult.hosts && serveResult.hosts.length > 0) {
      console.log(`Server running at http://${serveResult.hosts[0]}:${serveResult.port}/dev/index.html`);
    } else {
      console.log(`Server running at http://localhost:${serveResult.port}/dev/index.html`);
    }
  } else {
    // Production build
    await build({
      ...buildOptions,
      minify: true,
      sourcemap: false,
    });
    console.log('Build complete');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 