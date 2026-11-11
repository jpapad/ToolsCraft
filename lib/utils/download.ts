export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser time to start the download before freeing memory.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
