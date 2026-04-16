import { parseArgs } from './cli.js';
import { getBody } from './fetch.js';
import { parseSlice } from './scan.js';
import { writeOpenGraph, writeTwitter, writeTable, writeJson, MissingFieldError } from './render.js';

async function main(): Promise<void> {
  const config = parseArgs(process.argv);
  const body = await getBody(config.url);
  const tags = parseSlice(body);

  switch (config.outputFormat) {
    case 'opengraph':
      try {
        writeOpenGraph(tags);
      } catch (e) {
        if (e instanceof MissingFieldError) {
          process.stderr.write(`error: OpenGraph missing required field — ${e.field}.\n`);
          process.exit(1);
        }
        throw e;
      }
      break;

    case 'twitter':
      try {
        writeTwitter(tags);
      } catch (e) {
        if (e instanceof MissingFieldError) {
          process.stderr.write(`error: Twitter Card missing required field — ${e.field}.\n`);
          process.exit(1);
        }
        throw e;
      }
      break;

    case 'table':
      writeTable(tags);
      break;

    case 'json':
      writeJson(tags);
      break;
  }
}

main().catch(err => {
  process.stderr.write(`error: ${(err as Error).message}\n`);
  process.exit(1);
});
