CREATE TABLE bean_ledger (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_key TEXT NOT NULL,
 reason TEXT NOT NULL,
 delta INTEGER NOT NULL CHECK(delta != 0),
 day TEXT NOT NULL,
 created INTEGER NOT NULL,
 UNIQUE(user_id,event_key)
);
CREATE INDEX bean_user_day ON bean_ledger(user_id,day,reason);
CREATE TABLE home_presence (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 day TEXT NOT NULL,
 last_at INTEGER NOT NULL,
 elapsed_ms INTEGER NOT NULL DEFAULT 0 CHECK(elapsed_ms >= 0)
);
CREATE TABLE home_inventory (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 item_id TEXT NOT NULL,
 purchase_id TEXT NOT NULL UNIQUE,
 price INTEGER NOT NULL CHECK(price >= 0),
 acquired INTEGER NOT NULL,
 PRIMARY KEY(user_id,item_id)
);
CREATE TABLE home_equipment (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 slot TEXT NOT NULL,
 item_id TEXT NOT NULL,
 PRIMARY KEY(user_id,slot)
);
