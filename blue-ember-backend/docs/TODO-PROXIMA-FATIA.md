# To-dos — próxima fatia do backend

**Objetivo:** deixar a API pronta para o dashboard React consumir sem gambiarra, com score protegido por testes.  
**Fora desta fatia:** Postgres, worker Python, S3, `/ask`, auth real.

---

## Prioridade alta

- [x] **Contrato FE estável**
  - Revisar DTOs de `ranking`, detalhe, `compare`, `gaps` e `export` no Swagger
  - Alinhar nomes (`criteria`, `category`, pesos) com o que o frontend vai tipar
  - Documentar query params obrigatórios/opcionais por rota

- [x] **Seed / filtro fire-safety default**
  - Default: omitir `featured` = só fire-safety (~19); `featured=false` = catálogo completo
  - Rota dedicada: `GET /api/ranking/fire-safety` (sempre featured)
  - Resposta inclui `featured: true|false` para o FE não adivinhar
  - Aplicado em ranking, investigations e export

- [x] **Testes automatizados do score**
  - Cobrir 3–5 casos fixos (ex.: SAFFIRE-II Moon/ShipEngineer, SAME, FLEX)
  - Garantir que mudanças em C1–C5 não passem silenciosas
  - Rodar no CI local (`dotnet test`) antes do commit de feature

---

## Prioridade média

- [x] **Cache GEODE com TTL / idade dos dados**
  - Expor idade do cache em `/api/health` (`dataAgeSeconds`, `lastLoadedAt`, `dataSource`, `cacheStale`)
  - Opcional: refresh automático leve se TTL expirar (`Data:CacheTtlMinutes` > 0 + worker)

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
