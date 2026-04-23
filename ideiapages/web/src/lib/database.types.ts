export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      briefings_seo: {
        Row: {
          briefing_jsonb: Json
          criado_em: string
          custo_brl: number | null
          id: string
          model: string
          prompt_version: number
          termo_id: string
        }
        Insert: {
          briefing_jsonb: Json
          criado_em?: string
          custo_brl?: number | null
          id?: string
          model: string
          prompt_version?: number
          termo_id: string
        }
        Update: {
          briefing_jsonb?: Json
          criado_em?: string
          custo_brl?: number | null
          id?: string
          model?: string
          prompt_version?: number
          termo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_seo_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_concorrente: {
        Row: {
          headings_h2: string[]
          headings_h3: string[]
          id: string
          idioma_detectado: string | null
          markdown: string
          paywalled: boolean
          raspado_em: string
          snapshot_id: string
          tem_faq: boolean
          tem_imagem: boolean
          tem_tabela: boolean
          thin: boolean
          truncated: boolean
          url: string
          word_count: number
        }
        Insert: {
          headings_h2?: string[]
          headings_h3?: string[]
          id?: string
          idioma_detectado?: string | null
          markdown?: string
          paywalled?: boolean
          raspado_em?: string
          snapshot_id: string
          tem_faq?: boolean
          tem_imagem?: boolean
          tem_tabela?: boolean
          thin?: boolean
          truncated?: boolean
          url: string
          word_count?: number
        }
        Update: {
          headings_h2?: string[]
          headings_h3?: string[]
          id?: string
          idioma_detectado?: string | null
          markdown?: string
          paywalled?: boolean
          raspado_em?: string
          snapshot_id?: string
          tem_faq?: boolean
          tem_imagem?: boolean
          tem_tabela?: boolean
          thin?: boolean
          truncated?: boolean
          url?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_concorrente_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "serp_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      experimentos: {
        Row: {
          amostra_total: number | null
          criado_em: string
          encerrado_em: string | null
          id: string
          iniciado_em: string
          lift: number | null
          notas: string | null
          p_value: number | null
          pagina_id: string
          status: string
          vencedor_variacao_id: string | null
        }
        Insert: {
          amostra_total?: number | null
          criado_em?: string
          encerrado_em?: string | null
          id?: string
          iniciado_em?: string
          lift?: number | null
          notas?: string | null
          p_value?: number | null
          pagina_id: string
          status?: string
          vencedor_variacao_id?: string | null
        }
        Update: {
          amostra_total?: number | null
          criado_em?: string
          encerrado_em?: string | null
          id?: string
          iniciado_em?: string
          lift?: number | null
          notas?: string | null
          p_value?: number | null
          pagina_id?: string
          status?: string
          vencedor_variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experimentos_pagina_id_fkey"
            columns: ["pagina_id"]
            isOneToOne: false
            referencedRelation: "paginas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experimentos_vencedor_variacao_id_fkey"
            columns: ["vencedor_variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          criado_em: string
          email: string
          id: string
          ip_hash: string | null
          nome: string
          pagina_id: string | null
          telefone: string
          user_agent_hash: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variacao_id: string | null
        }
        Insert: {
          criado_em?: string
          email: string
          id?: string
          ip_hash?: string | null
          nome: string
          pagina_id?: string | null
          telefone: string
          user_agent_hash?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variacao_id?: string | null
        }
        Update: {
          criado_em?: string
          email?: string
          id?: string
          ip_hash?: string | null
          nome?: string
          pagina_id?: string | null
          telefone?: string
          user_agent_hash?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_pagina_id_fkey"
            columns: ["pagina_id"]
            isOneToOne: false
            referencedRelation: "paginas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_calls_log: {
        Row: {
          behavior: string
          criado_em: string
          custo_brl: number | null
          id: string
          latencia_ms: number | null
          model: string
          payload_resumido_jsonb: Json | null
          prompt_version: number | null
          purpose: string
          termo_id: string | null
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          behavior: string
          criado_em?: string
          custo_brl?: number | null
          id?: string
          latencia_ms?: number | null
          model: string
          payload_resumido_jsonb?: Json | null
          prompt_version?: number | null
          purpose: string
          termo_id?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          behavior?: string
          criado_em?: string
          custo_brl?: number | null
          id?: string
          latencia_ms?: number | null
          model?: string
          payload_resumido_jsonb?: Json | null
          prompt_version?: number | null
          purpose?: string
          termo_id?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_calls_log_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_coleta: {
        Row: {
          behavior: string
          comecou_em: string
          custo_brl: number | null
          id: string
          items_falha: number
          items_processados: number
          items_sucesso: number
          log_jsonb: Json | null
          terminou_em: string | null
        }
        Insert: {
          behavior: string
          comecou_em: string
          custo_brl?: number | null
          id?: string
          items_falha?: number
          items_processados?: number
          items_sucesso?: number
          log_jsonb?: Json | null
          terminou_em?: string | null
        }
        Update: {
          behavior?: string
          comecou_em?: string
          custo_brl?: number | null
          id?: string
          items_falha?: number
          items_processados?: number
          items_sucesso?: number
          log_jsonb?: Json | null
          terminou_em?: string | null
        }
        Relationships: []
      }
      metricas_diarias: {
        Row: {
          cliques_whatsapp: number
          criado_em: string
          ctr_whatsapp: number | null
          data: string
          id: string
          leads: number
          pageviews: number
          pagina_id: string
          sessoes: number
          taxa_conversao: number | null
          variacao_id: string | null
        }
        Insert: {
          cliques_whatsapp?: number
          criado_em?: string
          ctr_whatsapp?: number | null
          data: string
          id?: string
          leads?: number
          pageviews?: number
          pagina_id: string
          sessoes?: number
          taxa_conversao?: number | null
          variacao_id?: string | null
        }
        Update: {
          cliques_whatsapp?: number
          criado_em?: string
          ctr_whatsapp?: number | null
          data?: string
          id?: string
          leads?: number
          pageviews?: number
          pagina_id?: string
          sessoes?: number
          taxa_conversao?: number | null
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metricas_diarias_pagina_id_fkey"
            columns: ["pagina_id"]
            isOneToOne: false
            referencedRelation: "paginas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metricas_diarias_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      paginas: {
        Row: {
          atualizado_em: string
          corpo_mdx: string
          criado_em: string
          cta_whatsapp_texto: string
          faq_jsonb: Json | null
          id: string
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          publicado_em: string | null
          slug: string
          status: string
          status_experimento: string
          subtitulo: string | null
          termo_id: string | null
          titulo: string
          variacao_vencedora_id: string | null
        }
        Insert: {
          atualizado_em?: string
          corpo_mdx?: string
          criado_em?: string
          cta_whatsapp_texto?: string
          faq_jsonb?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          publicado_em?: string | null
          slug: string
          status?: string
          status_experimento?: string
          subtitulo?: string | null
          termo_id?: string | null
          titulo: string
          variacao_vencedora_id?: string | null
        }
        Update: {
          atualizado_em?: string
          corpo_mdx?: string
          criado_em?: string
          cta_whatsapp_texto?: string
          faq_jsonb?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          publicado_em?: string | null
          slug?: string
          status?: string
          status_experimento?: string
          subtitulo?: string | null
          termo_id?: string | null
          titulo?: string
          variacao_vencedora_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paginas_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paginas_variacao_vencedora_id_fkey"
            columns: ["variacao_vencedora_id"]
            isOneToOne: false
            referencedRelation: "variacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      serp_snapshots: {
        Row: {
          capturado_em: string
          id: string
          meta_description: string | null
          posicao: number
          raw_jsonb: Json | null
          termo_id: string
          titulo: string | null
          url: string
        }
        Insert: {
          capturado_em?: string
          id?: string
          meta_description?: string | null
          posicao: number
          raw_jsonb?: Json | null
          termo_id: string
          titulo?: string | null
          url: string
        }
        Update: {
          capturado_em?: string
          id?: string
          meta_description?: string | null
          posicao?: number
          raw_jsonb?: Json | null
          termo_id?: string
          titulo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "serp_snapshots_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos"
            referencedColumns: ["id"]
          },
        ]
      }
      termos: {
        Row: {
          cluster: string | null
          created_at: string
          dificuldade: number | null
          fonte: string
          id: string
          intencao: string | null
          justificativa: string | null
          keyword: string
          metadata: Json
          score_conversao: number | null
          status: string
          tendencia_pytrends: Json | null
          tipo_pagina_recomendado: string | null
          updated_at: string
          volume_estimado: number | null
        }
        Insert: {
          cluster?: string | null
          created_at?: string
          dificuldade?: number | null
          fonte: string
          id?: string
          intencao?: string | null
          justificativa?: string | null
          keyword: string
          metadata?: Json
          score_conversao?: number | null
          status?: string
          tendencia_pytrends?: Json | null
          tipo_pagina_recomendado?: string | null
          updated_at?: string
          volume_estimado?: number | null
        }
        Update: {
          cluster?: string | null
          created_at?: string
          dificuldade?: number | null
          fonte?: string
          id?: string
          intencao?: string | null
          justificativa?: string | null
          keyword?: string
          metadata?: Json
          score_conversao?: number | null
          status?: string
          tendencia_pytrends?: Json | null
          tipo_pagina_recomendado?: string | null
          updated_at?: string
          volume_estimado?: number | null
        }
        Relationships: []
      }
      variacoes: {
        Row: {
          ativa: boolean
          corpo_mdx: string | null
          criado_em: string
          custo_estimado_usd: number | null
          id: string
          model_version: string | null
          nome: string
          pagina_id: string
          peso_trafego: number
          prompt_version: string
          provider: string
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          ativa?: boolean
          corpo_mdx?: string | null
          criado_em?: string
          custo_estimado_usd?: number | null
          id?: string
          model_version?: string | null
          nome: string
          pagina_id: string
          peso_trafego?: number
          prompt_version?: string
          provider?: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          ativa?: boolean
          corpo_mdx?: string | null
          criado_em?: string
          custo_estimado_usd?: number | null
          id?: string
          model_version?: string | null
          nome?: string
          pagina_id?: string
          peso_trafego?: number
          prompt_version?: string
          provider?: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variacoes_pagina_id_fkey"
            columns: ["pagina_id"]
            isOneToOne: false
            referencedRelation: "paginas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
