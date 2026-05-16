import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Add "use client" if it has react hooks or browser APIs
  if (
    !content.includes('"use client"') &&
    !content.includes("'use client'") &&
    (content.includes('useState(') || content.includes('useEffect(') || content.includes('useRef(') || content.includes('useNavigate(') || content.includes('useAuth(') || content.includes('onClick=') || content.includes('window.') || content.includes('localStorage') || content.includes('navigator.'))
  ) {
    // some files might have ESLint directives at top
    if (content.startsWith('/*')) {
      content = content.replace(/(\/\*[\s\S]*?\*\/)\n/, '$1\n"use client";\n');
    } else {
      content = '"use client";\n' + content;
    }
  }

  // Replace react-router-dom Link and useNavigate
  if (content.includes('react-router-dom')) {
    // Find import { ... } from "react-router-dom"
    const regex = /import\s+{([^}]+)}\s+from\s+["']react-router-dom["']/g;

    content = content.replace(regex, (match, p1) => {
      let imports = p1.split(',').map(s => s.trim()).filter(Boolean);
      let hasLink = false;
      let hasNavigate = false;

      imports.forEach(imp => {
        if (imp === 'Link') hasLink = true;
        if (imp === 'useNavigate') hasNavigate = true;
      });

      let replacement = '';
      if (hasLink) {
        replacement += 'import Link from "next/link";\n';
      }
      if (hasNavigate) {
        replacement += 'import { useRouter as useNavigate } from "next/navigation";\n';
      }
      return replacement.trim();
    });
  }

  // Next.js Link doesn't need to="" it uses href=""
  content = content.replace(/<Link([^>]*?)to=/g, '<Link$1href=');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed:', filePath);
  }
}

walk(path.join(__dirname, 'src'), processFile);
console.log('Migration script complete.');
