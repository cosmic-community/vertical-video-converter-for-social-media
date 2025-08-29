const fs = require('fs');
const path = require('path');

function injectConsoleCapture() {
  const buildDir = path.join(process.cwd(), '.next');
  const outDir = path.join(process.cwd(), 'out');
  
  // Check which directory exists (depends on build/export config)
  let targetDir;
  if (fs.existsSync(buildDir)) {
    targetDir = buildDir;
  } else if (fs.existsSync(outDir)) {
    targetDir = outDir;
  } else {
    console.log('No build directory found. Skipping console capture injection.');
    return;
  }

  console.log('Injecting console capture script into HTML files...');
  
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.html')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Only inject if not already present
        if (!content.includes('dashboard-console-capture.js')) {
          // Inject script in head section
          const headTagIndex = content.indexOf('</head>');
          if (headTagIndex !== -1) {
            const scriptTag = '<script src="/dashboard-console-capture.js"></script>\n';
            content = content.slice(0, headTagIndex) + scriptTag + content.slice(headTagIndex);
            
            fs.writeFileSync(filePath, content);
            console.log(`Injected console capture into: ${filePath}`);
          }
        }
      }
    });
  }
  
  processDirectory(targetDir);
  console.log('Console capture injection completed.');
}

// Run if called directly
if (require.main === module) {
  injectConsoleCapture();
}

module.exports = { injectConsoleCapture };