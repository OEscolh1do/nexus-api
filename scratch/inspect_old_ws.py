
import sqlite3
import os
import json

old_ws_id = "973c250d387dfed1ca8e70cac9d23426"
db_path = f"C:\\Users\\emeso\\AppData\\Roaming\\Antigravity\\User\\workspaceStorage\\{old_ws_id}\\state.vscdb"

if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT key, value FROM ItemTable")
matches = cursor.fetchall()

print(f"Contents of workspace storage {old_ws_id}:")
for key, value in matches:
    if "antigravity" in key.lower() or "cascade" in key.lower():
        print(f"Key: {key}")
        print(f"Value: {value}")

conn.close()
