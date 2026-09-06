export type ChapterNameSortOrder = 'ASC' | 'DESC';

interface ChapterNameSortable {
  readonly chapterName: string;
}

export function sortChaptersByName<T extends ChapterNameSortable>(
  chapters: readonly T[],
  sortOrder: ChapterNameSortOrder,
): T[] {
  return [...chapters].sort((left, right) => {
    const comparison = left.chapterName.localeCompare(
      right.chapterName,
      undefined,
      { numeric: true, sensitivity: 'base' },
    );

    return sortOrder === 'ASC' ? comparison : -comparison;
  });
}
