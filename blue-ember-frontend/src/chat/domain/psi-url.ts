/**
 * Link da página oficial de uma investigação no PSI da NASA.
 * O formato que funciona é /physci/repo/data/investigations/PSI-n.
 * A API manda /physci/repo/investigations/PSI-n (sem "data"), que abre a página 404 do PSI;
 * por isso o link é montado sempre a partir do id.
 */
export function psiUrl(d: { id: string; nasaPsiUrl?: string | null }): string {
  const id = d.id?.trim()
  if (/^PSI-\d+$/i.test(id)) {
    return `https://psi.nasa.gov/physci/repo/data/investigations/${id.toUpperCase()}`
  }
  const api = d.nasaPsiUrl?.trim()
  if (api) {
    return api.replace('/physci/repo/investigations/', '/physci/repo/data/investigations/')
  }
  return 'https://psi.nasa.gov/physci/repo/search'
}
