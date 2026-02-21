-- Add current_affairs column to cards
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS current_affairs text;
