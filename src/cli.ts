import { Command } from 'commander';
import { Config, OUTPUT_FORMATS, OutputFormat } from './config.js';

export function parseArgs(argv: string[]): Config {
  const program = new Command();

  program
    .name('og-check-ts')
    .description('Fetch a URL and render its OpenGraph / Twitter Card metadata')
    .version('0.1.0')
    .argument('<url>', 'URL to fetch and inspect')
    .option(
      '-o, --output-format <format>',
      `Output format (${OUTPUT_FORMATS.join(', ')})`,
      'opengraph',
    )
    .exitOverride();

  program.parse(argv);

  const opts = program.opts<{ outputFormat: string }>();
  const [url] = program.args as [string];

  const outputFormat = opts.outputFormat as OutputFormat;
  if (!OUTPUT_FORMATS.includes(outputFormat)) {
    process.stderr.write(
      `error: invalid output format "${outputFormat}". Valid: ${OUTPUT_FORMATS.join(', ')}\n`,
    );
    process.exit(1);
  }

  return { url, outputFormat };
}
