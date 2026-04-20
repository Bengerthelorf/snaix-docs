import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.string().optional(),
    order: z.number().optional(),
  }),
});

const changelog = defineCollection({
  type: 'content',
  schema: z.object({
    version: z.string(),
    date: z.string(),
    tags: z.array(z.enum(['new', 'fix', 'breaking'])).optional(),
  }),
});

const products = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    tagline: z.string(),
    color: z.enum(['ink', 'yellow', 'red', 'blue']),
    version: z.string().optional(),
  }),
});

export const collections = { docs, changelog, products };
