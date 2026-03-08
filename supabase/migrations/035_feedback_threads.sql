-- Migration: 035_feedback_threads.sql
-- Enables Instagram-style DM Feedback System in the Vault

-- 1. Create feedback_threads table
CREATE TABLE IF NOT EXISTS public.feedback_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create feedback_messages table
CREATE TABLE IF NOT EXISTS public.feedback_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.feedback_threads(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Trigger to auto-update thread's updated_at timestamp when a message is inserted
CREATE OR REPLACE FUNCTION update_feedback_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.feedback_threads
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_feedback_messages_update_thread
AFTER INSERT ON public.feedback_messages
FOR EACH ROW
EXECUTE FUNCTION update_feedback_thread_timestamp();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.feedback_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;

-- 5. User Policies for feedback_threads (Users can see and create their own threads)
CREATE POLICY "Users can view their own feedback threads"
ON public.feedback_threads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback threads"
ON public.feedback_threads FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. User Policies for feedback_messages (Users can see and post messages in their own threads)
CREATE POLICY "Users can view messages in their own threads"
ON public.feedback_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.feedback_threads
        WHERE feedback_threads.id = feedback_messages.thread_id
        AND feedback_threads.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert messages in their own threads"
ON public.feedback_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.feedback_threads
        WHERE feedback_threads.id = feedback_messages.thread_id
        AND feedback_threads.user_id = auth.uid()
    )
    AND sender_type = 'user' -- Ensure users can't masquerade as admin
);

-- Note: Admins bypass RLS by using the service_role key server-side.
