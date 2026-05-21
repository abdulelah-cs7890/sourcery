// One-shot test: upload a 1-byte file to the configured Vercel Blob store
// with access:"public". Confirms the store will accept the Google Lens flow.
// Run: node --env-file=.env.local scripts/test-blob.mjs
import { put } from "@vercel/blob";

const { url } = await put("test/sourcery-blob-test.txt", "x", {
  access: "public",
  contentType: "text/plain",
  addRandomSuffix: false,
  allowOverwrite: true,
});

console.log("Uploaded:", url);

// Now fetch the URL without auth to verify public readability.
const res = await fetch(url);
console.log(`Public GET → ${res.status} ${res.statusText}`);
console.log("Body:", await res.text());
