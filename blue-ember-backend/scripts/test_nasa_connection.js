/**
 * Script de Teste de Conexão com o Banco Oficial da NASA PSI (GEODE)
 * Para executar (a partir de blue-ember-backend): node scripts/test_nasa_connection.js
 */

const NASA_URL = 'https://psi.nasa.gov/geode-py/ws/repo/search?q=combustion&data_source=psi&data_type=investigation&research_area=Combustion%20Science&size=10';

async function testConnection() {
  console.log('🛰️ Conectando ao banco oficial NASA PSI (GEODE)...');
  console.log(`📡 URL: ${NASA_URL}\n`);

  const startTime = Date.now();

  try {
    const response = await fetch(NASA_URL, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'BlueEmber-NASA-SpaceApps/1.0'
      }
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const hits = data?.hits?.hits || [];
    const total = data?.hits?.total?.value || data?.hits?.total || hits.length;

    console.log(`✅ Conexão estabelecida com sucesso em ${elapsed}ms!`);
    console.log(`📊 Total de investigações encontradas no banco da NASA: ${total}`);
    console.log(`\n📋 Primeiras ${hits.length} investigações retornadas ao vivo:\n`);

    hits.forEach((hit, i) => {
      const src = hit._source;
      const hw = typeof src['Experiment Hardware'] === 'object' ? src['Experiment Hardware']?.Name : src['Experiment Hardware'];
      console.log(`[${i + 1}] ID: ${src.Accession} | Sigla: ${src.Acronym || 'N/A'}`);
      console.log(`    Título: ${src.Title}`);
      console.log(`    Plataforma: ${src['Flight Platform'] || 'N/A'} | Hardware: ${hw || 'N/A'}`);
      console.log(`    Área: ${src['SubResearch Area'] || src['Research Area']}`);
      console.log(`    Link NASA: https://psi.nasa.gov/physci/repo/investigations/${src.Accession}`);
      console.log('    --------------------------------------------------');
    });

    console.log('\n🚀 O banco da NASA está pronto para ser consumido pela sua aplicação!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco da NASA:', error.message);
  }
}

testConnection();
