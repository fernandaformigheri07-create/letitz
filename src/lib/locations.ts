/** Coordenada aproximada para o globo. Representação visual, não navegação. */
export function resolveLocation(location: string): { lat: number; lng: number; label: string } {
  const key = location.trim().toLowerCase();
  const table: Array<[string, number, number, string]> = [
    ["curitiba", -25.43, -49.27, "Curitiba, PR"],
    ["são paulo", -23.55, -46.63, "São Paulo, SP"],
    ["sao paulo", -23.55, -46.63, "São Paulo, SP"],
    ["porto alegre", -30.03, -51.23, "Porto Alegre, RS"],
    ["florianópolis", -27.59, -48.55, "Florianópolis, SC"],
    ["belo horizonte", -19.92, -43.94, "Belo Horizonte, MG"],
    ["rio de janeiro", -22.91, -43.17, "Rio de Janeiro, RJ"],
    ["brasília", -15.79, -47.88, "Brasília, DF"],
    ["salvador", -12.97, -38.5, "Salvador, BA"],
    ["recife", -8.05, -34.9, "Recife, PE"],
    ["portugal", 39.4, -8.22, "Portugal"],
    ["lisboa", 38.72, -9.14, "Lisboa"],
    ["brasil", -14.24, -51.93, "Brasil"],
  ];
  for (const [needle, lat, lng, label] of table) {
    if (key.includes(needle)) return { lat, lng, label };
  }
  return { lat: -14.24, lng: -51.93, label: location.trim() || "Brasil" };
}
