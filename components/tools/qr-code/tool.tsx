"use client";

import { useDeferredValue, useState } from "react";
import type { QRCodeErrorCorrectionLevel } from "qrcode";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/utils/download";
import { wifiPayload, type WifiSecurity } from "./payload";
import { buildMatrix, toPng, toSvg, type QrMatrix } from "./render";

type Kind = "text" | "wifi";

function ColorInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border px-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs uppercase text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

export default function QrCodeTool() {
  const [kind, setKind] = useState<Kind>("text");
  const [text, setText] = useState("https://");
  const [wifi, setWifi] = useState({ ssid: "", password: "", security: "WPA" as WifiSecurity, hidden: false });
  const [ecl, setEcl] = useState<QRCodeErrorCorrectionLevel>("M");
  const [dark, setDark] = useState("#000000");
  const [light, setLight] = useState("#ffffff");
  const [size, setSize] = useState(1024);
  const [margin, setMargin] = useState(true);

  const payload = useDeferredValue(kind === "text" ? (text === "https://" ? "" : text) : wifiPayload(wifi));
  const style = { dark, light, margin: margin ? 4 : 0 };

  let matrix: QrMatrix | null = null;
  let error = "";
  if (payload) {
    try {
      matrix = buildMatrix(payload, ecl);
    } catch {
      error = "Too much content for a QR code. Shorten it or lower the error correction level.";
    }
  }
  const svg = matrix ? toSvg(matrix, style) : "";

  const downloadPng = async () => {
    if (!matrix) return;
    try {
      downloadBlob(await toPng(matrix, style, size), "qr-code.png");
    } catch {
      toast.error("Could not create the PNG.");
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-5 rounded-xl border bg-card p-5">
        <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
          <TabsList>
            <TabsTrigger value="text">Link / Text</TabsTrigger>
            <TabsTrigger value="wifi">Wi-Fi</TabsTrigger>
          </TabsList>
        </Tabs>

        {kind === "text" ? (
          <div className="space-y-2">
            <Label htmlFor="qr-text">Link or text</Label>
            <Textarea id="qr-text" value={text} onChange={(e) => setText(e.target.value)} className="min-h-28" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ssid">Network name (SSID)</Label>
              <Input id="ssid" value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security">Security</Label>
              <Select value={wifi.security} onValueChange={(v) => setWifi({ ...wifi, security: v as WifiSecurity })}>
                <SelectTrigger id="security" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">None (open)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {wifi.security !== "nopass" && (
              <div className="space-y-2">
                <Label htmlFor="wifi-pass">Password</Label>
                <Input id="wifi-pass" value={wifi.password} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} />
              </div>
            )}
            <div className="flex items-center gap-2 self-end pb-2">
              <Switch id="hidden" checked={wifi.hidden} onCheckedChange={(hidden) => setWifi({ ...wifi, hidden })} />
              <Label htmlFor="hidden">Hidden network</Label>
            </div>
          </div>
        )}

        <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
          <ColorInput id="qr-dark" label="Foreground" value={dark} onChange={setDark} />
          <ColorInput id="qr-light" label="Background" value={light} onChange={setLight} />
          <div className="space-y-2">
            <Label htmlFor="ecl">Error correction</Label>
            <Select value={ecl} onValueChange={(v) => setEcl(v as QRCodeErrorCorrectionLevel)}>
              <SelectTrigger id="ecl" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Low (7%)</SelectItem>
                <SelectItem value="M">Medium (15%)</SelectItem>
                <SelectItem value="Q">Quartile (25%)</SelectItem>
                <SelectItem value="H">High (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="png-size">PNG size</Label>
            <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
              <SelectTrigger id="png-size" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[256, 512, 1024, 2048].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} × {s} px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="margin" checked={margin} onCheckedChange={setMargin} />
            <Label htmlFor="margin">Quiet zone (margin)</Label>
          </div>
        </div>
      </section>

      <aside className="space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-20">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
          {svg ? (
            <div
              role="img"
              aria-label="QR code preview"
              className="size-full [&>svg]:size-full"
              // Markup built by toSvg() from the QR matrix and validated hex colors, never from user HTML.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <p className="px-6 text-center text-sm text-muted-foreground">
              {error || (kind === "wifi" ? "Enter a network name to see the QR code." : "Enter a link or text to see the QR code.")}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button disabled={!svg} onClick={downloadPng}>
            <Download /> PNG
          </Button>
          <Button
            variant="outline"
            disabled={!svg}
            onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "qr-code.svg")}
          >
            <Download /> SVG
          </Button>
        </div>
      </aside>
    </div>
  );
}
