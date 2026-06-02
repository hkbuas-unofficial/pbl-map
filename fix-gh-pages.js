const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run "npm run predeploy" first.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Fix absolute paths to relative paths for GitHub Pages subdirectory
// Change src="/_expo/..." to src="./_expo/..."
// Change href="/favicon.ico" to href="./favicon.ico"
html = html.replace(/src="\//g, 'src="./');
html = html.replace(/href="\//g, 'href="./');

fs.writeFileSync(indexPath, html);
console.log('Fixed paths in dist/index.html for GitHub Pages');

// Fix asset paths in JS bundles - expo exports assets to dist/assets/assets/ 
// but references them as assets/. We need to flatten.
const assetsDir = path.join(distDir, 'assets');
const nestedAssetsDir = path.join(assetsDir, 'assets');

if (fs.existsSync(nestedAssetsDir)) {
  // Move everything from assets/assets/ up to assets/
  const items = fs.readdirSync(nestedAssetsDir);
  for (const item of items) {
    const src = path.join(nestedAssetsDir, item);
    const dest = path.join(assetsDir, item);
    if (fs.existsSync(dest)) {
      // If destination exists, merge (for directories)
      if (fs.statSync(src).isDirectory()) {
        const subItems = fs.readdirSync(src);
        for (const sub of subItems) {
          const subSrc = path.join(src, sub);
          const subDest = path.join(dest, sub);
          if (!fs.existsSync(subDest)) {
            fs.renameSync(subSrc, subDest);
          }
        }
        fs.rmdirSync(src);
      }
    } else {
      fs.renameSync(src, dest);
    }
  }
  // Remove empty nested directory
  if (fs.readdirSync(nestedAssetsDir).length === 0) {
    fs.rmdirSync(nestedAssetsDir);
  }
  console.log('Flattened assets/ directory');
}

// Also fix JS bundle paths that reference assets/assets/ to assets/
function fixAssetPathsInDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixAssetPathsInDir(fullPath);
    } else if (item.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Replace assets/assets/ with assets/ in JS files
      const original = content;
      content = content.replace(/assets\/assets\//g, 'assets/');
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed asset paths in ${path.relative(distDir, fullPath)}`);
      }
    }
  }
}

fixAssetPathsInDir(distDir);

// Also create a .nojekyll file to prevent GitHub Pages from ignoring _expo folder
const nojekyllPath = path.join(distDir, '.nojekyll');
fs.writeFileSync(nojekyllPath, '');
console.log('Created .nojekyll file');
