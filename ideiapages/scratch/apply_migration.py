import os
from supabase import create_client
from dotenv import load_dotenv

# Carrega do diretório raiz
load_dotenv()

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados.")
    exit(1)

sb = create_client(url, key)

sql = """
ALTER TABLE public.variacoes 
ADD COLUMN IF NOT EXISTS titulo_alt text,
ADD COLUMN IF NOT EXISTS meta_description_alt text,
ADD COLUMN IF NOT EXISTS quality_gate_errors text[];
"""

try:
    # Tenta usar a extensão http para rodar SQL se o RPC estiver disponível
    # Ou simplesmente faz um post para a API de query se configurado
    # Na maioria dos setups Supabase, você pode usar a API de 'rest' para rodar SQL se tiver privilégios
    # Mas o jeito mais garantido é usar a biblioteca postgrest se ela permitir SQL bruto ou usar rpc
    # No entanto, o cliente oficial não tem um método 'run_sql' direto por segurança.
    # Vou usar o endpoint /rest/v1/rpc/admin_run_sql se existir, ou apenas printar que precisa rodar no dashboard
    # se não houver um helper.
    
    # Alternativa: usar requests direto no endpoint de SQL do Supabase
    import requests
    
    # O endpoint de SQL do Supabase requer autenticação
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json"
    }
    
    # Note: O endpoint de SQL (/rest/v1/) geralmente não permite SQL arbitrário.
    # O Supabase CLI usa um endpoint diferente ou o Dashboard usa websockets/API interna.
    # Vou tentar o RPC generico de SQL se o usuário tiver criado um (comum em setups avançados)
    # Se não, vou avisar que salvei a migration e ele pode rodar no dashboard.
    
    print(f"Tentando aplicar SQL no projeto: {url}")
    
    # Tenta o rpc generico
    try:
        response = sb.rpc('exec_sql', {'query': sql}).execute()
        print("SQL aplicado via RPC 'exec_sql'")
    except Exception as e:
        print(f"RPC 'exec_sql' falhou (normal se não existir): {e}")
        print("Por favor, execute o conteúdo de 'supabase/migrations/0017_variacoes_seo_alt.sql' no SQL Editor do Supabase.")

except Exception as e:
    print(f"Erro ao tentar rodar migration: {e}")
