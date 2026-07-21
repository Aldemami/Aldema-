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
  ButtonGroup,
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
  reports: 'var(--color-purple)',
  techUpdates: 'var(--color-chili-blue)',
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

function UpdateRow({
  update,
  color,
  expanded,
  onToggle,
  onTagClick,
}: {
  update: TeamUpdate;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  onTagClick: (tag: string) => void;
}) {
  const channel = CHANNELS.find(c => c.name === update.channel);
  const severity = SEVERITY[update.priority];
  return (
    <>
      <button type="button" className={styles.rowButton} onClick={onToggle} aria-expanded={expanded}>
        <div className={styles.row}>
          <div className={styles.colorBar} style={{ backgroundColor: color }} />
          <div className={styles.cell}>
            <Text type="text2" weight="medium" ellipsis withoutTooltip>
              {update.title}
            </Text>
          </div>
          <div className={`${styles.cell} ${styles.priorityCell}`}>
            <Chips label={severity.label} readOnly size="small" color={severity.chip as never} noMargin />
          </div>
          <div className={styles.cell}>
            <Chips label={`#${update.channel}`} readOnly size="small" color="explosive" noMargin />
          </div>
          <div className={`${styles.cell} ${styles.authorCell}`}>
            <Avatar type="text" text={initials(update.author)} size="small" aria-label={update.author} />
            <Text type="text3" color="secondary" ellipsis withoutTooltip>
              {update.author}
            </Text>
          </div>
          <div className={`${styles.cell} ${styles.dateCell}`}>
            <Text type="text3" color="secondary">
              {formatDate(update.date).replace(', 2026', '')}
            </Text>
          </div>
        </div>
      </button>
      {expanded && (
        <div className={styles.rowDetail}>
          <Text type="text2">{update.summary}</Text>
          <div className={styles.detailTags}>
            {update.tags.map(tag => (
              <Chips
                key={tag}
                label={tag}
                readOnly
                size="small"
                color="river"
                noMargin
                onClick={() => onTagClick(tag)}
                aria-label={`Filter by tag ${tag}`}
                className={styles.clickableChip}
              />
            ))}
          </div>
          {channel && (
            <Link
              text={`Open #${update.channel} in Slack`}
              href={`https://monday.slack.com/archives/${channel.id}`}
            />
          )}
        </div>
      )}
    </>
  );
}

export default function BusinessSupportHub() {
  const [view, setView] = useState<View>('home');
  const [query, setQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelOption[]>([]);
  const [severityFilter, setSeverityFilter] = useState<Priority | null>(null);
  const [range, setRange] = useState<RangeKey>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
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
    }).sort((a, b) => {
      if (a.priority !== b.priority) {
        const order: Priority[] = ['high', 'medium', 'low'];
        return order.indexOf(a.priority) - order.indexOf(b.priority);
      }
      return b.date.localeCompare(a.date);
    });
  }, [query, channelFilter, severityFilter, range, activeTags]);

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

  const groupsToRender =
    view === 'home' || view === 'search' ? GROUPS : GROUPS.filter(g => g.key === view);

  const statCards = [
    { key: null, label: 'TOTAL UPDATES', icon: '✨', count: counts.total, card: styles.statTotal, num: styles.statCountTotal },
    { key: 'high' as Priority, label: 'CRITICAL', icon: '⛔', count: counts.critical, card: styles.statCritical, num: styles.statCountCritical },
    { key: 'medium' as Priority, label: 'IMPORTANT', icon: '📈', count: counts.important, card: styles.statImportant, num: styles.statCountImportant },
    { key: 'low' as Priority, label: 'FYI', icon: 'ℹ️', count: counts.fyi, card: styles.statFyi, num: styles.statCountFyi },
  ];

  const renderToolbar = (withSearch: boolean) => (
    <>
      <div className={styles.toolbar}>
        {withSearch && (
          <div className={styles.search}>
            <Search
              placeholder="Search updates…"
              value={query}
              onChange={(value: string) => setQuery(value)}
              size="small"
            />
          </div>
        )}
        <div className={styles.channelFilter}>
          <Dropdown
            placeholder="All channels"
            options={channelOptions}
            value={channelFilter}
            onChange={(selected: { label: string; value: string | number }[] | null) =>
              setChannelFilter(
                (selected ?? []).map(s => ({ label: s.label, value: String(s.value) }))
              )
            }
            multi
            multiline={false}
            size="small"
            searchable={false}
          />
        </div>
        <ButtonGroup
          options={[
            { value: 'all', text: 'All time' },
            { value: 'month', text: 'Month' },
            { value: 'week', text: 'Week' },
            { value: 'day', text: 'Today' },
          ]}
          value={range}
          onSelect={(value: string | number) => setRange(value as RangeKey)}
          size="small"
          kind="tertiary"
        />
        {hasFilters && (
          <Button kind="tertiary" size="small" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
        <div className={styles.toolbarSpacer} />
        <Text type="text3" color="secondary">
          {filtered.length} of {UPDATES.length} updates
        </Text>
      </div>
      <div className={styles.tagsRow}>
        <Text type="text3" color="secondary" weight="medium">Tags:</Text>
        {ALL_TAGS.map(tag => {
          const active = activeTags.includes(tag);
          return (
            <Chips
              key={tag}
              label={tag}
              readOnly
              size="small"
              color={active ? 'primary' : 'explosive'}
              noMargin
              onClick={() => toggleTag(tag)}
              aria-label={`Filter by tag ${tag}`}
              className={styles.clickableChip}
            />
          );
        })}
      </div>
    </>
  );

  const renderGroups = () => {
    const hasResults = groupsToRender.some(g => filtered.some(u => u.group === g.key));
    return (
      <div className={styles.content}>
        {groupsToRender.map(group => {
          const items = filtered.filter(u => u.group === group.key);
          if (items.length === 0) return null;
          const isCollapsed = view === 'home' || view === 'search' ? collapsed[group.key] : false;
          return (
            <section key={group.key} className={styles.group}>
              <button
                type="button"
                className={styles.groupHeader}
                onClick={() => setCollapsed(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                aria-expanded={!isCollapsed}
              >
                <span
                  className={
                    isCollapsed
                      ? `${styles.groupChevron} ${styles.groupChevronCollapsed}`
                      : styles.groupChevron
                  }
                  aria-hidden="true"
                >
                  ▾
                </span>
                <span className={styles.groupTitle}>
                  <Heading type="h3">
                    <span style={{ color: GROUP_COLORS[group.key] }}>
                      {group.emoji} {group.title}
                    </span>
                  </Heading>
                  <Text type="text3" color="secondary">
                    {items.length} {items.length === 1 ? 'update' : 'updates'}
                  </Text>
                </span>
              </button>
              {!isCollapsed && (
                <div className={styles.table}>
                  <div className={styles.tableHeadRow}>
                    <div />
                    <div className={styles.headCell}>
                      <Text type="text3" color="secondary" weight="medium">Update</Text>
                    </div>
                    <div className={`${styles.headCell} ${styles.priorityCell}`}>
                      <Text type="text3" color="secondary" weight="medium">Severity</Text>
                    </div>
                    <div className={styles.headCell}>
                      <Text type="text3" color="secondary" weight="medium">Channel</Text>
                    </div>
                    <div className={styles.headCell}>
                      <Text type="text3" color="secondary" weight="medium">Posted by</Text>
                    </div>
                    <div className={`${styles.headCell} ${styles.dateHeadCell}`}>
                      <Text type="text3" color="secondary" weight="medium">Date</Text>
                    </div>
                  </div>
                  {items.map(update => (
                    <UpdateRow
                      key={update.id}
                      update={update}
                      color={GROUP_COLORS[group.key]}
                      expanded={expandedRow === update.id}
                      onToggle={() =>
                        setExpandedRow(prev => (prev === update.id ? null : update.id))
                      }
                      onTagClick={toggleTag}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {!hasResults && (
          <div className={styles.empty}>
            <Text type="text1" weight="medium">No updates match your filters</Text>
            <Button kind="secondary" size="small" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    );
  };

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
                  past {SCAN_WINDOW_DAYS} days
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
                      <span className={styles.statLabel}>
                        {card.label}
                        {!card.key && hasFilters ? ' · FILTERED' : ''}
                      </span>
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
                  <Text type="text2" color="inherit">
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
                      <Text type="text2" color="secondary">{criticalItem.summary}</Text>
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
                    <Button
                      kind="secondary"
                      size="small"
                      onClick={() => setSeverityFilter('high')}
                    >
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

              {renderToolbar(true)}
              {renderGroups()}
            </>
          )}

          {view === 'search' && (
            <>
              <div className={styles.pageHeader}>
                <Heading type="h1" weight="bold">Search</Heading>
              </div>
              {renderToolbar(true)}
              {renderGroups()}
            </>
          )}

          {view !== 'home' && view !== 'search' && (
            <>
              {GROUPS.filter(g => g.key === view).map(group => (
                <div key={group.key} className={styles.pageHeader}>
                  <Heading type="h1" weight="bold">
                    {group.emoji} {group.title}
                  </Heading>
                </div>
              ))}
              {renderToolbar(true)}
              {renderGroups()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
