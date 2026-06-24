import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  createAndSendProjectInvoice,
  deleteProjectInvoice,
  markProjectInvoicePaid,
  sendProjectInvoice,
} from '../../services/invoiceService'
import { updateProjectPaymentSettings } from '../../services/projectService'
import type { Invoice, VendorProjectDetail } from '../../types/portal'
import { formatUsDate } from '../../utils/calendarHelpers'
import {
  buildInvoicePresetInput,
  DEFAULT_DEPOSIT_PERCENT,
  getDepositAmount,
} from '../../utils/invoicePresets'
import {
  formatCurrency,
  getInvoiceDisplayLabel,
  getInvoiceStatusLabel,
} from '../../utils/portalHelpers'

function getApiError(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
  return message || fallback
}

type ProjectInvoiceSectionProps = {
  projectId: number
  detail: VendorProjectDetail
  hasPaymentMethod: boolean
  onUpdated: () => Promise<void>
}

const ProjectInvoiceSection: React.FC<ProjectInvoiceSectionProps> = ({
  projectId,
  detail,
  hasPaymentMethod,
  onUpdated,
}) => {
  const { project, paymentSettings, paymentSummary, invoices } = detail

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [projectTotal, setProjectTotal] = useState('')
  const [depositPercent, setDepositPercent] = useState(String(DEFAULT_DEPOSIT_PERCENT))
  const [customAmount, setCustomAmount] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [advancedForm, setAdvancedForm] = useState({
    paymentPlanType: paymentSettings.paymentPlanType,
    depositType: paymentSettings.depositType ?? ('percentage' as const),
    depositValue: '',
    secondPaymentDueDaysBeforeEvent: '',
    finalPaymentDueDaysBeforeEvent: '',
  })

  useEffect(() => {
    setProjectTotal(
      paymentSettings.projectTotal != null ? String(paymentSettings.projectTotal) : ''
    )
    setDepositPercent(
      paymentSettings.depositValue != null
        ? String(paymentSettings.depositValue)
        : String(DEFAULT_DEPOSIT_PERCENT)
    )
    setAdvancedForm({
      paymentPlanType: paymentSettings.paymentPlanType,
      depositType: paymentSettings.depositType ?? 'percentage',
      depositValue:
        paymentSettings.depositValue != null ? String(paymentSettings.depositValue) : '',
      secondPaymentDueDaysBeforeEvent:
        paymentSettings.secondPaymentDueDaysBeforeEvent != null
          ? String(paymentSettings.secondPaymentDueDaysBeforeEvent)
          : '',
      finalPaymentDueDaysBeforeEvent:
        paymentSettings.finalPaymentDueDaysBeforeEvent != null
          ? String(paymentSettings.finalPaymentDueDaysBeforeEvent)
          : '',
    })
  }, [paymentSettings])

  const workingDetail = useMemo((): VendorProjectDetail => {
    const total = projectTotal.trim() ? Number(projectTotal) : null
    const depositValue = depositPercent.trim() ? Number(depositPercent) : DEFAULT_DEPOSIT_PERCENT

    return {
      ...detail,
      paymentSettings: {
        ...paymentSettings,
        projectTotal: total != null && !Number.isNaN(total) ? total : null,
        paymentPlanType: 'deposit_and_balance',
        depositType: 'percentage',
        depositValue: Number.isNaN(depositValue) ? DEFAULT_DEPOSIT_PERCENT : depositValue,
      },
    }
  }, [detail, depositPercent, paymentSettings, projectTotal])

  const depositPreview = getDepositAmount(workingDetail.paymentSettings)
  const parsedTotal = projectTotal.trim() ? Number(projectTotal) : null
  const totalValid = parsedTotal != null && !Number.isNaN(parsedTotal) && parsedTotal > 0

  const depositPreset = totalValid ? buildInvoicePresetInput('deposit', workingDetail) : null
  const balancePreset = totalValid ? buildInvoicePresetInput('final', workingDetail) : null

  const canSendDeposit =
    hasPaymentMethod &&
    totalValid &&
    depositPreset != null &&
    paymentSummary.depositStatus === 'not_sent'

  const canSendBalance =
    hasPaymentMethod &&
    totalValid &&
    balancePreset != null &&
    paymentSummary.depositStatus === 'paid' &&
    paymentSummary.amountOutstanding > 0

  const canSendPayInFull =
    hasPaymentMethod &&
    totalValid &&
    balancePreset != null &&
    advancedForm.paymentPlanType === 'pay_in_full' &&
    !invoices.some((invoice) => invoice.status !== 'cancelled')

  const persistSimpleSetup = async () => {
    if (!totalValid) {
      throw new Error('Enter a valid project total before sending an invoice.')
    }

    const depositValue = Number(depositPercent)
    if (Number.isNaN(depositValue) || depositValue < 0) {
      throw new Error('Enter a valid deposit percentage.')
    }

    await updateProjectPaymentSettings(projectId, {
      projectTotal: parsedTotal,
      paymentPlanType: advancedForm.paymentPlanType,
      depositType:
        advancedForm.paymentPlanType === 'pay_in_full' ? null : advancedForm.depositType,
      depositValue: advancedForm.paymentPlanType === 'pay_in_full' ? null : depositValue,
      secondPaymentDueDaysBeforeEvent: advancedForm.secondPaymentDueDaysBeforeEvent
        ? Number(advancedForm.secondPaymentDueDaysBeforeEvent)
        : null,
      finalPaymentDueDaysBeforeEvent: advancedForm.finalPaymentDueDaysBeforeEvent
        ? Number(advancedForm.finalPaymentDueDaysBeforeEvent)
        : null,
    })
  }

  const handleQuickSend = async (kind: Invoice['invoiceKind']) => {
    if (!hasPaymentMethod) {
      setError(
        'Set up how clients pay you before sending an invoice. Go to Payments in your dashboard.'
      )
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await persistSimpleSetup()

      const preset = buildInvoicePresetInput(kind, {
        ...workingDetail,
        paymentSettings: {
          ...workingDetail.paymentSettings,
          projectTotal: parsedTotal,
        },
      })

      if (!preset || preset.amount <= 0) {
        setError('Could not calculate an invoice amount. Check your project total and deposit.')
        return
      }

      await createAndSendProjectInvoice(projectId, {
        title: preset.title,
        description: preset.description || undefined,
        amount: preset.amount,
        dueDate: preset.dueDate || undefined,
        invoiceKind: preset.invoiceKind,
        isDateHoldingDeposit: preset.isDateHoldingDeposit,
      })

      toast.success(
        kind === 'deposit' ? 'Deposit invoice sent to your client' : 'Invoice sent to your client'
      )
      setShowCustom(false)
      setCustomAmount('')
      setCustomTitle('')
      await onUpdated()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to send invoice'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCustomSend = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number(customAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount')
      return
    }

    if (!hasPaymentMethod) {
      setError(
        'Set up how clients pay you before sending an invoice. Go to Payments in your dashboard.'
      )
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (totalValid) {
        await persistSimpleSetup()
      }

      await createAndSendProjectInvoice(projectId, {
        title: customTitle.trim() || `${project.title} invoice`,
        amount,
        invoiceKind: 'custom',
        isDateHoldingDeposit: false,
      })

      toast.success('Invoice sent to your client')
      setShowCustom(false)
      setCustomAmount('')
      setCustomTitle('')
      await onUpdated()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to send invoice'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendDraft = async (invoiceId: number) => {
    if (!hasPaymentMethod) {
      setError(
        'Set up how clients pay you before sending an invoice. Go to Payments in your dashboard.'
      )
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await sendProjectInvoice(projectId, invoiceId)
      toast.success('Invoice sent to your client')
      await onUpdated()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to send invoice'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkPaid = async (invoiceId: number) => {
    setSubmitting(true)
    setError('')
    try {
      await markProjectInvoicePaid(projectId, invoiceId)
      await onUpdated()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to mark invoice paid'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (invoiceId: number) => {
    if (!window.confirm('Delete this invoice?')) return

    setSubmitting(true)
    setError('')
    try {
      await deleteProjectInvoice(projectId, invoiceId)
      await onUpdated()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to delete invoice'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveAdvanced = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await updateProjectPaymentSettings(projectId, {
        projectTotal: projectTotal.trim() ? Number(projectTotal) : null,
        paymentPlanType: advancedForm.paymentPlanType,
        depositType:
          advancedForm.paymentPlanType === 'pay_in_full' ? null : advancedForm.depositType,
        depositValue:
          advancedForm.paymentPlanType === 'pay_in_full' || !advancedForm.depositValue
            ? null
            : Number(advancedForm.depositValue),
        secondPaymentDueDaysBeforeEvent: advancedForm.secondPaymentDueDaysBeforeEvent
          ? Number(advancedForm.secondPaymentDueDaysBeforeEvent)
          : null,
        finalPaymentDueDaysBeforeEvent: advancedForm.finalPaymentDueDaysBeforeEvent
          ? Number(advancedForm.finalPaymentDueDaysBeforeEvent)
          : null,
      })
      toast.success('Payment plan saved')
      await onUpdated()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to save payment plan'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="font-medium text-gray-900">Invoices</h2>
      <p className="mt-1 text-sm text-gray-600">
        Set your project total, then send an invoice in one click. Your client gets an email and
        sees it in their portal.
      </p>

      {!hasPaymentMethod && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Before you can send invoices,{' '}
          <Link to="/dashboard/payments" className="font-medium text-amber-900 underline">
            set up how clients pay you
          </Link>
          .
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-5 space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">1. Project total & deposit</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-gray-700">Project total (USD)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={projectTotal}
                onChange={(e) => setProjectTotal(e.target.value)}
                placeholder="e.g. 2500"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Deposit (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={depositPercent}
                onChange={(e) => setDepositPercent(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              />
            </label>
          </div>
          {totalValid && depositPreview != null && (
            <p className="mt-2 text-xs text-gray-600">
              Deposit: <strong>{formatCurrency(depositPreview)}</strong>
              {' · '}
              Remaining after deposit:{' '}
              <strong>{formatCurrency(Math.max(0, parsedTotal! - depositPreview))}</strong>
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">2. Send to client</p>
          <div className="mt-3 flex flex-col sm:flex-row flex-wrap gap-3">
            {canSendDeposit && depositPreset && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuickSend('deposit')}
                className="vendor-btn-primary"
              >
                Send deposit invoice ({formatCurrency(depositPreset.amount)})
              </button>
            )}
            {paymentSummary.depositStatus === 'unpaid' && (
              <p className="text-sm text-amber-800 self-center">
                Deposit invoice already sent — waiting on client payment.
              </p>
            )}
            {canSendPayInFull && balancePreset && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuickSend('final')}
                className="vendor-btn-primary"
              >
                Send invoice ({formatCurrency(balancePreset.amount)})
              </button>
            )}
            {canSendBalance && balancePreset && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleQuickSend('final')}
                className="vendor-btn-primary"
              >
                Send balance invoice ({formatCurrency(balancePreset.amount)})
              </button>
            )}
            {!totalValid && (
              <p className="text-sm text-gray-600 self-center">
                Enter a project total above to enable quick send.
              </p>
            )}
            <button
              type="button"
              disabled={submitting || !hasPaymentMethod}
              onClick={() => setShowCustom((current) => !current)}
              className="vendor-btn-outline"
            >
              {showCustom ? 'Hide custom amount' : 'Other amount…'}
            </button>
          </div>

          {showCustom && (
            <form onSubmit={handleCustomSend} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="block text-sm">
                <span className="text-gray-700">Amount (USD)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Title (optional)</span>
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Additional services"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="vendor-btn-primary w-full sm:w-auto"
                >
                  {submitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 pt-1">
          <div className="rounded-md bg-white border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500">Deposit status</p>
            <p className="mt-1 text-sm text-gray-900 capitalize">
              {paymentSummary.depositStatus.replace('_', ' ')}
            </p>
          </div>
          <div className="rounded-md bg-white border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500">Paid</p>
            <p className="mt-1 text-sm text-gray-900">
              {formatCurrency(paymentSummary.amountPaid)}
            </p>
          </div>
          <div className="rounded-md bg-white border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500">Remaining</p>
            <p className="mt-1 text-sm text-gray-900">
              {formatCurrency(paymentSummary.amountOutstanding)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="text-sm font-medium vendor-link"
        >
          {showAdvanced ? 'Hide advanced payment plan' : 'Advanced payment plan'}
        </button>

        {showAdvanced && (
          <form
            onSubmit={handleSaveAdvanced}
            className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4"
          >
            <p className="text-xs text-gray-600">
              Optional: split payments, fixed deposit amounts, or due-date offsets before the
              event.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm">
                <span className="text-gray-700">Payment structure</span>
                <select
                  value={advancedForm.paymentPlanType}
                  onChange={(e) =>
                    setAdvancedForm((current) => ({
                      ...current,
                      paymentPlanType: e.target.value as typeof current.paymentPlanType,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="pay_in_full">Pay in full</option>
                  <option value="deposit_and_balance">Deposit + final balance</option>
                  <option value="split_payments">Split payments</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Deposit type</span>
                <select
                  value={advancedForm.depositType}
                  onChange={(e) =>
                    setAdvancedForm((current) => ({
                      ...current,
                      depositType: e.target.value as 'fixed' | 'percentage',
                    }))
                  }
                  disabled={advancedForm.paymentPlanType === 'pay_in_full'}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">
                  Deposit value
                  {advancedForm.depositType === 'percentage' ? ' (%)' : ' (USD)'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={advancedForm.depositValue}
                  onChange={(e) =>
                    setAdvancedForm((current) => ({ ...current, depositValue: e.target.value }))
                  }
                  disabled={advancedForm.paymentPlanType === 'pay_in_full'}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">2nd payment days before event</span>
                <input
                  type="number"
                  min="0"
                  value={advancedForm.secondPaymentDueDaysBeforeEvent}
                  onChange={(e) =>
                    setAdvancedForm((current) => ({
                      ...current,
                      secondPaymentDueDaysBeforeEvent: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Final payment days before event</span>
                <input
                  type="number"
                  min="0"
                  value={advancedForm.finalPaymentDueDaysBeforeEvent}
                  onChange={(e) =>
                    setAdvancedForm((current) => ({
                      ...current,
                      finalPaymentDueDaysBeforeEvent: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-gray-800 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save payment plan'}
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {invoices.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Invoice history</h3>
          <ul className="space-y-3">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-sm border border-gray-100 rounded-md p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{invoice.title}</p>
                  <p className="text-xs text-blue-700 mt-1">{getInvoiceDisplayLabel(invoice)}</p>
                  {invoice.invoiceNumber && (
                    <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                  )}
                  <p className="text-gray-600 mt-1">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                  {invoice.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Due {formatUsDate(invoice.dueDate)}
                    </p>
                  )}
                  {invoice.clientPaymentClaimedAt && invoice.status !== 'paid' && (
                    <p className="text-xs text-amber-700 mt-1">
                      Client reported payment sent — confirm and mark paid
                    </p>
                  )}
                  {invoice.status === 'paid' && invoice.paidAt && (
                    <p className="text-xs text-green-700 mt-1">
                      Paid {formatUsDate(invoice.paidAt)}
                      {invoice.paymentMethod ? ` via ${invoice.paymentMethod}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-gray-500">
                    {getInvoiceStatusLabel(invoice.status)}
                  </span>
                  {invoice.status === 'draft' && (
                    <>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSendDraft(invoice.id)}
                        className="vendor-btn-primary px-2 py-1 text-xs"
                      >
                        Send to client
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleDelete(invoice.id)}
                        className="px-2 py-1 text-xs text-red-700 bg-red-50 rounded disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleMarkPaid(invoice.id)}
                      className="px-2 py-1 text-xs text-green-800 bg-green-50 rounded disabled:opacity-50"
                    >
                      Mark paid
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export default ProjectInvoiceSection
