import contents from '../../data/db/contents.json';
import { getContent, getContents, type Row } from '../../lib/db';

/**
 * The legacy model filtered `contents.status = 1`, but the exported rows carry
 * status 'A', so lib/db's getContent()/getContents() match nothing. Accept both.
 */
const isActive = (c: Row) => c.status === 'A' || Number(c.status) === 1;

export const activeContents = (): Row[] => {
  const fromDb = getContents();
  return fromDb.length ? fromDb : (contents as Row[]).filter(isActive);
};

export const contentById = (id: number): Row | undefined =>
  getContent(id) ?? (contents as Row[]).find((c) => c.id === id && isActive(c));
