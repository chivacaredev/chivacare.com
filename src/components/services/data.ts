/**
 * Data rules of the legacy services module
 * (application/modules/services/controllers/services.php + services_model.php).
 */
import fs from 'node:fs';
import path from 'node:path';
import { getCategories, getCategory, getServices, getSubcategories, img, type Row } from '../../lib/db';
import { pick, url, type Lang } from '../../lib/i18n';
import { slug } from '../../lib/text';

/** LIMIT_PAGE in application/config/constants.php */
export const LIMIT_PAGE = 12;

const isImageFile = (f: unknown) => typeof f === 'string' && /\.(jpe?g|png|gif|webp)$/i.test(f);

/** True when the service has a real image file under public/. */
export const hasServiceImage = (row: Row) =>
  isImageFile(row.photomain) && fs.existsSync(path.join(process.cwd(), 'public', img.services(row.photomain)));

/** Active services (status 'A', id DESC) that can be shown as cards. */
const listable = () => getServices().filter(hasServiceImage);

/** fetchCategoryById(): active categories only. */
export const activeCategory = (id: number) => {
  const c = getCategory(id);
  return c && c.status === 'A' ? c : undefined;
};

/** fetchServicesAll({category_id, subcategory_id?, is_not_id?, limit?}) */
export function servicesOf(opts: { categoryId: number; subcategoryId?: number; notId?: number; limit?: number }) {
  let rows = listable().filter((s) => Number(s.category_id) === opts.categoryId);
  if (opts.subcategoryId != null) rows = rows.filter((s) => Number(s.subcategory_id) === opts.subcategoryId);
  if (opts.notId != null) rows = rows.filter((s) => Number(s.id) !== opts.notId);
  return opts.limit ? rows.slice(0, opts.limit) : rows;
}

/**
 * fetchServicesProgrameAll(): category 5 services whose title LIKE any comma-separated tag.
 * Zend_Db_Select builds `cat = 5 AND title LIKE t0 OR title LIKE t1 ... OR title LIKE tn AND status = 'A'`
 * without grouping, so with several tags the later tags match services of any category.
 * We keep that live behaviour, but only list active services (inactive ones have no page).
 * MySQL LIKE with a *_ci collation is case-insensitive. English falls back to Thai like pick().
 */
export function programsFor(service: Row, lang: Lang) {
  if (Number(service.category_id) === 5) return [];
  const tags = pick(service, 'tag', lang).split(',');
  const like = (s: Row, tag: string) => pick(s, 'title', lang).toLowerCase().includes(tag.toLowerCase());
  const rows = listable();
  if (tags.length === 1) return rows.filter((s) => Number(s.category_id) === 5 && like(s, tags[0]));
  return rows.filter(
    (s) => (Number(s.category_id) === 5 && like(s, tags[0])) || tags.slice(1).some((tag) => like(s, tag)),
  );
}

export const serviceUrl = (lang: Lang, s: Row) => url(lang, `services/${s.id}/${slug(pick(s, 'title', lang))}`);
export const categoryUrl = (lang: Lang, c: Row) => url(lang, `services/all/${c.id}/${slug(pick(c, 'name', lang))}`);
export const subcategoryUrl = (lang: Lang, c: Row, sub: Row) =>
  url(lang, `services/all/${c.id}/${sub.id}/${slug(pick(sub, 'name', lang))}`);

/** All active categories (fetchCategoryAll) and their active subcategories. */
export const categories = () => getCategories();
export const subcategoriesOf = (c: Row) => getSubcategories(c.id);

/** Per-category accent colours from chivacare.css (_bg_blue[data-c-N], _bg-blue-w40[data-c-N]). */
export function accent(categoryId: number) {
  switch (categoryId) {
    case 1:
      return { title: 'bg-teal', band: 'var(--color-amber)', heading: 'text-teal' };
    case 2:
      return { title: 'bg-amber', band: 'var(--color-teal)', heading: 'text-amber' };
    case 5:
      return { title: 'bg-ink', band: 'var(--color-teal)', heading: 'text-teal' };
    default:
      // The legacy CSS has no colour for other categories (white title on white); use teal.
      return { title: 'bg-teal', band: 'var(--color-teal)', heading: 'text-teal' };
  }
}

const STRINGS = {
  th: {
    ourServices: 'การบริการของเรา',
    details: 'รายละเอียด',
    noItems: 'ไม่พบรายการนี้',
    moreOf: (name: string) => `ดู${name}อื่น ๆ`,
    treatmentOf: (name: string) => `การรักษา${name}`,
    otherPrograms: 'โปรแกรมอื่นๆ',
    consult: 'ปรึกษาเรา',
    book: 'จองคิวนัดรักษา',
    promotions: 'ดูโปรโมชั่น',
    treatmentProcess: 'ขั้นตอนการรักษา',
    whoIsSuitable: 'เหมาะสำหรับใคร',
    download: 'ดาวน์โหลดเอกสาร',
  },
  en: {
    ourServices: 'Our Services',
    details: 'Details',
    noItems: 'No items found',
    moreOf: (name: string) => `See more ${name}`,
    treatmentOf: (name: string) => `Treatment for ${name}`,
    otherPrograms: 'Other programs',
    consult: 'Consult us',
    book: 'Book an appointment',
    promotions: 'See promotions',
    treatmentProcess: 'Treatment process',
    whoIsSuitable: 'Who is it suitable for',
    download: 'Download',
  },
};
export const s = (lang: Lang) => STRINGS[lang];

/**
 * download_* is a CKEditor field whose output the legacy view comments out.
 * Only link it when it holds a plain file name / URL (never stored HTML).
 */
export const downloadHref = (row: Row, lang: Lang) => {
  const v = pick(row, 'download', lang).trim();
  if (!v || /[<>\s]/.test(v) || !/\.[a-z0-9]{2,5}$/i.test(v)) return '';
  return /^(https?:)?\/\//.test(v) || v.startsWith('/') ? v : `/assets/uploads/${v}`;
};
