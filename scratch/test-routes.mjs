const routes = [
  '/',
  '/shop',
  '/categories/hoodies-sweats',
  '/collections/drop-01-cyber-circuit',
  '/product/flash-matrix-oversized-hoodie',
  '/cart',
  '/checkout',
  '/about',
  '/contact',
  '/shipping-policy',
  '/return-policy',
  '/privacy-policy',
  '/terms',
  '/admin/login',
  '/api/health',
  '/api/health?type=readiness',
  '/api/feeds/google-merchant',
  '/sitemap.xml',
  '/robots.txt',
];

async function checkRoutes() {
  console.log('Testing live local server routes on http://localhost:3000...\n');
  let passed = 0;
  let failed = 0;

  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`);
      const text = await res.text();
      const status = res.status;
      const isOk = status === 200;
      if (isOk) passed++;
      else failed++;

      const mark = isOk ? '✓' : '✗';
      console.log(`${mark} [${status}] ${route.padEnd(42)} (${text.length} bytes)`);
    } catch (err) {
      failed++;
      console.log(`✗ [ERR] ${route.padEnd(42)} (${err.message})`);
    }
  }

  console.log(`\nResult: ${passed}/${routes.length} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

checkRoutes();
