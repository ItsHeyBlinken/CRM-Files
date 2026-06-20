import { Router, Request, Response } from 'express'
import { Quote } from '../models/Quote'
import { QuoteContract } from '../models/QuoteContract'
import { logger } from '../utils/logger'

const router = Router()

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? null
  }
  return req.socket.remoteAddress ?? null
}

// GET /api/quotes/:token — public quote view
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const quote = await Quote.findByToken(token)

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' })
      return
    }

    res.json({ quote })
  } catch (error) {
    logger.error('Public quote lookup error:', error)
    res.status(500).json({ error: 'Failed to load quote' })
  }
})

// POST /api/quotes/:token/accept
router.post('/:token/accept', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const quote = await Quote.respondToQuote(token, 'accepted')

    if (!quote) {
      res.status(410).json({ error: 'This quote is no longer available to accept' })
      return
    }

    res.json({ quote })
  } catch (error) {
    logger.error('Accept quote error:', error)
    res.status(500).json({ error: 'Failed to accept quote' })
  }
})

// POST /api/quotes/:token/decline
router.post('/:token/decline', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const quote = await Quote.respondToQuote(token, 'declined')

    if (!quote) {
      res.status(410).json({ error: 'This quote is no longer available to decline' })
      return
    }

    res.json({ quote })
  } catch (error) {
    logger.error('Decline quote error:', error)
    res.status(500).json({ error: 'Failed to decline quote' })
  }
})

// GET /api/quotes/:token/contract/signing-context
router.get('/:token/contract/signing-context', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const context = await QuoteContract.getSigningContext(token)
    if (!context) {
      res.status(404).json({ error: 'Contract not found for this quote' })
      return
    }

    res.json({ context })
  } catch (error) {
    logger.error('Quote contract signing context error:', error)
    res.status(500).json({ error: 'Failed to load contract signing context' })
  }
})

// POST /api/quotes/:token/contract/acknowledge
router.post('/:token/contract/acknowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const {
      legalName,
      pdfHash,
      viewDurationSeconds,
      scrolledToEnd,
      consentAccepted,
    } = req.body

    const contract = await QuoteContract.acknowledge(
      token,
      clientIp(req),
      req.headers['user-agent'] ?? null,
      {
        legalName: String(legalName ?? ''),
        pdfHash: String(pdfHash ?? ''),
        viewDurationSeconds: Number(viewDurationSeconds ?? 0),
        scrolledToEnd: !!scrolledToEnd,
        consentAccepted: !!consentAccepted,
      }
    )

    if (!contract) {
      res.status(404).json({ error: 'Contract not found for this quote' })
      return
    }

    const quote = await Quote.findByToken(token)
    res.json({ contract, quote })
  } catch (error) {
    logger.error('Quote contract acknowledge error:', error)

    if (error instanceof Error) {
      switch (error.message) {
        case 'QUOTE_NOT_ACCEPTED':
          res.status(400).json({ error: 'Accept the quote before signing the contract' })
          return
        case 'LEGAL_NAME_REQUIRED':
          res.status(400).json({ error: 'Full legal name is required' })
          return
        case 'CONSENT_REQUIRED':
          res.status(400).json({ error: 'You must accept the electronic signature consent' })
          return
        case 'PDF_HASH_MISMATCH':
          res.status(409).json({ error: 'Contract changed — refresh the page and review again' })
          return
        case 'REVIEW_INCOMPLETE':
          res.status(400).json({ error: 'Please finish reviewing the contract before signing' })
          return
      }
    }

    res.status(500).json({ error: 'Failed to sign contract' })
  }
})

// GET /api/quotes/:token/contract — public contract PDF for quote link recipients
router.get('/:token/contract', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    if (!token) {
      res.status(400).json({ error: 'Quote token is required' })
      return
    }

    const contract = await QuoteContract.findByQuoteToken(token)

    if (!contract) {
      res.status(404).json({ error: 'No contract attached to this quote' })
      return
    }

    const absolutePath = QuoteContract.getAbsolutePath(contract.filePath)
    res.setHeader('Content-Type', contract.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${contract.fileName}"`)
    res.sendFile(absolutePath, (err) => {
      if (err) {
        logger.error('Public quote contract file send error:', err)
        if (!res.headersSent) {
          res.status(404).json({ error: 'Contract file not found on server' })
        }
      }
    })
  } catch (error) {
    logger.error('Public quote contract file error:', error)
    res.status(500).json({ error: 'Failed to load contract' })
  }
})

export default router
