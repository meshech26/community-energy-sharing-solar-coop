import { Text } from 'react-native';
import StatusBadge from '../StatusBadge';
import { getProposalStatusLabel, proposalTones } from '../../utils/community';

// Shared content; wrappers retain their distinct member/admin layouts and actions.
export function ProposalBadge({ proposal, neutralDraft = false }) {
  return <StatusBadge label={proposal.archivedAt ? 'Archived' : getProposalStatusLabel(proposal.status)} tone={proposal.archivedAt ? 'archived' : (neutralDraft && proposal.status === 'draft') ? 'neutral' : proposalTones[proposal.status]} />;
}

export function ProposalTitleSummary({ proposal, titleStyle, summaryStyle }) {
  return <><Text numberOfLines={2} style={titleStyle}>{proposal.title}</Text><Text numberOfLines={2} style={summaryStyle}>{proposal.summary}</Text></>;
}

export function ProposalProposer({ proposal, style, numberOfLines }) {
  return <Text style={style} numberOfLines={numberOfLines}>By {proposal.proposer?.name || 'Co-op Administrator'}</Text>;
}
