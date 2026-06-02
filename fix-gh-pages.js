const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run "npm run predeploy" first.');
  process.exit(1);
}

// Step 1: Flatten assets directory FIRST (before fixing JS paths)
const assetsDir = path.join(distDir, 'assets');
const nestedAssetsDir = path.join(assetsDir, 'assets');

if (fs.existsSync(nestedAssetsDir)) {
  const items = fs.readdirSync(nestedAssetsDir);
  for (const item of items) {
    const src = path.join(nestedAssetsDir, item);
    const dest = path.join(assetsDir, item);
    if (fs.existsSync(dest)) {
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
  if (fs.readdirSync(nestedAssetsDir).length === 0) {
    fs.rmdirSync(nestedAssetsDir);
  }
  console.log('Flattened assets/ directory');
}

// Step 2: Fix JS bundle paths AFTER flattening
function fixJsPaths(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixJsPaths(fullPath);
    } else if (item.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      // Replace "assets/assets/" with "assets/" (flattened structure)
      content = content.replace(/assets\/assets\//g, 'assets/');
      // Also fix any absolute paths
      content = content.replace(/"\/assets\//g, '"./assets/');
      content = content.replace(/'\/assets\//g, "'./assets/");
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed asset paths in ${path.relative(distDir, fullPath)}`);
      }
    }
  }
}

fixJsPaths(distDir);

// Step 3: Fix HTML paths
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/src="\//g, 'src="./');
html = html.replace(/href="\//g, 'href="./');
fs.writeFileSync(indexPath, html);
console.log('Fixed paths in dist/index.html for GitHub Pages');

// Step 4: Create .nojekyll file
const nojekyllPath = path.join(distDir, '.nojekyll');
fs.writeFileSync(nojekyllPath, '');
console.log('Created .nojekyll file');
