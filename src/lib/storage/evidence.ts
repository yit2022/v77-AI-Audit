type R2Bucket = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | Blob | ReadableStream | null,
    options?: { httpMetadata?: { contentType?: string } },
  ) => Promise<unknown>;
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer>; body: ReadableStream | null } | null>;
};

import path from "path";

export async function storeEvidenceBlob(opts: {
  orgId: string;
  evidenceId: string;
  safeName: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  const key = `evidence/${opts.orgId}/${opts.evidenceId}-${opts.safeName}`;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const bucket = (ctx.env as { EVIDENCE?: R2Bucket }).EVIDENCE;
    if (bucket) {
      await bucket.put(key, opts.buffer, {
        httpMetadata: { contentType: opts.contentType },
      });
      return `r2://${key}`;
    }
  } catch {
    // fall through to local fs
  }
  const fs = await import("fs/promises");
  const dir = path.join(process.cwd(), "uploads", "evidence", opts.orgId);
  await fs.mkdir(dir, { recursive: true });
  const storagePath = path.join(dir, `${opts.evidenceId}-${opts.safeName}`);
  await fs.writeFile(storagePath, opts.buffer);
  return storagePath;
}
