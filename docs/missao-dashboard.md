# 🚀 Dashboard Mission — Technical Report Analysis

## Central Objective

> Design an **AI-powered interactive dashboard** capable of **synthesizing, ranking by criticality, and interpreting** NASA experimental findings, turning raw data into **actionable recommendations** for fire prevention, detection, and suppression during human space exploration.

---

## The Problem

| Aspect | Description |
|---------|-----------|
| **Volume** | Decades of accumulated experimental data |
| **Dispersion** | Data scattered across multiple repositories and formats |
| **Complexity** | High technical barrier to query and interpretation |
| **Urgency** | Artemis program (Moon) and future Mars missions depend on this data |

---

## Physics: Earth vs. Microgravity

| Parameter | 🌍 Earth (1g) | 🛸 Space (0g) |
|-----------|--------------|----------------|
| **Mechanism** | Natural convection (thermal buoyancy) | Molecular diffusion / forced ventilation |
| **Flame geometry** | Teardrop (elongated vertical) | Spherical / hemispherical |
| **Color / luminosity** | Intense yellow/orange | Pale blue or **invisible** |
| **Temperature** | High (upper plume) | Lower — **cold flames (300-400°C)** |
| **Smoke** | Rises → accumulates on ceiling | Suspended in clouds → follows air ducts |

---

## 5 Critical Risks in Crewed Missions

```mermaid
flowchart TD
    R1["👁️ Low Detectability\nBlue/invisible flames\nSmoke does not rise to ceiling"]
    R2["🫁 Sustained Burn at Low O₂\nMaterials 'safe' on Earth\nburn in space"]
    R3["👻 Invisible Cold Flames\n300-400°C without visible light\nRelease toxic gases"]
    R4["☠️ Toxicity in Closed Loop\nCO, HCN, HCl, formaldehyde\nNo evacuation possible"]
    R5["💨 Ventilation Paradox\nFans feed the flame\nExtinguishers scatter embers"]
    
    R1 & R2 & R3 & R4 & R5 --> RISCO["⚠️ Silent\nand Complex Threat"]
    
    style RISCO fill:#e74c3c,color:#fff
```

---

## 3 Core Experimental Programs (Data Sources)

| Program | Focus | Environment | Key Data |
|----------|------|----------|-------------|
| **FLEX** | Liquid fuel droplets | ISS (CIR) | Hot-to-cold flame transition, extinction diameters |
| **Saffire** | Full-scale solid materials | Cygnus (post-ISS) | Spread, heat release, smoke generation |
| **ACME** | Non-premixed gas flames | ISS (CIR) | Flame structure, soot, extinction limits |

---

## 3-Layer Dashboard Architecture

```mermaid
flowchart TD
    subgraph C1["🔵 Layer 1: Environmental Conditions (INPUT)"]
        O2["O₂ % — 21% ISS → 30-34% EVA"]
        P["Total Pressure — kPa/psi"]
        V["Air Velocity — 5-20 cm/s"]
        G["Gravity Level — 0g, 0.16g, 0.38g"]
    end
    
    subgraph C2["🟠 Layer 2: Spread & Severity (EXPERIMENT)"]
        TP["Spread Rate — mm/s"]
        MOC["MOC — Minimum O₂ for combustion"]
        HRR["HRR — Heat Release Rate (kW)"]
        EXT["Extinction Diameter/Time"]
    end
    
    subgraph C3["🔴 Layer 3: Toxicity & Detection (SAFETY)"]
        TOX["Toxic Gases — CO, HCN, HCl, CH₂O (ppm)"]
        PART["Soot Particles — size/density"]
        SUP["Suppression Effectiveness — CO₂, N₂, mist"]
    end
    
    C1 --> C2 --> C3
    
    style C1 fill:#3498db,color:#fff
    style C2 fill:#e67e22,color:#fff
    style C3 fill:#e74c3c,color:#fff
```

### Priority Variables Table

| Layer | Variable | Unit | Relevance |
|--------|----------|---------|------------|
| **1. Environmental** | O₂ concentration | % | Flammability — EVA atmospheres use 30-34% |
| | Total pressure | kPa / psi | Hypobaric (56 kPa Moon/Mars) alters diffusivity |
| | Air velocity | cm/s | 5-20 cm/s intensifies O₂ transport to flame |
| | Gravity level | g | Interpolate 0g ↔ 0.16g (Moon) ↔ 0.38g (Mars) |
| **2. Severity** | Spread rate | mm/s | Time available for crew response |
| | MOC (Min O₂) | % | Cutoff line for material qualification |
| | HRR (Heat) | kW | Structural failure / secondary ignition risk |
| | Extinction diameter | mm / s | Threshold for transition to invisible cold flame |
| **3. Safety** | Toxic gases | ppm | Size mask autonomy |
| | Soot particles | µm / mg/m³ | Calibrate optical/ionization detectors |
| | Suppression effectiveness | L / L/s | Agent volume without reignition |

---

## AI Layer — 3 Intelligent Functions

| Function | What it does | Example |
|--------|-----------|---------|
| **🎯 Dynamic Ranking** | User defines mission profile (O₂%, pressure, g) → AI reorders materials from highest to lowest risk | "32% O₂, 56.5 kPa, 0.16g" → ranked material list |
| **⚠️ Criticality Index** | Crosses spread × MOC × toxicity → alert when ISS-safe material becomes Artemis-dangerous | Material approved at 21% O₂ → ALERT at 34% O₂ |
| **📊 Comparative Synthesis** | Automatically compares results across experimental campaigns → highlights gaps | Polymer X in Saffire (forced flow) vs. quiescent conditions |

---

## Full Map: Sources → Dashboard

```mermaid
flowchart TD
    subgraph HIST["🕰️ WHY IT EXISTS"]
        A1["Apollo 1"] --> A13["Apollo 13"] --> MIR["Mir Fire"]
    end
    
    subgraph PROG["📖 HOW IT WORKS"]
        GCS["Glenn Combustion Science"]
        RG["Researcher's Guide"]
    end
    
    subgraph DATA["📊 EXPERIMENTAL DATA"]
        FLEX["FLEX"] & SAFFIRE["Saffire"] & ACME["ACME"]
        PSI["PSI Repository"]
        FLEX & SAFFIRE & ACME --> PSI
    end
    
    subgraph IMPACT["🌍 TERRESTRIAL IMPACT"]
        SP1["Air Tanks"]
        SP2["Incipient Detector"]
        SP3["Project FIRES"]
    end
    
    subgraph DASH["🎯 INTELLIGENT DASHBOARD"]
        C1B["Layer 1: Environment"]
        C2B["Layer 2: Severity"]
        C3B["Layer 3: Toxicity"]
        AI["🤖 AI: Ranking + Criticality + Synthesis"]
        C1B --> C2B --> C3B --> AI
    end
    
    HIST -->|"motivated"| PROG
    PROG -->|"produced"| DATA
    DATA -->|"feeds"| DASH
    DATA -->|"yielded"| IMPACT
    
    style DASH fill:#1a1a2e,color:#fff
    style AI fill:#e74c3c,color:#fff
```

---

> [!IMPORTANT]
> **Strategic synthesis:** Dashboard success depends on connecting fundamental microgravity physics (no convection, spherical flames, cold combustion, non-rising smoke) directly to engineering design decisions. By structuring FLEX, Saffire, and ACME data around cabin atmosphere, thermal severity, and toxicity, AI enables engineers to mitigate risks **before** final flight material selection.