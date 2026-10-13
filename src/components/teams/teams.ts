import { getTeamGroups, getTeams, getTimes, img, type Row } from '../../lib/db';
import { url, type Lang } from '../../lib/i18n';

/** Labels the legacy teams views hard-coded in Thai. */
const STRINGS = {
  th: {
    title: 'ทีมแพทย์และผู้เชี่ยวชาญ',
    breadcrumb: 'ทีมแพทย์ผู้เชี่ยวชาญ',
    book: 'จองคิวนัดรักษา',
    appointment: 'นัดหมาย',
    detail: 'รายละเอียด',
    skill: 'ความชำนาญเฉพาะทางสาขา',
    tool: 'เครื่องมือ',
    lang: 'ภาษา',
    education: 'การศึกษา,รางวัลและการรับรอง',
    times: 'เวลาที่ให้บริการ',
    physio: 'นักกายภาพบำบัด',
  },
  en: {
    title: 'Doctors and Specialists',
    breadcrumb: 'Doctors and Specialists',
    book: 'Book an appointment',
    appointment: 'Appointment',
    detail: 'Details',
    skill: 'Specialty',
    tool: 'Tools',
    lang: 'Languages',
    education: 'Education, awards and certifications',
    times: 'Available times',
    physio: 'Physical therapist',
  },
} as const;

export type TeamStringKey = keyof (typeof STRINGS)['th'];
export const tt = (lang: Lang, key: TeamStringKey) => STRINGS[lang][key];

/** Team groups with their active members (legacy teams controller index()). */
export const teamGroupsWithItems = () =>
  getTeamGroups().map((g) => ({
    ...g,
    items: getTeams().filter((t) => Number(t.category_id) === g.id),
  }));

/**
 * Appointment step 2 link exactly as the legacy teams/index view built it.
 * Group 1 (doctors) books "ปรึกษาแพทย์"; the other groups book the physio clinic.
 */
export function appointmentUrl(lang: Lang, team: Row): string {
  const service = Number(team.category_id) === 1 ? 'ปรึกษาแพทย์' : 'คลินิกกายภาพและกิจกรรมบำบัด';
  const qs = new URLSearchParams({
    group: String(team.category_id),
    physician: '2',
    id: String(team.id),
    is_services: service,
  });
  return url(lang, `appointment/step2?${qs.toString()}`);
}

export const detailUrl = (lang: Lang, team: Row) => url(lang, `teams/detail/${team.id}`);

/** Times listed in the team's time_id CSV, in time-table order. */
export function teamTimes(team: Row) {
  const ids = new Set(
    String(team.time_id ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter(Boolean),
  );
  return getTimes().filter((t) => ids.has(t.id) && (t.status ?? 'A') === 'A');
}

export const teamPhoto = img.team;
