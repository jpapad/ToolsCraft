import Link from "next/link";
import { Blocks } from "lucide-react";
import { site } from "@/lib/site";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Blocks className="size-4" />
      </span>
      {site.name}
    </Link>
  );
}
