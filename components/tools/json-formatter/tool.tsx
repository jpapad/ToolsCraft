"use client";

import { useDeferredValue, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TextToolShell } from "@/components/shared/text-tool-shell";
import { formatJson, type JsonIndent, type JsonMode } from "./format";

const SAMPLE = `{"name":"ToolsCraft","private":true,"tools":[{"slug":"merge-pdf","category":"pdf"},{"slug":"json-formatter","category":"dev"}],"version":1}`;

export default function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<JsonMode>("format");
  const [indent, setIndent] = useState<JsonIndent>("2");
  const [sortKeys, setSortKeys] = useState(false);

  // Keeps typing smooth on large documents: formatting lags behind keystrokes.
  const deferred = useDeferredValue(input);
  const result = formatJson(deferred, { mode, indent, sortKeys });

  return (
    <TextToolShell
      input={input}
      onInputChange={setInput}
      result={result}
      placeholder='Paste JSON here, e.g. {"hello": "world"}'
      downloadName={mode === "minify" ? "data.min.json" : "data.json"}
      downloadType="application/json"
      toolbar={
        <>
          <Tabs value={mode} onValueChange={(v) => setMode(v as JsonMode)}>
            <TabsList>
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="minify">Minify</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "format" && (
            <div className="flex items-center gap-2">
              <Label htmlFor="json-indent" className="text-muted-foreground">
                Indent
              </Label>
              <Select value={indent} onValueChange={(v) => setIndent(v as JsonIndent)}>
                <SelectTrigger id="json-indent" size="sm" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 spaces</SelectItem>
                  <SelectItem value="4">4 spaces</SelectItem>
                  <SelectItem value="tab">Tabs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch id="json-sort" checked={sortKeys} onCheckedChange={setSortKeys} />
            <Label htmlFor="json-sort">Sort keys</Label>
          </div>

          <Button variant="outline" size="sm" className="ml-auto" onClick={() => setInput(SAMPLE)}>
            Load sample
          </Button>
        </>
      }
    />
  );
}
