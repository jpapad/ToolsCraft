"use client";

import { useRef, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { transfer } from "comlink";
import { Download, GripVertical, Loader2, RotateCcw, RotateCw, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BlobImage } from "@/components/shared/blob-image";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { canvasToBlob, openPdf, renderPage } from "@/lib/engines/pdf/pdfjs";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";
import { withWorker } from "@/lib/workers/with-worker";
import { pdfOrganizeMeta as meta } from "./meta";
import type { PdfOrganizeWorker } from "./worker";

interface PageItem {
  id: string;
  index: number;
  rotation: number;
}

const initialPages = (count: number): PageItem[] =>
  Array.from({ length: count }, (_, i) => ({ id: `p${i}`, index: i, rotation: 0 }));

export default function PdfOrganizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, Blob>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const generation = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async ([f]: File[]) => {
    if (!f) return;
    const gen = ++generation.current;
    setLoading(true);
    try {
      const { doc, close } = await openPdf(await f.arrayBuffer());
      if (gen !== generation.current) return void close();
      setFile(f);
      setPageCount(doc.numPages);
      setPages(initialPages(doc.numPages));
      setThumbs({});
      setLoading(false);
      // Render thumbnails one by one so the grid fills in progressively.
      for (let i = 0; i < doc.numPages; i++) {
        if (gen !== generation.current) break;
        const page = await doc.getPage(i + 1);
        const canvas = await renderPage(page, { targetPx: 260 });
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.8);
        page.cleanup();
        if (gen === generation.current) setThumbs((t) => ({ ...t, [i]: blob }));
      }
      await close();
    } catch (e) {
      if (gen === generation.current) {
        setLoading(false);
        toast.error(e instanceof Error ? e.message : "Could not open this PDF.");
      }
    }
  };

  const reset = () => {
    generation.current++;
    setFile(null);
    setPages([]);
    setThumbs({});
  };

  const rotate = (id: string, delta: number) =>
    setPages((ps) => ps.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p)));
  const remove = (id: string) => setPages((ps) => ps.filter((p) => p.id !== id));
  const rotateAll = (delta: number) => setPages((ps) => ps.map((p) => ({ ...p, rotation: (p.rotation + delta + 360) % 360 })));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setPages((ps) => {
      const ids = ps.map((p) => p.id);
      return arrayMove(ps, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    });
  };

  const save = async () => {
    if (!file || !pages.length) return;
    setSaving(true);
    try {
      const data = await file.arrayBuffer();
      const bytes = await withWorker<PdfOrganizeWorker, Uint8Array>(
        () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        new AbortController().signal,
        (api) => api.organize(transfer(data, [data]), file.name, pages.map(({ index, rotation }) => ({ index, rotation }))),
      );
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), file.name.replace(/\.pdf$/i, "") + "-organized.pdf");
      toast.success("Your PDF is downloading.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the PDF.");
    } finally {
      setSaving(false);
    }
  };

  if (!file) {
    return loading ? (
      <Skeleton className="min-h-72 w-full rounded-xl" />
    ) : (
      <FileDropzone onFiles={load} accept={meta.accept} multiple={false} maxSize={(meta.maxSizeMB ?? 200) * 1024 * 1024} />
    );
  }

  const changed =
    pages.length !== pageCount || pages.some((p, i) => p.index !== i || p.rotation !== 0);

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 p-3 shadow-xs backdrop-blur">
        <div className="mr-auto min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {pages.length} of {pageCount} pages
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <span className="px-2 text-xs text-muted-foreground">Rotate all</span>
          <Button variant="ghost" size="icon-sm" aria-label="Rotate all pages left" title="Rotate all left" onClick={() => rotateAll(-90)}>
            <RotateCcw />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Rotate all pages right" title="Rotate all right" onClick={() => rotateAll(90)}>
            <RotateCw />
          </Button>
        </div>
        <Button variant="ghost" size="sm" disabled={!changed} onClick={() => setPages(initialPages(pageCount))}>
          <Undo2 /> Reset
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close file" onClick={reset}>
          <X />
        </Button>
        <Button onClick={save} disabled={saving || !pages.length}>
          {saving ? <Loader2 className="animate-spin" /> : <Download />} Save PDF
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {pages.map((p, i) => (
              <PageCard
                key={p.id}
                page={p}
                position={i + 1}
                thumb={thumbs[p.index]}
                onRotate={(d) => rotate(p.id, d)}
                onRemove={() => remove(p.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {!pages.length && <p className="py-10 text-center text-muted-foreground">All pages deleted. Use Reset to bring them back.</p>}
    </div>
  );
}

function PageCard({
  page,
  position,
  thumb,
  onRotate,
  onRemove,
}: {
  page: PageItem;
  position: number;
  thumb?: Blob;
  onRotate: (delta: number) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-xs",
        isDragging && "z-10 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <div
        className="relative flex aspect-[3/4] cursor-grab touch-none items-center justify-center overflow-hidden rounded-md bg-muted/50 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={`Page ${page.index + 1}, position ${position}. Press Space to move.`}
      >
        {thumb ? (
          <BlobImage
            blob={thumb}
            alt=""
            className="max-h-full max-w-full object-contain shadow-sm transition-transform"
            style={{ transform: `rotate(${page.rotation}deg)`, scale: page.rotation % 180 ? "0.75" : "1" }}
          />
        ) : (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        )}
        <GripVertical className="absolute top-1 left-1 size-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </div>
      <div className="flex items-center justify-between">
        <span className="pl-1 text-xs tabular-nums text-muted-foreground">{page.index + 1}</span>
        <div className="flex">
          <Button variant="ghost" size="icon-xs" aria-label={`Rotate page ${page.index + 1} left`} onClick={() => onRotate(-90)}>
            <RotateCcw />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label={`Rotate page ${page.index + 1} right`} onClick={() => onRotate(90)}>
            <RotateCw />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label={`Delete page ${page.index + 1}`} onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
