// Drag and Drop Generator - Generate drag and drop components
import Anthropic from '@anthropic-ai/sdk';

class DragDropGenerator {
    private anthropic: Anthropic | null = null;

    generateDndKit(): string {
        return `import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

interface Item { id: string; content: string; }

function SortableItem({ id, content }: { id: string; content: string }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="sortable-item">
            {content}
        </div>
    );
}

export function SortableList({ initialItems }: { initialItems: Item[] }) {
    const [items, setItems] = useState(initialItems);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.map(item => <SortableItem key={item.id} id={item.id} content={item.content} />)}
            </SortableContext>
        </DndContext>
    );
}
`;
    }

    generateReactDnd(): string {
        return `import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useCallback, useState } from 'react';

interface DraggableProps { id: string; children: React.ReactNode; type: string; }

function DraggableItem({ id, children, type }: DraggableProps) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type,
        item: { id },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }));

    return (
        <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}>
            {children}
        </div>
    );
}

function DropZone({ accept, onDrop, children }: { accept: string; onDrop: (id: string) => void; children: React.ReactNode }) {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept,
        drop: (item: { id: string }) => onDrop(item.id),
        collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
    }));

    return (
        <div ref={drop} style={{ background: isOver && canDrop ? '#e9ecef' : 'white', minHeight: 100, padding: 16, border: '2px dashed #ddd' }}>
            {children}
        </div>
    );
}

export function KanbanBoard() {
    const [columns, setColumns] = useState({
        todo: ['Task 1', 'Task 2'],
        inProgress: ['Task 3'],
        done: ['Task 4'],
    });

    const moveTask = useCallback((taskId: string, toColumn: string) => {
        // Implementation for moving tasks between columns
    }, []);

    return (
        <DndProvider backend={HTML5Backend}>
            <div style={{ display: 'flex', gap: 16 }}>
                {Object.entries(columns).map(([col, tasks]) => (
                    <DropZone key={col} accept="task" onDrop={(id) => moveTask(id, col)}>
                        <h3>{col}</h3>
                        {tasks.map(task => (
                            <DraggableItem key={task} id={task} type="task">
                                <div className="task-card">{task}</div>
                            </DraggableItem>
                        ))}
                    </DropZone>
                ))}
            </div>
        </DndProvider>
    );
}
`;
    }

    generatePragmaticDnd(): string {
        return `import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef, useState } from 'react';

export function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!ref.current) return;
        return draggable({
            element: ref.current,
            getInitialData: () => ({ id }),
            onDragStart: () => setIsDragging(true),
            onDrop: () => setIsDragging(false),
        });
    }, [id]);

    return (
        <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}>
            {children}
        </div>
    );
}

export function DropTarget({ onDrop, children }: { onDrop: (data: any) => void; children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [isOver, setIsOver] = useState(false);

    useEffect(() => {
        if (!ref.current) return;
        return dropTargetForElements({
            element: ref.current,
            onDragEnter: () => setIsOver(true),
            onDragLeave: () => setIsOver(false),
            onDrop: ({ source }) => {
                setIsOver(false);
                onDrop(source.data);
            },
        });
    }, [onDrop]);

    return (
        <div ref={ref} style={{ background: isOver ? '#e9ecef' : 'white', minHeight: 100, border: '2px dashed #ddd' }}>
            {children}
        </div>
    );
}
`;
    }

    generateDragDropStyles(): string {
        return `.sortable-item { padding: 16px; margin: 8px 0; background: white; border: 1px solid #ddd; border-radius: 8px; cursor: grab; transition: box-shadow 0.2s; }
.sortable-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.sortable-item:active { cursor: grabbing; }
.task-card { padding: 12px; margin: 8px 0; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.kanban-column { min-width: 280px; background: #f4f5f7; border-radius: 8px; padding: 16px; }
.kanban-column h3 { margin: 0 0 16px; font-size: 14px; text-transform: uppercase; color: #666; }
`;
    }
}

export const dragDropGenerator = new DragDropGenerator();
