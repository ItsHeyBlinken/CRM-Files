export function printQuoteDocument(title: string): void {
  const previousTitle = document.title
  const safeTitle = title.trim() || 'Quote'
  document.title = `${safeTitle} — Quote`

  window.print()

  window.setTimeout(() => {
    document.title = previousTitle
  }, 0)
}
