import { supabase } from '@/services/supabase';
import { useSolarStore } from '@/core/state/solarStore';

export const SettingsService = {
    /**
     * Puxa as configurações (pricing_settings e engineering_settings) do Supabase
     * para o tenant atual logado e injeta no Zustand global (TechSlice).
     */
    async loadSettingsFromDB() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn("Usuário não logado ao tentar carregar settings.");
            return;
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            console.warn("Perfil de usuário não encontrado.");
            return;
        }

        const { data: tenantSettings, error } = await supabase
            .from('tenant_settings')
            .select('engineering_settings, pricing_settings')
            .eq('tenant_id', profile.tenant_id)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 is the PostgREST code for "JSON object requested, multiple (or no) rows returned"
            console.error("Erro ao carregar settings do DB", error.message);
            return;
        }

        if (tenantSettings) {
            console.log('🔄 Sincronizando Settings do Banco para o Zustand...');
            const store = useSolarStore.getState();

            // Combina o que veio do banco.
            // O Supabase salva como JSONB. Nós juntamos engineering+pricing no meso objeto updateSettings
            const mergedSettings = {
                ...tenantSettings.engineering_settings,
                ...tenantSettings.pricing_settings
            };

            if (Object.keys(mergedSettings).length > 0) {
                store.updateSettings(mergedSettings);
            }
        } else {
            // Create initial empty settings for this tenant to avoid future 404s
            await supabase.from('tenant_settings').insert({
                tenant_id: profile.tenant_id,
                engineering_settings: {},
                pricing_settings: {},
                institutional_data: {}
            });
        }
    },

    /**
     * Salva o estado atual de `settings` do Zustand de volta para a nuvem
     */
    async saveSettingsToDB() {
        const store = useSolarStore.getState();
        const currentSettings = store.settings;

        // Divide logicamente (opcional, pode unificar se preferir)
        const pricingKeys = [
            'pricingModel', 'marginPercentage', 'commissionPercentage', 'taxPercentage',
            'serviceCommissionFixed', 'referenceKitPricePerKwp', 'structurePricePerModule',
            'bosPricePerKwp', 'serviceUnitModule', 'serviceUnitInverter', 'serviceProjectBase',
            'serviceMarkup'
        ];

        const pricingSettings: any = {};
        const engineeringSettings: any = {};

        Object.keys(currentSettings).forEach(key => {
            // @ts-ignore
            if (pricingKeys.includes(key)) {
                // @ts-ignore
                pricingSettings[key] = currentSettings[key];
            } else {
                // @ts-ignore
                engineeringSettings[key] = currentSettings[key];
            }
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não logado");

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!profile) throw new Error("Tenant não encontrado");

        // Upsert na tabela tenant_settings
        const { error } = await supabase
            .from('tenant_settings')
            .upsert({
                tenant_id: profile.tenant_id,
                pricing_settings: pricingSettings,
                engineering_settings: engineeringSettings,
            }, { onConflict: 'tenant_id' });

        if (error) throw error;
    }
};
