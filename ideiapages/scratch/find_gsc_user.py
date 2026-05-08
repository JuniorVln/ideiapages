import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

def get_gsc_users():
    print(f"Buscando usuários em admin_google_oauth...")
    res = supabase.table("admin_google_oauth").select("user_id, actualizado_em").execute()
    if res.data:
        for row in res.data:
            print(f"User ID: {row['user_id']} | Last Sync: {row['actualizado_em']}")
    else:
        print("Nenhum usuário encontrado em admin_google_oauth.")

if __name__ == "__main__":
    get_gsc_users()
