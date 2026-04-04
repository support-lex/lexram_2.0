const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./app', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/\\\$\{/g, '${').replace(/\\`/g, '`');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Fixed', filePath);
    }
  }
});

walkDir('./components', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/\\\$\{/g, '${').replace(/\\`/g, '`');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Fixed', filePath);
    }
  }
});

walkDir('./lib', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(/\\\$\{/g, '${').replace(/\\`/g, '`');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Fixed', filePath);
    }
  }
});
