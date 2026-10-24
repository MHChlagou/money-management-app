import { answerConfirm, useConfirm } from '../lib/confirm'
import { useT } from '../lib/i18n'
import { Button, Modal } from './ui'

/** Renders the pending askConfirm() request. Cancel has focus, so Enter never confirms a destructive action by accident. */
export function ConfirmHost() {
  const request = useConfirm()
  const t = useT()
  return (
    <Modal open={request !== null} title={t('confirm.title')} onClose={() => answerConfirm(false)}>
      {request && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{request.message}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" autoFocus onClick={() => answerConfirm(false)}>{t('common.cancel')}</Button>
            <Button type="button" variant={request.danger ? 'danger' : 'primary'} onClick={() => answerConfirm(true)}>{request.confirmLabel}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
