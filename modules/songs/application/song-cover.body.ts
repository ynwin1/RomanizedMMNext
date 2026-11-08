/** Read only a bounded amount of JSON, even for chunked requests with no Content-Length. */
export async function readCoverSubmissionBody(request: Request, maxBytes = 4096): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder("utf-8", {fatal: true});
  let bytes = 0;
  let output = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => {});
        return null;
      }
      output += decoder.decode(part.value, {stream: true});
    }
    return output + decoder.decode();
  } catch {
    return "";
  } finally {
    reader.releaseLock();
  }
}
