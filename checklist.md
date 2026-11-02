# Checklist — Detecção de Encontros

## 0. Documentação e estrutura

- [x] `specification.md` a partir do enunciado
- [x] `checklist.md`
- [x] Esqueleto de pastas com `.gitkeep`
    - Definicao da arquitetura base do projeto
    - Definicao da linguagem (typescript ou javascript)

---

## 1. Setup do projeto

- [x] `package.json` + scripts pnpm (`detect`, `validate`, `typecheck`, `test`)
- [x] `tsconfig.json` (TypeScript estrito, NodeNext; inclui `tests/`)
- [x] Dev deps: `typescript`, `tsx`, `@types/node` (package manager: pnpm)
- [x] `node:test` + `tests/` espelhando `src/` (smoke: `haversine.test.ts`)
- [x] Atualizar `.gitignore` (`node_modules`, datasets 3–7, `output/*`, `dist/`)

---

## 2. Dados offline

- [x] Baixar `dataset1.txt` ate `dataset7.txt` → `data/inputs/`
- [x] Baixar `respostas1.json`, `respostas2.json` → `data/expected/`

---

## 3. Feature `shared`

- [x] `constants.ts` (`EARTH_RADIUS_METERS`, `ENCOUNTER_RADIUS_METERS`)
- [x] `haversine.ts` with `R = 6_371_000`

---

## 4. Feature `detection` — models

> Código e nomes de arquivos em **inglês**. Campos do JSON de output seguem o contrato do enunciado (`tipo`, `monitoradosEncontro`, `posicoes`, `distanciaMetros`).

- [x] `models/monitored.ts`
- [x] `models/position.ts`
- [x] `models/encounter.ts` (type, pair, timestamp, positions, distanceMeters → serializa no schema oficial)

---

## 5. Feature `detection` — core

- [ ] `parse-dataset.ts` (`;`, quotes, empty faction, `idsRestricaoMedida`)
- [ ] `classify-encounter.ts` (priority to confirm against expected)
- [ ] `pair-candidates.ts` (brute force per timestamp first)
- [ ] `detect-encounters.ts` (group by timestamp → pairs &lt; 20 m)
- [ ] `write-encounters-json.ts`
- [ ] `index.ts` (public API)
  - Aceite: processa `dataset1` e gera JSON no formato do enunciado

---

## 6. Run scripts

- [ ] `scripts/run-detection.ts` (`data/inputs` → `output/` + timing)
- [ ] `scripts/run-validation.ts` (detection + expected → score)
  - Aceite: CLI documentável no README; imprime tempo de execução

---

## 7. Feature `validation`

- [ ] `models/score-report.ts` (`ec`, `ei`, `score`, extras)
- [ ] `match-encounters.ts` (normalized pair + float tolerance)
- [ ] `load-expected-json.ts`
- [ ] `validate-against-expected.ts`
- [ ] `index.ts`
  - Aceite: **dataset1 e dataset2** com `ei = 0` e todos os expected encontrados (`ec` completo)

---

## 8. Performance

- [ ] Streaming / leitura eficiente
- [ ] Grade espacial (ou equivalente) para timestamps com muitos pontos
  - Aceite: datasets 3–5 em tempo razoável; 6–7 sem OOM e com tempo mensurável

---

## 9. Outputs oficiais

- [ ] Gerar JSON para datasets 3–7 (e 1–2 se desejado na entrega)
  - Aceite: arquivos em `output/` prontos para o zip

---

## 10. Entrega

- [ ] `README.md` (lógica, arquitetura, como rodar, por que a abordagem)
- [ ] Empacotar código + outputs (`.zip` ou link)
- [ ] Enviar e-mail
