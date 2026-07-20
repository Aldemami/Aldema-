// Always import the default React alongside any named hooks. Trident's MFE
// federation initializes the shared `react` module via the default-import
// code path; pure named-only imports resolve to null at runtime.
import React, { useMemo, useState } from 'react';
import { Heading, Text, Chips, Search, Link } from '@vibe/core';
import styles from './BusinessSupportHub.module.scss';
import {
  CHANNELS,
  GROUPS,
  UPDATES,
  SCANNED_AT,
  SCAN_WINDOW_DAYS,
  TeamUpdate,
} from './updates';

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function UpdateCard({ update }: { update: TeamUpdate }) {
  const channel = CHANNELS.find(c => c.name === update.channel);
  return (
    <div className={styles.card}>
      <div className={styles.cardMeta}>
        {channel ? (
          <Link
            text={`#${update.channel}`}
            href={`https://monday.slack.com/archives/${channel.id}`}
          />
        ) : (
          <Text type="text3" color="secondary">#{update.channel}</Text>
        )}
        <Text type="text3" color="secondary">{update.author}</Text>
        <Text type="text3" color="secondary">{formatDate(update.date)}</Text>
      </div>
      <Text type="text1" weight="bold">{update.title}</Text>
      <Text type="text2" color="secondary">{update.summary}</Text>
    </div>
  );
}

export default function BusinessSupportHub() {
  const [query, setQuery] = useState('');
  const [activeChannels, setActiveChannels] = useState<string[]>([]);

  const toggleChannel = (name: string) => {
    setActiveChannels(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UPDATES.filter(u => {
      if (activeChannels.length > 0 && !activeChannels.includes(u.channel)) return false;
      if (!q) return true;
      return (
        u.title.toLowerCase().includes(q) ||
        u.summary.toLowerCase().includes(q) ||
        u.author.toLowerCase().includes(q) ||
        u.channel.toLowerCase().includes(q)
      );
    });
  }, [query, activeChannels]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Heading type="h1">BS Team Updates Hub</Heading>
        <Text type="text2" color="secondary">
          Genuine team updates from {CHANNELS.length} Slack channels — no questions, no help
          requests. Last scanned {formatDate(SCANNED_AT)} (past {SCAN_WINDOW_DAYS} days).
        </Text>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search
            placeholder="Search updates…"
            value={query}
            onChange={(value: string) => setQuery(value)}
          />
        </div>
        <div className={styles.channelChips}>
          {CHANNELS.map(channel => {
            const active =
              activeChannels.length === 0 || activeChannels.includes(channel.name);
            return (
              <Chips
                key={channel.name}
                label={`#${channel.name}`}
                readOnly
                color={active ? 'primary' : 'explosive'}
                className={
                  active
                    ? styles.channelChip
                    : `${styles.channelChip} ${styles.channelChipInactive}`
                }
                onClick={() => toggleChannel(channel.name)}
                aria-label={`Filter by #${channel.name}`}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.groups}>
        {GROUPS.map(group => {
          const items = filtered.filter(u => u.group === group.key);
          if (items.length === 0) return null;
          return (
            <section key={group.key} className={styles.group}>
              <div className={styles.groupHeader}>
                <Heading type="h2">
                  {group.emoji} {group.title}
                </Heading>
                <Chips label={String(items.length)} readOnly color={group.chipColor as never} />
              </div>
              <div className={styles.cards}>
                {items.map(update => (
                  <UpdateCard key={update.id} update={update} />
                ))}
              </div>
            </section>
          );
        })}
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <Text type="text1" color="secondary">
              No updates match your search.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
