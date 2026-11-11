"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { categories } from "@/lib/tools/categories";
import { plannedTools, tools } from "@/lib/tools/registry";

export function ToolSearch({ variant = "header" }: { variant?: "header" | "hero" }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (variant !== "header") return; // one global shortcut is enough
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  const go = (slug: string) => {
    setOpen(false);
    router.push(`/tools/${slug}`);
  };

  return (
    <>
      {variant === "hero" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-12 w-full max-w-md items-center gap-3 rounded-xl border bg-card px-4 text-left text-muted-foreground shadow-sm transition-colors hover:border-primary/40"
        >
          <Search className="size-4" />
          <span className="flex-1">Search tools…</span>
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-xs sm:inline">⌘K</kbd>
        </button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="h-8 justify-start gap-2 text-muted-foreground sm:w-56"
          aria-label="Search tools"
        >
          <Search />
          <span className="hidden flex-1 text-left sm:inline">Search tools…</span>
          <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen} title="Search tools" description="Find a tool by name">
        <Command>
          <CommandInput placeholder="What do you want to do?" />
          <CommandList>
          <CommandEmpty>No tools found.</CommandEmpty>
          {categories.map((cat) => {
            const live = tools.filter((t) => t.category === cat.id);
            const soon = plannedTools.filter((t) => t.category === cat.id);
            return (
              <CommandGroup key={cat.id} heading={cat.name}>
                {live.map((t) => (
                  <CommandItem key={t.slug} value={`${t.name} ${t.tagline}`} onSelect={() => go(t.slug)}>
                    <t.icon />
                    {t.name}
                  </CommandItem>
                ))}
                {soon.map((t) => (
                  <CommandItem key={t.slug} value={`${t.name} ${t.tagline}`} disabled>
                    <t.icon />
                    {t.name}
                    <CommandShortcut>Soon</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
