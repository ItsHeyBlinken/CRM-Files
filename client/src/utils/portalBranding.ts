/** CSS linear gradient from vendor primary → secondary (client portal). */
export function vendorBrandGradient(primary: string, secondary: string): string {
  return `linear-gradient(to right, ${primary}, ${secondary})`
}

export function vendorBrandGradientStyle(
  primary: string,
  secondary: string
): { background: string } {
  return { background: vendorBrandGradient(primary, secondary) }
}
