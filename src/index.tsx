// Always import the default React alongside any named hooks. Trident's MFE
// federation initializes the shared `react` module via the default-import
// code path; pure named-only imports resolve to null at runtime.
import React, { useMemo, useState } from 'react';
import {
  Heading,
  Text,
  Chips,
  Search,
  Dropdown,
  Avatar,
  Link,
  Button,
} from '@vibe/core';
import styles from './BusinessSupportHub.module.scss';
import {
  CHANNELS,
  GROUPS,
  UPDATES,
  ALL_TAGS,
  SCANNED_AT,
  SCAN_WINDOW_DAYS,
  GroupKey,
  Priority,
  TeamUpdate,
} from './updates';

const GROUP_COLORS: Record<GroupKey, string> = {
  releases: 'var(--color-done-green)',
  incidents: 'var(--color-stuck-red)',
  maintenance: 'var(--color-working_orange)',
  policy: 'var(--color-bright-blue)',
  techUpdates: 'var(--color-chili-blue)',
};

const GROUP_ART: Record<GroupKey, string> = {
  releases: 'linear-gradient(135deg, #e3f7ec, #d2f3e0)',
  incidents: 'linear-gradient(135deg, #ffefe9, #ffe4dc)',
  maintenance: 'linear-gradient(135deg, #fff4dc, #ffedc7)',
  policy: 'linear-gradient(135deg, #e4f1fb, #d7eaf9)',
  techUpdates: 'linear-gradient(135deg, #e0f4f6, #d4f0f3)',
};

const SEVERITY_BAR: Record<Priority, string> = {
  high: '#ff6b57',
  medium: '#e8a300',
  low: '#00c875',
};

// Severity labels follow the comm-hub convention: Critical / Important / FYI.
const SEVERITY: Record<Priority, { label: string; chip: string }> = {
  high: { label: 'Critical', chip: 'stuck-red' },
  medium: { label: 'Important', chip: 'working_orange' },
  low: { label: 'FYI', chip: 'explosive' },
};

type RangeKey = 'all' | 'day' | 'week' | 'month';
type View = 'home' | 'search' | GroupKey;

const RANGE_DAYS: Record<RangeKey, number | null> = { all: null, day: 1, week: 7, month: 31 };

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysAgo(iso: string): number {
  const ms = new Date(SCANNED_AT + 'T00:00:00').getTime() - new Date(iso + 'T00:00:00').getTime();
  return Math.round(ms / 86400000);
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface ChannelOption extends Record<string, unknown> {
  label: string;
  value: string;
}

function UpdateCard({
  update,
  onTagClick,
}: {
  update: TeamUpdate;
  onTagClick: (tag: string) => void;
}) {
  const channel = CHANNELS.find(c => c.name === update.channel);
  const group = GROUPS.find(g => g.key === update.group);
  const severity = SEVERITY[update.priority];
  return (
    <article className={styles.card}>
      <div
        className={styles.cardTopBar}
        style={{ backgroundColor: SEVERITY_BAR[update.priority] }}
      />
      <div className={styles.cardArt} style={{ background: GROUP_ART[update.group] }} aria-hidden="true">
        {group?.emoji}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardBadges}>
          <Chips label={severity.label} readOnly size="small" color={severity.chip as never} noMargin />
          {group && <Chips label={group.title} readOnly size="small" color="explosive" noMargin />}
        </div>
        <Text type="text1" weight="bold">{update.title}</Text>
        <div className={styles.cardMeta}>
          <Avatar type="text" text={initials(update.author)} size="small" aria-label={update.author} />
          <Text type="text3" color="secondary">{update.author}</Text>
          <Text type="text3" color="secondary">· {formatDate(update.date)}</Text>
        </div>
        <Text type="text2" color="secondary" maxLines={3} withoutTooltip>
          {update.summary}
        </Text>
        <div className={styles.cardTags}>
          {update.tags.map(tag => (
            <Chips
              key={tag}
              label={tag}
              readOnly
              size="small"
              color="river"
              noMargin
              onClick={() => onTagClick(tag)}
              aria-label={`Filter by topic ${tag}`}
              className={styles.clickableChip}
            />
          ))}
        </div>
      </div>
      <div className={styles.cardFooter}>
        <Text type="text3" color="secondary">#{update.channel}</Text>
        {channel && (
          <Link
            text="View ›"
            href={`https://monday.slack.com/archives/${channel.id}`}
          />
        )}
      </div>
    </article>
  );
}

export default function BusinessSupportHub() {
  const [view, setView] = useState<View>('home');
  const [query, setQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelOption[]>([]);
  const [severityFilter, setSeverityFilter] = useState<Priority | null>(null);
  const [range, setRange] = useState<RangeKey>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [newestFirst, setNewestFirst] = useState(true);
  const [criticalIndex, setCriticalIndex] = useState(0);

  const channelOptions: ChannelOption[] = useMemo(
    () => CHANNELS.map(c => ({ label: `#${c.name}`, value: c.name })),
    []
  );

  const toggleTag = (tag: string) => {
    setActiveTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const channels = channelFilter.map(o => o.value);
    const maxDays = RANGE_DAYS[range];
    return UPDATES.filter(u => {
      if (view !== 'home' && view !== 'search' && u.group !== view) return false;
      if (maxDays !== null && daysAgo(u.date) >= maxDays) return false;
      if (channels.length > 0 && !channels.includes(u.channel)) return false;
      if (severityFilter && u.priority !== severityFilter) return false;
      if (activeTags.length > 0 && !activeTags.every(t => u.tags.includes(t))) return false;
      if (!q) return true;
      return (
        u.title.toLowerCase().includes(q) ||
        u.summary.toLowerCase().includes(q) ||
        u.author.toLowerCase().includes(q) ||
        u.channel.toLowerCase().includes(q) ||
        u.tags.some(t => t.toLowerCase().includes(q))
      );
    }).sort((a, b) =>
      newestFirst ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    );
  }, [view, query, channelFilter, severityFilter, range, activeTags, newestFirst]);

  const counts = useMemo(
    () => ({
      total: filtered.length,
      critical: filtered.filter(u => u.priority === 'high').length,
      important: filtered.filter(u => u.priority === 'medium').length,
      fyi: filtered.filter(u => u.priority === 'low').length,
    }),
    [filtered]
  );

  const criticalUpdates = useMemo(() => UPDATES.filter(u => u.priority === 'high'), []);
  const safeCriticalIndex = Math.min(criticalIndex, Math.max(0, criticalUpdates.length - 1));
  const criticalItem = criticalUpdates[safeCriticalIndex];
  const criticalChannel = criticalItem
    ? CHANNELS.find(c => c.name === criticalItem.channel)
    : undefined;
  const criticalGroup = criticalItem ? GROUPS.find(g => g.key === criticalItem.group) : undefined;

  const hasFilters =
    Boolean(query) ||
    channelFilter.length > 0 ||
    Boolean(severityFilter) ||
    range !== 'all' ||
    activeTags.length > 0;

  const clearFilters = () => {
    setQuery('');
    setChannelFilter([]);
    setSeverityFilter(null);
    setRange('all');
    setActiveTags([]);
  };

  const RANGE_LABELS: Record<RangeKey, string> = {
    all: 'All Updates',
    month: 'This Month',
    week: 'This Week',
    day: 'Today',
  };

  const SEVERITY_PILLS: { key: Priority | null; label: string }[] = [
    { key: null, label: 'All' },
    { key: 'high', label: 'Critical' },
    { key: 'medium', label: 'Important' },
    { key: 'low', label: 'FYI' },
  ];

  const statCards = [
    { key: null, label: 'TOTAL UPDATES', icon: '✨', count: counts.total, card: styles.statTotal, num: styles.statCountTotal },
    { key: 'high' as Priority, label: 'CRITICAL', icon: '⛔', count: counts.critical, card: styles.statCritical, num: styles.statCountCritical },
    { key: 'medium' as Priority, label: 'IMPORTANT', icon: '📈', count: counts.important, card: styles.statImportant, num: styles.statCountImportant },
    { key: 'low' as Priority, label: 'FYI', icon: 'ℹ️', count: counts.fyi, card: styles.statFyi, num: styles.statCountFyi },
  ];

  const currentGroup = GROUPS.find(g => g.key === view);

  const renderFilterBar = () => (
    <div className={styles.toolbar}>
      <div className={styles.search}>
        <Search
          placeholder="Search updates…"
          value={query}
          onChange={(value: string) => setQuery(value)}
          size="small"
        />
      </div>
      <div className={styles.channelFilter}>
        <Dropdown
          placeholder="All channels"
          options={channelOptions}
          value={channelFilter}
          onChange={(selected: { label: string; value: string | number }[] | null) =>
            setChannelFilter(
              (selected ?? []).map(o => ({ label: o.label, value: String(o.value) }))
            )
          }
          multi
          multiline={false}
          size="small"
          searchable={false}
        />
      </div>
      <div className={styles.topicFilter}>
        <Dropdown
          placeholder="All topics"
          options={ALL_TAGS.map(tag => ({ label: tag, value: tag }))}
          value={activeTags.map(tag => ({ label: tag, value: tag }))}
          onChange={(selected: { label: string; value: string | number }[] | null) =>
            setActiveTags((selected ?? []).map(o => String(o.value)))
          }
          multi
          multiline={false}
          size="small"
          searchable
        />
      </div>
      <Button kind="secondary" size="small" onClick={() => setNewestFirst(v => !v)}>
        {newestFirst ? '↓ Newest' : '↑ Oldest'}
      </Button>
      {hasFilters && (
        <Button kind="tertiary" size="small" onClick={clearFilters}>
          Clear
        </Button>
      )}
    </div>
  );

  const renderPills = () => (
    <>
      <div className={styles.pillRow}>
        <span className={styles.pillLabel}>
          <Text type="text3" color="secondary" weight="medium">Period:</Text>
        </span>
        {(Object.keys(RANGE_LABELS) as RangeKey[]).map(key => (
          <button
            type="button"
            key={key}
            className={range === key ? `${styles.pill} ${styles.pillActive}` : styles.pill}
            onClick={() => setRange(key)}
            aria-pressed={range === key}
          >
            {key === 'all' ? 'All Time' : RANGE_LABELS[key]}
          </button>
        ))}
      </div>
      <div className={styles.pillRow}>
        <span className={styles.pillLabel}>
          <Text type="text3" color="secondary" weight="medium">Urgency:</Text>
        </span>
        {SEVERITY_PILLS.map(pill => (
          <button
            type="button"
            key={pill.label}
            className={
              severityFilter === pill.key ? `${styles.pill} ${styles.pillActive}` : styles.pill
            }
            onClick={() => setSeverityFilter(pill.key)}
            aria-pressed={severityFilter === pill.key}
          >
            {pill.label}
          </button>
        ))}
      </div>
    </>
  );

  const renderCards = () => (
    <>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>
          {currentGroup ? currentGroup.title : RANGE_LABELS[range]}
        </h2>
        <span className={styles.countPill}>
          <Text type="text3" color="secondary">
            {filtered.length} {filtered.length === 1 ? 'update' : 'updates'}
          </Text>
        </span>
      </div>
      {renderPills()}
      {filtered.length > 0 ? (
        <div className={styles.cardGrid}>
          {filtered.map(update => (
            <UpdateCard key={update.id} update={update} onTagClick={toggleTag} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <Text type="text1" weight="medium">No updates match your filters</Text>
          <Button kind="secondary" size="small" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.root}>
      <nav className={styles.sidebar} aria-label="Business Support Hub navigation">
        <div className={styles.sidebarBrand}>
          <div className={styles.brandIcon} aria-hidden="true">📡</div>
          <div>
            <Text type="text2" weight="bold">BS Comm Hub</Text>
            <Text type="text3" color="secondary">Business Support</Text>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <Text type="text3" color="secondary" weight="medium">NAVIGATION</Text>
        </div>
        <button
          type="button"
          className={view === 'home' ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
          onClick={() => setView('home')}
        >
          <span className={styles.navEmoji} aria-hidden="true">🏠</span>
          <span className={styles.navLabel}><Text type="text2">Home</Text></span>
        </button>
        <button
          type="button"
          className={view === 'search' ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
          onClick={() => setView('search')}
        >
          <span className={styles.navEmoji} aria-hidden="true">🔍</span>
          <span className={styles.navLabel}><Text type="text2">Search</Text></span>
        </button>

        <div className={styles.sidebarSection}>
          <Text type="text3" color="secondary" weight="medium">COMMUNICATION TYPES</Text>
        </div>
        {GROUPS.map(group => {
          const count = UPDATES.filter(u => u.group === group.key).length;
          const active = view === group.key;
          return (
            <button
              type="button"
              key={group.key}
              className={active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
              onClick={() => setView(active ? 'home' : group.key)}
            >
              <span className={styles.navEmoji} aria-hidden="true">{group.emoji}</span>
              <span className={styles.navLabel}>
                <Text type="text2" ellipsis withoutTooltip>{group.title}</Text>
              </span>
              <span className={styles.navCount}>
                <Text type="text3" color="secondary">{count}</Text>
              </span>
            </button>
          );
        })}
      </nav>

      <main className={styles.main}>
        <div className={styles.mainInner}>
          {view === 'home' && (
            <>
              <div className={styles.hero}>
                <div className={styles.heroIcon} aria-hidden="true">📡</div>
                <h1 className={styles.heroTitle}>Business Support Communication Hub</h1>
                <Text type="text1" color="secondary">
                  Your centralized hub for all Business Support updates, launches, and communications
                </Text>
                <Text type="text3" color="secondary">
                  Scanning {CHANNELS.length} Slack channels · last scanned {formatDate(SCANNED_AT)} ·
                  past {SCAN_WINDOW_DAYS} days · refreshed daily
                </Text>
              </div>

              <div className={styles.statsRow}>
                {statCards.map(card => {
                  const active = severityFilter === card.key;
                  return (
                    <button
                      type="button"
                      key={card.label}
                      className={
                        (active ? `${styles.statCard} ${styles.statCardActive} ` : `${styles.statCard} `) +
                        card.card
                      }
                      onClick={() => setSeverityFilter(active || !card.key ? null : card.key)}
                      aria-pressed={active}
                      aria-label={`${card.label}: ${card.count} updates`}
                    >
                      <span className={styles.statIcon} aria-hidden="true">{card.icon}</span>
                      <span className={`${styles.statCount} ${card.num}`}>{card.count}</span>
                      <span className={styles.statLabel}>{card.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.banner}>
                <div className={styles.bannerIcon} aria-hidden="true">📊</div>
                <div className={styles.bannerBody}>
                  <div className={styles.bannerKicker}>
                    <span className={styles.liveBadge}>LIVE</span>
                    <Text type="text3" weight="medium" color="inherit">
                      WEEKLY INTELLIGENCE — POWERED BY LOUNGE LOGIC
                    </Text>
                  </div>
                  <span className={styles.bannerTitle}>
                    See What's New, What's Breaking & What You Need to Know
                  </span>
                  <Text type="text1" color="inherit">
                    The Business Lounge Weekly Intelligence Report covers ticket trends, health
                    score, top topics, and the critical queue — everything you need to stay ahead.
                  </Text>
                </div>
                <Button
                  kind="primary"
                  size="small"
                  onClick={() =>
                    window.open(
                      'https://monday.monday.com/boards/18411523320/pulses/12516507016',
                      '_blank'
                    )
                  }
                >
                  Open Weekly Report ↗
                </Button>
              </div>

              <div className={`${styles.banner} ${styles.bannerBiztech}`}>
                <div className={styles.bannerIcon} aria-hidden="true">🎮</div>
                <div className={styles.bannerBody}>
                  <div className={styles.bannerKicker}>
                    <span className={styles.weeklyBadge}>WEEKLY</span>
                    <Text type="text3" weight="medium" color="inherit">
                      BIZTECH WEEKLY — POWERED BY BIZ MAN
                    </Text>
                  </div>
                  <span className={styles.bannerTitle}>
                    Salesforce Weekly Analysis — What Changed & What Shipped
                  </span>
                  <Text type="text1" color="inherit">
                    BizTech's Salesforce Weekly Analysis lands every Friday on the Biztech weekly
                    Updates board. The latest edition covers July 17–24, 2026.
                  </Text>
                </div>
                <Button
                  kind="primary"
                  size="small"
                  onClick={() =>
                    window.open(
                      'https://monday.monday.com/boards/18413186810/pulses/12618256065',
                      '_blank'
                    )
                  }
                >
                  Open Biztech Weekly ↗
                </Button>
              </div>

              <div className={`${styles.banner} ${styles.bannerBugs}`}>
                <div className={styles.bannerIcon} aria-hidden="true">🐞</div>
                <div className={styles.bannerBody}>
                  <div className={styles.bannerKicker}>
                    <span className={styles.bugBadge}>BUGS</span>
                    <Text type="text3" weight="medium" color="inherit">
                      WEEKLY BUG SUMMARY — POWERED BY BIZ MAN
                    </Text>
                  </div>
                  <span className={styles.bannerTitle}>
                    New Bugs, Priorities & Fixes In Flight
                  </span>
                  <Text type="text1" color="inherit">
                    Biz Man's Weekly Bug Summary tracks new bugs raised on the Bug Board — latest
                    edition: CSAT surveys skipping MS projects (Biz Apps) and SFDC/BigBrain
                    subscription mismatches blocking Expansion Opps (Payments).
                  </Text>
                </div>
                <Button
                  kind="primary"
                  size="small"
                  onClick={() =>
                    window.open('https://monday.monday.com/boards/18390417108', '_blank')
                  }
                >
                  Open Bug Board ↗
                </Button>
              </div>

              {criticalItem && (
                <section className={styles.critical} aria-label="Critical updates">
                  <div className={styles.criticalHeader}>
                    <div className={styles.criticalHeaderText}>
                      <span className={styles.criticalKicker}>REQUIRES IMMEDIATE ATTENTION</span>
                      <Text type="text1" weight="bold">Critical Updates</Text>
                    </div>
                    <div className={styles.pager}>
                      <Text type="text3" color="secondary">
                        {safeCriticalIndex + 1} / {criticalUpdates.length}
                      </Text>
                      <button
                        type="button"
                        className={styles.pagerButton}
                        onClick={() => setCriticalIndex(i => Math.max(0, i - 1))}
                        disabled={safeCriticalIndex === 0}
                        aria-label="Previous critical update"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className={styles.pagerButton}
                        onClick={() =>
                          setCriticalIndex(i => Math.min(criticalUpdates.length - 1, i + 1))
                        }
                        disabled={safeCriticalIndex >= criticalUpdates.length - 1}
                        aria-label="Next critical update"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                  <div className={styles.criticalBody}>
                    <div className={styles.criticalIcon} aria-hidden="true">
                      {criticalGroup?.emoji ?? '⚠️'}
                    </div>
                    <div className={styles.criticalContent}>
                      <div className={styles.badgeRow}>
                        <span className={styles.criticalBadge}>⛔ CRITICAL</span>
                        {criticalGroup && (
                          <Chips label={criticalGroup.title} readOnly size="small" color="explosive" noMargin />
                        )}
                        {criticalItem.tags.slice(0, 2).map(tag => (
                          <Chips key={tag} label={tag} readOnly size="small" color="saladish" noMargin />
                        ))}
                      </div>
                      <Heading type="h2">{criticalItem.title}</Heading>
                      <Text type="text1" color="secondary">{criticalItem.summary}</Text>
                      <div className={styles.metaRow}>
                        <Text type="text3" color="secondary">👤 {criticalItem.author}</Text>
                        <Text type="text3" color="secondary">📅 {formatDate(criticalItem.date)}</Text>
                        {criticalChannel && (
                          <Link
                            text={`#${criticalItem.channel}`}
                            href={`https://monday.slack.com/archives/${criticalChannel.id}`}
                          />
                        )}
                      </div>
                    </div>
                    <Button kind="secondary" size="small" onClick={() => setSeverityFilter('high')}>
                      View All Critical
                    </Button>
                  </div>
                  <div className={styles.dots}>
                    {criticalUpdates.map((u, i) => (
                      <button
                        type="button"
                        key={u.id}
                        className={i === safeCriticalIndex ? `${styles.dot} ${styles.dotActive}` : styles.dot}
                        onClick={() => setCriticalIndex(i)}
                        aria-label={`Go to critical update ${i + 1}`}
                      />
                    ))}
                  </div>
                </section>
              )}

              {renderFilterBar()}
              {renderCards()}
            </>
          )}

          {view !== 'home' && (
            <>
              <div className={styles.pageHeader}>
                <Heading type="h1" weight="bold">
                  {view === 'search' ? '🔍 Search' : `${currentGroup?.emoji} ${currentGroup?.title}`}
                </Heading>
              </div>
              {renderFilterBar()}
              {renderCards()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
