import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function checkResponse(url, status, expectedBody, location) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  const body = Buffer.from(await response.arrayBuffer());

  if (response.status !== status) {
    throw new Error(`${url}: expected HTTP ${status}, got ${response.status}`);
  }
  if (expectedBody && !body.equals(expectedBody)) {
    throw new Error(`${url}: response does not match the build artifact`);
  }
  if (location && response.headers.get("location") !== location) {
    throw new Error(`${url}: unexpected redirect destination`);
  }
}

export async function verifySite({ siteUrl, wwwUrl, outputDirectory }) {
  const index = await readFile(join(outputDirectory, "index.html"));
  const asset = await readFile(join(outputDirectory, "me.jpeg"));
  const notFound = await readFile(join(outputDirectory, "404.html"));
  const redirectPath = "me.jpeg?source=deployment";

  await checkResponse(`${siteUrl}/`, 200, index);
  await checkResponse(`${siteUrl}/me.jpeg`, 200, asset);
  await checkResponse(
    `${wwwUrl}/${redirectPath}`,
    301,
    undefined,
    `${siteUrl}/${redirectPath}`,
  );
  await checkResponse(
    `${siteUrl}/__deployment-check-${randomUUID()}__`,
    404,
    notFound,
  );
}

if (import.meta.main) {
  const { DOMAIN_NAME, WWW_DOMAIN_NAME } = process.env;
  if (!DOMAIN_NAME || !WWW_DOMAIN_NAME) {
    throw new Error("DOMAIN_NAME and WWW_DOMAIN_NAME are required");
  }
  await verifySite({
    siteUrl: `https://${DOMAIN_NAME}`,
    wwwUrl: `https://${WWW_DOMAIN_NAME}`,
    outputDirectory: "out",
  });
  console.log("Homepage, asset, www redirect, and 404 checks passed.");
}
