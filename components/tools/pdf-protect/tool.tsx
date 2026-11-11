"use client";

import { useState } from "react";
import { Eye, EyeOff, FileLock2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolShell } from "@/components/shared/tool-shell";
import { pdfProtectMeta as meta } from "./meta";
import { pdfProtectProcessor, type ProtectOptions } from "./processor";

export default function PdfProtectTool() {
  const [mode, setMode] = useState<ProtectOptions["mode"]>("protect");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);

  const mismatch = mode === "protect" && confirm !== "" && confirm !== password;
  // Unlocking works without a password for PDFs that only restrict printing/copying.
  const invalid = mode === "protect" && (!password || password !== confirm);

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as ProtectOptions["mode"])}>
        <TabsList>
          <TabsTrigger value="protect">Protect</TabsTrigger>
          <TabsTrigger value="unlock">Unlock</TabsTrigger>
        </TabsList>
      </Tabs>
      <ToolShell
        key={mode}
        processor={pdfProtectProcessor}
        options={{ mode, password, allowPrint, allowCopy }}
        accept={meta.accept}
        maxFiles={meta.maxFiles}
        maxSize={(meta.maxSizeMB ?? 200) * 1024 * 1024}
        actionLabel={mode === "protect" ? "Protect PDF" : "Unlock PDF"}
        actionDisabled={invalid}
        zipName={mode === "protect" ? "protected-pdfs.zip" : "unlocked-pdfs.zip"}
        renderItemPreview={() => (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf/10 text-cat-pdf">
            {mode === "protect" ? <FileText className="size-5" /> : <FileLock2 className="size-5" />}
          </div>
        )}
        optionsPanel={
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">{mode === "protect" ? "New password" : "Current password"}</Label>
              <div className="relative">
                <Input
                  id="pw"
                  type={show ? "text" : "password"}
                  autoComplete={mode === "protect" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9"
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            {mode === "unlock" && (
              <p className="text-xs text-muted-foreground">
                Leave empty to remove printing and copying restrictions from a PDF that opens without a password.
              </p>
            )}
            {mode === "protect" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pw2">Confirm password</Label>
                  <Input
                    id="pw2"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={mismatch || undefined}
                  />
                  {mismatch && <p className="text-xs text-destructive">Passwords don’t match.</p>}
                </div>
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Switch id="print" checked={allowPrint} onCheckedChange={setAllowPrint} />
                    <Label htmlFor="print">Allow printing</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="copy" checked={allowCopy} onCheckedChange={setAllowCopy} />
                    <Label htmlFor="copy">Allow copying text</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Encrypted with AES-256. Keep the password safe: it can’t be recovered.</p>
                </div>
              </>
            )}
          </div>
        }
      />
    </div>
  );
}
