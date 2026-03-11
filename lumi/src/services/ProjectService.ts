import { supabase } from '@/services/supabase';
import { useSolarStore } from '@/core/state/solarStore';

export interface ProjectMetadata {
    id: string;
    project_name?: string;
    status: string;
    created_at: string;
    updated_at: string;
    client_crm_data?: any;
}

export const ProjectService = {
    /**
     * Salva o estado atual do `solarStore` como um Projeto no Supabase.
     * Se já houver um ID no store (ativo), atualiza. Se não, cria um novo.
     */
    async saveCurrentProject(status: string = 'DRAFT') {
        const state = useSolarStore.getState();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("Usuário não autenticado");
        }

        // Buscamos o tenant_id do usuário logado
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            throw new Error("Perfil de tenant não encontrado");
        }

        const projectPayload: any = {
            project_name: state.clientData.projectName?.trim() || state.clientData.clientName?.trim() || 'Projeto Sem Nome',
            tenant_id: profile.tenant_id,
            owner_id: user.id,
            status,
            client_crm_data: state.clientData,
            engineering_data: {
                modules: state.modules,
                inverters: state.inverters,
                engineeringData: state.engineeringData
            },
            electrical_data: {
                bosInventory: state.bosInventory
            },
            finance_params: state.financeParams,
        };

        let result;

        if (state.activeProjectId) {
            // Se já tem ID, atualiza o projeto existente
            const { data, error } = await supabase
                .from('projects')
                .update(projectPayload)
                .eq('id', state.activeProjectId)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Se não tem ID, cria um novo
            const { data, error } = await supabase
                .from('projects')
                .insert(projectPayload)
                .select()
                .single();

            if (error) throw error;
            result = data;

            // Depois de criar, salva o ID no store para futuras atualizações
            useSolarStore.getState().setActiveProjectId(data.id);
        }

        return result;
    },

    /**
     * Busca a lista de projetos do tenant atual (Engenharia vs Vendas)
     */
    async listProjects() {
        const { data, error } = await supabase
            .from('projects')
            .select('id, project_name, status, client_crm_data, created_at, updated_at')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Puxa um projeto inteiro pelo ID e hidrata o Zustand
     */
    async loadProjectAndHydrate(projectId: string) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) throw error;
        if (!data) return;

        // Hidratando o store!
        const store = useSolarStore.getState();

        // CRM
        if (data.client_crm_data) {
            // @ts-ignore
            store.updateClientData(data.client_crm_data);
        }

        // Finance
        if (data.finance_params) {
            store.updateFinanceParams(data.finance_params);
        }

        // Engineering
        if (data.engineering_data) {
            if (data.engineering_data.engineeringData) {
                store.updateEngineeringData(data.engineering_data.engineeringData);
            }
            if (data.engineering_data.modules) {
                store.setModules(data.engineering_data.modules);
            }
            if (data.engineering_data.inverters) {
                store.setInverters(data.engineering_data.inverters);
            }
        }

        // Electrical
        if (data.electrical_data && data.electrical_data.bosInventory) {
            store.updateBOSInventory(data.electrical_data.bosInventory);
        }

        // Define o projeto como ativo
        store.setActiveProjectId(projectId);
    },

    /**
     * Deleta um projeto permanentemente
     */
    async deleteProject(projectId: string) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    },

    /**
     * Duplica um projeto mantendo todo o histórico técnico
     */
    async duplicateProject(projectId: string) {
        // 1. Fetch o projeto original
        const { data: original, error: fetchError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (fetchError) throw fetchError;
        if (!original) throw new Error("Projeto não encontrado");

        // 2. Criar cópia limpa baseada no original
        const newProjectPayload = {
            project_name: `[Cópia] ${original.project_name || 'Sem Nome'}`,
            tenant_id: original.tenant_id,
            owner_id: original.owner_id,
            status: 'DRAFT', // Cópias sempre iniciam como Draft
            client_crm_data: original.client_crm_data,
            engineering_data: original.engineering_data,
            electrical_data: original.electrical_data,
            finance_params: original.finance_params,
        };

        const { data: copy, error: copyError } = await supabase
            .from('projects')
            .insert(newProjectPayload)
            .select()
            .single();

        if (copyError) throw copyError;
        return copy;
    }
};
