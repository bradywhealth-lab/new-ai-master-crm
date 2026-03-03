import papaparse from 'papaparse'

export interface ParsedLead {
  row_id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  normalized_email: string | null
  phone: string | null
  normalized_phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
}

export function normalizeEmail(email: string | null): string | null {
  if (!email) return null
  return email.toLowerCase().trim()
}

export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  // Remove all non-digit characters
  return phone.replace(/\D/g, '')
}

export function normalizeName(name: string | null): string | null {
  if (!name) return null
  return name.trim()
}

export function parseCSV(file: File): Promise<ParsedLead[]> {
  return new Promise((resolve, reject) => {
    papaparse.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedLeads: ParsedLead[] = []

        results.data.forEach((row: any, index: number) => {
          try {
            // Normalize keys to common format
            const normalizedRow: any = {}
            Object.keys(row).forEach((key) => {
              const lowerKey = key.toLowerCase().replace(/[_\s]/g, '')
              normalizedRow[lowerKey] = row[key]
            })

            const first_name = normalizeName(
              normalizedRow.firstName || normalizedRow.first_name
            )
            const last_name = normalizeName(
              normalizedRow.lastname || normalizedRow.last_name
            )
            const email = normalizeEmail(normalizedRow.email)
            const phone = normalizePhone(normalizedRow.phone)

            parsedLeads.push({
              row_id: index + 1,
              first_name,
              last_name,
              email,
              normalized_email: email,
              phone,
              normalized_phone: phone,
              address: normalizedRow.address || null,
              city: normalizedRow.city || null,
              state: normalizedRow.state || null,
              zip: normalizedRow.zip || null,
            })
          } catch (error) {
            console.warn(`Skipping invalid row ${index + 1}:`, error)
          }
        })

        resolve(parsedLeads)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
