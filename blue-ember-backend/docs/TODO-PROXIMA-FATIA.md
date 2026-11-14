# To-dos — próxima fatia do backend

**Objetivo:** deixar a API pronta para o dashboard React consumir sem gambiarra, com score protegido por testes.  
**Fora desta fatia:** Postgres, worker Python, S3, `/ask`, auth real.

---

## Prioridade alta

- [x] **Contrato FE estável**
  - Revisar DTOs de `ranking`, detalhe, `compare`, `gaps` e `export` no Swagger
  - Alinhar nomes (`criteria`, `category`, pesos) com o que o frontend vai tipar
  - Documentar query params obrigatórios/opcionais por rota

- [ ] **Seed / filtro fire-safety default**
  - Facilitar o consumo das ~19 investigações featured (desafio)
  - Opções: default `featured=true` no ranking **ou** rota dedicada (ex. `/api/ranking/fire-safety`)
  - Evitar que o FE precise “adivinhar” o filtro

- [ ] **Testes automatizados do score**
  - Cobrir 3–5 casos fixos (ex.: SAFFIRE-II Moon/ShipEngineer, SAME, FLEX)
  - Garantir que mudanças em C1–C5 não passem silenciosas
  - Rodar no CI local (`dotnet test`) antes do commit de feature

---

## Prioridade média

- [ ] **Cache GEODE com TTL / idade dos dados**
  - Expor idade do cache (ex. header `X-Data-Age` ou campo no `/api/health`)
  - Opcional: refresh automático leve se TTL expirar

- [ ] **Validação de query ampliada**
  - Ranges O2 / pressão inválidos → 400 claro
  - `ids` do compare (quantidade, formato PSI-xx)
  - Mensagens de erro consistentes para o FE

- [ ] **Logs estruturados no refresh**
  - Latência GEODE, count retornado, count após merge
  - Falha vs sucesso distinguíveis no log

---

## Depois (não começar agora)

- [ ] Worker Python + ingestão S3 `nasa-psi`
- [ ] PostgreSQL / pgvector atrás de `IInvestigationRepository`
- [ ] Endpoint `/ask` (proxy IA)
- [ ] Auth real (JWT/OAuth) — perfis mock continuam suficientes no hackathon

---

## Ordem sugerida no próximo commit

1. Contrato FE + (se necessário) ajuste fino de DTOs  
2. Fire-safety default / rota dedicada  
3. Testes do `ScoreCalculator`  
4. Validação + logs + idade do cache (se sobrar tempo)

---

*Referência do MVP atual: [RELATORIO-BACKEND-MVP.md](./RELATORIO-BACKEND-MVP.md)*
