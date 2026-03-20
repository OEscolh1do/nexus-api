

export const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-8 first:mt-0">
        <div className="p-1.5 rounded bg-slate-100 text-slate-600">
            <Icon size={14} />
        </div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
    </div>
);
