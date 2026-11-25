// Shared constants: statuses, sources, badge colors, sort options.
export const STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
export const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Event', 'Other'];
export const BADGE = {
  New: 'bg-blue-100 text-blue-700', Contacted: 'bg-amber-100 text-amber-700',
  Interested: 'bg-purple-100 text-purple-700', Converted: 'bg-green-100 text-green-700', Lost: 'bg-red-100 text-red-700',
};
export const SORTS = [
  { label: 'Newest', sort_by: 'created_at', order: 'desc' }, { label: 'Oldest', sort_by: 'created_at', order: 'asc' },
  { label: 'Name A–Z', sort_by: 'full_name', order: 'asc' }, { label: 'Name Z–A', sort_by: 'full_name', order: 'desc' },
];
