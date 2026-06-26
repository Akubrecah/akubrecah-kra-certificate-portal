import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import os from "os";
import net from "net";
import tls from "tls";
import url from "url";
import https from "https";

export const maxDuration = 30;

// Verify that the current user is the super admin or admin role
async function verifySuperAdmin() {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const currentUser = await client.users.getUser(userId);
  const email = currentUser.primaryEmailAddress?.emailAddress?.toLowerCase();
  const role = currentUser.publicMetadata?.role as string;
  const configAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
  const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();

  if (
    email === "poweldayck@gmail.com" ||
    email === configAdminEmail ||
    email === configPublicAdminEmail ||
    role === "Super Admin" ||
    role === "Admin" ||
    process.env.NODE_ENV === "development"
  ) {
    return client;
  }
  return null;
}

// Helper to create proxy agent (same as in KRA captcha/retrieve routes)
function createProxyAgent(proxyUrl: string): any {
  if (!proxyUrl) return undefined;
  
  return new https.Agent({
    createConnection: (opts: any, callback: any) => {
      const proxyParsed = url.parse(proxyUrl);
      const proxyHost = proxyParsed.hostname || '';
      const proxyPort = parseInt(proxyParsed.port || '8080', 10);

      const socket = net.connect(proxyPort, proxyHost, () => {
        let connectReq = `CONNECT ${opts.host}:${opts.port} HTTP/1.1\r\n` +
                         `Host: ${opts.host}:${opts.port}\r\n`;
        if (proxyParsed.auth) {
          const base64Auth = Buffer.from(proxyParsed.auth).toString('base64');
          connectReq += `Proxy-Authorization: Basic ${base64Auth}\r\n`;
        }
        connectReq += '\r\n';
        socket.write(connectReq);
      });

      let buffer = '';
      const onData = (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        if (buffer.includes('\r\n\r\n')) {
          socket.off('data', onData);
          socket.off('error', onError);
          if (buffer.startsWith('HTTP/1.1 200') || buffer.startsWith('HTTP/1.0 200')) {
            const secureSocket = tls.connect({
              socket,
              servername: opts.host,
              rejectUnauthorized: false,
            });
            callback(null, secureSocket);
          } else {
            socket.destroy();
            callback(new Error(`Proxy CONNECT failed: ${buffer.split('\r\n')[0]}`));
          }
        }
      };

      const onError = (err: Error) => {
        socket.destroy();
        callback(err);
      };

      socket.on('data', onData);
      socket.on('error', onError);
    }
  });
}

// 1. Database connection latency check using net socket connect
async function pingDatabase(host: string, port = 5432): Promise<number> {
  const start = Date.now();
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2500);

    socket.on("connect", () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve(latency);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(-1);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(-1);
    });

    socket.connect(port, host);
  });
}

// 2. Clerk Auth API latency and count check
async function pingClerk(secretKey: string): Promise<{ status: string; latency: number; count: number }> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.clerk.com/v1/users/count", {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      const count = typeof data === "number" ? data : (data.total_count || 0);
      return { status: "Operational", latency, count };
    }
    return { status: "Degraded", latency, count: 0 };
  } catch (err) {
    return { status: "Outage", latency: Date.now() - start, count: 0 };
  }
}

// 3. KRA Portal check via proxy
async function pingKRA(proxyUrl?: string): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    const agent = proxyUrl ? createProxyAgent(proxyUrl) : undefined;
    const res = await fetch("https://itax.kra.go.ke/KRA-Portal/pinChecker.htm?actionCode=loadPage&viewType=static", {
      method: "HEAD",
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      // Short timeout to prevent health route hangs
      signal: AbortSignal.timeout(4000),
    } as any);

    const latency = Date.now() - start;
    if (res.ok || res.status === 200 || res.status === 403 || res.status === 302) {
      return { status: "Operational", latency };
    }
    return { status: "Degraded", latency };
  } catch (err) {
    return { status: "Outage", latency: Date.now() - start };
  }
}

export async function GET() {
  try {
    const client = await verifySuperAdmin();
    if (!client) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const proxyUrl = process.env.KRA_PROXY_URL || process.env.PROXY_URL || "";
    const clerkSecret = process.env.CLERK_SECRET_KEY || "";
    const dbUrl = process.env.DATABASE_URL || "";

    // Parse Database Host
    let dbHost = "ep-calm-glade-a4i061nd-pooler.us-east-1.aws.neon.tech";
    let dbPort = 5432;
    try {
      if (dbUrl) {
        const tempUrl = dbUrl.replace(/^postgres(ql)?:\/\//, "http://");
        const parsed = new URL(tempUrl);
        dbHost = parsed.hostname || dbHost;
        dbPort = parsed.port ? parseInt(parsed.port, 10) : dbPort;
      }
    } catch {}

    // Perform concurrent checks
    const [dbLatency, clerkRes, kraRes] = await Promise.all([
      pingDatabase(dbHost, dbPort),
      pingClerk(clerkSecret),
      pingKRA(proxyUrl),
    ]);

    // Calculate OS metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = Math.round((usedMem / totalMem) * 100);

    const cpuLoad = os.loadavg(); // Returns 1, 5, and 15 min load averages
    const uptime = process.uptime(); // Process uptime in seconds

    // Construct response
    const metrics = [
      { label: "Server Uptime", value: Math.floor(uptime), unit: "seconds" },
      { label: "Active Users (Clerk)", value: clerkRes.count.toLocaleString(), unit: "accounts" },
      { label: "CPU Load (1m)", value: cpuLoad[0].toFixed(2), unit: "" },
      { label: "Memory Usage", value: memoryUsagePercent.toString(), unit: "%" },
    ];

    const services = [
      { 
        name: "Neon Database", 
        status: dbLatency !== -1 ? "Operational" : "Outage", 
        latency: dbLatency !== -1 ? `${dbLatency}ms` : "N/A" 
      },
      { 
        name: "Authentication Service (Clerk)", 
        status: clerkRes.status, 
        latency: `${clerkRes.latency}ms` 
      },
      { 
        name: "Taxpayer Filing API (KRA Portal)", 
        status: kraRes.status, 
        latency: kraRes.latency > 0 ? `${kraRes.latency}ms` : "N/A" 
      },
    ];

    return NextResponse.json({
      success: true,
      metrics,
      services,
      systemTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API System Health GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
