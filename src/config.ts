export type OutputFormat = 'opengraph' | 'twitter' | 'table' | 'json';

export interface Config {
  url: string;
  outputFormat: OutputFormat;
}

export const OUTPUT_FORMATS: OutputFormat[] = ['opengraph', 'twitter', 'table', 'json'];
