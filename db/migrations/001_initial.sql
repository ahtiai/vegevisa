CREATE TABLE quiz_settings (
 id integer PRIMARY KEY CHECK(id=1), question_counts integer[] NOT NULL CHECK(cardinality(question_counts)=2 AND question_counts[1] BETWEEN 1 AND 20 AND question_counts[2] BETWEEN 1 AND 20 AND question_counts[1]<>question_counts[2]),
 question_time_seconds integer NOT NULL CHECK(question_time_seconds BETWEEN 5 AND 120), revision integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO quiz_settings(id,question_counts,question_time_seconds) VALUES(1,ARRAY[5,10],30);
CREATE TABLE questions (
 id text PRIMARY KEY, question text NOT NULL CHECK(length(trim(question)) BETWEEN 1 AND 1000), options text[] NOT NULL CHECK(cardinality(options)=4), correct_index integer NOT NULL CHECK(correct_index BETWEEN 0 AND 3), active boolean NOT NULL, difficulty text, revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE scores (
 submission_id uuid PRIMARY KEY, player_name text NOT NULL CHECK(length(trim(player_name)) BETWEEN 1 AND 30), score integer NOT NULL CHECK(score>=0), correct_answers integer NOT NULL CHECK(correct_answers>=0), total_questions integer NOT NULL CHECK(total_questions BETWEEN 1 AND 20), time_played_seconds integer NOT NULL CHECK(time_played_seconds>=0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), CHECK(correct_answers<=total_questions), CHECK(score<=correct_answers*2000)
);
CREATE INDEX scores_ranking ON scores(score DESC,created_at,submission_id);
CREATE INDEX scores_created_at ON scores(created_at);
CREATE TABLE leaderboard_state(id integer PRIMARY KEY CHECK(id=1), today_since timestamptz, all_time_since timestamptz);
INSERT INTO leaderboard_state(id) VALUES(1);
CREATE TABLE admin_sessions(token_hash text PRIMARY KEY, password_fingerprint text NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX sessions_expiry ON admin_sessions(expires_at);
CREATE TABLE login_attempts(address_hash text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL);
