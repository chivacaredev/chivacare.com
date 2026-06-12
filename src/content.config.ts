import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  img: z.string(),
});

export const collections = {
  'blog-en': defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog-en' }),
    schema: postSchema,
  }),
  'blog-th': defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog-th' }),
    schema: postSchema,
  }),
};
