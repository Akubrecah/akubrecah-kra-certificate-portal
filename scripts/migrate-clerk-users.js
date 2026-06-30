const fs = require('fs');
const path = require('path');

// Helper to parse env files manually to avoid external dependencies
function parseEnvFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) return {};
    const content = fs.readFileSync(fullPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.substring(0, index).trim();
      let value = trimmed.substring(index + 1).trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      env[key] = value;
    });
    return env;
  } catch (error) {
    console.error(`Error parsing env file ${filePath}:`, error);
    return {};
  }
}

async function migrate() {
  const envGlobal = parseEnvFile('.env');

  // Target instance (usually prod: select-dove-43)
  const TARGET_SECRET = envGlobal.CLERK_SECRET_KEY || process.env.TARGET_SECRET_KEY;
  const CSV_PATH = path.resolve('old clerk.csv');

  console.log('--- Clerk CSV User Migration Script ---');
  console.log('Target publishable key (from .env):', envGlobal.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'Not Found');
  console.log('CSV File Path:', CSV_PATH);

  if (!TARGET_SECRET) {
    console.error('Error: CLERK_SECRET_KEY in .env must be present.');
    process.exit(1);
  }

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_PATH}`);
    process.exit(1);
  }

  console.log('\n1. Parsing users from CSV file...');
  const lines = fs.readFileSync(CSV_PATH, 'utf8').split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const users = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    const user = {};
    headers.forEach((header, index) => {
      user[header] = parts[index] ? parts[index].trim() : '';
    });
    users.push(user);
  }

  console.log(`Successfully parsed ${users.length} users from CSV.`);

  console.log('\n2. Fetching users from TARGET Clerk instance to prevent duplicates...');
  let targetEmails = new Set();
  try {
    const res = await fetch('https://api.clerk.com/v1/users?limit=100', {
      headers: {
        'Authorization': `Bearer ${TARGET_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch target users (HTTP ${res.status}): ${errText}`);
    }

    const data = await res.json();
    const targetUsers = Array.isArray(data) ? data : (data.data || []);
    targetUsers.forEach(user => {
      user.email_addresses?.forEach(e => {
        if (e.email_address) {
          targetEmails.add(e.email_address.toLowerCase());
        }
      });
    });
    console.log(`Successfully fetched ${targetUsers.length} users from target instance (containing ${targetEmails.size} unique emails).`);
  } catch (error) {
    console.error('Warning: Failed to fetch target users to prevent duplicates. Proceeding with caution...', error.message, error.cause);
  }

  console.log('\n3. Starting Migration from CSV...');
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const user of users) {
    const email = user.primary_email_address;

    if (!email) {
      console.log(`[-] Skipping user with missing email (first_name: ${user.first_name || 'unknown'})`);
      skipCount++;
      continue;
    }

    if (targetEmails.has(email.toLowerCase())) {
      console.log(`[-] Skipping user ${email} - Already exists in target instance.`);
      skipCount++;
      continue;
    }

    console.log(`[+] Migrating ${email} (${user.first_name || ''} ${user.last_name || ''})...`);

    // Prepare payload
    const payload = {
      email_address: [email],
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
      username: user.username || undefined,
    };

    // If user has a password digest in CSV, migrate password hash
    if (user.password_digest && user.password_hasher) {
      payload.password_digest = user.password_digest;
      payload.password_hasher = user.password_hasher;
      console.log(`    -> Including hashed password (${user.password_hasher})`);
    } else {
      // If no password hash, set a default password
      payload.password = 'Password2026!';
      console.log(`    -> Setting temporary default password 'Password2026!'`);
    }

    try {
      const res = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TARGET_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const createdUser = await res.json();
      console.log(`    [Success] Migrated successfully. Target ID: ${createdUser.id}`);
      successCount++;
    } catch (error) {
      console.error(`    [Failed] Failed to migrate ${email}:`, error.message, error.cause);
      failCount++;
    }

    // Small delay to respect rate limit (150ms)
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  console.log('\n--- CSV Migration Summary ---');
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Skipped (already exist/no email): ${skipCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('-----------------------------');
}

migrate();
