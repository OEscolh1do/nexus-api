// /frontend/src/features/kanban-board/components/KanbanColumn.jsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableCard from './DraggableCard';

function KanbanColumn({ title, status, projects = [], onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const projectIds = projects.map(p => p.id);

  return (
    <div 
      ref={setNodeRef}
      className={`shrink-0 w-80 rounded-xl border flex flex-col h-full transition-colors ${
        isOver ? 'bg-neo-surface-1 border-neo-green-main/30' : 'bg-neo-surface-1/50 border-neo-surface-2/30'
      }`}
    >
      <div className="p-4 flex justify-between items-center border-b border-neo-surface-2/30">
        <h3 className="font-bold text-neo-text-sec text-xs tracking-[0.2em] uppercase">
          {title}
        </h3>
        <span className="bg-neo-bg-main text-neo-text-sec text-xs font-mono font-bold px-2 py-1 rounded">
          {projects.length}
        </span>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {/* O SortableContext permite que os itens dentro dele sejam reordenados */}
        <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
            {projects.map((project) => (
            <DraggableCard 
                key={project.id} 
                project={project} 
                onCardClick={onCardClick}
                onClick={() => onCardClick(project)}
            />
            ))}
        </SortableContext>

        {projects.length === 0 && (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-neo-surface-2/30 rounded-lg m-2 text-neo-text-sec/30 text-sm">
                Arraste para cá
            </div>
        )}
      </div>
    </div>
  );
}
export default KanbanColumn;