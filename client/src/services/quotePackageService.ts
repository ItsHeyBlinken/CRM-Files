import api from './api'
import type { QuotePackage, QuotePackageInput } from '../types/quotePackage'

export async function fetchQuotePackages(): Promise<QuotePackage[]> {
  const { data } = await api.get<{ packages: QuotePackage[] }>('/vendor/quote-packages')
  return data.packages
}

export async function createQuotePackage(input: QuotePackageInput): Promise<QuotePackage> {
  const { data } = await api.post<{ package: QuotePackage }>('/vendor/quote-packages', input)
  return data.package
}

export async function updateQuotePackage(
  id: number,
  input: Partial<QuotePackageInput>
): Promise<QuotePackage> {
  const { data } = await api.put<{ package: QuotePackage }>(
    `/vendor/quote-packages/${id}`,
    input
  )
  return data.package
}

export async function deleteQuotePackage(id: number): Promise<void> {
  await api.delete(`/vendor/quote-packages/${id}`)
}
