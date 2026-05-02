
import sqlite3
import os

db_path = r"C:\Users\emeso\AppData\Roaming\Antigravity\User\globalStorage\state.vscdb"

if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Tables in state.vscdb:")
for table in tables:
    print(f"- {table[0]}")

# Also check for values containing the old path
old_path = "Neonorte"
cursor.execute("SELECT key, value FROM ItemTable WHERE value LIKE ?", (f"%{old_path}%",))
matches = cursor.fetchall()

print("\nMatches in ItemTable:")
for key, value in matches:
    print(f"Key: {key}")
    # Print a snippet of the value
    val_str = str(value)
    if len(val_str) > 100:
        print(f"Value: {val_str[:100]}...")
    else:
        print(f"Value: {val_str}")

conn.close()
