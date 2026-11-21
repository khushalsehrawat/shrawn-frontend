const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');

const source = fs.readFileSync(path.join(__dirname, '../src/shared/components/SeoMetadata.tsx'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const compiled = { exports: {} };
new Function('require', 'module', 'exports', output)(require, compiled, compiled.exports);
const { SeoMetadata } = compiled.exports;
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../seo-sites.json'), 'utf8')).sites[0];

for (const route of ['/', '/login', '/register', '/login?source=test#form']) {
  const markup = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(SeoMetadata)));
  const expected = new URL(route.split(/[?#]/)[0], config.base_url).href;
  assert.equal((markup.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(markup.includes(`href="${expected}"`));
  assert.ok(markup.includes(`content="${expected}"`));
}
for (const route of ['/dashboard', '/unrecognized']) {
  const markup = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(SeoMetadata)));
  assert.equal(markup, '');
}
console.log('PASS: React metadata uses the verified origin and current public route; query/hash and private routes do not create incorrect canonicals.');
