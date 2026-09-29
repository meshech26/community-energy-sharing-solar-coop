import SearchField from '../SearchField';

export default function ProposalSearchField({ onChangeText, value }) {
  return <SearchField label="Search proposals" clearLabel="Clear proposal search" value={value} onChangeText={onChangeText} style={{ marginBottom: 16 }} />;
}
