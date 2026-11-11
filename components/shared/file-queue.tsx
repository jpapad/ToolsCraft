"use client";

import type { ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, CircleAlert, File as FileIcon, GripVertical, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/files";
import type { QueueItem } from "@/lib/hooks/use-file-processor";

interface FileQueueProps {
  items: QueueItem[];
  sortable?: boolean;
  onRemove?: (id: string) => void;
  onReorder?: (ids: string[]) => void;
  renderPreview?: (item: QueueItem) => ReactNode;
}

export function FileQueue({ items, sortable, onRemove, onReorder, renderPreview }: FileQueueProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    onReorder?.(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  const list = (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <QueueRow
          key={item.id}
          item={item}
          index={index}
          sortable={sortable}
          onRemove={onRemove}
          preview={renderPreview?.(item)}
        />
      ))}
    </ul>
  );

  if (!sortable) return list;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {list}
      </SortableContext>
    </DndContext>
  );
}

function QueueRow({
  item,
  index,
  sortable,
  onRemove,
  preview,
}: {
  item: QueueItem;
  index: number;
  sortable?: boolean;
  onRemove?: (id: string) => void;
  preview?: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !sortable,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 shadow-xs",
        isDragging && "relative z-10 shadow-lg ring-2 ring-primary/40",
      )}
    >
      {sortable && (
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label={`Reorder ${item.file.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}

      {preview ?? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <FileIcon className="size-5" />
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {sortable && <span className="text-xs tabular-nums text-muted-foreground">{index + 1}.</span>}
          <p className="truncate text-sm font-medium" title={item.file.name}>
            {item.file.name}
          </p>
        </div>
        {item.status === "processing" ? (
          <Progress value={item.progress} className="h-1.5" />
        ) : (
          <p className={cn("text-xs text-muted-foreground", item.status === "error" && "text-destructive")}>
            {item.status === "error" ? item.error : <SizeLine item={item} />}
          </p>
        )}
      </div>

      <StatusIcon status={item.status} />

      {onRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${item.file.name}`}
          onClick={() => onRemove(item.id)}
        >
          <X />
        </Button>
      )}
    </li>
  );
}

/** "1.2 MB", or "1.2 MB → 340 KB (−72%)" once a single-output item is done. */
function SizeLine({ item }: { item: QueueItem }) {
  const before = item.file.size;
  if (item.status !== "done" || item.outputs.length !== 1) return <>{formatBytes(before)}</>;
  const after = item.outputs[0].blob.size;
  const change = Math.round((after / before - 1) * 100);
  return (
    <>
      {formatBytes(before)} → {formatBytes(after)}{" "}
      <span className={change <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}>
        ({change > 0 ? "+" : ""}
        {change}%)
      </span>
    </>
  );
}

function StatusIcon({ status }: { status: QueueItem["status"] }) {
  if (status === "processing") return <Loader2 className="size-4 animate-spin text-primary" />;
  if (status === "done") return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />;
  if (status === "error") return <CircleAlert className="size-4 text-destructive" />;
  return null;
}
