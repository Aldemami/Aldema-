// Always import the default React alongside any named hooks. Trident's MFE
// federation initializes the shared `react` module via the default-import
// code path; pure named-only imports resolve to null at runtime.
import React, { useMemo, useState } from 'react';
import { Heading, Text, Chips, Search, Dropdown, Avatar, Link, Button } from '@vibe/core';
import styles from './BusinessSupportHub.module.scss';
import {
  CHANNELS,
  GROUPS,
  UPDATES,
  SCANNED_AT,
  SCAN_WINDOW_DAYS,
  GroupKey,
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

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
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
}: {
  update: TeamUpdate;
  color: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const channel = CHANNELS.find(c => c.name === update.channel);
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const channelOptions: ChannelOption[] = useMemo(
    () => CHANNELS.map(c => ({ label: `#${c.name}`, value: c.name })),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const channels = channelFilter.map(o => o.value);
    return UPDATES.filter(u => {
      if (channels.length > 0 && !channels.includes(u.channel)) return false;
      if (!q) return true;
      return (
        u.title.toLowerCase().includes(q) ||
        u.summary.toLowerCase().includes(q) ||
        u.author.toLowerCase().includes(q) ||
        u.channel.toLowerCase().includes(q)
      );
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [query, channelFilter]);

  const visibleGroups = activeGroup ? GROUPS.filter(g => g.key === activeGroup) : GROUPS;
  const hasResults = visibleGroups.some(g => filtered.some(u => u.group === g.key));

  const clearFilters = () => {
    setQuery('');
    setChannelFilter([]);
    setActiveGroup(null);
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
                requests. Last scanned {formatDate(SCANNED_AT)} · past {SCAN_WINDOW_DAYS} days.
              </Text>
            </div>
          </div>
        </div>
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
        {(query || channelFilter.length > 0 || activeGroup) && (
          <Button kind="tertiary" size="small" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
        <div className={styles.toolbarSpacer} />
        <Text type="text3" color="secondary">
          {filtered.length} of {UPDATES.length} updates
        </Text>
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
