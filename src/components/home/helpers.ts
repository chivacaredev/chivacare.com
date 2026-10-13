import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pick, type Lang } from '../../lib/i18n';

/** True when a root-relative /assets/... image exists in public/ (build time). */
export function hasImage(src: string | null | undefined): boolean {
  if (!src || !/\.(jpe?g|png|gif|webp|svg)$/i.test(src)) return false;
  let path = src;
  try {
    path = decodeURIComponent(src);
  } catch {}
  return existsSync(join(process.cwd(), 'public', path));
}

/** pick() that also treats the literal string "null" (common in the legacy dump) as empty. */
export function pickHtml(row: Record<string, any>, field: string, lang: Lang): string {
  const v = row[`${field}_${lang}`];
  if (v == null || String(v).trim() === '' || String(v).trim() === 'null') {
    const th = row[`${field}_th`];
    return th && String(th).trim() !== 'null' ? String(th) : '';
  }
  return pick(row, field, lang);
}

/** Home-page headings and labels (legacy view hard-coded Thai). */
const STRINGS = {
  th: {
    promotions: 'โปรโมชั่น',
    morePromotions: 'ดูโปรโมชั่นอื่น ๆ',
    why: 'ทำไมต้องชีวาแคร์',
    whyWarm: 'บริการอบอุ่น',
    whyStandard: 'มาตรฐานที่ดี มีเอกสารรับรอง',
    whyPrice: 'ราคาเข้าได้ ไม่แพง',
    teamTitle: 'ทีมแพทย์ผู้เชี่ยวชาญ',
    teamButton: 'ดูทีมแพทย์ของเรา',
    certificates: 'CERTIFICATE จากสถาบันชั้นนำ',
    services: 'บริการของเรา',
    moreOf: (name: string) => `ดู${name}อื่น ๆ`,
    videos: 'คลิปวิดีโอ ชีวาแคร์',
    moreVideos: 'ดูคลิปวิดีโออื่น ๆ',
    blogs: 'สาระน่ารู้ ข้อมูลสุขภาพ',
    moreBlogs: 'ดูสาระน่ารู้อื่น ๆ',
    reviews: 'รีวิวผู้รับการรักษากับชีวาแคร์',
    moreReviews: 'ดูรีวิวผู้รับการรักษาอื่น ๆ',
    about: 'เกี่ยวกับเรา',
    aboutInfo: 'ข้อมูลชีวาแคร์',
    aboutWhy: 'ทำไมต้องชีวาแคร์',
    aboutDoctors: 'แพทย์ผู้เชี่ยวชาญ',
    aboutMap: 'แผนที่',
  },
  en: {
    promotions: 'Promotions',
    morePromotions: 'See more promotions',
    why: 'Why ChivaCare',
    whyWarm: 'Warm, caring service',
    whyStandard: 'High standards, certified',
    whyPrice: 'Affordable prices',
    teamTitle: 'Our specialist doctors',
    teamButton: 'Meet our doctors',
    certificates: 'Certificates from leading institutions',
    services: 'Our services',
    moreOf: (name: string) => `See more: ${name}`,
    videos: 'ChivaCare videos',
    moreVideos: 'See more videos',
    blogs: 'Health articles',
    moreBlogs: 'See more articles',
    reviews: 'Patient reviews',
    moreReviews: 'See more reviews',
    about: 'About us',
    aboutInfo: 'About ChivaCare',
    aboutWhy: 'Why ChivaCare',
    aboutDoctors: 'Specialist doctors',
    aboutMap: 'Map',
  },
};

export const ht = (lang: Lang) => STRINGS[lang] ?? STRINGS.th;

/** Service name used in the legacy appointment links. */
export const PHYSIO = 'คลินิกกายภาพและกิจกรรมบำบัด';

export const MAP_URL =
  'https://www.google.com/maps/place/ChivaCare+Medical+%26+Physical+Therapy+Clinic+(%E0%B8%8A%E0%B8%B5%E0%B8%A7%E0%B8%B2%E0%B9%81%E0%B8%84%E0%B8%A3%E0%B9%8C+%E0%B8%84%E0%B8%A5%E0%B8%B4%E0%B8%99%E0%B8%B4%E0%B8%81%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%97%E0%B8%B2%E0%B8%87%E0%B9%81%E0%B8%9E%E0%B8%97%E0%B8%A2%E0%B9%8C%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%81%E0%B8%B2%E0%B8%A2%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%9A%E0%B8%B3%E0%B8%9A%E0%B8%B1%E0%B8%94)/@18.793752,98.971779,17z/data=!4m5!3m4!1s0x0:0x94595eee9c3683b4!8m2!3d18.793752!4d98.9717786?hl=en';

/**
 * Legacy .custom-overflow carousels (videos/blog/reviews): the swiper overflows so card shadows show,
 * the section wrapper clips it, and slides outside the viewport are hidden.
 */
export const OVERFLOW_CAROUSEL = 'overflow-visible! [&_.swiper-slide]:transition-opacity [&_.swiper-slide:not(.swiper-slide-visible)]:opacity-0';
