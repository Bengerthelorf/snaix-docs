import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docsSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  section: z.string().optional(),
  order: z.number().optional(),
  locale: z.enum(['en', 'zh', 'zh-Hant']).default('en'),
});

const bcmr      = defineCollection({ type: 'content', schema: docsSchema });
const claudit   = defineCollection({ type: 'content', schema: docsSchema });
const pikpaktui = defineCollection({ type: 'content', schema: docsSchema });

const flag = z.object({ f: z.string(), t: z.string(), d: z.string(), x: z.string() });

const commands = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!README.md'], base: './src/content/commands' }),
  schema: z.object({
    cmd: z.string(),
    group: z.string(),
    sig: z.string().default(''),
    desc: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().optional(),
    related: z.array(z.string()).default([]),
    flags: z.array(flag).default([]),
    example: z.array(z.string()).default([]),
  }),
});

export const collections = { bcmr, claudit, pikpaktui, commands };
