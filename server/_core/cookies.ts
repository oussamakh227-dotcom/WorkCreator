import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (forwardedProto) {
    const protos = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
    if (protos.some((p) => p.trim() === "https")) return true;
  }

  const host = req.headers.host?.split(":")[0];
  if (!host) return false;

  if (LOCAL_HOSTS.has(host) || isIpAddress(host)) {
    return false;
  }

  return true;
}

export function getSessionCookieOptions(req: Request): CookieOptions {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  };
}
