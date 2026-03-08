-- 033_mentor_history.sql
-- Persistence for UPSC Mentor Chat (ChatGPT style)

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS public.mentor_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    title text NOT NULL,
    is_archived boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.mentor_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.mentor_conversations(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'mentor')),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Conversations
DROP POLICY IF EXISTS "Users can manage their mentor conversations" ON public.mentor_conversations;
CREATE POLICY "Users can manage their mentor conversations"
ON public.mentor_conversations FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000000'); -- Using static ID as placeholder for now

-- Policies for Messages
DROP POLICY IF EXISTS "Users can manage their mentor messages" ON public.mentor_messages;
CREATE POLICY "Users can manage their mentor messages"
ON public.mentor_messages FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.mentor_conversations 
    WHERE id = mentor_messages.conversation_id 
    AND user_id = '00000000-0000-0000-0000-000000000000'
));

-- Trigger for updated_at in conversations
DROP TRIGGER IF EXISTS set_mentor_conversations_updated_at ON public.mentor_conversations;
CREATE TRIGGER set_mentor_conversations_updated_at
    BEFORE UPDATE ON public.mentor_conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
