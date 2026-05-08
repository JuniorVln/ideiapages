# Usar imagem base do Node (Bookworm tem as bibliotecas recentes para Python/C++)
FROM node:20-bookworm-slim

# Evitar prompts interativos do apt
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependências de sistema (Python, pip, curl)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    git \
    && curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="/usr/local/bin" sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Configurar pasta de trabalho raiz
WORKDIR /app

# Copiar todo o projeto para dentro do container
COPY . /app/

# 1. Configurar o Python/Research
# (criar o ambiente e instalar as deps via uv sync)
WORKDIR /app/research
RUN uv sync

# 2. Configurar o Web/Next.js
# (instalar dependências e compilar)
WORKDIR /app/web
RUN pnpm install --frozen-lockfile

# Injetar as variáveis da Railway durante a fase de build
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG APIFY_TOKEN
ARG FIRECRAWL_API_KEY
ARG PEXELS_API_KEY
ARG ANTHROPIC_API_KEY
ARG OPENAI_API_KEY
ARG GOOGLE_AI_API_KEY
ARG GOOGLE_OAUTH_CLIENT_ID
ARG GOOGLE_OAUTH_CLIENT_SECRET
ARG GSC_OAUTH_STATE_SECRET
ARG GSC_SYNC_USER_ID
ARG GSC_SITE_URL
ARG CRON_SECRET
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE
ARG ADMIN_LOCAL_BYPASS
ARG NEXT_PUBLIC_SITE_URL

ENV SUPABASE_URL=$SUPABASE_URL \
    SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    APIFY_TOKEN=$APIFY_TOKEN \
    FIRECRAWL_API_KEY=$FIRECRAWL_API_KEY \
    PEXELS_API_KEY=$PEXELS_API_KEY \
    ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
    OPENAI_API_KEY=$OPENAI_API_KEY \
    GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY \
    GOOGLE_OAUTH_CLIENT_ID=$GOOGLE_OAUTH_CLIENT_ID \
    GOOGLE_OAUTH_CLIENT_SECRET=$GOOGLE_OAUTH_CLIENT_SECRET \
    GSC_OAUTH_STATE_SECRET=$GSC_OAUTH_STATE_SECRET \
    GSC_SYNC_USER_ID=$GSC_SYNC_USER_ID \
    GSC_SITE_URL=$GSC_SITE_URL \
    CRON_SECRET=$CRON_SECRET \
    NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE=$NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE \
    ADMIN_LOCAL_BYPASS=$ADMIN_LOCAL_BYPASS \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN pnpm build

# Expor a porta que a Railway injeta
EXPOSE 3000

# Definir variáveis de ambiente essenciais para Next.js e para a CLI de pesquisa
ENV NODE_ENV=production
ENV PORT=3000
ENV IDEIAPAGES_RESEARCH_DIR=/app/research

# Comando para iniciar o servidor do Next.js em produção
CMD ["pnpm", "start"]
