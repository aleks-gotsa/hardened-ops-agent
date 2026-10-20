
CREATE TABLE public.agent_runs (
    id integer NOT NULL,
    received_at timestamp with time zone DEFAULT now(),
    msg_id text,
    sender text,
    subject text,
    class text,
    risk numeric,
    attack_type text,
    action text,
    tools_called jsonb DEFAULT '[]'::jsonb,
    approval text,
    outcome text,
    latency_ms integer,
    cost_usd numeric(8,5),
    redteam boolean DEFAULT false,
    sender_name text,
    body_text text,
    attachments_text text[],
    pdf_pages integer,
    pdf_chars integer,
    guard_reason text,
    urls text[],
    foreign_links text[],
    phishing_risk numeric,
    ticket_url text,
    rt_id text,
    rt_tier text,
    rt_category text,
    rt_target text,
    rt_canary text,
    action_requested text,
    blocked_by_allowlist boolean,
    rt_hit boolean,
    body_html text,
    dg_score integer,
    dg_verdict text,
    dg_signals text,
    dg_block boolean,
    dg_enforce boolean,
    rt_hit_reason text,
    rt_mention boolean
);

CREATE SEQUENCE public.agent_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.agent_runs_id_seq OWNED BY public.agent_runs.id;

ALTER TABLE ONLY public.agent_runs ALTER COLUMN id SET DEFAULT nextval('public.agent_runs_id_seq'::regclass);

ALTER TABLE ONLY public.agent_runs
    ADD CONSTRAINT agent_runs_msg_id_key UNIQUE (msg_id);

ALTER TABLE ONLY public.agent_runs
    ADD CONSTRAINT agent_runs_pkey PRIMARY KEY (id);

