const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'app', 'admin', 'testimonials', 'page.tsx');
if (!fs.existsSync(targetPath)) {
  console.error('Target file does not exist:', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// Replace hex colors
content = content.replace(/#C49A0C/gi, '#8F7A70');
content = content.replace(/#E8D48B/gi, '#A69288');

// Replace RGB colors (with or without spaces)
content = content.replace(/196,\s*154,\s*12/g, '143, 122, 112');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully replaced gold colors with brand Luxury Taupe in admin testimonials page.');
