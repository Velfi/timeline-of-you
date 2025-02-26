# Timeline of You - Development Guide

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript type checking
- `npm run lint` - Check code with ESLint/Prettier
- `npm run format` - Format code with Prettier
- `npm run test:unit` - Run unit tests
- `npm run test:unit -- path/to/test.ts` - Run single test

## Code Style
- **TypeScript**: Strict mode, explicit types for function parameters/returns
- **Imports**: Use SvelteKit aliases (`$lib/...`)
- **Exports**: Prefer named over default exports
- **Components**: PascalCase for files (.svelte), props use TypeScript types
- **Variables/Functions**: camelCase
- **Errors**: Explicit throwing with descriptive messages
- **Formatting**: Prettier with single quotes, 100 char line length
- **State**: Svelte stores with getters/setters pattern

## Architecture
SvelteKit app focusing on timeline visualization with d3, using Dexie (IndexedDB), and supporting date manipulation via custom DateTime implementation.