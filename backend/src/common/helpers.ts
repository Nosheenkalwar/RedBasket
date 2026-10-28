import { BadRequestException } from '@nestjs/common';

/** "0300 1234567", "+92 300..." or "3001234567" -> "+923001234567" */
export function normalizePhone(input: string) {
  const digits = String(input || '').replace(/\D/g, '').replace(/^92/, '').replace(/^0/, '');
  if (!/^3\d{9}$/.test(digits)) throw new BadRequestException('Enter a valid mobile number, for example 300 1234567.');
  return '+92' + digits;
}

/** page and pageSize from the query string, never more than 100 rows (REQ-COM-10) */
export function paging(query: { page?: string; pageSize?: string }, defaultSize = 20) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
