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
- [x] `pair-candidates.ts` (brute force + distance filter)
- [x] `detect-encounters.ts`
- [x] `write-encounters-json.ts`
- [x] `index.ts` (public API)
- [x] `scripts/run-detection.ts`

---

## 7. Performance (próximo foco)

- [ ] Grade espacial (ou equivalente) em `pair-candidates` / por timestamp
- [ ] Revisar memória nos datasets 6–7 (evitar OOM)
  - Aceite: 3–5 rápidos; 6–7 completam com tempo mensurável

---

## 8. Outputs oficiais

- [x] `output/dataset1.json` (smoke)
- [ ] Gerar JSON para datasets 1–7
  - Aceite: arquivos em `output/` prontos para o zip

---

## 9. Entrega

- [ ] `README.md` (lógica, arquitetura, como rodar, por que a abordagem)
- [ ] Empacotar código + outputs (`.zip` ou link)
- [ ] Enviar e-mail
