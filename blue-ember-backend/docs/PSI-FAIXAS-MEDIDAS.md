# Faixas medidas das 19 investigações de incêndio (PSI)

Extraído em 15/11/2026 das tabelas "Experimental table" de cada investigação no repositório PSI da NASA
(`/geode-py/ws/studies/<PSI-id>/download`). Valores gravados em `data/normalized_investigations.json`
(`o2_range`, `pressure_kpa`, `flow_speed_cms`). A atualização da NASA (`NasaRefreshService`) preserva esses campos.

Regra: só entra número que está na tabela. Onde a tabela não traz a coluna, fica o valor assumido de cabine da ISS
(O2 21 %, 101,3 kPa, fluxo 5 cm/s) e o selo "Estimated" continua valendo.

| ID | Investigação | O2 (%) | Pressão (kPa) | Fluxo (cm/s) | Coluna de origem |
|---|---|---|---|---|---|
| PSI-98 | SAFFIRE-I | 21,6 (medido) | assumida | 20 | Percent O2, Air Flow |
| PSI-99 | SAFFIRE-II | 21,5–22,1 | assumida | 20, 30 | Percent O2, Air Flow |
| PSI-100 | SAFFIRE-III | assumido | assumida | 30 | Air Flow |
| PSI-25 | BASS-II | 13,6–22,2 | assumida | assumido | Calibrated initial O2 % |
| PSI-39 | CFI | 17–21 | 50,7–506,6 (0,5–5 atm) | assumido | Oxygen, Pressure |
| PSI-159 | ACME CFI-G | 12–40 | 50,7–304 (0,5–3 bar) | assumido | XO2, approx p (bar) |
| PSI-10 | ACME/Flame Design | 20–40 | 43–306 | assumido | XO2, pmean (atm) |
| PSI-20 | ACME BRE | 21–40 | assumida | assumido | Oxygen Conc (percent) |
| PSI-23 | ACME s-Flame | 21, 30 | assumida | assumido | Atmosphere |
| PSI-69 | FLEX | 12–34 | 70–309 (mmHg convertido) | assumido | O initial mole fraction, Ambient pressure |
| PSI-68 | FLEX-2 | 17–30 | 50,7–304 (0,5–3 atm) | 0,1–5 | Oxygen Mole Fraction, Ambient Pressure, Flow Velocity |
| PSI-102 | SAME | assumido | assumida | 5–10 | Air Flow |
| PSI-101 | SAME-R | assumido | assumida | 0,5–8,1 | Inlet velocity |
| PSI-107 | SPICE | assumido | assumida | 0,66–85 | Air Rate |
| PSI-26, PSI-106, PSI-47, PSI-22, PSI-21 | BASS, SLICE, DAFT, ACME E-FIELD, ACME CLD | assumidos | assumidos | assumidos | tabela sem essas colunas |

Ainda iguais para todas (valores padrão do normalizador, sem fonte): MOC 18 %, HRR 1,5 kW, CO 100 ppm,
propagação 1 mm/s. Ou seja, C2–C5 do score não diferenciam; só C1 (proximidade) usa dado medido.
Exceção conhecida: BASS-II traz CO final medido (até 950 ppm), não aplicado para não misturar critérios.
