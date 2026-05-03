const TECHNOL_CODES = {
  mtSiMono: 'Monocristalino',
  mtSiPoly: 'Policristalino',
  mtCdTe: 'CdTe (First Solar)',
  mtCIS: 'CIS/CIGS',
  mtAmorphous: 'Amorfo',
  mtHIT: 'HIT/HJT',
  mtTopCon: 'TOPCon',
};

function validateModule(params) {
  const results = [];
  const { pnom, imp, vmp, rSerie, nCelS, technol, tempCoeffVoc, tempCoeffIsc, tempCoeffPmax, rpExp, width, height } = params;

  // 1. Regra dos 0,2% (Pmpp Discrepancy)
  if (pnom) {
    const pmpp = Number(imp) * Number(vmp);
    const discrepancy = Math.abs(pmpp - pnom) / pnom;
    if (discrepancy > 0.002) {
      results.push({
        rule: 'pmpp_discrepancy',
        status: 'warning',
        message: `Imp × Vmp (${pmpp.toFixed(2)}W) difere de Pnom (${pnom}W) em ${(discrepancy * 100).toFixed(3)}%. PVSyst recalculará Pnom silenciosamente.`,
        value: discrepancy,
        threshold: 0.002
      });
    }
  }

  // 2. Resistência Shunt Dinâmica (Rp_Exp)
  if (rpExp !== undefined && rpExp !== null) {
    if (Math.abs(rpExp - 5.5) > 0.1) {
      results.push({
        rule: 'rp_exp_nonstandard',
        status: 'warning',
        message: `Rp_Exp=${rpExp} difere do padrão 5.5. Válido apenas se derivado de medições IEC 61853-1.`,
        value: rpExp,
        threshold: 5.5
      });
    }
  } else {
    results.push({
      rule: 'rp_exp_missing',
      status: 'info',
      message: 'Rp_Exp ausente. Será usado o valor padrão 5.5 do PVSyst na exportação.'
    });
  }

  // 3. Estabilidade do RSerie (Heurística)
  if (rSerie && vmp && imp && nCelS) {
    const rChar = vmp / (nCelS * imp);
    const rSerieMax = 2 * rChar * nCelS;
    if (rSerie > rSerieMax) {
      results.push({
        rule: 'rserie_physical_bounds',
        status: 'critical',
        message: `RSerie=${rSerie}Ω está acima do limite físico estimado de ${rSerieMax.toFixed(4)}Ω. Pode causar falha de convergência.`,
        value: rSerie,
        threshold: rSerieMax
      });
    }
  }

  // 4. Consistência de Tecnologia e Células
  if (technol) {
    if (!TECHNOL_CODES[technol]) {
      results.push({
        rule: 'technol_unknown',
        status: 'warning',
        message: `Tecnologia '${technol}' não reconhecida pelo PVSyst. Verifique compatibilidade.`
      });
    } else if (technol === 'mtSiMono' && nCelS && (nCelS < 60 || nCelS > 144)) {
      results.push({
        rule: 'nCelS_range',
        status: 'warning',
        message: `NCelS=${nCelS} incomum para monocristalino (padrão: 60-144). Verifique se não há erro no arquivo.`
      });
    }
  }

  // 5. Coeficientes de Temperatura
  if (tempCoeffVoc !== null && tempCoeffVoc >= 0) {
    results.push({
      rule: 'tempCoeff_voc_sign',
      status: 'critical',
      message: `TempCoeff_Voc deve ser negativo. Valor: ${tempCoeffVoc}%/°C.`
    });
  }
  if (tempCoeffIsc !== null && tempCoeffIsc <= 0) {
    results.push({
      rule: 'tempCoeff_isc_sign',
      status: 'warning',
      message: `TempCoeff_Isc positivo esperado. Valor: ${tempCoeffIsc}%/°C.`
    });
  }
  if (tempCoeffPmax !== null && tempCoeffPmax >= 0) {
    results.push({
      rule: 'tempCoeff_pmax_sign',
      status: 'critical',
      message: `TempCoeff_Pmax deve ser negativo. Valor: ${tempCoeffPmax}%/°C.`
    });
  }
  if (tempCoeffPmax !== null && (tempCoeffPmax < -0.8 || tempCoeffPmax > -0.1)) {
    results.push({
      rule: 'tempCoeff_pmax_magnitude',
      status: 'warning',
      message: `TempCoeff_Pmax=${tempCoeffPmax}%/°C fora da faixa típica (-0.1 a -0.8%/°C).`
    });
  }

  // Final: Bancabilidade
  const criticals = results.filter(r => r.status === 'critical').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  let bankability = 'BANKABLE';
  if (criticals > 0) bankability = 'UNRELIABLE';
  else if (warnings > 0) bankability = 'ACCEPTABLE';

  return {
    results,
    bankability,
    isHealthy: criticals === 0
  };
}

function validateInverter(params) {
  const results = [];
  const { pAcNom, pAcMax, vMinMpp, vMaxMpp, vAbsMax } = params;

  if (pAcMax < pAcNom) {
    results.push({
      rule: 'pAc_consistency',
      status: 'critical',
      message: `Potência Máxima (PMax=${pAcMax}W) menor que Nominal (PNom=${pAcNom}W).`
    });
  }

  if (vMaxMpp > vAbsMax) {
    results.push({
      rule: 'voltage_consistency',
      status: 'critical',
      message: `Tensão Máxima MPPT (${vMaxMpp}V) maior que Tensão Absoluta (${vAbsMax}V).`
    });
  }

  const criticals = results.filter(r => r.status === 'critical').length;
  
  return {
    results,
    bankability: criticals > 0 ? 'UNRELIABLE' : 'BANKABLE',
    isHealthy: criticals === 0
  };
}

module.exports = {
  validateModule,
  validateInverter
};

