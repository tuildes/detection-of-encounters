# Checklist — Detecção de Encontros

## 0. Documentação e estrutura

- [x] `specification.md` a partir do enunciado
- [x] `checklist.md`
- [x] Esqueleto de pastas com `.gitkeep`
    - Definicao da arquitetura base do projeto
    - Definicao da linguagem (typescript ou javascript)

---

## 1. Setup do projeto

- [x] `package.json` + scripts pnpm (`detect`, `typecheck`, `test`)
- [x] `tsconfig.json` (TypeScript estrito, NodeNext; inclui `tests/`; alias `@/*`)
- [x] Dev deps: `typescript`, `tsx`, `@types/node` (package manager: pnpm)
- [x] `node:test` + `tests/` espelhando `src/`
- [x] Atualizar `.gitignore` (`node_modules`, datasets 3–7, `output/*`, `dist/`)

---

## 2. Dados offline

- [x] Baixar `dataset1.txt` ate `dataset7.txt` → `data/inputs/`
- [x] Baixar `respostas1.json`, `respostas2.json` → `data/expected/`

---

## 3. Feature `shared`

- [x] `constants.ts` (`EARTH_RADIUS_METERS`, `ENCOUNTER_RADIUS_METERS`)
- [x] `haversine.ts` with `R = 6_371_000`
- [x] `repo-root.ts`

---

## 4. Feature `detection` — models

> Código e nomes de arquivos em **inglês**. Campos do JSON de output seguem o contrato do enunciado (`tipo`, `monitoradosEncontro`, `posicoes`, `distanciaMetros`).

- [x] `models/monitored.ts`
- [x] `models/position.ts`
- [x] `models/encounter.ts`

---

## 5. Feature `detection` — core

- [x] `parse-dataset.ts`
- [x] `classify-encounter.ts`
- [x] `pair-candidates.ts` → `pairCandidatesBruteForce`
- [x] `detect-encounters.ts`
- [x] `write-encounters-json.ts`
- [x] `index.ts` (public API)
- [x] `scripts/run-detection.ts`

---

## 7. Performance — decisões

### Fazer

- **Grade espacial esparsa** como algoritmo principal de pares (`pairCandidates`).
- **One-pass ordenado por timestamp** (sem `Position[]` global):
  - Assumir arquivo ordenado por timestamp (validar nos DS 3–7).
  - Descobrir `N` no **1º** timestamp completo; timestamps seguintes devem fechar com `N` linhas.
  - Ao mudar o timestamp: processar bucket → acumular só `Encounter`s → liberar bucket.
  - Bucket incompleto no meio = erro de dados; extras além de `N` = rejeitar/erro explícito.
- **`Monitored` no bucket (temporário)** — com one-pass, N≈10–120, embutir no snapshot do bucket é ok. Registry global `Map<id, Monitored>` é opcional (organização / lookup de classify), não P0 de RAM.
- **Tabela N×N de classificação (opcional, barata)**: `classifyEncounter` só depende de atributos estáveis do par → calcular uma vez e reutilizar em todo timestamp. **Não** cachear Haversine (posição muda a cada 5s).
- **Um algoritmo na API pública**:
  - Atual → `pairCandidatesBruteForce` (referência / testes de paridade).
  - Novo → `pairCandidates` (grade espacial esparsa).

### Tasks

- [x] One-pass: `iterateTimestampBuckets` + `detectEncountersFromDataset`; validar `N` após o 1º timestamp
- [x] `pairCandidatesBruteForce` (rename) + testes
- [ ] `pairCandidates` grade espacial esparsa + paridade com brute (DS 1–2)
- [ ] (Opcional) lookup N×N de `EncounterType` por par de ids
- [ ] Rodar datasets 3–7 medindo tempo / memória
  - Aceite: 1–2 idênticos ao expected; 3–7 sem OOM; tempos anotados

---

## 8. Outputs oficiais

- [x] `output/dataset1.json` (smoke)
- [ ] Gerar JSON para datasets 1–7
  - Aceite: arquivos em `output/` prontos para o zip

---

## 9. Entrega

- [ ] `README.md` (lógica, arquitetura, como rodar, por que a abordagem — incluir decisões de perf)
- [ ] Empacotar código + outputs (`.zip` ou link)
- [ ] Enviar e-mail
