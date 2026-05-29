import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchViaSsstik } from "./ssstik";
import { IngestionError } from "./types";

// Captured from the actual ssstik landing page (2026-05-29).
// The token lives in a JS assignment, not an <input> — selectors changed
// during Stream B implementation.
const LANDING_HTML = `
  <html><body>
    <script>
      var s_furl = 'abc', s_tt = 'YVBjMTIz', s_prov = 'google';
    </script>
  </body></html>
`;

const PANDA_RESULT_HTML = `
  <p class="maintext">🐼✨ Panda Night Light — perfect for kids</p>
  <a href="https://tikcdn.io/ssstik/123?st=token&e=1234567890"
     class="pure-button without_watermark notranslate"
     download="ssstik.io_panda.mp4">Download MP4</a>
  <img class="result_overlay" src="https://tikcdn.io/ssstik/cover/123.jpg">
`;

const PANDA_URL = "https://www.tiktok.com/@lummilux/video/7394481180319501611";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function okResponse(body: string): Response {
  return new Response(body, { status: 200 });
}

describe("fetchViaSsstik()", () => {
  it("fetches the landing, posts with the extracted token, and parses the mp4 + caption + thumbnail", async () => {
    fetchMock
      .mockResolvedValueOnce(okResponse(LANDING_HTML))
      .mockResolvedValueOnce(okResponse(PANDA_RESULT_HTML));

    const result = await fetchViaSsstik(PANDA_URL);

    expect(result.mp4Url).toBe(
      "https://tikcdn.io/ssstik/123?st=token&e=1234567890",
    );
    expect(result.caption).toContain("Panda Night Light");
    expect(result.thumbnailUrl).toBe(
      "https://tikcdn.io/ssstik/cover/123.jpg",
    );

    // Two requests: landing GET, then form POST.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [landingCall, postCall] = fetchMock.mock.calls;
    expect(landingCall[0]).toContain("ssstik.io");
    expect(postCall[0]).toContain("/abc?url=dl");
    expect(postCall[1].method).toBe("POST");

    // The POST body should carry the tiktok URL + token we parsed.
    const body = String(postCall[1].body);
    expect(body).toContain("id=" + encodeURIComponent(PANDA_URL));
    expect(body).toContain("tt=YVBjMTIz");
    expect(body).toContain("locale=en");
  });

  it("throws IngestionError(unreachable) when ssstik returns no .without_watermark link", async () => {
    // ssstik renders a different layout when the URL is private / removed.
    const noLinkHtml =
      "<p>Sorry, we couldn't process this video.</p>";

    fetchMock
      .mockResolvedValueOnce(okResponse(LANDING_HTML))
      .mockResolvedValueOnce(okResponse(noLinkHtml));

    let err: unknown = null;
    try {
      await fetchViaSsstik(PANDA_URL);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(IngestionError);
    expect((err as IngestionError).code).toBe("unreachable");
  });

  it("throws IngestionError(unknown) when the form token regex doesn't match", async () => {
    // ssstik HTML structure change → token regex misses.
    const tokenlessHtml = "<html><body><h1>SSStik</h1></body></html>";
    fetchMock.mockResolvedValueOnce(okResponse(tokenlessHtml));

    await expect(fetchViaSsstik(PANDA_URL)).rejects.toMatchObject({
      code: "unknown",
      message: expect.stringContaining("form-token"),
    });
  });

  it("throws IngestionError(timeout) on 429 rate-limit from the form POST", async () => {
    fetchMock
      .mockResolvedValueOnce(okResponse(LANDING_HTML))
      .mockResolvedValueOnce(new Response("rate-limited", { status: 429 }));

    await expect(fetchViaSsstik(PANDA_URL)).rejects.toMatchObject({
      code: "timeout",
      message: expect.stringContaining("rate-limited"),
    });
  });

  it("throws IngestionError(unknown) when the landing GET returns a non-OK status", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("server error", { status: 500 }),
    );

    await expect(fetchViaSsstik(PANDA_URL)).rejects.toMatchObject({
      code: "unknown",
      message: expect.stringContaining("500"),
    });
  });

  it("sends a browser-shaped User-Agent on the landing request", async () => {
    fetchMock
      .mockResolvedValueOnce(okResponse(LANDING_HTML))
      .mockResolvedValueOnce(okResponse(PANDA_RESULT_HTML));

    await fetchViaSsstik(PANDA_URL);

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["user-agent"]).toMatch(/Mozilla.*Chrome/);
  });
});
