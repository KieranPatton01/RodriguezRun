const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let fixed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('Phaser.') && !content.includes('import Phaser')) {
    const importStr = "import Phaser from 'phaser';\n";
    if (content.startsWith('// =============================================================')) {
      const match = content.match(/^(\/\/ =============================================================[\s\S]*?\/\/ =============================================================\r?\n\r?\n)/);
      if (match) {
        content = content.replace(match[1], match[1] + importStr);
      } else {
        content = importStr + content;
      }
    } else {
      content = importStr + content;
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
    fixed++;
  }
});
console.log('Total fixed:', fixed);
