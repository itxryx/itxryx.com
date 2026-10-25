import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("./bootstrap-backend.sh", import.meta.url),
);

async function fixture(t, env = {}) {
  const directory = await mkdtemp(join(tmpdir(), "bootstrap-backend-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const log = join(directory, "calls.jsonl");
  await writeFile(log, "");
  await writeFile(
    join(directory, "tool.mjs"),
    `import { appendFileSync, existsSync, writeFileSync } from "node:fs";
const [tool, ...args] = process.argv.slice(2);
appendFileSync(process.env.TEST_LOG, JSON.stringify([tool, ...args]) + "\\n");
if (tool === "terraform") {
  if (args.includes("-migrate-state")) writeFileSync("migrated", "true");
  if (args[0] === "state") console.log(process.env.TEST_STATE_RESOURCES);
  process.exit(0);
}
const kind = args[1] === "head-bucket" ? "BUCKET" : args[1] === "describe-table" ? "TABLE" : "STATE";
const status = kind === "STATE" && existsSync("migrated") ? "present" : process.env["TEST_" + kind];
if (status === "present") process.exit(0);
const code = status === "denied" ? "403" : kind === "TABLE" ? "ResourceNotFoundException" : "404";
console.error("An error occurred (" + code + ") when calling the operation");
process.exit(255);
`,
  );
  for (const tool of ["aws", "terraform"]) {
    await writeFile(
      join(directory, tool),
      `#!/bin/sh\nexec node "$TEST_TOOL" ${tool} "$@"\n`,
      { mode: 0o755 },
    );
  }
  return {
    directory,
    calls: async () =>
      (await readFile(log, "utf8"))
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
    run: (...args) =>
      spawnSync("bash", [script, ...args], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          TEST_TOOL: join(directory, "tool.mjs"),
          TEST_LOG: log,
          TEST_BUCKET: "present",
          TEST_TABLE: "present",
          TEST_STATE: "present",
          TEST_STATE_RESOURCES:
            "aws_s3_bucket.terraform_state\naws_dynamodb_table.terraform_locks",
          BOOTSTRAP_MODE: "manage",
          AWS_REGION: "ap-northeast-1",
          TF_STATE_BUCKET: "example-state-bucket",
          TF_LOCK_TABLE: "example-locks",
          TF_STATE_KEY: "prod/terraform.tfstate",
          TF_BOOTSTRAP_STATE_KEY: "bootstrap/terraform.tfstate",
          ...env,
        },
      }),
  };
}

for (const [name, env, succeeds] of [
  ["allows managing saved state", {}, true],
  ["rejects missing state in manage mode", { TEST_STATE: "missing" }, false],
  [
    "allows adopting existing resources without saved state",
    { BOOTSTRAP_MODE: "adopt", TEST_STATE: "missing" },
    true,
  ],
  [
    "rejects adopting a missing bucket",
    { BOOTSTRAP_MODE: "adopt", TEST_BUCKET: "missing" },
    false,
  ],
  [
    "allows creating absent resources",
    { BOOTSTRAP_MODE: "create", TEST_BUCKET: "missing", TEST_TABLE: "missing" },
    true,
  ],
  ["rejects creating an existing bucket", { BOOTSTRAP_MODE: "create" }, false],
  [
    "rejects creating an existing lock table",
    { BOOTSTRAP_MODE: "create", TEST_BUCKET: "missing" },
    false,
  ],
  [
    "does not treat a bucket permission error as absence",
    { BOOTSTRAP_MODE: "create", TEST_BUCKET: "denied", TEST_TABLE: "missing" },
    false,
  ],
  [
    "does not treat a table permission error as absence",
    { BOOTSTRAP_MODE: "create", TEST_BUCKET: "missing", TEST_TABLE: "denied" },
    false,
  ],
  [
    "does not treat a state permission error as absence",
    { TEST_STATE: "denied" },
    false,
  ],
]) {
  test(name, async (t) => {
    const context = await fixture(t, env);
    const result = context.run("check");
    assert.equal(result.status === 0, succeeds, result.stderr);
    assert.ok((await context.calls()).every(([tool]) => tool === "aws"));
  });
}

test("rejects production state key reuse before any AWS call", async (t) => {
  const context = await fixture(t, {
    TF_BOOTSTRAP_STATE_KEY: "prod/terraform.tfstate",
  });
  assert.notEqual(context.run("check").status, 0);
  assert.deepEqual(await context.calls(), []);
});

test("initial creation selects a local backend", async (t) => {
  const context = await fixture(t, { BOOTSTRAP_MODE: "create" });
  assert.equal(context.run("init", "-lockfile=readonly").status, 0);
  assert.match(
    await readFile(
      join(context.directory, "bootstrap_backend_override.tf"),
      "utf8",
    ),
    /backend "local"/,
  );
  assert.deepEqual(await context.calls(), [
    ["terraform", "init", "-input=false", "-lockfile=readonly"],
  ]);
});

test("normal initialization uses the separate encrypted S3 state", async (t) => {
  const context = await fixture(t);
  assert.equal(context.run("init").status, 0);
  const [call] = await context.calls();
  assert.ok(call.includes("-backend-config=key=bootstrap/terraform.tfstate"));
  assert.ok(call.includes("-backend-config=encrypt=true"));
  assert.ok(call.includes("-backend-config=dynamodb_table=example-locks"));
});

test("rejects an empty remote state in manage mode", async (t) => {
  const context = await fixture(t, { TEST_STATE_RESOURCES: "" });
  const result = context.run("init");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not track aws_s3_bucket/);
});

test("refuses to overwrite existing state during migration", async (t) => {
  const context = await fixture(t, { BOOTSTRAP_MODE: "create" });
  await writeFile(join(context.directory, "terraform.tfstate"), "saved state");
  await writeFile(
    join(context.directory, "bootstrap_backend_override.tf"),
    "local backend",
  );
  const result = context.run("migrate");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to overwrite/);
  assert.ok((await context.calls()).every(([tool]) => tool === "aws"));
  assert.equal(
    await readFile(
      join(context.directory, "bootstrap_backend_override.tf"),
      "utf8",
    ),
    "local backend",
  );
});

test("migrates only local state into an absent destination and verifies persistence", async (t) => {
  const context = await fixture(t, {
    BOOTSTRAP_MODE: "create",
    TEST_STATE: "missing",
  });
  await writeFile(join(context.directory, "terraform.tfstate"), "saved state");
  await writeFile(
    join(context.directory, "bootstrap_backend_override.tf"),
    "local backend",
  );
  const result = context.run("migrate");
  assert.equal(result.status, 0, result.stderr);
  const calls = await context.calls();
  assert.ok(
    calls.some(
      ([tool, ...args]) =>
        tool === "terraform" && args.includes("-migrate-state"),
    ),
  );
  assert.equal(calls.at(-1)[1], "s3api");
  assert.equal(calls.at(-1)[2], "head-object");
  await assert.rejects(
    readFile(join(context.directory, "bootstrap_backend_override.tf")),
    { code: "ENOENT" },
  );
});
