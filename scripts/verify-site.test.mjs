import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifySite } from "./verify-site.mjs";

async function serveSite(t, overrides = {}) {
  const outputDirectory = await mkdtemp(join(tmpdir(), "verify-site-"));
  const files = {
    "index.html": "<html>Current release</html>",
    "me.jpeg": Buffer.from([0xff, 0xd8, 0xff]),
    "404.html": "<html>Not found</html>",
  };
  t.after(() => rm(outputDirectory, { recursive: true, force: true }));
  await Promise.all(
    Object.entries(files).map(([name, body]) =>
      writeFile(join(outputDirectory, name), body),
    ),
  );

  const requests = [];
  const server = createServer((request, response) => {
    requests.push(request.url);
    const routes = {
      "/": { status: 200, body: files["index.html"] },
      "/me.jpeg": { status: 200, body: files["me.jpeg"] },
      "/www/me.jpeg?source=deployment": {
        status: 301,
        headers: { location: `${siteUrl}/me.jpeg?source=deployment` },
      },
      missing: { status: 404, body: files["404.html"] },
      ...overrides,
    };
    const route = routes[request.url] ?? routes.missing;
    response.writeHead(route.status, route.headers);
    response.end(route.body);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const siteUrl = `http://127.0.0.1:${server.address().port}`;
  return {
    options: { siteUrl, wwwUrl: `${siteUrl}/www`, outputDirectory },
    requests,
  };
}

test("accepts the published build and preserves the redirect path and query", async (t) => {
  const { options, requests } = await serveSite(t);
  await verifySite(options);
  assert.equal(requests.length, 4);
  assert.equal(requests[2], "/www/me.jpeg?source=deployment");
  assert.match(requests[3], /^\/__deployment-check-[\w-]+__$/);
});

test("rejects a stale homepage even when it returns HTTP 200", async (t) => {
  const { options } = await serveSite(t, {
    "/": { status: 200, body: "Old release" },
  });
  await assert.rejects(
    verifySite(options),
    /does not match the build artifact/,
  );
});

test("rejects a missing static asset", async (t) => {
  const { options } = await serveSite(t, {
    "/me.jpeg": { status: 404 },
  });
  await assert.rejects(verifySite(options), /expected HTTP 200, got 404/);
});

test("rejects a temporary redirect", async (t) => {
  const { options } = await serveSite(t, {
    "/www/me.jpeg?source=deployment": { status: 302 },
  });
  await assert.rejects(verifySite(options), /expected HTTP 301, got 302/);
});

test("rejects a redirect that loses the path or query", async (t) => {
  const { options } = await serveSite(t, {
    "/www/me.jpeg?source=deployment": {
      status: 301,
      headers: { location: "https://example.com/" },
    },
  });
  await assert.rejects(verifySite(options), /unexpected redirect destination/);
});

test("rejects a missing page served with HTTP 200", async (t) => {
  const { options } = await serveSite(t, {
    missing: { status: 200 },
  });
  await assert.rejects(verifySite(options), /expected HTTP 404, got 200/);
});

test("rejects a 404 response that is not the exported error page", async (t) => {
  const { options } = await serveSite(t, {
    missing: { status: 404, body: "S3 access denied" },
  });
  await assert.rejects(
    verifySite(options),
    /does not match the build artifact/,
  );
});
