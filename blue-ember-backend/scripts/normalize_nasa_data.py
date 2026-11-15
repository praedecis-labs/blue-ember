import json
import os

_script_dir = os.path.dirname(os.path.abspath(__file__))
_data_dir = os.path.join(_script_dir, '..', 'data')
input_file = os.path.join(_data_dir, 'nasa_psi_combustion.json')
output_file = os.path.join(_data_dir, 'normalized_investigations.json')

with open(input_file, encoding='utf-8') as f:
    raw_data = json.load(f)

hits = raw_data['hits']['hits']

# Combustion & fire safety focused acronyms
TARGET_ACRONYMS = {
    'SAFFIRE-I', 'SAFFIRE-II', 'SAFFIRE-III', 
    'BASS', 'BASS-II',
    'FLEX', 'FLEX-2', 'CFI',
    'ACME BRE', 'ACME CFI-G', 'ACME CLD Flame', 'ACME E-FIELD Flames', 'ACME s-Flame', 'ACME/Flame Design',
    'SAME', 'SAME-R', 'DAFT / DAFT-2',
    'SPICE', 'SLICE'
}

# Knowledge enrichment base for specific experiments
ENRICHMENT = {
    'SAFFIRE-I': {
        'materials': ['Cotton/Fiberglass (SIBAL fabric)', 'PMMA (Plexiglas)'],
        'geometry': 'Large Solid Sheet (0.4m x 1.0m)',
        'o2_range': [21.0, 30.0],
        'pressure_kpa': [101.3, 70.0],
        'flow_speed_cms': [10.0, 25.0],
        'flame_spread_rate_mms': 2.4,
        'moc_percent': 16.0,
        'hrr_kw': 8.5,
        'co_ppm': 450,
        'relevance_habitat': ['Moon Base', 'Pressurized Rover', 'Spacecraft'],
        'spinoff_relevance': 'Standardization of flame-retardant composites in aerospace and maritime interiors.'
    },
    'SAFFIRE-II': {
        'materials': ['PMMA', 'Silicone', 'Nomex Blend'],
        'geometry': 'Solid Samples Array',
        'o2_range': [21.0, 34.0],
        'pressure_kpa': [101.3, 56.5],
        'flow_speed_cms': [12.0, 30.0],
        'flame_spread_rate_mms': 3.1,
        'moc_percent': 15.5,
        'hrr_kw': 11.2,
        'co_ppm': 620,
        'relevance_habitat': ['Moon Base', 'Pressurized Rover'],
        'spinoff_relevance': 'Refined flammability standards for FAA commercial aviation cabins.'
    },
    'SAFFIRE-III': {
        'materials': ['SIBAL Fabric', 'Acrylic Glass'],
        'geometry': 'Large-Scale Fuel Board',
        'o2_range': [21.0, 32.0],
        'pressure_kpa': [95.0, 70.3],
        'flow_speed_cms': [15.0, 20.0],
        'flame_spread_rate_mms': 2.8,
        'moc_percent': 16.2,
        'hrr_kw': 9.8,
        'co_ppm': 510,
        'relevance_habitat': ['Space Station', 'Moon Base'],
        'spinoff_relevance': 'Calibration of industrial duct and high-risk facility suppression systems.'
    },
    'BASS': {
        'materials': ['Cotton-Fiberglass Fabric', 'Cast PMMA Rods', 'Polyethylene'],
        'geometry': 'Narrow Solid Strips and Rods (10cm)',
        'o2_range': [18.0, 25.0],
        'pressure_kpa': [101.3],
        'flow_speed_cms': [2.0, 15.0],
        'flame_spread_rate_mms': 1.1,
        'moc_percent': 17.5,
        'hrr_kw': 1.8,
        'co_ppm': 180,
        'relevance_habitat': ['Space Station', 'Spacecraft'],
        'spinoff_relevance': 'Low-airflow flame spread prediction models for building HVAC systems.'
    },
    'BASS-II': {
        'materials': ['Nomex', 'Cotton', 'Delrin', 'Polycarbonate'],
        'geometry': 'Flat Strips and Thin Rods',
        'o2_range': [16.0, 30.0],
        'pressure_kpa': [101.3, 70.3],
        'flow_speed_cms': [1.0, 20.0],
        'flame_spread_rate_mms': 1.7,
        'moc_percent': 16.8,
        'hrr_kw': 2.4,
        'co_ppm': 240,
        'relevance_habitat': ['Moon Base', 'Space Station'],
        'spinoff_relevance': 'Validation of flame retardant textiles for protective uniforms (Project FIRES).'
    },
    'FLEX': {
        'materials': ['n-Heptane', 'Methanol', 'Ethanol Droplets'],
        'geometry': 'Free & Tethered Liquid Droplets (1-5mm)',
        'o2_range': [15.0, 40.0],
        'pressure_kpa': [50.0, 101.3, 300.0],
        'flow_speed_cms': [0.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 13.0,
        'hrr_kw': 0.8,
        'co_ppm': 85,
        'relevance_habitat': ['Spacecraft', 'Space Station'],
        'spinoff_relevance': 'Discovery of Cool Flames (300-400°C); modeled in cleaner terrestrial diesel/gas engines.'
    },
    'FLEX-2': {
        'materials': ['Alkane Mixtures', 'Bio-derived Fuels'],
        'geometry': 'Liquid Droplet Matrix',
        'o2_range': [14.0, 35.0],
        'pressure_kpa': [70.0, 101.3],
        'flow_speed_cms': [0.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 12.8,
        'hrr_kw': 0.9,
        'co_ppm': 95,
        'relevance_habitat': ['Spacecraft'],
        'spinoff_relevance': 'Development of low-emission, eco-friendly liquid fuel combustion tech.'
    },
    'CFI': {
        'materials': ['Heptane Droplets', 'Decane'],
        'geometry': 'Isolated Spherical Droplets',
        'o2_range': [16.0, 30.0],
        'pressure_kpa': [70.0, 101.3],
        'flow_speed_cms': [0.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 14.0,
        'hrr_kw': 0.5,
        'co_ppm': 110,
        'relevance_habitat': ['Space Station', 'Moon Base'],
        'spinoff_relevance': 'Terrestrial engine design minimizing soot and carbon monoxide emissions.'
    },
    'ACME BRE': {
        'materials': ['Gaseous Fuels (CH4, C2H4) emulating Solids'],
        'geometry': 'Flat Porous Burner',
        'o2_range': [16.0, 35.0],
        'pressure_kpa': [70.0, 101.3],
        'flow_speed_cms': [0.0, 10.0],
        'flame_spread_rate_mms': 0.8,
        'moc_percent': 15.0,
        'hrr_kw': 3.2,
        'co_ppm': 160,
        'relevance_habitat': ['Moon Base', 'Mars Base'],
        'spinoff_relevance': 'Standard test method for evaluating flammability of interior furnishings without large samples.'
    },
    'ACME CFI-G': {
        'materials': ['Propane / Nitrogen mixture', 'Oxygen-Enriched Flow'],
        'geometry': 'Spherical Porous Burner (Inside-Out Flame)',
        'o2_range': [21.0, 85.0],
        'pressure_kpa': [70.0, 101.3],
        'flow_speed_cms': [5.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 11.5,
        'hrr_kw': 2.1,
        'co_ppm': 310,
        'relevance_habitat': ['Moon Base (High O2)', 'Spacesuit Atmosphere'],
        'spinoff_relevance': 'Super-enriched oxygen combustion safety protocols for hyperbaric chambers and ICUs.'
    },
    'ACME E-FIELD Flames': {
        'materials': ['Methane / Ethylene Gas'],
        'geometry': 'Coflow Burner with High Voltage Electrodes',
        'o2_range': [21.0, 30.0],
        'pressure_kpa': [101.3],
        'flow_speed_cms': [5.0, 20.0],
        'flame_spread_rate_mms': 0.5,
        'moc_percent': 15.5,
        'hrr_kw': 1.6,
        'co_ppm': 120,
        'relevance_habitat': ['Moon Base (0.16g proxy)', 'Mars Base (0.38g proxy)'],
        'spinoff_relevance': 'Electrostatic control of industrial flames to curb soot and enhance heat exchange.'
    },
    'SAME': {
        'materials': ['Combustion Aerosols from Overheated Wiring/Polymers'],
        'geometry': 'Particulate Cloud in Flow Loop',
        'o2_range': [21.0],
        'pressure_kpa': [101.3],
        'flow_speed_cms': [5.0, 15.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 21.0,
        'hrr_kw': 0.2,
        'co_ppm': 50,
        'relevance_habitat': ['Spacecraft', 'Space Station', 'Moon Base'],
        'spinoff_relevance': 'Next-gen commercial smoke sensors detecting micro-particles before visible smoke (Spinoff 9407).'
    },
    'SAME-R': {
        'materials': ['Aerosols from Pyrolyzing Aircraft Materials'],
        'geometry': 'Sensor Chamber',
        'o2_range': [21.0],
        'pressure_kpa': [101.3],
        'flow_speed_cms': [10.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 21.0,
        'hrr_kw': 0.2,
        'co_ppm': 60,
        'relevance_habitat': ['Space Station', 'Pressurized Rover'],
        'spinoff_relevance': 'Airborne early-warning wildfire and industrial toxic vapor detectors.'
    },
    'DAFT / DAFT-2': {
        'materials': ['Lunar Regolith Simulant', 'Aerosol Dust Particles'],
        'geometry': 'Aerosol Sampling Duct',
        'o2_range': [21.0],
        'pressure_kpa': [101.3],
        'flow_speed_cms': [10.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 21.0,
        'hrr_kw': 0.0,
        'co_ppm': 10,
        'relevance_habitat': ['Moon Base', 'Pressurized Rover'],
        'spinoff_relevance': 'Clean-room dust monitoring and underground mine air quality instrumentation.'
    },
    'SPICE': {
        'materials': ['Gaseous Hydrocarbons (Ethylene, Propane)'],
        'geometry': 'Coflow Laminar Burner',
        'o2_range': [21.0, 30.0],
        'pressure_kpa': [101.3],
        'flow_speed_cms': [5.0, 30.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 16.0,
        'hrr_kw': 1.4,
        'co_ppm': 220,
        'relevance_habitat': ['Space Station'],
        'spinoff_relevance': 'Soot reduction models for commercial aviation jet combustors.'
    },
    'SLICE': {
        'materials': ['Methane & Ethylene with inert diluents'],
        'geometry': 'Laminar Jet',
        'o2_range': [18.0, 30.0],
        'pressure_kpa': [101.3],
        'flow_speed_cms': [10.0, 40.0],
        'flame_spread_rate_mms': 0.0,
        'moc_percent': 15.8,
        'hrr_kw': 1.2,
        'co_ppm': 140,
        'relevance_habitat': ['Spacecraft'],
        'spinoff_relevance': 'Turbine flame stabilization and burner blow-off safety limits.'
    }
}

normalized_list = []

for hit in hits:
    src = hit['_source']
    acronym = (src.get('Acronym') or '').strip()
    accession = src.get('Accession')
    title = src.get('Title') or 'Investigação sem título'
    
    # Check if target
    is_target = acronym in TARGET_ACRONYMS
    enrich = ENRICHMENT.get(acronym, {})
    
    # Normalize hardware
    hw_raw = src.get('Experiment Hardware') or {}
    hw_name = hw_raw.get('Name') if isinstance(hw_raw, dict) else str(hw_raw)
    hw_link = hw_raw.get('Link') if isinstance(hw_raw, dict) else ''
    
    # DOI extraction
    doi = None
    if isinstance(hw_raw, dict) and 'doi.org' in str(hw_link):
        doi = hw_link
    
    normalized_record = {
        'id': accession,
        'acronym': acronym,
        'title': title,
        'platform': src.get('Flight Platform') or 'ISS / Ground Facility',
        'hardware': hw_name or 'NASA Standard Hardware',
        'hardware_link': hw_link,
        'discipline': src.get('Research Area'),
        'sub_discipline': src.get('SubResearch Area'),
        'objectives': src.get('Objectives') or '',
        'approach': src.get('Approach') or '',
        'hypothesis': src.get('Hypothesis') or '',
        'earth_benefits': src.get('Research Impacts/Earth Benefits') or enrich.get('spinoff_relevance', ''),
        'materials': enrich.get('materials', ['Amostras Diversas de Pesquisa']),
        'geometry': enrich.get('geometry', 'Geometria Padrão de Ensaio'),
        'o2_range': enrich.get('o2_range', [21.0]),
        'pressure_kpa': enrich.get('pressure_kpa', [101.3]),
        'flow_speed_cms': enrich.get('flow_speed_cms', [5.0]),
        'flame_spread_rate_mms': enrich.get('flame_spread_rate_mms', 1.0),
        'moc_percent': enrich.get('moc_percent', 18.0),
        'hrr_kw': enrich.get('hrr_kw', 1.5),
        'co_ppm': enrich.get('co_ppm', 100),
        'relevance_habitat': enrich.get('relevance_habitat', ['ISS', 'Spacecraft']),
        'is_featured_fire_safety': is_target,
        'nasa_psi_url': f"https://psi.nasa.gov/physci/repo/investigations/{accession}",
        'doi': doi or f"10.25923/nasa.{accession.lower() if accession else 'psi'}"
    }
    normalized_list.append(normalized_record)

print(f"Total investigações normalizadas: {len(normalized_list)}")
featured = [n for n in normalized_list if n['is_featured_fire_safety']]
print(f"Investigações destaque de segurança contra incêndio: {len(featured)}")

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'metadata': {
            'source': 'NASA Physical Sciences Informatics (PSI) GEODE Repository',
            'api_endpoint': 'https://psi.nasa.gov/geode-py/ws/repo/search',
            'total_investigations': len(normalized_list),
            'featured_fire_safety_count': len(featured),
            'timestamp': '2026-11-14T15:30:00Z'
        },
        'investigations': normalized_list
    }, f, ensure_ascii=False, indent=2)

print(f"Salvo com sucesso em: {output_file}")
