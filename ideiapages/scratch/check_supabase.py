
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados.")
    exit(1)

sb: Client = create_client(url, key)

TABLES_TO_CHECK = [
    "termos",
    "serp_snapshots",
    "conteudo_concorrente",
    "briefings_seo",
    "llm_calls_log",
    "metricas_coleta",
    "paginas",
    "variacoes",
    "leads",
    "metricas_diarias",
    "admin_google_oauth",
    "generative_visibility_checks",
    "automation_state",
    "auto_rewrite_queue",
    "automation_log",
    "gsc_metricas_diarias"
]

print(f"Conectando a {url}...")

for table in TABLES_TO_CHECK:
    try:
        res = sb.table(table).select("count", count="exact").limit(1).execute()
        print(f"OK: Tabela '{table}': {res.count} registros.")
    except Exception as e:
        print(f"ERROR: Tabela '{table}' falhou: {e}")
