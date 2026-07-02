import { GROUP_QUESTIONS } from '../data/groupQuestions.js';

/**
 * Convert a raw groupId into a human-readable short code.
 *   G1A-1        -> G1A-1
 *   G4 Local 1-1 -> G4(1)-1
 *   G5E1-1       -> G5(1)-1
 *   G6S2-3       -> G6(2)-3
 *   London-2     -> London-2
 */
export function formatGroupDisplay(groupId) {
  if (!groupId) return '';

  // Excursions / city names stay as-is
  if (/^[A-Za-z]+-\d+$/.test(groupId)) return groupId;

  const group = GROUP_QUESTIONS[groupId];
  if (!group) return groupId;

  const groupNum = group.groupName ? group.groupName.replace('Group ', '') : '';

  // Grades 1-3 already include the grade in their classId (e.g. G1A)
  if (/^G[123]$/.test(group.grade)) {
    return `${group.classId}-${groupNum}`;
  }

  // Grades 4-6 show the class as a 1-based index in parentheses
  const classes = [
    ...new Set(
      Object.values(GROUP_QUESTIONS)
        .filter(g => g.grade === group.grade)
        .map(g => g.classId)
    ),
  ].sort();
  const classIndex = classes.indexOf(group.classId) + 1;

  return `${group.grade}(${classIndex})-${groupNum}`;
}
