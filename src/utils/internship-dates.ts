import { differenceInWeeks, differenceInDays, startOfWeek, endOfWeek } from "date-fns";

/**
 * Calculate the total number of weeks in an internship based on start and end dates
 * @param startDate - The start date of the internship
 * @param endDate - The end date of the internship
 * @returns The total number of weeks (rounded up)
 */
export function calculateTotalWeeks(startDate: Date, endDate: Date): number {
  if (!startDate || !endDate) {
    return 0;
  }
  
  const days = differenceInDays(endDate, startDate);
  // Round up to include partial weeks
  return Math.ceil(days / 7);
}

/**
 * Calculate the current week number based on the internship start date
 * @param startDate - The start date of the internship
 * @param currentDate - The current date (defaults to now)
 * @returns The current week number (1-based), or 0 if internship hasn't started
 */
export function calculateCurrentWeek(startDate: Date, currentDate: Date = new Date()): number {
  if (!startDate) {
    return 0;
  }
  
  // If current date is before start date, return 0
  if (currentDate < startDate) {
    return 0;
  }
  
  const weeksPassed = differenceInWeeks(currentDate, startDate);
  // Week numbers are 1-based, so add 1
  return weeksPassed + 1;
}

/**
 * Get the week range (start and end dates) for a specific week number
 * @param startDate - The start date of the internship
 * @param weekNo - The week number (1-based)
 * @returns An object with weekStart and weekEnd dates
 */
export function getWeekRange(startDate: Date, weekNo: number): { weekStart: Date; weekEnd: Date } {
  if (!startDate || weekNo < 1) {
    throw new Error("Invalid start date or week number");
  }
  
  // Calculate the start of the week (weekNo - 1 weeks after startDate)
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() + (weekNo - 1) * 7);
  
  // Calculate the end of the week (6 days after week start)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  return { weekStart, weekEnd };
}

/**
 * Check if a week number is valid for the internship duration
 * @param weekNo - The week number to check
 * @param startDate - The start date of the internship
 * @param endDate - The end date of the internship
 * @returns True if the week number is valid, false otherwise
 */
export function isValidWeekNumber(
  weekNo: number,
  startDate: Date,
  endDate: Date
): boolean {
  if (!startDate || !endDate || weekNo < 1) {
    return false;
  }
  
  const totalWeeks = calculateTotalWeeks(startDate, endDate);
  return weekNo <= totalWeeks;
}

/**
 * Check if the internship has started
 * @param startDate - The start date of the internship
 * @param currentDate - The current date (defaults to now)
 * @returns True if the internship has started, false otherwise
 */
export function hasInternshipStarted(startDate: Date, currentDate: Date = new Date()): boolean {
  if (!startDate) {
    return false;
  }
  
  return currentDate >= startDate;
}

/**
 * Check if the internship has ended
 * @param endDate - The end date of the internship
 * @param currentDate - The current date (defaults to now)
 * @returns True if the internship has ended, false otherwise
 */
export function hasInternshipEnded(endDate: Date, currentDate: Date = new Date()): boolean {
  if (!endDate) {
    return false;
  }
  
  return currentDate > endDate;
}

