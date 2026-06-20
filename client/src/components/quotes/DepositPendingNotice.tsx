import React from 'react'
import { DEPOSIT_PENDING_NOTICE } from '../../constants/clientAgreement'

const DepositPendingNotice: React.FC = () => {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-medium text-amber-900">Contract signed — deposit still required</p>
      <p className="mt-2 text-amber-900">{DEPOSIT_PENDING_NOTICE}</p>
    </div>
  )
}

export default DepositPendingNotice
