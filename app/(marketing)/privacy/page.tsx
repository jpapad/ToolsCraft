import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How ToolsCraft handles your files and data: in-browser processing, no uploads.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-muted-foreground">Short version: your files stay on your device.</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your files</h2>
        <p className="text-muted-foreground">
          Tools marked “Runs in your browser” process files entirely on your device using JavaScript and WebAssembly.
          The files are never sent to our servers or anyone else’s. You can check this yourself in your browser’s
          network panel, or by disconnecting from the internet after the page loads.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Server-side tools</h2>
        <p className="text-muted-foreground">
          A few heavy tasks may need a server in the future. Those tools will be clearly labeled before you add a file,
          files will be sent over an encrypted connection, and they will be deleted automatically within one hour.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Accounts and tracking</h2>
        <p className="text-muted-foreground">
          There are no accounts. We don’t sell data, and we never record the contents or names of your files.
        </p>
      </section>
    </main>
  );
}
