import { useCallback, useState } from 'react';

export function useExpandedSections(
  initialSections: Record<string, boolean>
): {
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isExpanded: (key: string) => boolean;
} {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialSections);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isExpanded = useCallback(
    (key: string) => expandedSections[key] ?? false,
    [expandedSections]
  );

  return { expandedSections, toggleSection, setExpandedSections, isExpanded };
}
