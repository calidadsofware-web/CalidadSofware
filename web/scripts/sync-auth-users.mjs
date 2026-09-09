import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATACELL_AUTH_USERS } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATACELL_AUTH_USERS) {
  throw new Error("Faltan SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o DATACELL_AUTH_USERS.");
}

const requestedUsers = JSON.parse(DATACELL_AUTH_USERS);
if (!Array.isArray(requestedUsers)) throw new Error("DATACELL_AUTH_USERS debe ser un arreglo JSON.");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;

let created = 0;
let updated = 0;
for (const item of requestedUsers) {
  if (!item.email || !item.password || !item.role) throw new Error("Cada usuario requiere email, password y role.");
  const metadata = { role: item.role };
  const existing = listed.users.find((user) => user.email?.toLowerCase() === item.email.toLowerCase());
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: item.password,
      email_confirm: true,
      app_metadata: metadata,
    });
    if (error) throw error;
    updated += 1;
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email: item.email,
      password: item.password,
      email_confirm: true,
      app_metadata: metadata,
    });
    if (error) throw error;
    created += 1;
  }
}

const requestedEmails = new Set(requestedUsers.map((user) => user.email.toLowerCase()));
let removed = 0;
for (const existing of listed.users) {
  if (existing.email && !requestedEmails.has(existing.email.toLowerCase())) {
    const { error } = await supabase.auth.admin.deleteUser(existing.id);
    if (error) throw error;
    removed += 1;
  }
}

console.log(JSON.stringify({ created, updated, removed, total: requestedUsers.length }));
