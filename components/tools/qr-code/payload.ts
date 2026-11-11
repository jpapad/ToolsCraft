export type WifiSecurity = "WPA" | "WEP" | "nopass";

export interface WifiDetails {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}

/** Escapes the characters that are special in the Wi-Fi QR format. */
const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");

/** Standard "WIFI:" payload that phone cameras recognize. */
export function wifiPayload({ ssid, password, security, hidden }: WifiDetails): string {
  if (!ssid) return "";
  const pass = security === "nopass" ? "" : `P:${esc(password)};`;
  return `WIFI:T:${security};S:${esc(ssid)};${pass}${hidden ? "H:true;" : ""};`;
}
