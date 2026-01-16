const fs = require('fs');
const path = require('path');

// List of route files that need the dynamic export
const routeFiles = [
  'app/api/admin/appointments/route.ts',
  'app/api/admin/recent-activity/route.ts',
  'app/api/admin/staff/route.ts',
  'app/api/admin/stats/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/receptionist/search/route.ts',
  'app/api/staff/appointments/route.ts',
  'app/api/receptionist/queue/route.ts',
  'app/api/receptionist/queue/[id]/route.ts',
];

// The line to add at the top of each file
const dynamicExport = "export const dynamic = 'force-dynamic';\n\n";

function addDynamicExport(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if the export already exists
    if (content.includes("export const dynamic = 'force-dynamic'") || 
        content.includes('export const dynamic = "force-dynamic"')) {
      console.log(`✓ Already has dynamic export: ${filePath}`);
      return;
    }

    // Add the export at the top (after any existing imports/comments)
    // Find the first export or import statement
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Skip initial comments and find first meaningful line
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        insertIndex = i;
        break;
      }
    }

    // Insert the dynamic export
    lines.splice(insertIndex, 0, dynamicExport.trim());
    content = lines.join('\n');

    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Added dynamic export to: ${filePath}`);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔧 Adding dynamic exports to API routes...\n');

routeFiles.forEach(file => {
  addDynamicExport(file);
});

console.log('\n✅ Done! You can now commit these changes and redeploy to Vercel.');
console.log('\nIf you have additional API routes that use cookies(), add them to the routeFiles array and run this script again.');
