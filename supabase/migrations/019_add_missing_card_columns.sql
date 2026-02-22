-- 019_add_missing_card_columns.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'elimination_trick') THEN
        ALTER TABLE cards ADD COLUMN elimination_trick text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'logic_derivation') THEN
        ALTER TABLE cards ADD COLUMN logic_derivation text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'cross_refs') THEN
        ALTER TABLE cards ADD COLUMN cross_refs text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'interlink_ids') THEN
        ALTER TABLE cards ADD COLUMN interlink_ids text[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'is_pyq_tagged') THEN
        ALTER TABLE cards ADD COLUMN is_pyq_tagged boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'pyq_years') THEN
        ALTER TABLE cards ADD COLUMN pyq_years text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'current_affairs') THEN
        ALTER TABLE cards ADD COLUMN current_affairs text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'priority_score') THEN
        ALTER TABLE cards ADD COLUMN priority_score integer DEFAULT 5;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'scaffold_level') THEN
        ALTER TABLE cards ADD COLUMN scaffold_level text DEFAULT 'Foundation';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'custom_analogy') THEN
        ALTER TABLE cards ADD COLUMN custom_analogy text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'mains_point') THEN
        ALTER TABLE cards ADD COLUMN mains_point text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'syllabus_topic') THEN
        ALTER TABLE cards ADD COLUMN syllabus_topic text;
    END IF;
END $$;
