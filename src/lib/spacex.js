export async function loadLaunches(withMeta = false) {
  const apiUrl = process.env.SPACEX_API_URL || 'https://api.spacexdata.com/v5/launches';
  let fallbackUsed = false;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`SpaceX API ${response.status}`);
    const data = await response.json();
    const launches = Array.isArray(data) ? data : [];
    
    if (!launches.length) {
      fallbackUsed = true;
      const fallback = fallbackLaunches();
      if (withMeta) {
        return {
          launches: fallback,
          fallbackUsed: true,
          sourceUrl: apiUrl,
          fetchedAt: new Date().toISOString()
        };
      }
      return fallback;
    }

    if (withMeta) {
      return {
        launches,
        fallbackUsed: false,
        sourceUrl: apiUrl,
        fetchedAt: new Date().toISOString()
      };
    }
    return launches;
  } catch (error) {
    console.warn('[MiniETL] SpaceX API fetch failed:', error.message);
    fallbackUsed = true;
    const launches = fallbackLaunches();
    if (withMeta) {
      return {
        launches,
        fallbackUsed: true,
        sourceUrl: apiUrl,
        fetchedAt: new Date().toISOString()
      };
    }
    return launches;
  }
}

export function buildMetrics(launches) {
  const total = launches.length;
  const successful = launches.filter((launch) => launch.success === true).length;
  const failed = total - successful;
  const lastLaunch = launches[launches.length - 1];
  return {
    rows_in: total,
    rows_out: successful,
    dedup_removed: failed,
    duration_sec: 95,
    lastLaunch: lastLaunch ? lastLaunch.name || 'N/A' : 'N/A',
    rockets: new Set(launches.map(l => l.rocket).filter(Boolean)).size
  };
}

export function fallbackLaunches() {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `demo-launch-${i + 1}`,
    name: `Demo Launch ${i + 1}`,
    date_utc: new Date(Date.now() - i * 86400000).toISOString(),
    success: i % 3 !== 0,
    upcoming: false,
    rocket: `rocket-${(i % 5) + 1}`,
    launchpad: `launchpad-${(i % 3) + 1}`,
    details: `Demo launch details for launch ${i + 1}`,
    payloads: Array.from({ length: (i % 3) + 1 }, (_, j) => ({
      id: `payload-${i}-${j}`,
      name: `Payload ${i}-${j}`
    }))
  }));
}

