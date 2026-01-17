const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting email functionality cleanup...\n');

// Files to delete
const filesToDelete = [
  'lib/email.ts',
  'lib/email.js',
];

// API routes that might have email imports to clean
const routesToClean = [
  'app/api/auth/register/route.ts',
  'app/api/appointments/route.ts',
  'app/api/appointments/[id]/route.ts',
];

// Step 1: Delete email-related files
console.log('📁 Step 1: Deleting email-related files...');
filesToDelete.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`  ✓ Deleted: ${file}`);
    } else {
      console.log(`  ⚠️  File not found (skipping): ${file}`);
    }
  } catch (error) {
    console.error(`  ✗ Error deleting ${file}:`, error.message);
  }
});

// Step 2: Remove email imports from route files
console.log('\n📝 Step 2: Removing email imports from route files...');
routesToClean.forEach(file => {
  try {
    if (!fs.existsSync(file)) {
      console.log(`  ⚠️  File not found (skipping): ${file}`);
      return;
    }

    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Remove import statements for email functions
    const importPatterns = [
      /import\s+{[^}]*send\w*Email[^}]*}\s+from\s+['"]@\/lib\/email['"];?\n?/gi,
      /import\s+{[^}]*sendEmail[^}]*}\s+from\s+['"]@\/lib\/email['"];?\n?/gi,
      /import\s+.*from\s+['"]@\/lib\/email['"];?\n?/gi,
    ];

    importPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });

    // Remove email sending code blocks (try-catch blocks with sendWelcomeEmail, etc.)
    const emailCallPatterns = [
      /\/\/ Send.*email[\s\S]*?try\s*{[\s\S]*?send\w*Email[\s\S]*?}\s*catch[\s\S]*?}\n?/gi,
      /try\s*{[\s\S]*?await\s+send\w*Email[\s\S]*?}\s*catch\s*\([^)]*\)\s*{[\s\S]*?}\n?/gi,
      /await\s+send\w*Email\([^)]*\);?\n?/gi,
    ];

    emailCallPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`  ✓ Cleaned email imports from: ${file}`);
    } else {
      console.log(`  ℹ️  No email imports found in: ${file}`);
    }
  } catch (error) {
    console.error(`  ✗ Error cleaning ${file}:`, error.message);
  }
});

// Step 3: Uninstall Resend package
console.log('\n📦 Step 3: Uninstalling Resend package...');
try {
  console.log('  Running: npm uninstall resend');
  execSync('npm uninstall resend', { stdio: 'inherit' });
  console.log('  ✓ Resend package uninstalled');
} catch (error) {
  console.error('  ✗ Error uninstalling resend:', error.message);
}

// Step 4: Instructions for Vercel environment variables
console.log('\n🔐 Step 4: Manual action required for Vercel environment variables');
console.log('  Go to your Vercel dashboard and remove these environment variables:');
console.log('  • RESEND_API_KEY');
console.log('  • EMAIL_FROM');
console.log('\n  Steps:');
console.log('  1. Go to https://vercel.com/dashboard');
console.log('  2. Select your project');
console.log('  3. Go to Settings → Environment Variables');
console.log('  4. Delete RESEND_API_KEY and EMAIL_FROM');
console.log('  5. Redeploy your application');

// Step 5: Update .env.local
console.log('\n📄 Step 5: Cleaning .env.local file...');
try {
  if (fs.existsSync('.env.local')) {
    let envContent = fs.readFileSync('.env.local', 'utf8');
    const originalContent = envContent;
    
    // Remove Resend-related environment variables
    envContent = envContent
      .split('\n')
      .filter(line => {
        return !line.trim().startsWith('RESEND_API_KEY') &&
               !line.trim().startsWith('EMAIL_FROM');
      })
      .join('\n');

    if (envContent !== originalContent) {
      fs.writeFileSync('.env.local', envContent, 'utf8');
      console.log('  ✓ Removed email-related variables from .env.local');
    } else {
      console.log('  ℹ️  No email variables found in .env.local');
    }
  } else {
    console.log('  ⚠️  .env.local file not found');
  }
} catch (error) {
  console.error('  ✗ Error cleaning .env.local:', error.message);
}

// Summary
console.log('\n✅ Cleanup complete!\n');
console.log('Summary of changes:');
console.log('  • Deleted email utility files');
console.log('  • Removed email imports from route files');
console.log('  • Uninstalled Resend package');
console.log('  • Cleaned .env.local file');
console.log('\n⚠️  Don\'t forget to:');
console.log('  1. Remove environment variables from Vercel dashboard');
console.log('  2. Update app/api/auth/register/route.ts with the new version');
console.log('  3. Commit and push your changes');
console.log('  4. Redeploy to Vercel');
console.log('\n🎉 Your app is now email-free!');
