export interface ProjectMetadata {
    id: string;
    project_name?: string;
    status: string;
    created_at: string;
    updated_at: string;
    client_crm_data?: any;
}

export const ProjectService = {
    async saveCurrentProject(_status: string = 'DRAFT') {
        console.warn("ProjectService.saveCurrentProject: Supabase removido.");
        return null;
    },

    async listProjects() {
        console.warn("ProjectService.listProjects: Supabase removido.");
        return [];
    },

    async loadProjectAndHydrate(_projectId: string) {
        console.warn(`ProjectService.loadProjectAndHydrate: Supabase removido.`);
    },

    async deleteProject(_projectId: string) {
        console.warn(`ProjectService.deleteProject: Supabase removido.`);
    },

    async duplicateProject(_projectId: string) {
        console.warn(`ProjectService.duplicateProject: Supabase removido.`);
        return null;
    }
};
