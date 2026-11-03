/** Site-owned usage examples; upstream command frontmatter also contains
 * illustrative terminal output, which must not be presented as execution. */
export const bcmrCommandExamples: Record<string, string[]> = {
  'bcmr copy': ['bcmr copy -r --verify ./photos/ ./backup/'],
  'bcmr move': ['bcmr move -r ./project/ ./archive/'],
  'bcmr remove': ['bcmr remove --dry-run -r ./old-project/'],
  'bcmr check': ['bcmr check -r ./photos/ ./backup/'],
  'bcmr status': ['bcmr status'],
  'bcmr ls': ['bcmr ls user@host:/srv/'],
  'bcmr stat': ['bcmr stat user@host:/srv/report.pdf'],
  'bcmr du': ['bcmr du user@host:/srv/'],
  'bcmr hash': ['bcmr hash user@host:/srv/report.pdf'],
  'bcmr update': ['bcmr update --check'],
  'bcmr completions': ['bcmr completions zsh'],
  'bcmr doctor': ['bcmr doctor user@host'],
  'bcmr deploy': ['bcmr deploy user@host'],
  'bcmr init': ['eval "$(bcmr init zsh --cmd b)"'],
};
