
import sqlite3
import os
import shutil
import json

# Configurações de Caminhos
USER_HOME = os.path.expanduser("~")
APP_DATA_DIR = os.path.join(USER_HOME, "AppData", "Roaming", "Antigravity", "User")
GLOBAL_DB = os.path.join(APP_DATA_DIR, "globalStorage", "state.vscdb")

# IDs identificados durante a análise
OLD_WS_ID = "973c250d387dfed1ca8e70cac9d23426" # ID do Neonorte (antigo)
NEW_WS_ID = "1074c4f3fe1fd3f0ca4f225bfa47976b" # ID do Kurupira-Iaca (novo)

# Caminhos para replace (Fragmentos de URI)
OLD_PATH_FRAG = "Neonorte/Neonorte"
NEW_PATH_FRAG = "Neonorte/Kurupira-Iaca"

def backup_db(path):
    if os.path.exists(path):
        backup_path = path + ".migration_backup"
        shutil.copy2(path, backup_path)
        print(f"Backup criado: {backup_path}")

def migrate_global_db():
    print("\n--- Migrando Banco de Dados Global ---")
    if not os.path.exists(GLOBAL_DB):
        print(f"Erro: Banco global não encontrado em {GLOBAL_DB}")
        return

    backup_db(GLOBAL_DB)
    conn = sqlite3.connect(GLOBAL_DB)
    cursor = conn.cursor()

    # Buscar chaves relacionadas ao antigravity ou que contenham o caminho antigo
    cursor.execute("SELECT key, value FROM ItemTable WHERE key LIKE '%antigravity%' OR value LIKE ?", (f"%{OLD_PATH_FRAG}%",))
    rows = cursor.fetchall()

    updated_count = 0
    for key, value in rows:
        if value and isinstance(value, str):
            if OLD_PATH_FRAG in value:
                # Substitui tanto o formato raw quanto o URL encoded
                new_value = value.replace(OLD_PATH_FRAG, NEW_PATH_FRAG)
                new_value = new_value.replace(OLD_PATH_FRAG.replace("/", "%2F"), NEW_PATH_FRAG.replace("/", "%2F"))
                
                cursor.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (new_value, key))
                print(f"Atualizada chave global: {key}")
                updated_count += 1

    conn.commit()
    conn.close()
    print(f"Total de chaves globais atualizadas: {updated_count}")

def migrate_workspace_db():
    print("\n--- Migrando Banco de Dados do Workspace ---")
    old_db = os.path.join(APP_DATA_DIR, "workspaceStorage", OLD_WS_ID, "state.vscdb")
    new_db = os.path.join(APP_DATA_DIR, "workspaceStorage", NEW_WS_ID, "state.vscdb")

    if not os.path.exists(old_db):
        print(f"Aviso: Banco de dados antigo não encontrado em {old_db}. Pulando etapa de workspace.")
        return

    if not os.path.exists(os.path.dirname(new_db)):
        os.makedirs(os.path.dirname(new_db), exist_ok=True)

    backup_db(new_db)
    
    conn_old = sqlite3.connect(old_db)
    conn_new = sqlite3.connect(new_db)
    
    cursor_old = conn_old.cursor()
    cursor_new = conn_new.cursor()

    # Garantir que a tabela existe no banco novo
    cursor_new.execute("CREATE TABLE IF NOT EXISTS ItemTable (key TEXT PRIMARY KEY, value TEXT)")

    # Copiar chaves do Antigravity e do editor do antigo para o novo
    cursor_old.execute("SELECT key, value FROM ItemTable WHERE key LIKE '%antigravity%' OR key LIKE '%jetski%' OR key LIKE '%cascade%'")
    rows = cursor_old.fetchall()

    migrated_count = 0
    for key, value in rows:
        cursor_new.execute("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", (key, value))
        print(f"Migrada chave de workspace: {key}")
        migrated_count += 1

    conn_new.commit()
    conn_old.close()
    conn_new.close()
    print(f"Total de chaves de workspace migradas: {migrated_count}")

def cleanup_junction():
    print("\n--- Limpeza de Vínculos ---")
    # Tenta remover tanto a versão capitalizada quanto a minúscula se existirem
    junction_paths = [
        r"D:\Repositório_Pessoal\SaaS Projects\Neonorte\Neonorte",
        r"D:\Repositório_Pessoal\SaaS Projects\Neonorte\neonorte"
    ]
    for path in junction_paths:
        if os.path.exists(path):
            try:
                # No Windows, os.rmdir em um junction remove apenas o link
                os.rmdir(path)
                print(f"Junction removida com sucesso: {path}")
            except Exception as e:
                print(f"Não foi possível remover {path} (pode ser uma pasta real): {e}")

if __name__ == "__main__":
    print("====================================================")
    print("   SCRIPT DE MIGRAÇÃO DEFINITIVA DO ANTIGRAVITY     ")
    print("====================================================")
    print("Certifique-se de que o VS Code/Antigravity está FECHADO.")
    
    confirm = input("\nDeseja iniciar a migração? (s/n): ")
    if confirm.lower() != 's':
        print("Migração cancelada.")
        exit(0)

    try:
        migrate_global_db()
        migrate_workspace_db()
        cleanup_junction()
        print("\n====================================================")
        print("MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("Agora você pode abrir a pasta 'Kurupira-Iaca' no Antigravity.")
        print("====================================================")
    except Exception as e:
        print(f"\n[ERRO CRÍTICO]: {e}")
        print("Use os arquivos .migration_backup para restaurar o estado anterior se necessário.")
