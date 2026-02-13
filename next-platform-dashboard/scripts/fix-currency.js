const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory() && f !== 'node_modules' && f !== '.next') {
      results = results.concat(walk(fp));
    } else if (/\.(ts|tsx)$/.test(f)) {
      results.push(fp);
    }
  });
  return results;
}

const files = walk('src');
let totalChanged = 0;

const replacements = [
  // currencySymbol || 'K' -> currencySymbol || '$'
  [/currencySymbol \|\| 'K'/g, "currencySymbol || '$'"],
  [/currencySymbol \|\| "K"/g, 'currencySymbol || "$"'],
  // K0.00 -> $0.00
  [/'K0\.00'/g, "'$0.00'"],
  [/"K0\.00"/g, '"$0.00"'],
  // currency_symbol: 'ZK' -> '$'
  [/currency_symbol: 'ZK'/g, "currency_symbol: '$'"],
  // currencySymbol: 'ZK' -> '$'
  [/currencySymbol: 'ZK'/g, "currencySymbol: '$'"],
  // K prefix in template strings for admin subscriptions: `K ${...}` -> `$ ${...}`
  [/`K \$\{/g, '`$ ${'],
  // K in JSX: >K {... -> >$ {...
  [/>K \{/g, '>$ {'],
  // 'K ' prefix -> '$ '  (for `K ${data.mrr}`)  
  [/`K /g, '`$ '],
  // Zambia-specific text in comments
  [/ZAMBIAN KWACHA DEFAULT/g, 'US DOLLAR DEFAULT'],
  [/Zambian Kwacha symbol/g, 'US Dollar symbol'],
  [/Zambia default/g, 'US Dollar default'],
  [/Zambian Kwacha/gi, 'US Dollar'],
  // ZMW first in arrays -> USD first
  [/\['ZMW', 'USD'/g, "['USD', 'ZMW'"],
  // Descriptions
  [/default: Zambian Kwacha/g, 'default: US Dollar'],
  [/Zambia VAT/g, 'Platform default'],
  // K-prefixed prices in plan comments
  [/\/\/ K(\d)/g, '// $$$1'],
  // 'K29/mo' etc in template/display strings
  [/'K29\/mo'/g, "'$29/mo'"],
  [/'K79\/mo'/g, "'$79/mo'"],
  [/"K29\/mo"/g, '"$29/mo"'],
  [/"K79\/mo"/g, '"$79/mo"'],
  // Locale string in AI prompts
  [/Locale: en-US \(Zambia\)/g, 'Locale: en-US (United States)'],
  // Zambian audience refs in AI prompts
  [/Zambian holidays and cultural events/g, 'local holidays and cultural events'],
  [/Zambian audience online times/g, 'target audience online times'],
  // en-ZM refs that remain (in case the previous pass missed any)
  [/Zambia locale/g, 'US locale'],
  // ZMW first -> USD first in supported currencies
  [/supported_currencies: \['ZMW'/g, "supported_currencies: ['USD'"],
];

files.forEach(fp => {
  if (fp.includes('locale-config')) return;
  
  let content = fs.readFileSync(fp, 'utf8');
  const original = content;
  
  replacements.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });
  
  if (content !== original) {
    fs.writeFileSync(fp, content);
    totalChanged++;
    console.log('Updated:', fp);
  }
});

console.log(`\nTotal files updated: ${totalChanged}`);
