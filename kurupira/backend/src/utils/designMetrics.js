const { getHspByCoordinates } = require('./hsp');
const logger = require('../lib/logger');

function extractDesignMetrics(designData) {
  try {
    let data = designData;
    if (typeof designData === 'string') {
      try { data = JSON.parse(designData); } catch (e) {
        logger.error('Failed to parse designData string', { err: e.message });
      }
    }

    if (!data?.solar) {
      return {
        targetPowerKwp: 0, averageConsumptionKwh: 0,
        lat: null, lng: null, clientName: null, city: null, state: null,
        moduleCount: 0, inverterCount: 0, voltage: null
      };
    }

    const cd = data.solar.clientData || {};
    const avgConsumption = cd.averageConsumption || 0;
    const lat = cd.lat || null;
    const lng = cd.lng || null;
    const clientName = cd.clientName || null;
    const city = cd.city || null;
    const state = cd.state || null;
    const voltage = cd.voltage || (cd.invoices && cd.invoices[0]?.voltage) || null;

    let kWpAlvo = data.tech?.kWpAlvo || 0;
    if (kWpAlvo === 0 && avgConsumption > 0) {
      const hsp = getHspByCoordinates(lat, lng);
      // PR configurável por projeto; 0.75 como default conservador para clima tropical
      const pr = data.tech?.performanceRatio ?? 0.75;
      kWpAlvo = (avgConsumption * 12) / (hsp * 365 * pr);
    }

    const placedModulesCount = data.solar.project?.placedModules?.length || 0;
    const inverterCount = data.tech?.inverters?.ids?.length || 0;

    const moduleIds = data.solar.modules?.ids || [];
    const entities = data.solar.modules?.entities || {};
    const firstModule = moduleIds.length > 0 ? entities[moduleIds[0]] : null;
    const moduleCount = placedModulesCount > 0 ? placedModulesCount : moduleIds.length;

    const modulePowerW = firstModule?.power || firstModule?.powerWp || 550;
    const systemKwp = (moduleCount * modulePowerW) / 1000;

    const calculatedKwp = Math.round(systemKwp * 100) / 100;
    const finalPowerKwp = calculatedKwp > 0 ? calculatedKwp : (Math.round(kWpAlvo * 100) / 100);

    let finalModuleCount = moduleCount;
    if (moduleCount === 0 && finalPowerKwp > 0) {
      finalModuleCount = Math.ceil((finalPowerKwp * 1000) / modulePowerW);
    }

    return {
      targetPowerKwp: finalPowerKwp,
      averageConsumptionKwh: Math.round(avgConsumption),
      lat: lat && lat !== 0 ? lat : null,
      lng: lng && lng !== 0 ? lng : null,
      clientName, city, state,
      moduleCount: finalModuleCount, inverterCount, voltage
    };
  } catch (error) {
    logger.error('designMetrics extraction failed', { err: error.message });
    return {
      targetPowerKwp: 0, averageConsumptionKwh: 0,
      lat: null, lng: null, clientName: null, city: null, state: null,
      moduleCount: 0, inverterCount: 0, voltage: null
    };
  }
}

module.exports = { extractDesignMetrics };
