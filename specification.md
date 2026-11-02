# Especificação Técnica — Detecção de Encontros

Programa Trainee Tech Spacecom 2027 · Etapa técnica 1  
Prazo de envio: **03/11/2026, 23:59:59** (vale a última versão recebida)

---

## 1. Objetivo

Processar geolocalizações e detectar encontros físicos entre entidades rastreadas:

| Papel | Descrição |
| --- | --- |
| Monitorados / agressores | Indivíduos com tornozeleira eletrônica |
| Vítimas | Pessoas com medida protetiva e rastreador portátil |

### Tipos de encontro (`tipo`)

| Valor | Regra |
| --- | --- |
| `generico` | Encontro entre quaisquer dois monitorados |
| `faccao` | Dois monitorados da mesma facção |
| `protetiva` | Agressor e sua respectiva vítima (medida protetiva) |

**Hipótese de classificação (validar com `respostas1.json` / `respostas2.json`):** um par gera **um** `tipo` por timestamp, com prioridade `protetiva` > `faccao` > `generico`. A fonte da verdade são os JSONs oficiais de resposta.

---

## 2. Stack e restrições

- **Obrigatório:** JavaScript ou TypeScript (Node.js ou similar)
- **Este projeto:** TypeScript + Node.js, sem framework além do runtime
- **IA:** permitida; a avaliação pesa o uso consciente e a defesa da solução
- **Sem dependências**

---

## 3. Regras de negócio

| Regra | Detalhe |
| --- | --- |
| Raio de encontro | Distância **estritamente menor** que **20 metros** |
| Distância | Fórmula de **Haversine**, raio da Terra = **6.371.000** m |
| Timestamps | Posicionamentos a cada 5 s; comparar **somente** o mesmo timestamp exato |
| Unicidade | Um encontro por par de envolvidos naquele timestamp (ordem dos IDs no array não importa) |

---

## 4. Input

Arquivos `.txt` estilo CSV com separador `;`.

### Cabeçalho

```text
idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida
```

### Campos

| Campo | Tipo / formato | Observação |
| --- | --- | --- |
| `idMonitorado` | número | Tornozeleira ou vítima |
| `faccaoMonitorado` | id ou vazio | Preenchido só para tornozeleira |
| `timestamp` | `YYYY-MM-DD HH:MM:SS` | Pode vir entre aspas |
| `latitude` | float (5 casas) | |
| `longitude` | float (5 casas) | |
| `medidaProtetiva` | boolean | |
| `idsRestricaoMedida` | `"1,2,3,...n"` ou vazio | IDs dos agressores vinculados à vítima |

### Datasets

| Arquivo | Papel |
| --- | --- |
| `dataset1.txt`, `dataset2.txt` | Validação local (existem JSONs de resposta) |
| `dataset3.txt` … `dataset7.txt` | Avaliação / pontuação oficial |

Armazenamento local do projeto:

- `data/inputs/` — datasets baixados
- `data/expected/` — `respostas1.json`, `respostas2.json`

---

## 5. Output

Para cada dataset processado, um JSON: **array** de encontros.

```json
[
  {
    "tipo": "faccao",
    "monitoradosEncontro": [40, 44],
    "timestamp": "2024-01-01 00:01:50",
    "posicoes": {
      "40": { "lat": -10.07996, "lon": -37.08384 },
      "44": { "lat": -10.07987, "lon": -37.08389 }
    },
    "distanciaMetros": 11.406788673336607
  }
]
```

- `tipo`: `generico` | `faccao` | `protetiva`
- Chaves de `posicoes`: id do monitorado como **string**
- Arquivos gerados em: `output/`

---

## 6. Pontuação

```text
Score = soma_ec - soma_ei
```

- `soma_ec` — encontros corretos (todos os outputs)
- `soma_ei` — incorretos / falsos positivos
- **Desempate:** menor tempo médio de execução por dataset

---

## 7. Entrega (e-mail)

1. Código-fonte completo  
2. `README.md` — lógica, como executar, por que a abordagem  
3. Outputs JSON dos datasets resolvidos  

Anexos: preferir `.zip` ou link (Drive / GitHub / OneDrive). Evitar anexar `.js`/`.ts` soltos (bloqueio comum de e-mail).

---

## 8. Arquitetura do repositório

Monólito modular por feature, TypeScript/Node, batch offline.  
**Convenção:** código, comentários e nomes de arquivos/funções em **inglês**. Campos do JSON de I/O do desafio permanecem como no enunciado.

```text
data/inputs/          # downloaded datasets
data/expected/        # official answers 1 and 2
output/               # generated JSONs
src/
  shared/             # pure utils (e.g. haversine.ts)
  features/
    detection/        # parse, detect, write output
      models/         # monitored.ts, position.ts, encounter.ts
    validation/       # local score vs expected
  scripts/            # run-detection.ts, run-validation.ts
```

Regras de dependência:

- Features expose API only via `index.ts`
- `shared` must not import features
- Pure logic without `fs`; I/O in parse/write/scripts
- Data lives **outside** `src/`

Issue breakdown: see [checklist.md](checklist.md).

