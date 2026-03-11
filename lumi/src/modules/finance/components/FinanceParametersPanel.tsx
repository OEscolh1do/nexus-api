import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeDollarSign, TrendingUp, Percent } from 'lucide-react';

import { useSolarStore } from '@/core/state/solarStore';
import { FinanceParamsSchema, FinanceParams } from '../store/financeSchema';
import { DenseCard, DenseInput, DenseDivider } from '@/components/ui/dense-form';

export const FinanceParametersPanel: React.FC = () => {
  const financeParams = useSolarStore(state => state.financeParams);
  const updateFinanceParams = useSolarStore(state => state.updateFinanceParams);
  const techSettings = useSolarStore(state => state.settings);
  const modules = useSolarStore(state => state.modules);

  // Calculate Kit Price Reference if CAPEX is 0
  const systemPowerKWp = modules.reduce((acc, m) => acc + (m.power * m.quantity), 0) / 1000;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(FinanceParamsSchema),
    defaultValues: financeParams,
    mode: 'onBlur'
  });

  // Sync from store to form (initial load or external updates)
  useEffect(() => {
    if (financeParams.capex === 0 && systemPowerKWp > 0) {
      const estimatedCapex = systemPowerKWp * techSettings.referenceKitPricePerKwp * (1 + techSettings.marginPercentage);
      const roundedCapex = Math.round(estimatedCapex);
      setValue('capex', roundedCapex);
      updateFinanceParams({ capex: roundedCapex });
    } else {
      setValue('capex', financeParams.capex);
    }
    setValue('energyTariff', financeParams.energyTariff);
    setValue('discountRate', financeParams.discountRate);
    setValue('inflationRate', financeParams.inflationRate);
    setValue('tariffInflation', financeParams.tariffInflation);
    setValue('annualDegradation', financeParams.annualDegradation);
    setValue('omCost', financeParams.omCost);
  }, [financeParams, setValue, systemPowerKWp, techSettings, updateFinanceParams]);

  const onSubmit = (data: any) => {
    updateFinanceParams(data as FinanceParams);
  };

  const handleBlur = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <DenseCard className="h-full flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <BadgeDollarSign className="text-emerald-600" size={18} />
        <h3 className="font-bold text-slate-700">Premissas Financeiras</h3>
      </div>

      <form className="grid grid-cols-12 gap-3" onBlur={handleBlur}>
        {/* Investimento */}
        <div className="col-span-12 space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Investimento (CAPEX)</h4>
          <DenseInput
            colSpan={12}
            label="Valor Total (R$)"
            error={errors.capex?.message as string}
            id="capex"
            type="number"
            step="100"
            {...register('capex', { valueAsNumber: true })}
          />
        </div>

        <DenseDivider />

        {/* Tarifas e Inflação */}
        <div className="col-span-12 space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={12} /> Cenário Econômico
          </h4>

          <div className="grid grid-cols-12 gap-2">
            <DenseInput
              colSpan={6}
              label="Tarifa (R$/kWh)"
              error={errors.energyTariff?.message as string}
              id="energyTariff"
              type="number"
              step="0.01"
              {...register('energyTariff', { valueAsNumber: true })}
            />

            <DenseInput
              colSpan={6}
              label="Inflação Energ. (% a.a.)"
              error={errors.tariffInflation?.message as string}
              id="tariffInflation"
              type="number"
              step="0.1"
              {...register('tariffInflation', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-12 gap-2">
            <DenseInput
              colSpan={6}
              label="IPCA Projetado (% a.a.)"
              error={errors.inflationRate?.message as string}
              id="inflationRate"
              type="number"
              step="0.1"
              {...register('inflationRate', { valueAsNumber: true })}
            />

            <DenseInput
              colSpan={6}
              label="Taxa Desconto (TMA %)"
              error={errors.discountRate?.message as string}
              id="discountRate"
              type="number"
              step="0.1"
              {...register('discountRate', { valueAsNumber: true })}
            />
          </div>
        </div>

        <DenseDivider />

        {/* Operacional */}
        <div className="col-span-12 space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Percent size={12} /> Operacional
          </h4>
          <div className="grid grid-cols-12 gap-2">
            <DenseInput
              colSpan={6}
              label="O&M Inicial (R$/ano)"
              error={errors.omCost?.message as string}
              id="omCost"
              type="number"
              step="100"
              {...register('omCost', { valueAsNumber: true })}
            />

            <DenseInput
              colSpan={6}
              label="Degradação (% a.a.)"
              error={errors.annualDegradation?.message as string}
              id="annualDegradation"
              type="number"
              step="0.01"
              {...register('annualDegradation', { valueAsNumber: true })}
            />
          </div>
        </div>



        <DenseDivider />

        {/* Financiamento */}
        <div className="col-span-12 space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <BadgeDollarSign size={12} /> Financiamento Bancário
          </h4>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Modalidade</label>
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    setValue('financingMode', 'cash');
                    updateFinanceParams({ financingMode: 'cash' });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${financeParams.financingMode === 'cash' ? 'bg-white text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  À Vista
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('financingMode', 'financed');
                    updateFinanceParams({ financingMode: 'financed' });
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${financeParams.financingMode === 'financed' ? 'bg-white text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Financiado
                </button>
              </div>
            </div>

            {financeParams.financingMode === 'financed' && (
              <>
                <DenseInput
                  colSpan={6}
                  label="Entrada (R$)"
                  error={errors.downPayment?.message as string}
                  id="downPayment"
                  type="number"
                  step="100"
                  {...register('downPayment', { valueAsNumber: true })}
                />
                <DenseInput
                  colSpan={6}
                  label="Taxa Juros (% a.m.)"
                  error={errors.loanInterestRate?.message as string}
                  id="loanInterestRate"
                  type="number"
                  step="0.01"
                  {...register('loanInterestRate', { valueAsNumber: true })}
                />
                <DenseInput
                  colSpan={12}
                  label="Prazo (Meses)"
                  error={errors.loanTerm?.message as string}
                  id="loanTerm"
                  type="number"
                  step="12"
                  {...register('loanTerm', { valueAsNumber: true })}
                />
              </>
            )}
          </div>
        </div>

      </form>
    </DenseCard>
  );
};
