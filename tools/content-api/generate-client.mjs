// Generates the frontend's types for the content API from the published contract
// (backend/openapi/v1.json, L2-027 #5) into @pibbo/api. Run from anywhere:
//
//   node tools/content-api/generate-client.mjs          writes the file
//   node tools/content-api/generate-client.mjs --check  fails if the file has drifted (every build)
//
// It knows only the schema shapes the contract uses, and stops on any other, so a change to
// the contract is never silently mistyped.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const contractPath = `${root}backend/openapi/v1.json`;
const outputPath = `${root}frontend/projects/api/src/lib/content-api.ts`;
const check = process.argv.includes("--check");

const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const schemas = contract.components?.schemas ?? {};

const fail = (message) => {
  console.error(`content-api: ${message}`);
  process.exit(1);
};

const refName = (ref) => {
  const prefix = "#/components/schemas/";
  if (!ref.startsWith(prefix)) fail(`unsupported reference ${ref}`);
  return ref.slice(prefix.length);
};

const typeOf = (schema, where) => {
  if (schema.$ref) return refName(schema.$ref);
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const parts = types.map((type) => {
    switch (type) {
      case "string":
        return "string";
      case "integer":
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "null":
        return "null";
      case "array":
        if (!schema.items) fail(`${where}: an array with no items`);
        return `readonly ${wrap(typeOf(schema.items, `${where}[]`))}[]`;
      case "object":
        if (schema.properties) fail(`${where}: a nested object; give it a schema of its own`);
        if (!schema.additionalProperties) fail(`${where}: an object with no shape`);
        return `Readonly<Record<string, ${typeOf(schema.additionalProperties, `${where}{}`)}>>`;
      default:
        return fail(`${where}: unsupported type ${JSON.stringify(type)}`);
    }
  });
  return [...new Set(parts)].join(" | ");
};

const wrap = (type) => (type.includes(" ") ? `(${type})` : type);

const doc = (text, indent = "") =>
  text ? `${indent}/** ${text.replace(/\*\//g, "*\\/")} */\n` : "";

const interfaceOf = (name, schema) => {
  if (schema.type !== "object" || !schema.properties) fail(`${name}: not an object schema`);
  const required = new Set(schema.required ?? []);
  const members = Object.entries(schema.properties).map(
    ([property, value]) =>
      `${doc(value.description, "  ")}  readonly ${property}${required.has(property) ? "" : "?"}: ${typeOf(value, `${name}.${property}`)};`,
  );
  return `${doc(schema.description)}export interface ${name} {\n${members.join("\n")}\n}`;
};

// The operations, so a caller names an operation, never types a path.
const operations = [];
for (const [path, item] of Object.entries(contract.paths ?? {})) {
  for (const [method, operation] of Object.entries(item)) {
    if (method !== "get") fail(`${method.toUpperCase()} ${path}: the public contract has reads only`);
    const ok = operation.responses?.["200"]?.content?.["application/json"]?.schema;
    if (!ok) fail(`${operation.operationId}: no 200 JSON response`);
    const parameters = [...path.matchAll(/\{([a-zA-Z]+)\}/g)].map((match) => match[1]);
    operations.push({ id: operation.operationId, summary: operation.summary, path, parameters, response: typeOf(ok, operation.operationId) });
  }
}

const pathFunctions = operations.map(({ id, summary, path, parameters }) => {
  const signature = parameters.map((parameter) => `${parameter}: string`).join(", ");
  const template = path.replace(/\{([a-zA-Z]+)\}/g, (_, parameter) => `\${encodeURIComponent(${parameter})}`);
  return `${doc(summary, "  ")}  ${id}: (${signature}): string => \`${template}\`,`;
});

const responseMap = operations.map(({ id, response }) => `  readonly ${id}: ${response};`);

const source = `// Generated from backend/openapi/v1.json by tools/content-api/generate-client.mjs. Do not edit:
// change the API, publish its contract, and run the generator. The build fails if this drifts.

${Object.entries(schemas)
  .map(([name, schema]) => interfaceOf(name, schema))
  .join("\n\n")}

/** The path of each operation of the content API, version ${contract.info?.version ?? "1"}. */
export const contentApiPaths = {
${pathFunctions.join("\n")}
} as const;

/** What each operation answers with 200. */
export interface ContentApiResponses {
${responseMap.join("\n")}
}
`;

const prettierEntry = `${root}frontend/node_modules/prettier/index.mjs`;
if (!existsSync(prettierEntry)) fail("run npm ci in frontend/ first: prettier formats the generated file");
const prettier = await import(pathToFileURL(prettierEntry).href);
const formatted = await prettier.format(source, {
  ...(await prettier.resolveConfig(outputPath)),
  filepath: outputPath,
});

const current = existsSync(outputPath) ? readFileSync(outputPath, "utf8") : "";
if (check) {
  if (current !== formatted) {
    fail(
      "frontend/projects/api/src/lib/content-api.ts has drifted from backend/openapi/v1.json. " +
        "Run: node tools/content-api/generate-client.mjs",
    );
  }
  console.log("content-api: the generated types match the published contract.");
} else if (current !== formatted) {
  writeFileSync(outputPath, formatted);
  console.log("content-api: wrote frontend/projects/api/src/lib/content-api.ts");
} else {
  console.log("content-api: already up to date.");
}
