-- Migration: Add image_url to cards table for visual flashcards

ALTER TABLE cards
ADD COLUMN image_url text;
