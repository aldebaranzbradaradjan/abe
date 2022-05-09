CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id integer,
  parent_id integer,
  user_id integer NOT NULL,
  body TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);