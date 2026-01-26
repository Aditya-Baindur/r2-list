-- Tracks where each CDN file is used (site + page + counts)

CREATE TABLE IF NOT EXISTS file_usage (
  file TEXT NOT NULL,        -- R2 object key
  site TEXT NOT NULL,        -- hostname (veritas.ai, adityabaindur.dev, etc.)
  page TEXT NOT NULL,        -- path (/about, /home, etc.)
  count INTEGER NOT NULL DEFAULT 1,
  last_seen INTEGER NOT NULL,

  PRIMARY KEY (file, site, page)
);

-- Fast lookups by file (for admin "usage" overlay)
CREATE INDEX IF NOT EXISTS idx_file_usage_file
ON file_usage (file);

-- Fast grouping by site (future dashboards)
CREATE INDEX IF NOT EXISTS idx_file_usage_site
ON file_usage (site);

-- Fast "recent activity" queries
CREATE INDEX IF NOT EXISTS idx_file_usage_last_seen
ON file_usage (last_seen DESC);
