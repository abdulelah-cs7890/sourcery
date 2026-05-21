import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

export async function uploadFrames(
  framePaths: string[],
  lookupId: string,
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < framePaths.length; i++) {
    const data = await readFile(framePaths[i]);
    const { url } = await put(`frames/${lookupId}/${i}.jpg`, data, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    urls.push(url);
  }
  return urls;
}
