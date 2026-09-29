// Run alongside Expo on 8081: node tests/web/serveHarness.cjs
// Loopback-only, test-only HTML; no application configuration is changed.
require('node:http').createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Solar Share accessibility fixture</title><style>html,body,#root{height:100%;margin:0}#root{display:flex}body{overflow:hidden}</style></head><body><div id="root"></div><script src="http://localhost:8081/tests/web/browserHarness.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable" defer></script></body></html>`);
}).listen(8189, '127.0.0.1', () => console.log('Accessibility fixture: http://127.0.0.1:8189'));
