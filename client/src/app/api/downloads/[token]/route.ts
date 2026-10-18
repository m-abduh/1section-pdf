import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fail } from "@/lib/server/next-helpers";
import { resolveDownload } from "@/lib/server/modules/downloads/download.service";
import * as fs from "node:fs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const resolved = await resolveDownload(token);
    if (resolved.redirectUrl) {
      return NextResponse.redirect(resolved.redirectUrl);
    }
    if (!resolved.localPath) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "File could not be resolved" } }, { status: 404 });
    }
    if (!fs.existsSync(resolved.localPath)) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "File no longer exists on the server" } }, { status: 404 });
    }
    const buf = fs.readFileSync(resolved.localPath);
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resolved.fileName}"`,
      },
    });
  } catch (e) {
    return fail(e);
  }
}
