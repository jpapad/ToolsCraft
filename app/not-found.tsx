import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">This page doesn’t exist</h1>
      <p className="text-muted-foreground">The tool may have moved, or it isn’t built yet.</p>
      <Button asChild>
        <Link href="/tools">Browse all tools</Link>
      </Button>
    </main>
  );
}
