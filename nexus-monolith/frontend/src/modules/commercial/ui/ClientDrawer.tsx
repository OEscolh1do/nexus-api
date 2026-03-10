import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/mock-components';
import { api } from '@/lib/api';

const clientSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().min(10, 'Telefone inválido'),
    city: z.string().optional(),
    state: z.string().length(2, 'Estado deve ter 2 letras').optional().or(z.literal('')),
    notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    client?: any; // If editing an existing client
    defaultStatus?: string;
    title?: string;
}

export const ClientDrawer: React.FC<ClientDrawerProps> = ({
    isOpen,
    onClose,
    onSuccess,
    client,
    defaultStatus,
    title
}) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            city: '',
            state: '',
            notes: '',
        }
    });

    useEffect(() => {
        if (client && isOpen) {
            reset({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                city: client.city || '',
                state: client.state || '',
                notes: client.notes || '',
            });
        } else if (isOpen) {
            reset({
                name: '',
                email: '',
                phone: '',
                city: '',
                state: '',
                notes: '',
            });
        }
    }, [client, isOpen, reset]);

    if (!isOpen) return null;

    const onSubmit = async (data: ClientFormValues) => {
        try {
            const payload = {
                ...data,
                status: defaultStatus || 'CONVERTED', // Force status to CONVERTED for Clients if not provided
                source: 'OTHER'
            };

            if (client?.id) {
                await api.put(`/commercial/leads/${client.id}`, payload);
            } else {
                await api.post(`/commercial/leads`, payload);
            }

            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save client', error);
            alert('Erro ao salvar cliente. Verifique o console.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                            {title ? title : (client ? 'Editar Cliente' : 'Novo Cliente')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <User size={16} className="text-purple-600" />
                                Dados Principais
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: João da Silva"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        <Phone size={14} className="inline mr-1" /> Telefone *
                                    </label>
                                    <input
                                        type="text"
                                        {...register('phone')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="(00) 00000-0000"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        <Mail size={14} className="inline mr-1" /> E-mail
                                    </label>
                                    <input
                                        type="email"
                                        {...register('email')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="email@exemplo.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <MapPin size={16} className="text-purple-600" />
                                Localização
                            </h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Cidade
                                    </label>
                                    <input
                                        type="text"
                                        {...register('city')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: Manaus"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        UF
                                    </label>
                                    <input
                                        type="text"
                                        {...register('state')}
                                        maxLength={2}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                                        placeholder="AM"
                                    />
                                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Observações
                                </label>
                                <textarea
                                    {...register('notes')}
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Informações adicionais sobre o cliente..."
                                />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-4">
                    <Button variant="outline" className="w-full" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="client-form"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Salvando...' : 'Salvar Dados'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
