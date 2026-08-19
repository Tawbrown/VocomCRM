export const INTEREST_FILTERS = [
  'All',
  'Interested',
  'Out of Office',
  'Meeting Booked',
  'Not Interested',
  'Wrong Person',
  'No Reply Yet'
];

// Campaign-level: is the campaign itself still sending, paused, or finished.
export const CAMPAIGN_STATUS_FILTERS = ['All', 'Active', 'Paused', 'Completed', 'Running Subsequences'];

// Lead-level: where this specific lead is in that campaign's send sequence.
export const SEQUENCE_STATUS_FILTERS = [
  'All',
  'Active',
  'Paused',
  'Completed',
  'Bounced',
  'Unsubscribed',
  'Skipped'
];
