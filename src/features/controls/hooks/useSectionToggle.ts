import { useCallback } from 'react';

export function useSectionToggle(
  sectionKey: string,
  expandedSections: Record<string, boolean>,
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
) {
  const isExpanded = expandedSections[sectionKey] ?? false;

  const toggle = useCallback(() => {
    setExpandedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  }, [sectionKey, setExpandedSections]);

  return { isExpanded, toggle };
}
