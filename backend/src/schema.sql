CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), first_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS profiles (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, country TEXT, preferred_response_style TEXT NOT NULL DEFAULT 'Normal', primary_help_category TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS memories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, category TEXT NOT NULL, value TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'user', confirmed_by_user BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS conversations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL DEFAULT 'New conversation', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK(role IN ('user','assistant')), content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, access_token TEXT NOT NULL, refresh_token TEXT, expires_at TIMESTAMPTZ,
  granted_scopes TEXT[] NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
CREATE INDEX IF NOT EXISTS connected_accounts_user_id_idx ON connected_accounts(user_id);
CREATE TABLE IF NOT EXISTS task_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, color TEXT, shared BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID REFERENCES task_lists(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Personal' CHECK(category IN ('Personal','Work','Shopping','Finance','Health','Family','Other')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High')), due_date TIMESTAMPTZ,
  reminder_date TIMESTAMPTZ, completed BOOLEAN NOT NULL DEFAULT FALSE, source TEXT NOT NULL DEFAULT 'user',
  checklist JSONB NOT NULL DEFAULT '[]', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'One Time', timing TEXT NOT NULL DEFAULT 'At time', scheduled_for TIMESTAMPTZ NOT NULL,
  custom_rule JSONB, notification_id TEXT, enabled BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tasks_user_due_idx ON tasks(user_id,due_date); CREATE INDEX IF NOT EXISTS task_reminders_task_idx ON task_reminders(task_id);
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id); CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id); CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);

-- Money is intentionally separate from assistant memories and conversations.
CREATE TABLE IF NOT EXISTS budgets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, pay_frequency TEXT NOT NULL, typical_take_home NUMERIC(12,2) NOT NULL, next_pay_date DATE NOT NULL, monthly_savings_target NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS budget_categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, monthly_target NUMERIC(12,2) NOT NULL DEFAULT 0, type TEXT NOT NULL CHECK(type IN ('flexible','savings')));
CREATE TABLE IF NOT EXISTS recurring_bills (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, amount NUMERIC(12,2) NOT NULL, frequency TEXT NOT NULL, next_due_date DATE NOT NULL, category TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, description TEXT NOT NULL, amount NUMERIC(12,2) NOT NULL, category TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('expense','income')), transaction_date DATE NOT NULL, source TEXT NOT NULL DEFAULT 'manual', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS savings_goals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, target_amount NUMERIC(12,2) NOT NULL, current_amount NUMERIC(12,2) NOT NULL DEFAULT 0, target_date DATE);
CREATE INDEX IF NOT EXISTS bills_user_due_idx ON recurring_bills(user_id,next_due_date); CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions(user_id,transaction_date);
