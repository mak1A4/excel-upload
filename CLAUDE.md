# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a reusable Excel file upload web component built with SolidJS and TailwindCSS. The component can be used either as a web component (via custom elements) or directly as a SolidJS component.

## Common Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start development server with hot reload
pnpm dev
# → Server runs at http://localhost:{port}/dev/index.html

# Build for production
pnpm build

# Serve files locally (useful for testing the built output)
pnpm serve
```

## Architecture & Key Concepts

### Build System
- Uses esbuild with custom configuration (`esbuild.config.js`)
- Custom CSS plugin processes Tailwind styles and bundles them as JavaScript strings
- Development mode includes watch mode and local server
- Production build includes minification

### Component Architecture
The project exports a web component that encapsulates:

1. **Web Component Registration** (`src/index.ts`):
   - Uses `solid-element` to register `<excel-upload>` custom element
   - Injects styles into shadow DOM when used as web component
   - Exports `ExcelUploadComponent` for direct SolidJS usage

2. **Main Component** (`src/components/ExcelUploadComponent.tsx`):
   - Accepts customizable props for colors, text labels, and verification rules
   - Supports drag-and-drop file uploads
   - File verification system with custom rules via `VerificationRule` type
   - Helper functions for color and text management to avoid prop drilling

### Styling Approach
- Tailwind CSS is processed at build time
- Styles are bundled as a string and injected into shadow DOM for web component usage
- Component uses dynamic class composition based on props for customization

### Package Management
- Uses pnpm with specific version (10.12.1)
- TypeScript for type safety
- SolidJS as the reactive framework
- Lucide icons for UI elements