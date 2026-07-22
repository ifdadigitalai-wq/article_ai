export const CATEGORIES = [
  "Accounting",
  "SAP",
  "HR Executive",
  "Data Analytics & Business Intelligence",
  "Stock Market & Forex",
  "Artificial Intelligence",
  "Programming & Software Development",
  "Cyber Security & Ethical Hacking",
  "Digital Marketing",
  "Web Design & Development",
  "Mobile App Development",
  "Multimedia, Design & Animation",
  "Computer Hardware & Networking",
  "Technology",
  "Sports",
  "Science",
  "Environment",
  "Architecture",
  "International"
];

/**
 * Get all unique categories from the articles data
 * This ensures category lists are always in sync with the actual article data
 */
export function getAvailableCategories(): string[] {
  return CATEGORIES;
}

/**
 * Check if a category exists in the available categories
 */
export function isStandardCategory(category: string): boolean {
  return CATEGORIES.includes(category);
}
