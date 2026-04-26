export type CustomerGender = 'M' | 'F'

export interface CustomerNameParts {
  name: string
  gender?: CustomerGender | null
}

export function formatCustomerGenderSuffix(gender?: CustomerGender | null): string {
  if (gender === 'M') {
    return '(先生)'
  }

  if (gender === 'F') {
    return '(女士)'
  }

  return ''
}

export function formatCustomerDisplayName(customer: CustomerNameParts): string {
  return `${customer.name}${formatCustomerGenderSuffix(customer.gender)}`
}
