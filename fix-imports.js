const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Заменяем все варианты импорта authOptions
    content = content.replace(
      /from ['"]\.\.\/auth\/\[\.\.\.nextauth\]\/route['"]/g,
      "from '@/lib/auth'"
    );
    content = content.replace(
      /from ['"]\.\.\/\.\.\/auth\/\[\.\.\.nextauth\]\/route['"]/g,
      "from '@/lib/auth'"
    );
    content = content.replace(
      /from ['"]\.\.\/\.\.\/\.\.\/auth\/\[\.\.\.nextauth\]\/route['"]/g,
      "from '@/lib/auth'"
    );
    content = content.replace(
      /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/auth\/\[\.\.\.nextauth\]\/route['"]/g,
      "from '@/lib/auth'"
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error in ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  });
}

console.log('Fixing authOptions imports...\n');
walkDir('./src/app/api');
console.log('\nDone!');
