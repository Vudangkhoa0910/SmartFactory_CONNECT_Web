/**
 * Date Parser Utility
 */

export interface DateFilterResult {
  dateFrom: string | null;
  dateTo: string | null;
  keywords: string;
  fullDateMatch: RegExpMatchArray | null;
  month: number | null;
  year: number | null;
  currentYear: number;
}

export function extractDateFilters(
  input: string, 
  lowerInput: string,
  wordsToRemove: string[]
): DateFilterResult {
  const currentYear = new Date().getFullYear();
  
  // Remove search-related words
  const removePattern = new RegExp(`(${wordsToRemove.join('|')})`, 'gi');
  let keywords = input.replace(removePattern, '').trim();
  
  // Extract year
  const yearMatch = lowerInput.match(/(?:năm\s+)?(\d{4})/);
  let year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Extract month
  const monthMatch = lowerInput.match(/(?:tháng|t)\s*(\d{1,2})/i);
  let month = monthMatch ? parseInt(monthMatch[1]) : null;
  
  // Extract full date
  const fullDateMatch = lowerInput.match(/(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  
  let dateFrom: string | null = null;
  let dateTo: string | null = null;
  
  if (fullDateMatch) {
    const day = parseInt(fullDateMatch[1]);
    month = parseInt(fullDateMatch[2]);
    year = fullDateMatch[3] 
      ? (fullDateMatch[3].length === 2 ? 2000 + parseInt(fullDateMatch[3]) : parseInt(fullDateMatch[3])) 
      : currentYear;
    
    const startDate = new Date(year, month - 1, day);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);
    dateFrom = startDate.toISOString();
    dateTo = endDate.toISOString();
  } else if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    dateFrom = startDate.toISOString();
    dateTo = endDate.toISOString();
  } else if (month && !year) {
    const startDate = new Date(currentYear, month - 1, 1);
    const endDate = new Date(currentYear, month, 0, 23, 59, 59);
    dateFrom = startDate.toISOString();
    dateTo = endDate.toISOString();
  } else if (year && !month) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    dateFrom = startDate.toISOString();
    dateTo = endDate.toISOString();
  }
  
  // Remove date strings from keywords
  keywords = keywords.replace(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/g, '').trim();
  keywords = keywords.replace(/\d{4}/g, '').trim();
  keywords = keywords.replace(/\d{1,2}/g, '').trim();
  
  return { dateFrom, dateTo, keywords, fullDateMatch, month, year, currentYear };
}
