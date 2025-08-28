import { context, build } from 'esbuild';
import postcss from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';
import fs from 'fs/promises';
import { solidPlugin } from 'esbuild-plugin-solid';

// PostCSS plugin to scope all selectors to the component host
// This keeps Tailwind preflight while preventing any leakage outside the web component
const scopeToHost = () => ({
  postcssPlugin: 'scope-to-host',
  Once(root) {
    root.walkRules((rule) => {
      // Ignore keyframes contents
      if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;
      const sel = rule.selector;
      if (!sel) return;
      // If selector already targets :host, keep as-is
      if (sel.includes(':host')) return;
      // Prefix each selector in a selector list
      const scoped = sel.split(',').map((s) => {
        const t = s.trim();
        // Replace global roots with :host
        let replaced = t.replace(/\bhtml\b/g, ':host').replace(/:root\b/g, ':host');
        // If it still does not reference :host directly, prefix it
        if (!/^:host/.test(replaced)) {
          replaced = `:host ${replaced}`;
        }
        return replaced;
      });
      rule.selector = scoped.join(', ');
    });
  }
});
scopeToHost.postcss = true;

// PostCSS plugin to convert all rem units to px with base 16
const remToPx = (base = 16) => ({
  postcssPlugin: 'rem-to-px',
  Declaration(decl) {
    if (!decl.value || decl.value.indexOf('rem') === -1) return;
    decl.value = decl.value.replace(/(-?\d*\.?\d+)rem/g, (_, num) => {
      const px = Math.round(parseFloat(num) * base * 1000) / 1000;
      return `${px}px`;
    });
  }
});
remToPx.postcss = true;

// Plugin to handle CSS with Tailwind
const cssPlugin = {
  name: 'css',
  setup(build) {
    // Handle CSS files
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.readFile(args.path, 'utf8');
      const result = await postcss([
        tailwindcssPostcss(),
        scopeToHost(),
        remToPx(16),
      ]).process(css, { from: args.path });
      
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