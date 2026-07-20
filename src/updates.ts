// Data produced by the Claude Slack scan of the 7 monitored channels.
// Refreshed by re-running the scan and republishing the app.

export const SCANNED_AT = '2026-07-20';
export const SCAN_WINDOW_DAYS = 14;

export interface Channel {
  name: string;
  id: string;
}

export const CHANNELS: Channel[] = [
  { name: 'ask-biztech', id: 'C02SL6V7V4M' },
  { name: 'biz-ops', id: 'CPW5WDPFT' },
  { name: 'business-support-internal', id: 'C03PTA56ARZ' },
  { name: 'cpq-business-lounge-tickets', id: 'C08E87N4V5Y' },
  { name: 'nam-ops-support-tech', id: 'C0AFTMG9C00' },
  { name: 'intech-org', id: 'C0AE82TJDT8' },
  { name: 'cro-org', id: 'C04J60ZA279' },
];

export type GroupKey =
  | 'releases'
  | 'incidents'
  | 'maintenance'
  | 'policy'
  | 'reports'
  | 'techUpdates';

export interface Group {
  key: GroupKey;
  emoji: string;
  title: string;
  chipColor: string;
}

export const GROUPS: Group[] = [
  { key: 'releases', emoji: '🚀', title: 'Releases & Launches', chipColor: 'done-green' },
  { key: 'incidents', emoji: '⚠️', title: 'Incidents & Watch Outs', chipColor: 'stuck-red' },
  { key: 'maintenance', emoji: '🔧', title: 'Maintenance & Downtime', chipColor: 'working_orange' },
  { key: 'policy', emoji: '📋', title: 'Policy & Process Changes', chipColor: 'bright-blue' },
  { key: 'reports', emoji: '📊', title: 'Weekly Reports & Digests', chipColor: 'purple' },
  { key: 'techUpdates', emoji: '📢', title: 'Updates for Policy or Tech Changes', chipColor: 'teal' },
];

export interface TeamUpdate {
  id: string;
  group: GroupKey;
  channel: string;
  author: string;
  date: string; // ISO
  title: string;
  summary: string;
}

export const UPDATES: TeamUpdate[] = [
  {
    id: 'crm-suite-launch',
    group: 'releases',
    channel: 'cro-org',
    author: 'Ron Kimhi',
    date: '2026-07-15',
    title: 'monday Agentic CRM Suite launches',
    summary:
      'One platform running the entire revenue cycle with pre-built revenue expert agents: Lead Sourcing, Calling, Meeting Prep, Pipeline Monitor, and Campaign Intelligence. Also ships a new navigation & home page and a new CRM mobile app — all on a real-time intelligent context layer.',
  },
  {
    id: 'quotes-stuck-approval',
    group: 'incidents',
    channel: 'cpq-business-lounge-tickets',
    author: 'Benjamin Goldstein',
    date: '2026-07-14',
    title: 'Quotes stuck "In Approval Process" despite being approved',
    summary:
      'Multiple Sales Orders show status "In Approval Process" even though they are approved, blocking the Close Won flow. Confirmed in at least 3 cases via SOQL — more may pop up. Also logged on the Bug Board as a Medium bug with an admin-only workaround.',
  },
  {
    id: 'ai-credits-proration-error',
    group: 'incidents',
    channel: 'cpq-business-lounge-tickets',
    author: 'Anntricia George',
    date: '2026-07-15',
    title: 'Error adding seats while keeping AI credits — workaround available',
    summary:
      'Adding 10 WM seats while keeping AI credits at 20k throws an error in CPQ. Workaround: add extra AI credits first, save the quote, then reopen Edit Lines and set the AI credits quantity back — the quote then saves cleanly.',
  },
  {
    id: 'success-factors-maintenance',
    group: 'maintenance',
    channel: 'business-support-internal',
    author: 'Robert Pattinson',
    date: '2026-07-14',
    title: 'Success Factors down for maintenance for the week',
    summary:
      'Success Factors is out for the next week for scheduled maintenance — expect it to be unavailable and plan around it.',
  },
  {
    id: 'reopen-renewal-opps',
    group: 'policy',
    channel: 'business-support-internal',
    author: 'Aldema Michaelo',
    date: '2026-07-20',
    title: 'OK to reopen locked Renewal Opps (with conditions)',
    summary:
      'After syncing with Ksenia: feel free to reopen locked Renewal Opps as long as they are the ones tied to the contract and the correct ones to work off. If ARR issues pop up, loop in Daniel and Ksenia to sync with the Renewals Pod.',
  },
  {
    id: 'opt-out-arr-decrease',
    group: 'policy',
    channel: 'business-support-internal',
    author: 'Josh Zak',
    date: '2026-07-19',
    title: 'RevOps/Finance: Opt Out only required when ARR decreases',
    summary:
      'Update from RevOps/Finance: an Opt Out is only required if there is a decrease in ARR.',
  },
  {
    id: 'opt-out-hold-off',
    group: 'policy',
    channel: 'business-support-internal',
    author: 'Josh Zak',
    date: '2026-07-19',
    title: 'Hold off — opt-out change paused, everything stays the same',
    summary:
      'Follow-up to the morning update: RevOps and Finance still need to align, so hold off for now. Opt outs are still needed even if ARR does not change. A call is being set up to finalize the process.',
  },
  {
    id: 'q3-ai-credits-spif',
    group: 'policy',
    channel: 'cro-org',
    author: 'Casey George',
    date: '2026-07-09',
    title: 'Q3 AI Credits SPIF is live',
    summary:
      'Monthly AI Credit subscriptions on the new AI Work Platform earn 5% of AI Credits Added ARR on top of existing incentive plans (July 1 – Sept 30). Required: toggle "Account Should use AI Platform" to TRUE in CPQ or the deal is not included. Track progress on the AI Credits SPIF Dashboard.',
  },
  {
    id: 'bug-board-jul10-17',
    group: 'reports',
    channel: 'business-support-internal',
    author: 'Otis – Lounge Logic Insights',
    date: '2026-07-17',
    title: 'Bug Board Update — Week of July 10–17',
    summary:
      '3 new bugs: quotes stuck in approval despite being approved (Medium, admin-only workaround); signed Dealroom/SO not emailing managers (Low, no workaround); expansion CC claim not claimable under expansion opps (HIGH, incorrect ARR routing, urgent investigation).',
  },
  {
    id: 'bug-board-jul7-13',
    group: 'reports',
    channel: 'business-support-internal',
    author: 'Otis – Lounge Logic Insights',
    date: '2026-07-16',
    title: 'Bug Board Update — Week of July 7–13',
    summary:
      '2 new bugs: overlay ARR recognition for Campaigns miscalculated (possibly APJ-specific; manual fix via Yonatan) and a CPQ error blocking quote save/issue when two primary quotes exist (workaround: de-select one as primary).',
  },
  {
    id: 'weekly-intel-jul7-13',
    group: 'reports',
    channel: 'business-support-internal',
    author: 'Otis – Lounge Logic Insights',
    date: '2026-07-13',
    title: 'Business Lounge Weekly Intelligence Report — July 7–13',
    summary:
      '349 tickets analyzed, health score 7.5/10. Top topics: Change Account Owner (37), SO creation/modification – SFDC CPQ (37), ARR Recognition/Claim (28). 26 Critical tickets in queue.',
  },
  {
    id: 'winners-circle-june',
    group: 'reports',
    channel: 'cro-org',
    author: 'George C.',
    date: '2026-07-13',
    title: "June 2026 Winner's Circle standings",
    summary:
      "The Winner's Circle leaderboard refreshed: top 10 managers and top 40 ICs announced for the Vietnam May 2027 trip. 172 days left — live rankings on the Winner's Circle dashboard and office TV screens.",
  },
  {
    id: 'madfest-wrap',
    group: 'reports',
    channel: 'cro-org',
    author: 'Beth Young',
    date: '2026-07-10',
    title: 'MAD//Fest London wrap-up',
    summary:
      '272 booth leads (37 rated 4–5 quality) plus 1k+ leads from the monday bar. Press interviews reaching an estimated 477k+ audience. Next: leads being worked and a Monday for Marketers AI webinar on July 22.',
  },
  {
    id: 'ana-conference-recap',
    group: 'reports',
    channel: 'cro-org',
    author: 'Emani Brown',
    date: '2026-07-10',
    title: 'ANA In-House Agency Conference recap',
    summary:
      '200+ attendees, 50+ MQLs, connections with Chick-fil-A, Fidelity, Nielsen, LEGO, Allstate and more — plus a meeting booked with Ford. Daniel Brooks joined a mainstage session on running marketing at scale.',
  },
  {
    id: 'tof-context-repo',
    group: 'techUpdates',
    channel: 'business-support-internal',
    author: 'Aldema Michaelo',
    date: '2026-07-15',
    title: 'TOF context repo available for Cursor',
    summary:
      'The TOFNB-context repo is live — connect it to Cursor to ask TOF questions. It powers their AI channel and is always kept up to date.',
  },
  {
    id: 'ai-levels-academy',
    group: 'techUpdates',
    channel: 'business-support-internal',
    author: 'Josh Zak',
    date: '2026-07-15',
    title: 'AI levels academy on BigBrain AI Hub',
    summary:
      'The AI levels program is live on the AI Hub academy tab — check it out and see what level you are on.',
  },
  {
    id: 'codex-credits',
    group: 'techUpdates',
    channel: 'intech-org',
    author: 'Amit Malichi',
    date: '2026-07-15',
    title: 'Free Codex credits for personal-subscription builders',
    summary:
      'For anyone building non-work projects with Codex on a personal subscription: posting about gpt5.6 on X and submitting it to the promo minisite grants $100 in personal Codex credits.',
  },
];
