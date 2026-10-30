// Generated from migrations/0003_room_layout.sql by the build check.
export const LAYOUT_SCHEMA_SQL = "CREATE TABLE IF NOT EXISTS home_layout (\n user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,\n nodes TEXT NOT NULL DEFAULT '{}',\n revision INTEGER NOT NULL DEFAULT 0\n);\n";
