# Behaviors

Cada subpasta é um **domínio** (research, generation, rendering, conversion, experiments, monitoring).

Dentro de cada domínio, cada subpasta é um **behavior** (cobertor curto isolado).

Estrutura por behavior:

```
behaviors/<dominio>/<behavior>/
├── spec.md                 (criada por /spec)
└── issues/
    ├── 01-<nome>.md        (criadas por /break)
    ├── 01-<nome>-plan.md   (criada por /plan)
    └── 01-<nome>-review.md (opcional, por quality-reviewer)
```

A **implementação** mora em:

- `web/src/behaviors/<dominio>/<behavior>/` (TypeScript/React)
- `research/src/ideiapages_research/behaviors/<behavior_snake_case>/` (Python)

Veja [`../docs/sdd-workflow.md`](../docs/sdd-workflow.md) para o pipeline completo.
