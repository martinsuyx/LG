#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'openapi', 'openapi.yaml');
const OUTPUT = path.join(ROOT, 'openapi', '.generated.yaml');

const source = fs.readFileSync(INPUT, 'utf8');
const lines = source.split(/\r?\n/);

const resolved = lines.flatMap((line) => {
  const includeMatch = line.match(/^(\s*)example:\s*!include\s+(.+)$/);
  if (!includeMatch) {
    return line;
  }

  const [, indent, includePathRaw] = includeMatch;
  const includePath = includePathRaw.replace(/['"]/g, '').trim();
  const resolvedPath = path.resolve(path.dirname(INPUT), includePath);

  let data;
  const fileContent = fs.readFileSync(resolvedPath, 'utf8');
  try {
    data = JSON.parse(fileContent);
  } catch (jsonError) {
    try {
      data = yaml.parse(fileContent);
    } catch (yamlError) {
      throw new Error(`Failed to parse include file: ${resolvedPath}`);
    }
  }

  const rendered = yaml.stringify(data, { indent: 2 }).trimEnd();
  const renderedLines = rendered.split(/\r?\n/).map((item) => `${indent}  ${item}`);
  return [`${indent}example:`, ...renderedLines];
});

fs.writeFileSync(OUTPUT, resolved.join('\n'));
