import ConfirmationDialog from '../ConfirmationDialog';
import { proposalActionCopy } from '../../utils/proposalManagement';

export default function ProposalActionConfirmation({ action, isConfirming, onCancel, onConfirm }) {
  const copy = proposalActionCopy[action];
  if (!copy) return null;
  return <ConfirmationDialog visible title={copy.title} cancelLabel={copy.cancelLabel} confirmLabel={copy.confirmLabel} destructive={copy.destructive} isConfirming={isConfirming} onCancel={onCancel} onConfirm={onConfirm}>{copy.message}</ConfirmationDialog>;
}
