import Link from "next/link";
import { categories } from "@/lib/tools/categories";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { ToolSearch } from "./tool-search";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Tool categories">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.id}`}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {c.name.replace(" Tools", "")}
            </Link>
          ))}
          <Link
            href="/tools"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            All tools
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ToolSearch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
