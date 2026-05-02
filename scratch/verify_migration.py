import sqlite3
import os
import shutil

# Configurações de Caminhos
USER_HOME = os.path.expanduser("~")
APP_DATA_DIR = os.path.join(USER_HOME, "AppData", "Roaming", "Antigravity", "User")
GLOBAL_DB = os.path.join(APP_DATA_DIR, "globalStorage", "state.vscdb")

# IDs identificados
OLD_WS_ID = "1074c4f3fe1fd3f0ca4f225bfa47976b" # Kurupira-Iaca
NEW_WS_ID = "4acc5519dce3c7f6b0921d153fcffd76" # Ywara (Novo ID gerado pelo seu VS Code)

def migrate():
    print(f"Migrando dados de {OLD_WS_ID} para {NEW_WS_ID}...")
    
    # 1. Migrar Banco Global
    conn = sqlite3.connect(GLOBAL_DB)
    cursor = conn.cursor()
    
    # Atualizar o mapeamento de workspace cascades
    cursor.execute("SELECT value FROM ItemTable WHERE key = 'google.antigravity'")
    row = cursor.fetchone()
    if row:
        val = row[0].replace(OLD_WS_ID, NEW_WS_ID)
        val = val.replace("Kurupira-Iaca", "Ywara")
        cursor.execute("UPDATE ItemTable SET value = ? WHERE key = 'google.antigravity'", (val,))
    
    conn.commit()
    conn.close()
    
    # 2. Migrar Banco de Workspace (Storage)
    old_db = os.path.join(APP_DATA_DIR, "workspaceStorage", OLD_WS_ID, "state.vscdb")
    new_db = os.path.join(APP_DATA_DIR, "workspaceStorage", NEW_WS_ID, "state.vscdb")
    
    if os.path.exists(old_db):
        conn_old = sqlite3.connect(old_db)
        conn_new = sqlite3.connect(new_db)
        
        cursor_old = conn_old.cursor()
        cursor_new = conn_new.cursor()
        
        cursor_new.execute("CREATE TABLE IF NOT EXISTS ItemTable (key TEXT PRIMARY KEY, value TEXT)")
        
        cursor_old.execute("SELECT key, value FROM ItemTable WHERE key LIKE '%antigravity%' OR key LIKE '%jetski%'")
        for key, value in cursor_old.fetchall():
            cursor_new.execute("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", (key, value))
            
        conn_new.commit()
        conn_old.close()
        conn_new.close()
        print("Migração de chaves concluída.")

if __name__ == "__main__":
    migrate()
    print("\nFeito! Agora abra o VS Code na pasta Ywara e as conversas devem ser reconhecidas como 'deste workspace'.")
