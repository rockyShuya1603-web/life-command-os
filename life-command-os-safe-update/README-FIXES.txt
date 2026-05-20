Life Command OS safe update

Base: uploaded page(18).tsx / 2138 lines
Updated app/page.tsx lines: 2220

Changes:
- BrainDump: 3-second banner after auto-sorting, showing TODO / memo / later-box counts.
- Budget: upgraded to Pro view with selectable record date, monthly spending target, category ranking, and clearer balance checks.
- Guide AI: upgraded to v2 card with richer daily interpretation and lazy-loaded image.
- Diary: blog-style editor with headings, sections, quotes, divider, list insertion, preview mode, tone selector, and read-time estimate.
- Performance: wraps snapshot updates in React transition, debounces global search, and reduces realtime refresh churn.

Install:
unzip -o life-command-os-safe-brain-budget-guide-diary-speed-update.zip
npm run build
npx vercel --prod --force
