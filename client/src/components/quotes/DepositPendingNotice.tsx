import React from 'react'
import {
  CONTRACT_SIGNED_NEXT_STEPS,
  CONTRACT_SIGNED_NEXT_STEPS_HEADLINE,
} from '../../constants/clientAgreement'
import QuoteNextStepsNotice from './QuoteNextStepsNotice'

const DepositPendingNotice: React.FC = () => {
  return (
    <QuoteNextStepsNotice
      headline={CONTRACT_SIGNED_NEXT_STEPS_HEADLINE}
      steps={CONTRACT_SIGNED_NEXT_STEPS}
      tone="amber"
    />
  )
}

export default DepositPendingNotice
