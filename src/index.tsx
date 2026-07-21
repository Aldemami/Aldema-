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

// Vibe chip color name → CSS color token, used for group color bars and stat cards.
const GROUP_COLORS: Record<GroupKey, string> = {
  releases: 'var(--color-done-green)',
  incidents: 'var(--color-stuck-red)',
  maintenance: 'var(--color-working_orange)',
  policy: 'var(--color-bright-blue)',
  reports: 'var(--color-purple)',
  techUpdates: 'var(--color-chili-blue)',
};

const PRIORITY_CHIP: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: 'stuck-red' },
  medium: { label: 'Medium', color: 'working_orange' },
  low: { label: 'Low', color: 'explosive' },
};

type RangeKey = 'all' | 'day' | 'week' | 'month';

const RANGE_DAYS: Record<RangeKey, number | null> = {
  all: null,
  day: 1,
  week: 7,
  month: 31,
};

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
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
  const priority = PRIORITY_CHIP[update.priority];
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
            <Chips
              label={priority.label}
              readOnly
              size="small"
              color={priority.color as never}
              noMargin
            />
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
            <Text type="text3" color="secondary">{formatDate(update.date)}</Text>
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
  const [query, setQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelOption[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupKey | null>(null);
  const [range, setRange] = useState<RangeKey>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
  }, [query, channelFilter, range, activeTags]);

  const highCount = filtered.filter(u => u.priority === 'high').length;
  const visibleGroups = activeGroup ? GROUPS.filter(g => g.key === activeGroup) : GROUPS;
  const hasResults = visibleGroups.some(g => filtered.some(u => u.group === g.key));
  const hasFilters =
    Boolean(query) || channelFilter.length > 0 || Boolean(activeGroup) || range !== 'all' || activeTags.length > 0;

  const clearFilters = () => {
    setQuery('');
    setChannelFilter([]);
    setActiveGroup(null);
    setRange('all');
    setActiveTags([]);
  };

  return (
    <div className={styles.root}>
      <div className={styles.topBar}>
        <div className={styles.titleBlock}>
          <div className={styles.appIcon} aria-hidden="true">📡</div>
          <div>
            <Heading type="h1" weight="bold">BS Team Updates Hub</Heading>
            <div className={styles.subtitleRow}>
              <Text type="text3" color="secondary">
                Genuine team updates from {CHANNELS.length} Slack channels — no questions, no help
                requests. Last scanned {formatDate(SCANNED_AT)} · past {SCAN_WINDOW_DAYS} days
                {highCount > 0 ? ` · ${highCount} high priority in view` : ''}.
              </Text>
            </div>
          </div>
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
      </div>

      <div className={styles.statsRow}>
        {GROUPS.map(group => {
          const count = filtered.filter(u => u.group === group.key).length;
          const active = activeGroup === group.key;
          return (
            <button
              type="button"
              key={group.key}
              className={active ? `${styles.statCard} ${styles.statCardActive}` : styles.statCard}
              style={{ borderTopColor: GROUP_COLORS[group.key] }}
              onClick={() => setActiveGroup(active ? null : group.key)}
              aria-pressed={active}
              aria-label={`${group.title}: ${count} updates`}
            >
              <span className={styles.statCount}>{count}</span>
              <Text type="text3" color="secondary">
                {group.emoji} {group.title}
              </Text>
            </button>
          );
        })}
      </div>

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
                (selected ?? []).map(s => ({ label: s.label, value: String(s.value) }))
              )
            }
            multi
            multiline={false}
            size="small"
            searchable={false}
          />
        </div>
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

      <div className={styles.content}>
        {visibleGroups.map(group => {
          const items = filtered.filter(u => u.group === group.key);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[group.key];
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
                      <Text type="text3" color="secondary" weight="medium">Priority</Text>
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
    </div>
  );
}
