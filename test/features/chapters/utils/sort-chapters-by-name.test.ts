import { describe, expect, it } from 'vitest';

import { sortChaptersByName } from '@/features/chapters/utils/sort-chapters-by-name';

const chapters = [
  { chapterName: 'Chapter 10' },
  { chapterName: 'chapter 2' },
  { chapterName: 'Chapter 1' },
];

describe('sortChaptersByName', () => {
  it('sorts chapter names naturally from A to Z', () => {
    expect(sortChaptersByName(chapters, 'ASC')).toEqual([
      { chapterName: 'Chapter 1' },
      { chapterName: 'chapter 2' },
      { chapterName: 'Chapter 10' },
    ]);
  });

  it('sorts chapter names from Z to A', () => {
    expect(sortChaptersByName(chapters, 'DESC')).toEqual([
      { chapterName: 'Chapter 10' },
      { chapterName: 'chapter 2' },
      { chapterName: 'Chapter 1' },
    ]);
  });

  it('does not mutate the source list', () => {
    const original = [...chapters];

    sortChaptersByName(chapters, 'ASC');

    expect(chapters).toEqual(original);
  });
});
