"use client";

import { useCallback, type ComponentProps } from "react";

/**
 * <img> for a Blob/File. The object URL is created when the element mounts and
 * revoked when it unmounts (React 19 ref cleanup), so previews never leak memory.
 */
export function BlobImage({ blob, alt, ...props }: { blob: Blob; alt: string } & Omit<ComponentProps<"img">, "src">) {
  const ref = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el) return;
      const url = URL.createObjectURL(blob);
      el.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [blob],
  );
  // eslint-disable-next-line @next/next/no-img-element -- local blob previews can't use next/image
  return <img ref={ref} alt={alt} decoding="async" {...props} />;
}
