#!/usr/bin/env node

/**
 * PhantomPay Deployment Readiness Check
 * Run with: node check-deployment.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 PhantomPay Deployment Readiness Check\n');
console.log('='.repeat(50));

let allGood = true;
const warnings = [];
const errors = [];

// Check 1: Environment file exists
console.log('\n📁 Checking environment configuration...');
const envPath = join(__dirname, 'server', '.env');
if (existsSync(envPath)) {
  console.log('  ✅ server/.env exists');
  
  // Parse .env file
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2];
    }
  });
  
  // Check JWT_SECRET
  if (envVars.JWT_SECRET) {
    if (envVars.JWT_SECRET === 'transrights') {
      console.log('  ✅ JWT_SECRET is set to "transrights"');
    } else if (envVars.JWT_SECRET === 'your-super-secret-jwt-key-here') {
      errors.push('JWT_SECRET is still the default example value');
      console.log('  ❌ JWT_SECRET needs to be changed from example value');
      allGood = false;
    } else {
      console.log('  ✅ JWT_SECRET is set (custom value)');
    }
  } else {
    errors.push('JWT_SECRET is not set in .env file');
    console.log('  ❌ JWT_SECRET is missing');
    allGood = false;
  }
  
  // Check PORT
  if (envVars.PORT) {
    console.log(`  ✅ PORT is set to ${envVars.PORT}`);
  } else {
    warnings.push('PORT not set, will default to 3001');
    console.log('  ⚠️  PORT not set (will default to 3001)');
  }
  
  // Check NODE_ENV
  if (envVars.NODE_ENV) {
    console.log(`  ✅ NODE_ENV is set to ${envVars.NODE_ENV}`);
    if (envVars.NODE_ENV === 'development') {
      warnings.push('NODE_ENV is set to development (consider production for deployment)');
      console.log('  ⚠️  NODE_ENV is "development"');
    }
  } else {
    warnings.push('NODE_ENV not set');
    console.log('  ⚠️  NODE_ENV not set');
  }
  
} else {
  errors.push('server/.env file does not exist');
  console.log('  ❌ server/.env does not exist');
  console.log('  💡 Copy server/.env.example to server/.env');
  allGood = false;
}

// Check 2: Node modules
console.log('\n📦 Checking dependencies...');
const nodeModulesChecks = [
  { path: 'node_modules', name: 'Root' },
  { path: 'client/node_modules', name: 'Client' },
  { path: 'server/node_modules', name: 'Server' }
];

nodeModulesChecks.forEach(({ path, name }) => {
  if (existsSync(join(__dirname, path))) {
    console.log(`  ✅ ${name} dependencies installed`);
  } else {
    warnings.push(`${name} dependencies not installed`);
    console.log(`  ⚠️  ${name} dependencies not installed`);
    console.log(`     Run: npm run install:all`);
  }
});

// Check 3: Package.json files
console.log('\n📄 Checking package.json files...');
const packageJsons = [
  'package.json',
  'client/package.json',
  'server/package.json'
];

packageJsons.forEach(file => {
  if (existsSync(join(__dirname, file))) {
    console.log(`  ✅ ${file} exists`);
  } else {
    errors.push(`${file} is missing`);
    console.log(`  ❌ ${file} is missing`);
    allGood = false;
  }
});

// Check 4: Required directories
console.log('\n📂 Checking directory structure...');
const requiredDirs = [
  'client/src',
  'server/src',
  'server/src/config',
  'server/src/controllers',
  'server/src/routes',
  'server/src/middleware'
];

requiredDirs.forEach(dir => {
  if (existsSync(join(__dirname, dir))) {
    console.log(`  ✅ ${dir}/ exists`);
  } else {
    errors.push(`${dir} directory is missing`);
    console.log(`  ❌ ${dir}/ is missing`);
    allGood = false;
  }
});

// Check 5: Deployment files
console.log('\n🚀 Checking deployment configuration...');
const deploymentFiles = [
  { file: '.replit', required: false, desc: 'Replit config' },
  { file: 'replit.nix', required: false, desc: 'Replit dependencies' },
  { file: 'REPLIT_SETUP.md', required: false, desc: 'Replit guide' },
  { file: 'DEPLOYMENT_GUIDE.md', required: false, desc: 'Deployment guide' },
  { file: 'DEPLOYMENT_CHECKLIST.md', required: false, desc: 'Deployment checklist' }
];

deploymentFiles.forEach(({ file, required, desc }) => {
  if (existsSync(join(__dirname, file))) {
    console.log(`  ✅ ${file} (${desc})`);
  } else if (required) {
    errors.push(`${file} is missing`);
    console.log(`  ❌ ${file} is missing`);
    allGood = false;
  } else {
    console.log(`  ℹ️  ${file} not found (optional)`);
  }
});

// Check 6: Frontend build
console.log('\n🏗️  Checking frontend build...');
const buildDir = join(__dirname, 'client', 'dist');
if (existsSync(buildDir)) {
  console.log('  ✅ Client build exists (client/dist/)');
  if (existsSync(join(buildDir, 'index.html'))) {
    console.log('  ✅ index.html found in build');
  } else {
    warnings.push('index.html missing from build');
    console.log('  ⚠️  index.html missing from build');
  }
} else {
  warnings.push('Client not built yet');
  console.log('  ⚠️  Client not built yet');
  console.log('     Run: cd client && npm run build');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY\n');

if (errors.length > 0) {
  console.log('❌ ERRORS (must fix):');
  errors.forEach(err => console.log(`   • ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (recommended):');
  warnings.forEach(warn => console.log(`   • ${warn}`));
  console.log('');
}

if (allGood && errors.length === 0) {
  console.log('✅ READY FOR DEPLOYMENT!\n');
  console.log('Next steps:');
  console.log('  1. Choose deployment platform (see DEPLOYMENT_GUIDE.md)');
  console.log('  2. For Replit: See REPLIT_SETUP.md');
  console.log('  3. For VPS: Run deploy-vps.sh');
  console.log('  4. Review DEPLOYMENT_CHECKLIST.md');
  console.log('');
} else {
  console.log('❌ NOT READY - Please fix errors above\n');
  process.exit(1);
}

console.log('='.repeat(50));


