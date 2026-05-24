

// All monetary values are stored in paise (1 rupee = 100 paise)
// so we never deal with floating-point arithmetic in the database.
// These helpers convert at the API boundary.
 
/** Rupees (float from client) → paise (integer for DB) */
export const toPaise = (rupees) => Math.round(Number(rupees) * 100)
 
/** Paise (integer from DB) → rupees (float for client) */
export const toRupees = (paise) => Number(paise) / 100
 
/**
 * Recursively convert all *Paise fields in an object to *Rupees.
 * Used in route handlers to transform Prisma results before sending.
 *
 * Example:
 *   { ratePaise: 5000 }  →  { rateRupees: 50 }
 */
export const paiseToRupees = (obj) => {
  if (Array.isArray(obj)) return obj.map(paiseToRupees)
  if (obj === null || typeof obj !== 'object') return obj
 
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key.endsWith('Paise') && typeof value === 'number') {
      const newKey = key.replace('Paise', 'Rupees')
      result[newKey] = toRupees(value)
    } else if (typeof value === 'object' && value !== null) {
      result[key] = paiseToRupees(value)
    } else {
      result[key] = value
    }
  }
  return result
}