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

// Also create a .nojekyll file to prevent GitHub Pages from ignoring _expo folder
const nojekyllPath = path.join(distDir, '.nojekyll');
fs.writeFileSync(nojekyllPath, '');
console.log('Created .nojekyll file');
