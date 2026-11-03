# Detecção de Encontros

Solução em **TypeScript / Node.js** para o desafio técnico do **Programa Trainee Tech Spacecom 2027**:
processa geolocalizações e detecta encontros físicos entre monitorados (tornozeleiras) e vítimas (medidas protetivas).

## Como executar

```bash
# 1. Dependências
pnpm install

# 2. Baixar datasets oficiais
./scripts/download-dataset.sh

# 3. Typecheck e testes
pnpm typecheck
pnpm test

# 4. Processar um dataset
pnpm detect data/inputs/dataset1.txt
```

### Exemplo de saída

No `stdout`, o comando exibe informações relevantes da execução (tempo, quantidade de encontros e tamanho do bucket, usado na otimização).

```text
Input:       $HOME/detection-of-encounters/data/inputs/dataset1.txt
Output:      $HOME/detection-of-encounters/output/dataset1.json
Positions:   5000
Timestamps:  500
Bucket size: 10
Encounters:  4
Elapsed:     0.013s
```

Os JSONs gerados ficam em `output/` (formato oficial do enunciado: `tipo`, `monitoradosEncontro`, `timestamp`, `posicoes`, `distanciaMetros`).

## Baixar os dados

Script incluso:

```bash
./scripts/download-dataset.sh
```

Ele baixa:

| Destino | Arquivos |
| --- | --- |
| `data/inputs/` | `dataset1.txt` … `dataset7.txt` |
| `data/expected/` | `respostas1.json`, `respostas2.json` (respostas esperadas dos datasets 1 e 2) |

## Estrutura do repositório

O repositório é organizado em pastas como `data/`, `src/` e `tests/`. A pasta `tests/` espelha a estrutura de `src/` para os testes unitários.

```text
detection-of-encounters/
├── data/
│   ├── inputs/              # datasets .txt (offline)
│   └── expected/            # respostas oficiais 1 e 2
├── output/                  # JSONs gerados pela detecção
├── scripts/
│   └── download-dataset.sh
├── src/
│   ├── shared/              # Haversine, constants, repo root
│   ├── features/            # domínio da detecção
│   │   ├── models/          # Monitored, Position, Encounter
│   │   ├── parse-dataset.ts
│   │   ├── pair-candidates.ts
│   │   ├── classify-encounter.ts
│   │   ├── detect-encounters.ts
│   │   ├── write-encounters-json.ts
│   │   └── index.ts         # API pública da feature
│   └── scripts/
│       └── run-detection.ts # CLI
├── tests/                   # espelha src/ (node:test)
├── package.json
├── tsconfig.json            # alias @/* → src/*
└── README.md
```

## Arquitetura

Monólito modular **leve**, organizado por responsabilidade (sem framework):

| Camada | Papel |
| --- | --- |
| `shared/` | utilitários puros (Haversine e constantes) |
| `features/` | regras e funções específicas do desafio |
| `scripts/` | entrypoints do CLI |
| `tests/` | testes unitários / integração local |

Convenções:

- Código, comentários e nomes de arquivos em **inglês**
- Schema JSON de saída em **português**, como no enunciado
- Alias de import `@/` → `src/` (resolvido em runtime pelo `tsx`)

## Lógica / fluxo

1. **Leitura one-pass**  
   O arquivo é percorrido em stream, assumindo ordenação por `timestamp` (evita custo de RAM/tempo ao agrupar o dataset inteiro de uma vez).  
   Ao fechar o primeiro timestamp, define-se `N` (pessoas por instante). Timestamps seguintes devem ter exatamente `N` linhas.

2. **Pares candidatos (grade espacial)**  
   Em cada bucket, posições vão para células de ~20 m. Só se comparam pontos na mesma célula ou nas 8 vizinhas; a distância final usa **Haversine** com `R = 6_371_000` m. Encontro se `distância < 20`.

3. **Classificação**  
   Para cada par próximo:
   - `protetiva` — um lista o outro em `idsRestricaoMedida`
   - `faccao` — mesma `factionId` não nula
   - `generico` — demais casos

4. **Serialização**  
   Modelo interno em inglês → JSON oficial (`tipo`, `monitoradosEncontro`, …).

Referência de pares: `pairCandidatesBruteForce` permanece no código para testes de paridade com o grid.

## Otimizações (e por quê)

| Decisão | Motivo |
| --- | --- |
| **One-pass por timestamp** (sem `Position[]` global) | Datasets 6 e 7 têm milhões de linhas; manter tudo em RAM estouraria a memória, então só o bucket atual e a lista de encontros ficam armazenados. |
| **Grade espacial esparsa** | Brute-force é O(N²) por timestamp (`N` chega a 120). O grid reduz Haversines aos vizinhos geográficos, evitando comparações entre pontos muito distantes. |
| **`N` fixo validado** | Nos datasets, cada timestamp tem o mesmo número de entradas; isso evita um agrupamento genérico mais caro e, se a premissa quebrar, a validação falha cedo. |

Baseline de força bruta foi mantido só para validar que o grid encontra o **mesmo** conjunto de pares.

## Datasets processados

Todos os 7 datasets foram executados. Tempos medidos localmente (máquina de desenvolvimento; variam por hardware):

| Dataset | Positions | Timestamps | Bucket `N` | Encounters | Elapsed (aprox.) | Output |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 5 000 | 500 | 10 | 4 | 0.01 s | `output/dataset1.json` |
| 2 | 25 000 | 1 250 | 20 | 6 | 0.06 s | `output/dataset2.json` |
| 3 | 100 000 | 2 500 | 40 | 10 | 0.22 s | `output/dataset3.json` |
| 4 | 400 020 | 6 667 | 60 | 15 | 0.85 s | `output/dataset4.json` |
| 5 | 1 000 000 | 12 500 | 80 | 21 | 2.2 s | `output/dataset5.json` |
| 6 | 8 000 000 | 80 000 | 100 | 27 | 16 s | `output/dataset6.json` |
| 7 | 12 000 000 | 100 000 | 120 | 35 | 25 s | `output/dataset7.json` |

Validação local: `dataset1` e `dataset2` conferem com `data/expected/respostas1.json` e `respostas2.json` (conteúdo JSON idêntico pelo `diff` do Linux/macOS).

## Testes

Stack: **`node:test`** + `node:assert/strict`, executados via `tsx`.

```bash
pnpm test
pnpm typecheck
```

Cobertura principal:

- Haversine (amostra oficial)
- Parse de linha / campos com aspas
- Classificação de tipo (prioridade protetiva)
- Paridade grid × brute-force (buckets dos datasets 1 e 2)
- Integração `detectEncountersFromDataset` × `respostas1.json`
- Serialização para o schema oficial

## Uso de IA

O desenvolvimento foi acelerado com **Cursor** (assistente de código). A IA ajudou em scaffolding, refactors e rascunhos de implementação.  
**Todas** as decisões de arquitetura, regras de negócio, revisões de código e escolhas de otimização foram feitas e validadas por mim. O código foi revisado humanamente antes de consolidar cada etapa, com diversos code reviews e testes unitários para garantir os resultados.

## Por que esta abordagem

1. **Correção primeiro** — regras do enunciado (mesmo timestamp, Haversine, `< 20 m`, tipos) cobertas por testes contra o gabarito.
2. **Escala depois** — one-pass + grade espacial permitem processar os datasets grandes sem OOM e com tempo competitivo no critério de desempate.
3. **Simplicidade defensável** — TypeScript puro, sem framework; um algoritmo público de pares (`pairCandidates`) com brute-force só como referência. Mantém apenas o necessário, nada além do pedido, para evitar perda de desempenho tanto em memória quanto em tempo de processamento.
4. **Reprodutibilidade** — `pnpm install` + script de download + um comando `detect` por arquivo.
