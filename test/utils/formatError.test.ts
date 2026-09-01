import { describe, expect, it } from 'vitest';

import formatError from '@/utils/formatError';

describe('formatError', () => {
  it('uses the response message retained for rejected API requests', () => {
    expect(
      formatError({
        kind: 'rejected',
        data: {
          message:
            'Chapter chỉ có thể được đánh dấu đã đăng sau khi hoàn thành workflow.',
        },
      }),
    ).toBe('Chapter chỉ có thể được đánh dấu đã đăng sau khi hoàn thành workflow.');
  });

  it('falls back to the response message when the error list is empty', () => {
    expect(
      formatError({
        kind: 'rejected',
        data: { errors: [], message: 'Không thể đăng chapter.' },
      }),
    ).toBe('Không thể đăng chapter.');
  });

  it('joins API validation details into one message', () => {
    expect(
      formatError({
        kind: 'rejected',
        data: {
          errors: [
            { detail: 'Chapter không tồn tại.' },
            { message: 'Bạn không có quyền.' },
          ],
        },
      }),
    ).toBe('Chapter không tồn tại., Bạn không có quyền.');
  });
});
