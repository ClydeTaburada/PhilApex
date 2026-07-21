const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local file not found.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.replace('\r', '');
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function provision() {
  const email = "admin@phil-apex.com";
  const password = "Password123!";
  const fullName = "System Administrator";

  console.log(`Provisioning admin account...`);
  console.log(`Email: ${email}`);

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.code === 'email_exists' || authError.message.includes('already')) {
      console.log("User already exists. Skipping auth creation.");
      
      // Get the user ID
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const user = usersData.users.find(u => u.email === email);
      if (user) {
         // Force password update so we know it
         await supabase.auth.admin.updateUserById(user.id, { password: password });
         await ensureProfile(user.id, fullName);
         console.log("✅ Admin profile ensured and password reset successfully!");
         console.log(`Email: ${email}`);
         console.log(`Password: ${password}`);
      }
      return;
    }
    console.error("Error creating auth user:", authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  await ensureProfile(userId, fullName);
  
  console.log("✅ Admin provisioned successfully!");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

async function ensureProfile(userId, fullName) {
  const { error: profileError } = await supabase
    .from("staff")
    .upsert({
      id: userId,
      full_name: fullName,
      role: "admin",
      is_active: true,
    });

  if (profileError) {
    console.error("Error creating staff profile:", profileError);
    process.exit(1);
  }
}

provision();
