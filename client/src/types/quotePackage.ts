export interface QuotePackageLineItem {
  id: number
  packageId: number
  description: string
  quantity: number
  unitPrice: number
  sortOrder: number
}

export interface QuotePackage {
  id: number
  vendorId: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  lineItems: QuotePackageLineItem[]
}

export interface QuotePackageInput {
  name: string
  description?: string | null
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
}
