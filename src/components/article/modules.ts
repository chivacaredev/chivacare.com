/**
 * Per-module settings for the legacy article-like modules
 * (promotions, blog, activities, reviews, video). Labels are the hard-coded
 * Thai strings from the legacy views/controllers; English is a fresh translation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getActivities, getBlogs, getPromotions, getReviews, getVideos, img, type Row } from '../../lib/db';
import { pick, url, type Lang } from '../../lib/i18n';
import { slug } from '../../lib/text';

export type ModuleKey = 'promotions' | 'blog' | 'activities' | 'reviews' | 'video';

type L10n = Record<Lang, string>;

export interface ModuleConfig {
  key: ModuleKey;
  rows: () => Row[];
  image: (file: string) => string;
  /** Page heading + breadcrumb label */
  label: L10n;
  /** Heading of the "other items" carousel on detail pages (null = none) */
  otherLabel: L10n | null;
  /** "See more" link under the other-items carousel */
  moreLabel?: L10n;
  /** Max other items (legacy LIMIT 10; reviews had no limit) */
  otherLimit?: number;
  /** Carousel slides per view [mobile, 640, 768, 1024] */
  otherPerView: [number, number, number, number];
}

export const MODULES: Record<ModuleKey, ModuleConfig> = {
  promotions: {
    key: 'promotions',
    rows: getPromotions,
    image: img.promotions,
    label: { th: 'โปรโมชั่น', en: 'Promotions' },
    otherLabel: { th: 'โปรโมชั่นแนะนำอื่นๆ', en: 'Other recommended promotions' },
    otherLimit: 10,
    otherPerView: [1, 2, 2, 3],
  },
  blog: {
    key: 'blog',
    rows: getBlogs,
    image: img.blog,
    label: { th: 'สาระน่ารู้', en: 'Health Articles' },
    otherLabel: null,
    otherPerView: [1, 2, 2, 3],
  },
  activities: {
    key: 'activities',
    rows: getActivities,
    image: img.activities,
    label: { th: 'ข่าวสารและกิจกรรม', en: 'News & Activities' },
    otherLabel: { th: 'ข่าวสารและกิจกรรม', en: 'News & Activities' },
    moreLabel: { th: 'ข่าวสารและกิจกรรมอื่น ๆ', en: 'More news & activities' },
    otherLimit: 10,
    otherPerView: [1.4, 2, 2, 4],
  },
  reviews: {
    key: 'reviews',
    rows: getReviews,
    image: img.reviews,
    label: { th: 'รีวิวผู้รับการรักษากับชีวาแคร์', en: 'ChivaCare Patient Reviews' },
    otherLabel: { th: 'รีวิวผู้รับการรักษากับชีวาแคร์อื่นๆ', en: 'More patient reviews' },
    otherPerView: [1.3, 2, 2, 3],
  },
  video: {
    key: 'video',
    rows: getVideos,
    image: img.video,
    label: { th: 'คลิปวิดีโอ ชีวาแคร์', en: 'ChivaCare Video Clips' },
    otherLabel: null,
    otherPerView: [1, 2, 2, 3],
  },
};

/** /{lang}/<module>/{id}/{slug} */
export const detailUrl = (mod: ModuleKey, row: Row, lang: Lang) => url(lang, `${mod}/${row.id}/${rowSlug(row, lang)}`);

/** Legacy slug(title); falls back to the id so the route segment is never empty. */
export const rowSlug = (row: Row, lang: Lang) => slug(pick(row, 'title', lang)) || String(row.id);

const publicDir = path.join(process.cwd(), 'public');

/** Image URL only when the row has a real image file that exists under public/. */
export function imageSrc(mod: ModuleKey, row: Row): string | undefined {
  const file = String(row.photomain ?? '');
  if (!/\.(jpe?g|png|gif|webp)$/i.test(file)) return undefined;
  const src = MODULES[mod].image(file);
  return fs.existsSync(path.join(publicDir, src)) ? src : undefined;
}

/** getStaticPaths for detail routes: every active row in both languages. */
export function detailPaths(mod: ModuleKey) {
  const rows = MODULES[mod].rows();
  return (['th', 'en'] as Lang[]).flatMap((lang) =>
    rows.map((row) => ({
      params: { lang, id: String(row.id), slug: rowSlug(row, lang) },
      props: { row },
    })),
  );
}

/** Other items for the detail carousel (legacy: id != current, id DESC, LIMIT n). */
export function otherRows(mod: ModuleKey, row: Row): Row[] {
  const cfg = MODULES[mod];
  const others = cfg.rows().filter((r) => r.id !== row.id);
  return cfg.otherLimit ? others.slice(0, cfg.otherLimit) : others;
}

export const SHARE_LABEL: L10n = { th: 'แชร์', en: 'Share' };
