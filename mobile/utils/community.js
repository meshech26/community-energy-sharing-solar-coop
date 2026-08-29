export const proposalTones = {
  active: 'green',
  upcoming: 'blue',
  closed: 'neutral',
  cancelled: 'danger',
  draft: 'warning',
};

export const proposalStatusLabels = {
  active: 'Active',
  upcoming: 'Upcoming',
  closed: 'Closed',
  cancelled: 'Cancelled',
  draft: 'Draft',
};

export const proposalAccents = {
  active: '#16764C',
  upcoming: '#3E78A8',
  closed: '#66746C',
  cancelled: '#B14B56',
  draft: '#A96A09',
};

export const getProposalStatusLabel = (status) => proposalStatusLabels[status] || 'Proposal';

export const filterProposalsBySearch = (proposals, query) => {
  const normalizedQuery = String(query || '').trim().toLocaleLowerCase();
  if (!normalizedQuery) return proposals;

  return proposals.filter((proposal) => [proposal.title, proposal.summary, proposal.description]
    .some((value) => String(value || '').toLocaleLowerCase().includes(normalizedQuery)));
};

export const formatProposalDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric' }).replace(',', ' ·');
};

export const formatEstimatedCost = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Cost unavailable';
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export const getProposalTimingText = (proposal, now = new Date()) => {
  if (proposal.status === 'active') {
    const remainingMilliseconds = new Date(proposal.votingDeadline) - now;
    if (!Number.isFinite(remainingMilliseconds)) return 'Voting deadline unavailable';
    if (remainingMilliseconds <= 0) return 'Voting is closing now';

    const remainingMinutes = Math.ceil(remainingMilliseconds / 60000);
    const days = Math.floor(remainingMinutes / 1440);
    const hours = Math.floor((remainingMinutes % 1440) / 60);
    const minutes = remainingMinutes % 60;
    const parts = [];

    if (days) {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
      if (hours) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    } else if (hours) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
      if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    } else {
      const displayMinutes = Math.max(minutes, 1);
      parts.push(`${displayMinutes} ${displayMinutes === 1 ? 'minute' : 'minutes'}`);
    }

    return `Time remaining: ${parts.join(' ')}`;
  }
  if (proposal.status === 'upcoming') return `Voting opens ${formatProposalDate(proposal.votingStartDate)}`;
  if (proposal.status === 'closed') return 'Voting closed';
  if (proposal.status === 'cancelled') return 'Proposal cancelled';
  return 'Draft proposal';
};

export const getCommunityError = (error, fallback) => {
  const status = error?.response?.status;
  if (!status) return 'We could not reach Solar Share. Please check your connection and try again.';
  if (status === 401) return 'Your session has ended. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  return error.response?.data?.message || fallback;
};

export const toDateTimeLocal = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
