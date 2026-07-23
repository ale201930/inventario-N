let cachedBcvData = {
  promedio: 737.23,
  fechaActualizacion: new Date().toISOString(),
  fechaFormatted: new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  fuente: 'Banco Central de Venezuela (BCV)',
  lastFetched: 0
};

export function formatDate(dateInput) {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleDateString('es-VE');
    return d.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return new Date().toLocaleDateString('es-VE');
  }
}

export async function fetchBcvRate() {
  const now = Date.now();
  // Revalidate every 30 minutes (1800000 ms) to keep daily rate updated automatically
  if (now - cachedBcvData.lastFetched < 1800000 && cachedBcvData.promedio > 0) {
    return cachedBcvData;
  }

  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.promedio && Number(data.promedio) > 0) {
        const fechaRaw = data.fechaActualizacion || new Date().toISOString();
        cachedBcvData = {
          promedio: Number(data.promedio),
          fechaActualizacion: fechaRaw,
          fechaFormatted: formatDate(fechaRaw),
          fuente: 'Banco Central de Venezuela (BCV)',
          lastFetched: now
        };
        return cachedBcvData;
      }
    }
  } catch (err) {
    console.warn('Error obteniendo tasa BCV en línea, usando valor en caché:', err.message);
  }

  // Ensure date is updated to current date formatted if using fallback
  cachedBcvData.fechaFormatted = formatDate(cachedBcvData.fechaActualizacion);
  return cachedBcvData;
}

export function setCustomBcvRate(rate) {
  const numRate = Number(rate);
  if (numRate > 0) {
    const nowIso = new Date().toISOString();
    cachedBcvData = {
      promedio: numRate,
      fechaActualizacion: nowIso,
      fechaFormatted: formatDate(nowIso),
      fuente: 'Personalizado / BCV',
      lastFetched: Date.now()
    };
  }
  return cachedBcvData;
}

export function convertToBs(usdAmount, rate = null) {
  const currentRate = rate || cachedBcvData.promedio;
  return Number(usdAmount || 0) * Number(currentRate || 1);
}
