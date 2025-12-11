--
-- PostgreSQL database dump
--

\restrict mI7CwJfHfffOZrL7S8ydViSSGnVhpWaW6KxFQ3K7y9PC7Pf1CfWepkauYmxtSTk

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS smartfactory_db;
--
-- Name: smartfactory_db; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE smartfactory_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.UTF-8';


\unrestrict mI7CwJfHfffOZrL7S8ydViSSGnVhpWaW6KxFQ3K7y9PC7Pf1CfWepkauYmxtSTk
\connect smartfactory_db
\restrict mI7CwJfHfffOZrL7S8ydViSSGnVhpWaW6KxFQ3K7y9PC7Pf1CfWepkauYmxtSTk

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: idea_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.idea_category AS ENUM (
    'process_improvement',
    'cost_reduction',
    'quality_improvement',
    'safety_enhancement',
    'productivity',
    'innovation',
    'environment',
    'workplace',
    'other'
);


--
-- Name: idea_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.idea_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'implemented',
    'on_hold'
);


--
-- Name: ideabox_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ideabox_type AS ENUM (
    'white',
    'pink'
);


--
-- Name: incident_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.incident_status AS ENUM (
    'pending',
    'assigned',
    'in_progress',
    'resolved',
    'closed',
    'cancelled',
    'escalated'
);


--
-- Name: incident_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.incident_type AS ENUM (
    'safety',
    'quality',
    'equipment',
    'other'
);


--
-- Name: news_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.news_category AS ENUM (
    'company_announcement',
    'policy_update',
    'event',
    'achievement',
    'safety_alert',
    'maintenance',
    'training',
    'welfare',
    'newsletter',
    'emergency',
    'other'
);


--
-- Name: news_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.news_status AS ENUM (
    'draft',
    'published',
    'archived',
    'deleted'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'incident_assigned',
    'incident_escalated',
    'incident_resolved',
    'idea_submitted',
    'idea_reviewed',
    'idea_implemented',
    'news_published',
    'system_alert',
    'comment_added',
    'response_added'
);


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_id uuid,
    manager_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE departments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.departments IS 'Factory departments and organizational structure';


--
-- Name: ideas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ideas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ideabox_type public.ideabox_type NOT NULL,
    category public.idea_category NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    expected_benefit text,
    submitter_id uuid NOT NULL,
    department_id uuid,
    is_anonymous boolean DEFAULT false,
    assigned_to uuid,
    status public.idea_status DEFAULT 'pending'::public.idea_status,
    attachments jsonb,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    review_notes text,
    feasibility_score integer,
    impact_score integer,
    implemented_at timestamp without time zone,
    implementation_notes text,
    actual_benefit text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ideas_feasibility_score_check CHECK (((feasibility_score >= 1) AND (feasibility_score <= 10))),
    CONSTRAINT ideas_impact_score_check CHECK (((impact_score >= 1) AND (impact_score <= 10)))
);


--
-- Name: TABLE ideas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ideas IS 'Employee ideas and suggestions (White and Pink Box)';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_code character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    phone character varying(20),
    role character varying(50) NOT NULL,
    level integer NOT NULL,
    department_id uuid,
    is_active boolean DEFAULT true,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    username character varying(50),
    avatar_url text
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'System users with roles and permissions';


--
-- Name: active_ideas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_ideas AS
 SELECT i.id,
    i.ideabox_type,
    i.category,
    i.title,
    i.description,
    i.expected_benefit,
    i.submitter_id,
    i.department_id,
    i.is_anonymous,
    i.assigned_to,
    i.status,
    i.attachments,
    i.reviewed_by,
    i.reviewed_at,
    i.review_notes,
    i.feasibility_score,
    i.impact_score,
    i.implemented_at,
    i.implementation_notes,
    i.actual_benefit,
    i.created_at,
    i.updated_at,
        CASE
            WHEN (i.is_anonymous = true) THEN 'Anonymous'::character varying
            ELSE u.full_name
        END AS submitter_name,
    d.name AS department_name
   FROM ((public.ideas i
     LEFT JOIN public.users u ON ((i.submitter_id = u.id)))
     LEFT JOIN public.departments d ON ((i.department_id = d.id)))
  WHERE (i.status <> ALL (ARRAY['rejected'::public.idea_status, 'implemented'::public.idea_status]));


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_type public.incident_type NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    location character varying(200),
    department_id uuid,
    reporter_id uuid NOT NULL,
    assigned_to uuid,
    priority character varying(20) DEFAULT 'medium'::character varying,
    status public.incident_status DEFAULT 'pending'::public.incident_status,
    attachments jsonb,
    escalated_to uuid,
    escalated_at timestamp without time zone,
    escalation_level integer DEFAULT 0,
    resolved_by uuid,
    resolved_at timestamp without time zone,
    resolution_notes text,
    root_cause text,
    corrective_actions text,
    rating integer,
    rating_feedback text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    media_urls text[],
    media_metadata jsonb,
    assigned_department_id uuid,
    accepted_at timestamp without time zone,
    accepted_by uuid,
    notification_sent boolean DEFAULT false,
    notification_sent_at timestamp without time zone,
    CONSTRAINT incidents_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: TABLE incidents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.incidents IS 'Incident reports from factory floor';


--
-- Name: COLUMN incidents.media_urls; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.incidents.media_urls IS 'Array of uploaded media file URLs (images/videos)';


--
-- Name: COLUMN incidents.media_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.incidents.media_metadata IS 'Metadata for media files: type, size, dimensions, thumbnail';


--
-- Name: COLUMN incidents.assigned_department_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.incidents.assigned_department_id IS 'Department assigned to handle this incident';


--
-- Name: COLUMN incidents.accepted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.incidents.accepted_at IS 'When incident was accepted from queue';


--
-- Name: COLUMN incidents.accepted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.incidents.accepted_by IS 'User who accepted the incident';


--
-- Name: active_incidents; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_incidents AS
 SELECT i.id,
    i.incident_type,
    i.title,
    i.description,
    i.location,
    i.department_id,
    i.reporter_id,
    i.assigned_to,
    i.priority,
    i.status,
    i.attachments,
    i.escalated_to,
    i.escalated_at,
    i.escalation_level,
    i.resolved_by,
    i.resolved_at,
    i.resolution_notes,
    i.root_cause,
    i.corrective_actions,
    i.rating,
    i.rating_feedback,
    i.created_at,
    i.updated_at,
    u.full_name AS reporter_name,
    d.name AS department_name,
    a.full_name AS assigned_to_name
   FROM (((public.incidents i
     LEFT JOIN public.users u ON ((i.reporter_id = u.id)))
     LEFT JOIN public.departments d ON ((i.department_id = d.id)))
     LEFT JOIN public.users a ON ((i.assigned_to = a.id)))
  WHERE (i.status <> ALL (ARRAY['closed'::public.incident_status, 'cancelled'::public.incident_status]));


--
-- Name: idea_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idea_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    idea_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    performed_by uuid NOT NULL,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: idea_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idea_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    idea_id uuid NOT NULL,
    user_id uuid NOT NULL,
    response text NOT NULL,
    attachments jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: incident_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incident_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    attachments jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    media_urls text[],
    media_metadata jsonb
);


--
-- Name: incident_department_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incident_department_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_id uuid NOT NULL,
    department_id uuid NOT NULL,
    assigned_to uuid,
    task_description text,
    status character varying(50) DEFAULT 'pending'::character varying,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: incident_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incident_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    performed_by uuid NOT NULL,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category public.news_category NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    excerpt character varying(500),
    author_id uuid NOT NULL,
    target_audience character varying(50) DEFAULT 'all'::character varying,
    target_departments jsonb,
    is_priority boolean DEFAULT false,
    publish_at timestamp without time zone,
    status public.news_status DEFAULT 'draft'::public.news_status,
    attachments jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE news; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.news IS 'Company news and announcements';


--
-- Name: news_read_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_read_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    news_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: news_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    news_id uuid NOT NULL,
    user_id uuid NOT NULL,
    viewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    action_url character varying(500),
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    recipient_department_id uuid,
    related_incident_id uuid,
    related_idea_id uuid,
    related_news_id uuid,
    sent_via jsonb DEFAULT '{"web": true, "mobile": false}'::jsonb,
    metadata jsonb
);


--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notifications IS 'System-wide notifications for incidents, ideas, news';


--
-- Name: COLUMN notifications.recipient_department_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.recipient_department_id IS 'Notify entire department';


--
-- Name: COLUMN notifications.related_incident_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notifications.related_incident_id IS 'Link to incident';


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, code, name, description, parent_id, manager_id, is_active, created_at, updated_at) FROM stdin;
67e150ea-1f65-4dda-887b-8100f4700dc6	PROD	Production	Main production department	\N	\N	t	2025-11-16 15:42:32.752444	2025-11-16 15:42:32.752444
2351c49b-5053-4a75-b486-b8d92b7ff21d	QC	Quality Control	Quality assurance and control	\N	\N	t	2025-11-16 15:42:32.752444	2025-11-16 15:42:32.752444
9dd521c3-3ec5-4711-93cc-dbb72e1821d6	MAINT	Maintenance	Equipment maintenance	\N	\N	t	2025-11-16 15:42:32.752444	2025-11-16 15:42:32.752444
e0d9a569-02a7-4949-92ac-e1ee71b5f846	ADMIN	Administration	Administrative department	\N	\N	t	2025-11-16 15:42:32.752444	2025-11-16 15:42:32.752444
494f2da3-b371-4381-ad70-7cf6805a07c9	MA	Maintenance	Bộ phận bảo trì	\N	\N	t	2025-11-18 00:08:23.266214	2025-11-18 00:08:23.266214
320d144b-e97f-417e-a3d1-c05680896c88	LOG	Logistics	Bộ phận kho vận	\N	\N	t	2025-11-18 00:08:23.266214	2025-11-18 00:08:23.266214
16be4cde-d2d5-4803-aec6-cfe56c6d9419	SAFETY	Safety	Bộ phận an toàn	\N	\N	t	2025-11-18 00:08:23.266214	2025-11-18 00:08:23.266214
\.


--
-- Data for Name: idea_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.idea_history (id, idea_id, action, performed_by, details, created_at) FROM stdin;
\.


--
-- Data for Name: idea_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.idea_responses (id, idea_id, user_id, response, attachments, created_at) FROM stdin;
\.


--
-- Data for Name: ideas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ideas (id, ideabox_type, category, title, description, expected_benefit, submitter_id, department_id, is_anonymous, assigned_to, status, attachments, reviewed_by, reviewed_at, review_notes, feasibility_score, impact_score, implemented_at, implementation_notes, actual_benefit, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: incident_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incident_comments (id, incident_id, user_id, comment, attachments, created_at, media_urls, media_metadata) FROM stdin;
\.


--
-- Data for Name: incident_department_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incident_department_tasks (id, incident_id, department_id, assigned_to, task_description, status, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: incident_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incident_history (id, incident_id, action, performed_by, details, created_at) FROM stdin;
1a60b3e9-1186-424c-9bfd-12159bb53e56	81a4c112-c2f1-4523-9f5d-5f518c7a358f	created	3d25ff39-5149-4b65-9db7-e70213707bb7	{"status": "pending"}	2025-11-16 16:20:26.820415
828833ac-63df-43d3-bf60-af6711698115	e233e57c-9c13-467c-a516-6e71b2ff3056	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 12:51:39.813382
51e09b52-d4fb-475b-92d7-9ccba87a5b8c	4586abb3-53cc-4a32-9202-d152c614c6a6	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 09:36:39.813382
207e10de-bc70-4eab-aa99-87930eef2b8d	8eee28c9-8aa1-4e6d-928c-1362bfc19f5f	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 11:36:39.813382
6e874c93-24a6-428d-becf-579407df47bc	b0f4721d-c834-424a-9a20-2f5d6db1abca	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 07:36:39.813382
53aaa757-de84-46e7-a08c-986ba76c8db6	cca7c3df-ed42-4a77-b4ed-b632f208bf08	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 12:36:39.813382
e9a8ce86-5e58-441b-9327-2436b4636d3d	9790f021-2112-4776-bfb5-a6456c0f9dd5	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 10:36:39.813382
37d3efdc-d849-4bcd-9df6-d2bfa5e31192	77c56238-dd25-421e-b3d9-e3a6f13f8602	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 05:36:39.813382
529994a9-bdaa-47d7-b399-889dc78a0592	cf17dbcf-1f82-48b1-aab5-33dd95693143	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 11:06:39.813382
fd0f199b-a584-40c5-a0fd-b50532576b95	6166789d-c5b1-4d2d-9e67-110216c6fac7	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-16 13:36:39.813382
4f5d17b6-0ab6-4f8b-b312-f4f1189a48f6	d4bbc43d-ba0b-42f5-9fa4-d6a7b4bf2f55	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 13:06:39.813382
bc7987c4-3a8e-4754-9df6-3a77bfa6c4e1	15fffcce-fe45-4c46-b57c-9c7966a631d8	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 08:36:39.813382
f6f17734-304d-4e87-b4c3-a7702df3d557	60adfd1c-6321-47a7-b62c-353ecd215e81	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 12:06:39.813382
106ad76f-ecb0-432d-b55f-f2ff3e3ccead	2f8559d0-f1d9-4ede-8295-f9378d45ce2f	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 13:11:39.813382
5a8da9c3-4b4d-44be-942b-6ffedb857b6a	5db590a2-bdda-49bf-b9bc-2d861f0122c9	status_change	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã tiếp nhận và bắt đầu xử lý sự cố"}	2025-11-18 08:36:39.813382
3323b12b-f2f0-4d8a-8c6c-4716d42c59b2	5db590a2-bdda-49bf-b9bc-2d861f0122c9	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 08:41:39.813382
50fd3664-3d68-41b1-88a0-e6842b80a497	2f8559d0-f1d9-4ede-8295-f9378d45ce2f	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 13:16:39.813382
f377a828-990d-49c7-af12-50952774ebc6	60adfd1c-6321-47a7-b62c-353ecd215e81	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 12:11:39.813382
01263091-cfb9-4f46-a299-41181788801e	15fffcce-fe45-4c46-b57c-9c7966a631d8	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 08:41:39.813382
fdf36aa9-6dce-4dfa-aaff-ae9eb2757b5b	d4bbc43d-ba0b-42f5-9fa4-d6a7b4bf2f55	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 13:11:39.813382
d915c0b5-cbe9-48e7-8cda-dfdaf9e15bd6	cf17dbcf-1f82-48b1-aab5-33dd95693143	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 11:11:39.813382
8d2c3fce-b89b-44d2-8267-f0052509de36	77c56238-dd25-421e-b3d9-e3a6f13f8602	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 05:41:39.813382
df226da3-35d3-4e4d-bd91-21857ec9b1ce	cca7c3df-ed42-4a77-b4ed-b632f208bf08	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 12:41:39.813382
ce81ce79-bb30-4446-bfd1-f5cd290d1110	b0f4721d-c834-424a-9a20-2f5d6db1abca	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 07:41:39.813382
7706baba-f347-43db-853e-163e3b47e920	8eee28c9-8aa1-4e6d-928c-1362bfc19f5f	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 11:41:39.813382
f1211393-aca9-454f-879f-263ec9666ad7	4586abb3-53cc-4a32-9202-d152c614c6a6	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 09:41:39.813382
41d1755c-dc90-4f91-9cd6-3bafbf78d100	e233e57c-9c13-467c-a516-6e71b2ff3056	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Maintenance", "department_name": "Maintenance"}	2025-11-18 12:56:39.813382
7023e416-165b-4874-859f-05fab3f1dbda	6166789d-c5b1-4d2d-9e67-110216c6fac7	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Safety", "department_name": "Safety"}	2025-11-16 13:41:39.813382
6dda3bc2-2c0f-48b1-bbc8-ef488fe77510	9790f021-2112-4776-bfb5-a6456c0f9dd5	assignment	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã phân công cho phòng Safety", "department_name": "Safety"}	2025-11-18 10:41:39.813382
853d7bb7-27a6-4e8e-97c3-0eaa0091a446	4586abb3-53cc-4a32-9202-d152c614c6a6	resolution	614b0b0b-4097-4117-8d4a-d7962bb92c1a	{"message": "Đã thay thế cầu dao tự động bị hỏng. Hệ thống điện đã hoạt động trở lại bình thường."}	2025-11-18 10:36:39.813382
0a15e07a-034e-44c4-8b77-b8b8d64d96a4	b0f4721d-c834-424a-9a20-2f5d6db1abca	resolution	614b0b0b-4097-4117-8d4a-d7962bb92c1a	{"message": "Đã thay thế băng tải mới. Kiểm tra và căn chỉnh lại hệ thống. Dây chuyền hoạt động bình thường."}	2025-11-18 09:36:39.813382
dfc90c5d-dfb5-41e9-aaa6-8b8e93a04dd5	77c56238-dd25-421e-b3d9-e3a6f13f8602	resolution	614b0b0b-4097-4117-8d4a-d7962bb92c1a	{"message": "Đã thay thế khóa cửa mới. Kiểm tra hoạt động tốt."}	2025-11-18 07:36:39.813382
6058bb07-c6ce-4570-8181-82574004fe32	6166789d-c5b1-4d2d-9e67-110216c6fac7	resolution	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"message": "Đã lắp đặt biển báo \\"Khu vực nguy hiểm - Không được vào\\" và biển cảnh báo hóa chất."}	2025-11-17 13:36:39.813382
a951c683-2015-4b4b-80f8-1625c382ca3d	c1ac90a9-db42-483b-9707-1756b285b26e	resolution	3b3c0baf-e68b-4c59-94b2-54731d57726f	{"message": "Đã thu gom rác và vệ sinh khu vực."}	2025-11-18 10:36:39.813382
0207a176-7158-4cd8-9621-8573c6e9f872	15fffcce-fe45-4c46-b57c-9c7966a631d8	resolution	614b0b0b-4097-4117-8d4a-d7962bb92c1a	{"message": "Đầu báo khói bị bụi bẩn. Đã vệ sinh và kiểm tra lại hệ thống."}	2025-11-18 09:36:39.813382
3b045938-e381-4cea-aa40-9ee3d369f904	5db590a2-bdda-49bf-b9bc-2d861f0122c9	resolution	614b0b0b-4097-4117-8d4a-d7962bb92c1a	{"message": "Đã kiểm tra và thay thế motor thay dao. Hệ thống hoạt động bình thường."}	2025-11-18 10:36:39.813382
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incidents (id, incident_type, title, description, location, department_id, reporter_id, assigned_to, priority, status, attachments, escalated_to, escalated_at, escalation_level, resolved_by, resolved_at, resolution_notes, root_cause, corrective_actions, rating, rating_feedback, created_at, updated_at, media_urls, media_metadata, assigned_department_id, accepted_at, accepted_by, notification_sent, notification_sent_at) FROM stdin;
81a4c112-c2f1-4523-9f5d-5f518c7a358f	safety	Oil spill on production floor	Large oil spill detected near machine A-12. Immediate cleanup required.	Production Line A, Zone 3	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	[]	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-16 16:20:26.814097	2025-11-16 16:20:26.814097	\N	\N	\N	\N	\N	f	\N
9bf6800e-9ff1-456e-9a91-0b7d7a8be75c	equipment	Máy ép bị kẹt - Dây chuyền A3	Máy ép số 5 bị kẹt không hoạt động được, phát ra tiếng kêu lạ. Cần kiểm tra gấp để tránh ảnh hưởng sản xuất.	Xưởng sản xuất - Dây chuyền A3	67e150ea-1f65-4dda-887b-8100f4700dc6	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	critical	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 13:21:39.813382	2025-11-18 13:36:39.813382	{https://picsum.photos/seed/machine1/800/600,https://picsum.photos/seed/machine2/800/600}	\N	\N	\N	\N	f	\N
48ac24bb-d570-403f-afe3-e4f6677bc4a2	safety	Phát hiện rò rỉ khí độc - Khu vực B4	Phát hiện mùi hóa chất bất thường tại khu vực B4, nghi ngờ rò rỉ khí độc từ bồn chứa. Cần sơ tán và kiểm tra ngay.	Khu vực B4 - Gần bồn chứa hóa chất số 7	2351c49b-5053-4a75-b486-b8d92b7ff21d	cbb86a19-c894-43f1-8475-fb5201a31041	\N	critical	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 13:28:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
e233e57c-9c13-467c-a516-6e71b2ff3056	safety	Cháy nhỏ tại tủ điện phòng điều khiển	Phát hiện khói và mùi cháy từ tủ điện chính phòng điều khiển. Đã cắt nguồn điện khẩn cấp.	Phòng điều khiển chính - Tầng 2	67e150ea-1f65-4dda-887b-8100f4700dc6	ada87914-6ca1-494f-80b9-a390564bd3e9	614b0b0b-4097-4117-8d4a-d7962bb92c1a	critical	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 12:51:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
4586abb3-53cc-4a32-9202-d152c614c6a6	equipment	Mất điện toàn bộ xưởng C	Toàn bộ xưởng C mất điện đột ngột lúc 14:30. Cần khôi phục gấp.	Xưởng sản xuất C	67e150ea-1f65-4dda-887b-8100f4700dc6	4f65dd1d-a644-4785-8432-275d28a7f1ac	614b0b0b-4097-4117-8d4a-d7962bb92c1a	critical	resolved	\N	\N	\N	0	614b0b0b-4097-4117-8d4a-d7962bb92c1a	2025-11-18 10:36:39.813382	Đã thay thế cầu dao tự động bị hỏng. Hệ thống điện đã hoạt động trở lại bình thường.	\N	\N	\N	\N	2025-11-18 08:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 09:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
eeb8c3ce-ba00-4ed3-aa04-318619851446	safety	Phát hiện rò rỉ dầu - Khu vực B2	Có dầu rò rỉ từ máy nén khí số 3, tạo vũng dầu trên sàn nhà. Nguy cơ trượt ngã cao.	Khu vực B2 - Gần máy nén khí số 3	2351c49b-5053-4a75-b486-b8d92b7ff21d	cbb86a19-c894-43f1-8475-fb5201a31041	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:51:39.813382	2025-11-18 13:36:39.813382	{https://picsum.photos/seed/oil1/800/600}	\N	\N	\N	\N	f	\N
fa0c6a97-17b9-496f-96fa-450621a6beda	other	Thiếu nguyên liệu thép tấm loại A	Kho thiếu nguyên liệu thép tấm loại A, chỉ đủ cho 2 giờ sản xuất. Ảnh hưởng đến tiến độ sản xuất ca chiều.	Kho nguyên vật liệu - Khu A	320d144b-e97f-417e-a3d1-c05680896c88	3b3c0baf-e68b-4c59-94b2-54731d57726f	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:06:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
8eee28c9-8aa1-4e6d-928c-1362bfc19f5f	equipment	Hệ thống thông gió không hoạt động	Quạt thông gió tại khu vực hàn bị hỏng, nhiệt độ tăng cao, ảnh hưởng đến công nhân.	Khu vực hàn - C1	67e150ea-1f65-4dda-887b-8100f4700dc6	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	high	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 10:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 11:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
b0f4721d-c834-424a-9a20-2f5d6db1abca	equipment	Băng tải dây chuyền B1 bị đứt	Băng tải chính dây chuyền B1 bị đứt, dừng toàn bộ dây chuyền.	Dây chuyền B1	67e150ea-1f65-4dda-887b-8100f4700dc6	ada87914-6ca1-494f-80b9-a390564bd3e9	614b0b0b-4097-4117-8d4a-d7962bb92c1a	high	resolved	\N	\N	\N	0	614b0b0b-4097-4117-8d4a-d7962bb92c1a	2025-11-18 09:36:39.813382	Đã thay thế băng tải mới. Kiểm tra và căn chỉnh lại hệ thống. Dây chuyền hoạt động bình thường.	\N	\N	\N	\N	2025-11-18 06:36:39.813382	2025-11-18 13:36:39.813382	{https://picsum.photos/seed/belt1/800/600,https://picsum.photos/seed/belt2/800/600}	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 07:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
20f4c332-c534-45fe-8512-d5ba0bd5b664	quality	Lỗi hàng loạt sản phẩm - Lô SP-2024-11-001	Phát hiện 15% sản phẩm trong lô bị lỗi kích thước không đạt. Cần dừng sản xuất và kiểm tra lại máy móc.	Xưởng sản xuất - Dây chuyền A1	2351c49b-5053-4a75-b486-b8d92b7ff21d	cbb86a19-c894-43f1-8475-fb5201a31041	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 13:11:39.813382	2025-11-18 13:36:39.813382	{https://picsum.photos/seed/defect1/800/600,https://picsum.photos/seed/defect2/800/600,https://picsum.photos/seed/defect3/800/600}	\N	\N	\N	\N	f	\N
cca7c3df-ed42-4a77-b4ed-b632f208bf08	equipment	Rò rỉ nước làm mát hệ thống máy CNC	Phát hiện rò rỉ nước làm mát từ máy CNC số 8, tạo vũng nước lớn.	Xưởng gia công CNC	67e150ea-1f65-4dda-887b-8100f4700dc6	ada87914-6ca1-494f-80b9-a390564bd3e9	614b0b0b-4097-4117-8d4a-d7962bb92c1a	high	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:06:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 12:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
c0a15e2a-827a-4929-a32b-24e432762842	quality	Lỗi bề mặt sản phẩm - Lô SP-2024-11-002	Phát hiện nhiều sản phẩm bị trầy xước bề mặt. Cần kiểm tra lại quy trình đánh bóng.	Xưởng hoàn thiện	2351c49b-5053-4a75-b486-b8d92b7ff21d	cbb86a19-c894-43f1-8475-fb5201a31041	\N	medium	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 11:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
e6147dd3-26fb-4cff-8acc-e45ea97ce2d8	equipment	Máy in mã vạch không hoạt động	Máy in mã vạch tại khu đóng gói bị lỗi, không in được mã QR code.	Khu vực đóng gói	320d144b-e97f-417e-a3d1-c05680896c88	3b3c0baf-e68b-4c59-94b2-54731d57726f	\N	medium	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:56:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
9790f021-2112-4776-bfb5-a6456c0f9dd5	safety	Thiếu găng tay bảo hộ cho công nhân	Kho đồ bảo hộ hết găng tay chịu nhiệt. Cần đặt hàng gấp.	Kho đồ bảo hộ	67e150ea-1f65-4dda-887b-8100f4700dc6	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 09:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	16be4cde-d2d5-4803-aec6-cfe56c6d9419	2025-11-18 10:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
5c46c5db-eb82-4323-82e4-a860a23e877c	other	Ánh sáng yếu tại khu vực kiểm tra chất lượng	Nhiều bóng đèn LED bị hỏng, ánh sáng không đủ cho công tác kiểm tra.	Khu kiểm tra chất lượng - QC Station 3	2351c49b-5053-4a75-b486-b8d92b7ff21d	cbb86a19-c894-43f1-8475-fb5201a31041	\N	medium	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:41:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
77c56238-dd25-421e-b3d9-e3a6f13f8602	other	Cửa kho số 2 bị hỏng khóa	Cửa kho số 2 bị hỏng khóa, không đóng được. Cần sửa chữa để đảm bảo an ninh.	Kho số 2	320d144b-e97f-417e-a3d1-c05680896c88	3b3c0baf-e68b-4c59-94b2-54731d57726f	614b0b0b-4097-4117-8d4a-d7962bb92c1a	medium	resolved	\N	\N	\N	0	614b0b0b-4097-4117-8d4a-d7962bb92c1a	2025-11-18 07:36:39.813382	Đã thay thế khóa cửa mới. Kiểm tra hoạt động tốt.	\N	\N	\N	\N	2025-11-18 03:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 05:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
2ed1a469-8423-4f29-a72d-56b93c9dc99e	equipment	Máy đo nhiệt độ lò nung sai lệch	Nhiệt độ hiển thị trên máy đo không khớp với nhiệt kế chuẩn. Chênh lệch 15°C.	Khu vực lò nung	67e150ea-1f65-4dda-887b-8100f4700dc6	4f65dd1d-a644-4785-8432-275d28a7f1ac	\N	medium	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:24:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
cf17dbcf-1f82-48b1-aab5-33dd95693143	equipment	Rò rỉ khí nén tại đường ống chính	Phát hiện rò rỉ khí nén tại đường ống chính khu vực D, phát ra tiếng rít.	Khu vực D - Đường ống khí nén chính	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	614b0b0b-4097-4117-8d4a-d7962bb92c1a	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 10:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 11:06:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
6652fd13-54cf-482c-b024-f5b51765ca0f	other	Phát hiện pallet gỗ bị mối mọt	Nhiều pallet gỗ tại kho bị mối mọt, cần kiểm tra và xử lý.	Kho thành phẩm - Khu B	320d144b-e97f-417e-a3d1-c05680896c88	3b3c0baf-e68b-4c59-94b2-54731d57726f	\N	medium	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 13:06:39.813382	2025-11-18 13:36:39.813382	{https://picsum.photos/seed/pallet1/800/600}	\N	\N	\N	\N	f	\N
b04e4207-8c68-46e9-aab0-204b4d926c39	other	Bàn ghế phòng họp A bị hư hỏng	Một số ghế phòng họp A bị lỏng ốc, cần siết chặt lại.	Phòng họp A - Tầng 3	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	low	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 08:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
8c960641-b2ea-448e-b6eb-14b486ac7766	other	Máy lạnh phòng văn phòng làm mát kém	Máy lạnh phòng văn phòng hành chính làm mát kém, có thể cần bảo dưỡng.	Văn phòng hành chính - Tầng 2	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	low	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 10:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
37aefc10-86d2-4bbd-806e-fc7fc2bad712	other	Tường khu vực nghỉ trưa bị bong tróc sơn	Tường khu vực nghỉ trưa của công nhân bị bong tróc sơn nhiều chỗ.	Khu vực nghỉ trưa công nhân	67e150ea-1f65-4dda-887b-8100f4700dc6	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	low	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-17 13:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
6166789d-c5b1-4d2d-9e67-110216c6fac7	safety	Thiếu biển báo an toàn tại khu vực nguy hiểm	Khu vực hóa chất thiếu biển báo cảnh báo nguy hiểm.	Khu vực hóa chất	2351c49b-5053-4a75-b486-b8d92b7ff21d	cbb86a19-c894-43f1-8475-fb5201a31041	\N	low	resolved	\N	\N	\N	0	0ff4679e-723b-4712-ba0b-6f4af00824fc	2025-11-17 13:36:39.813382	Đã lắp đặt biển báo "Khu vực nguy hiểm - Không được vào" và biển cảnh báo hóa chất.	\N	\N	\N	\N	2025-11-15 13:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	16be4cde-d2d5-4803-aec6-cfe56c6d9419	2025-11-16 13:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
1f052fb3-4da3-4954-bab9-814ff8eac590	other	Máy tính bàn QC chạy chậm	Máy tính tại bàn QC-05 chạy rất chậm, ảnh hưởng đến công việc nhập liệu.	Phòng QC - Bàn QC-05	2351c49b-5053-4a75-b486-b8d92b7ff21d	cbb86a19-c894-43f1-8475-fb5201a31041	\N	low	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 07:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
c1ac90a9-db42-483b-9707-1756b285b26e	other	Thùng rác khu A đầy, cần thu gom	Thùng rác tại khu A đã đầy, rác tràn ra ngoài.	Khu vực A	67e150ea-1f65-4dda-887b-8100f4700dc6	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	low	resolved	\N	\N	\N	0	3b3c0baf-e68b-4c59-94b2-54731d57726f	2025-11-18 10:36:39.813382	Đã thu gom rác và vệ sinh khu vực.	\N	\N	\N	\N	2025-11-18 09:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
19836205-f0dd-4a51-b0c8-24ea492323f8	equipment	Máy hàn số 12 bị chập điện	Máy hàn số 12 bị chập điện khi vận hành, phát ra tia lửa điện. Rất nguy hiểm!	Khu vực hàn - Station 12	67e150ea-1f65-4dda-887b-8100f4700dc6	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	critical	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 13:31:39.813382	2025-11-18 13:36:39.813382	{https://picsum.photos/seed/weld1/800/600}	\N	\N	\N	\N	f	\N
d4bbc43d-ba0b-42f5-9fa4-d6a7b4bf2f55	equipment	Xe nâng FL-03 hỏng hệ thống phanh	Xe nâng FL-03 có dấu hiệu hỏng phanh, phanh không ăn. Đã dừng sử dụng.	Kho nguyên vật liệu	320d144b-e97f-417e-a3d1-c05680896c88	3b3c0baf-e68b-4c59-94b2-54731d57726f	614b0b0b-4097-4117-8d4a-d7962bb92c1a	high	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:36:39.813382	2025-11-18 13:36:39.813382	{https://picsum.photos/seed/forklift1/800/600}	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 13:06:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
15fffcce-fe45-4c46-b57c-9c7966a631d8	other	Hệ thống báo cháy kêu nhầm	Hệ thống báo cháy khu vực E kêu liên tục nhưng không có cháy.	Khu vực E	67e150ea-1f65-4dda-887b-8100f4700dc6	ada87914-6ca1-494f-80b9-a390564bd3e9	\N	medium	resolved	\N	\N	\N	0	614b0b0b-4097-4117-8d4a-d7962bb92c1a	2025-11-18 09:36:39.813382	Đầu báo khói bị bụi bẩn. Đã vệ sinh và kiểm tra lại hệ thống.	\N	\N	\N	\N	2025-11-18 07:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 08:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
e9beb818-dfdb-402a-add0-478311bbc356	safety	Nước thải có màu bất thường	Phát hiện nước thải xưởng có màu đen đặc, vượt ngưỡng cho phép.	Hệ thống xử lý nước thải	2351c49b-5053-4a75-b486-b8d92b7ff21d	cbb86a19-c894-43f1-8475-fb5201a31041	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 13:16:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
60adfd1c-6321-47a7-b62c-353ecd215e81	equipment	Robot hàn RB-05 lỗi chương trình	Robot hàn RB-05 hàn sai vị trí, nghi ngờ lỗi chương trình điều khiển.	Dây chuyền robot hàn	67e150ea-1f65-4dda-887b-8100f4700dc6	ada87914-6ca1-494f-80b9-a390564bd3e9	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 11:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 12:06:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
4f345ab6-de76-479f-b8c4-f98fdf9bb6c8	equipment	Máy bơm nước vệ sinh bị rò nhẹ	Máy bơm nước tại khu vệ sinh công nhân bị rò nước nhẹ từ đường ống nối.	Khu vệ sinh công nhân	67e150ea-1f65-4dda-887b-8100f4700dc6	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	low	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 11:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
c73812ed-8b0f-4e10-9d10-cc5a9bd75186	safety	Kính bảo vệ máy mài số 7 bị nứt	Phát hiện kính bảo vệ máy mài số 7 bị nứt, có nguy cơ vỡ khi vận hành.	Xưởng gia công - Station 7	67e150ea-1f65-4dda-887b-8100f4700dc6	ada87914-6ca1-494f-80b9-a390564bd3e9	\N	medium	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 13:01:39.813382	2025-11-18 13:36:39.813382	{https://picsum.photos/seed/glass1/800/600}	\N	\N	\N	\N	f	\N
3ae4c271-0fec-4f85-ae51-001aa964c0f3	other	Camera giám sát khu vực B mất tín hiệu	3 camera tại khu vực B không hiển thị hình ảnh, màn hình đen.	Khu vực B	67e150ea-1f65-4dda-887b-8100f4700dc6	0ff4679e-723b-4712-ba0b-6f4af00824fc	\N	low	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 09:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
e4d19dcf-f102-4157-bf62-b2ba81a54133	safety	Sàn nhà khu vực đóng gói bị trơn trượt	Sàn nhà khu vực đóng gói bị ướt, rất trơn trượt. Nguy cơ tai nạn lao động.	Khu vực đóng gói	320d144b-e97f-417e-a3d1-c05680896c88	3b3c0baf-e68b-4c59-94b2-54731d57726f	\N	medium	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:46:39.813382	2025-11-18 13:36:39.813382	\N	\N	\N	\N	\N	f	\N
2f8559d0-f1d9-4ede-8295-f9378d45ce2f	equipment	Nhiệt độ phòng lạnh tăng cao bất thường	Nhiệt độ phòng lạnh tăng từ -5°C lên 8°C. Nguy cơ hỏng nguyên liệu.	Phòng lạnh số 1	320d144b-e97f-417e-a3d1-c05680896c88	3b3c0baf-e68b-4c59-94b2-54731d57726f	614b0b0b-4097-4117-8d4a-d7962bb92c1a	high	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-18 12:56:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 13:11:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
5db590a2-bdda-49bf-b9bc-2d861f0122c9	equipment	Máy cắt CNC-03 lỗi thay dao tự động	Hệ thống thay dao tự động của máy CNC-03 không hoạt động.	Xưởng CNC	67e150ea-1f65-4dda-887b-8100f4700dc6	4f65dd1d-a644-4785-8432-275d28a7f1ac	614b0b0b-4097-4117-8d4a-d7962bb92c1a	medium	resolved	\N	\N	\N	0	614b0b0b-4097-4117-8d4a-d7962bb92c1a	2025-11-18 10:36:39.813382	Đã kiểm tra và thay thế motor thay dao. Hệ thống hoạt động bình thường.	\N	\N	\N	\N	2025-11-18 06:36:39.813382	2025-11-18 13:36:39.813382	\N	\N	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2025-11-18 08:36:39.813382	0ff4679e-723b-4712-ba0b-6f4af00824fc	t	\N
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news (id, category, title, content, excerpt, author_id, target_audience, target_departments, is_priority, publish_at, status, attachments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: news_read_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_read_receipts (id, news_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: news_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_views (id, news_id, user_id, viewed_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, recipient_id, type, title, message, reference_type, reference_id, action_url, is_read, read_at, created_at, recipient_department_id, related_incident_id, related_idea_id, related_news_id, sent_via, metadata) FROM stdin;
e553e218-c264-4210-bb21-506898ae66df	614b0b0b-4097-4117-8d4a-d7962bb92c1a	incident_assigned	Sự cố được phân công: Máy cắt CNC-03 lỗi thay dao tự động	Sự cố mức độ Trung bình đã được phân công cho phòng Maintenance. Vui lòng xử lý ngay.	incident	5db590a2-bdda-49bf-b9bc-2d861f0122c9	/incidents/5db590a2-bdda-49bf-b9bc-2d861f0122c9	f	\N	2025-11-18 17:47:38.731936	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	5db590a2-bdda-49bf-b9bc-2d861f0122c9	\N	\N	{"web": true, "mobile": false}	\N
b1a84280-d59c-47de-8733-ee7988d5e3b3	614b0b0b-4097-4117-8d4a-d7962bb92c1a	incident_assigned	Sự cố được phân công: Nhiệt độ phòng lạnh tăng cao bất thường	Sự cố mức độ CAO đã được phân công cho phòng Maintenance. Vui lòng xử lý ngay.	incident	2f8559d0-f1d9-4ede-8295-f9378d45ce2f	/incidents/2f8559d0-f1d9-4ede-8295-f9378d45ce2f	f	\N	2025-11-18 17:47:38.731936	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	2f8559d0-f1d9-4ede-8295-f9378d45ce2f	\N	\N	{"web": true, "mobile": false}	\N
f1203d76-9a14-4ad9-b7c3-02e6f0e66ed1	614b0b0b-4097-4117-8d4a-d7962bb92c1a	incident_assigned	Sự cố được phân công: Xe nâng FL-03 hỏng hệ thống phanh	Sự cố mức độ CAO đã được phân công cho phòng Maintenance. Vui lòng xử lý ngay.	incident	d4bbc43d-ba0b-42f5-9fa4-d6a7b4bf2f55	/incidents/d4bbc43d-ba0b-42f5-9fa4-d6a7b4bf2f55	f	\N	2025-11-18 17:47:38.731936	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	d4bbc43d-ba0b-42f5-9fa4-d6a7b4bf2f55	\N	\N	{"web": true, "mobile": false}	\N
ab46ce8f-1e03-4738-8d6a-e42adae9afd8	614b0b0b-4097-4117-8d4a-d7962bb92c1a	incident_assigned	Sự cố được phân công: Cửa kho số 2 bị hỏng khóa	Sự cố mức độ Trung bình đã được phân công cho phòng Maintenance. Vui lòng xử lý ngay.	incident	77c56238-dd25-421e-b3d9-e3a6f13f8602	/incidents/77c56238-dd25-421e-b3d9-e3a6f13f8602	f	\N	2025-11-18 17:47:38.731936	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	77c56238-dd25-421e-b3d9-e3a6f13f8602	\N	\N	{"web": true, "mobile": false}	\N
dab9f83c-d34b-4058-8c5f-f31291d883a4	614b0b0b-4097-4117-8d4a-d7962bb92c1a	incident_assigned	Sự cố được phân công: Rò rỉ nước làm mát hệ thống máy CNC	Sự cố mức độ CAO đã được phân công cho phòng Maintenance. Vui lòng xử lý ngay.	incident	cca7c3df-ed42-4a77-b4ed-b632f208bf08	/incidents/cca7c3df-ed42-4a77-b4ed-b632f208bf08	f	\N	2025-11-18 17:47:38.731936	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	cca7c3df-ed42-4a77-b4ed-b632f208bf08	\N	\N	{"web": true, "mobile": false}	\N
d0b45953-38e2-4451-9878-788fc8a64e86	614b0b0b-4097-4117-8d4a-d7962bb92c1a	incident_assigned	Sự cố được phân công: Băng tải dây chuyền B1 bị đứt	Sự cố mức độ CAO đã được phân công cho phòng Maintenance. Vui lòng xử lý ngay.	incident	b0f4721d-c834-424a-9a20-2f5d6db1abca	/incidents/b0f4721d-c834-424a-9a20-2f5d6db1abca	f	\N	2025-11-18 17:47:38.731936	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	b0f4721d-c834-424a-9a20-2f5d6db1abca	\N	\N	{"web": true, "mobile": false}	\N
4d28dfd5-1d07-4061-8fcb-90def41c41f2	614b0b0b-4097-4117-8d4a-d7962bb92c1a	incident_assigned	Sự cố được phân công: Mất điện toàn bộ xưởng C	Sự cố mức độ KHẨN CẤP đã được phân công cho phòng Maintenance. Vui lòng xử lý ngay.	incident	4586abb3-53cc-4a32-9202-d152c614c6a6	/incidents/4586abb3-53cc-4a32-9202-d152c614c6a6	f	\N	2025-11-18 17:47:38.731936	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	4586abb3-53cc-4a32-9202-d152c614c6a6	\N	\N	{"web": true, "mobile": false}	\N
e99358e2-380a-4db5-97f3-afd9cc22a89a	614b0b0b-4097-4117-8d4a-d7962bb92c1a	incident_assigned	Sự cố được phân công: Cháy nhỏ tại tủ điện phòng điều khiển	Sự cố mức độ KHẨN CẤP đã được phân công cho phòng Maintenance. Vui lòng xử lý ngay.	incident	e233e57c-9c13-467c-a516-6e71b2ff3056	/incidents/e233e57c-9c13-467c-a516-6e71b2ff3056	f	\N	2025-11-18 17:47:38.731936	9dd521c3-3ec5-4711-93cc-dbb72e1821d6	e233e57c-9c13-467c-a516-6e71b2ff3056	\N	\N	{"web": true, "mobile": false}	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, employee_code, email, password, full_name, phone, role, level, department_id, is_active, password_reset_token, password_reset_expires, last_login, created_at, updated_at, username, avatar_url) FROM stdin;
4f65dd1d-a644-4785-8432-275d28a7f1ac	PROD001	prod.manager@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Trần Thị Sản Xuất	\N	production_manager	3	67e150ea-1f65-4dda-887b-8100f4700dc6	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-18 00:32:15.20522	prod_manager	\N
614b0b0b-4097-4117-8d4a-d7962bb92c1a	MA001	ma.manager@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Lê Văn Bảo Trì	\N	maintenance_manager	3	494f2da3-b371-4381-ad70-7cf6805a07c9	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-18 00:32:15.20522	ma_manager	\N
cbb86a19-c894-43f1-8475-fb5201a31041	QC001	qc.manager@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Phạm Thị Chất Lượng	\N	qc_inspector	8	2351c49b-5053-4a75-b486-b8d92b7ff21d	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-18 00:32:15.20522	qc_manager	\N
3b3c0baf-e68b-4c59-94b2-54731d57726f	LOG001	logistics.manager@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Hoàng Văn Kho Vận	\N	team_leader	5	320d144b-e97f-417e-a3d1-c05680896c88	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-18 00:32:15.20522	logistics_manager	\N
ada87914-6ca1-494f-80b9-a390564bd3e9	TL001	teamlead.prod@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Ngô Văn Trưởng Nhóm	\N	team_leader	5	67e150ea-1f65-4dda-887b-8100f4700dc6	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-18 00:32:15.20522	team_leader	\N
e3084203-e4cf-48b9-8f55-7365f30a2175	OP001	operator@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Vũ Thị Công Nhân	\N	operator	6	67e150ea-1f65-4dda-887b-8100f4700dc6	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-18 00:32:15.20522	operator	\N
0ff4679e-723b-4712-ba0b-6f4af00824fc	SUP001	supervisor@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Nguyễn Văn Giám Sát	\N	supervisor	4	\N	t	\N	\N	2025-11-18 20:30:43.197761	2025-11-18 00:07:25.108263	2025-11-18 20:30:43.197761	supervisor	\N
3d25ff39-5149-4b65-9db7-e70213707bb7	ADMIN001	admin@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	System Administrator	\N	admin	1	\N	t	\N	\N	2025-11-18 20:32:48.209991	2025-11-16 15:42:32.75194	2025-11-18 20:32:48.209991	\N	\N
\.


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: idea_history idea_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_history
    ADD CONSTRAINT idea_history_pkey PRIMARY KEY (id);


--
-- Name: idea_responses idea_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_responses
    ADD CONSTRAINT idea_responses_pkey PRIMARY KEY (id);


--
-- Name: ideas ideas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_pkey PRIMARY KEY (id);


--
-- Name: incident_comments incident_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_pkey PRIMARY KEY (id);


--
-- Name: incident_department_tasks incident_department_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_department_tasks
    ADD CONSTRAINT incident_department_tasks_pkey PRIMARY KEY (id);


--
-- Name: incident_history incident_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: news_read_receipts news_read_receipts_news_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_read_receipts
    ADD CONSTRAINT news_read_receipts_news_id_user_id_key UNIQUE (news_id, user_id);


--
-- Name: news_read_receipts news_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_read_receipts
    ADD CONSTRAINT news_read_receipts_pkey PRIMARY KEY (id);


--
-- Name: news_views news_views_news_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_news_id_user_id_key UNIQUE (news_id, user_id);


--
-- Name: news_views news_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_code_key UNIQUE (employee_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_departments_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_code ON public.departments USING btree (code);


--
-- Name: idx_departments_manager_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_manager_id ON public.departments USING btree (manager_id);


--
-- Name: idx_departments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_parent_id ON public.departments USING btree (parent_id);


--
-- Name: idx_idea_responses_idea_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_idea_responses_idea_id ON public.idea_responses USING btree (idea_id);


--
-- Name: idx_idea_responses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_idea_responses_user_id ON public.idea_responses USING btree (user_id);


--
-- Name: idx_ideas_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_assigned_to ON public.ideas USING btree (assigned_to);


--
-- Name: idx_ideas_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_created_at ON public.ideas USING btree (created_at);


--
-- Name: idx_ideas_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_department_id ON public.ideas USING btree (department_id);


--
-- Name: idx_ideas_ideabox_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_ideabox_type ON public.ideas USING btree (ideabox_type);


--
-- Name: idx_ideas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_status ON public.ideas USING btree (status);


--
-- Name: idx_ideas_submitter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_submitter_id ON public.ideas USING btree (submitter_id);


--
-- Name: idx_incident_comments_incident_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incident_comments_incident_id ON public.incident_comments USING btree (incident_id);


--
-- Name: idx_incident_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incident_comments_user_id ON public.incident_comments USING btree (user_id);


--
-- Name: idx_incidents_accepted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_accepted ON public.incidents USING btree (accepted_at, accepted_by);


--
-- Name: idx_incidents_assigned_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_assigned_dept ON public.incidents USING btree (assigned_department_id);


--
-- Name: idx_incidents_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_assigned_to ON public.incidents USING btree (assigned_to);


--
-- Name: idx_incidents_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_created_at ON public.incidents USING btree (created_at);


--
-- Name: idx_incidents_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_department_id ON public.incidents USING btree (department_id);


--
-- Name: idx_incidents_media; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_media ON public.incidents USING gin (media_urls);


--
-- Name: idx_incidents_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_priority ON public.incidents USING btree (priority);


--
-- Name: idx_incidents_reporter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_reporter_id ON public.incidents USING btree (reporter_id);


--
-- Name: idx_incidents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_status ON public.incidents USING btree (status);


--
-- Name: idx_news_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_author_id ON public.news USING btree (author_id);


--
-- Name: idx_news_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_category ON public.news USING btree (category);


--
-- Name: idx_news_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_created_at ON public.news USING btree (created_at);


--
-- Name: idx_news_publish_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_publish_at ON public.news USING btree (publish_at);


--
-- Name: idx_news_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_status ON public.news USING btree (status);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_dept ON public.notifications USING btree (recipient_department_id, is_read);


--
-- Name: idx_notifications_incident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_incident ON public.notifications USING btree (related_incident_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_id, is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (recipient_id);


--
-- Name: idx_users_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_department ON public.users USING btree (department_id);


--
-- Name: idx_users_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_department_id ON public.users USING btree (department_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_employee_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_employee_code ON public.users USING btree (employee_code);


--
-- Name: idx_users_password_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: departments update_departments_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_departments_timestamp BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: ideas update_ideas_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ideas_timestamp BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: incidents update_incidents_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_incidents_timestamp BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: news update_news_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_news_timestamp BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: users update_users_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: departments fk_departments_manager; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: idea_history idea_history_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_history
    ADD CONSTRAINT idea_history_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;


--
-- Name: idea_history idea_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_history
    ADD CONSTRAINT idea_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: idea_responses idea_responses_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_responses
    ADD CONSTRAINT idea_responses_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;


--
-- Name: idea_responses idea_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_responses
    ADD CONSTRAINT idea_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ideas ideas_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ideas ideas_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: ideas ideas_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ideas ideas_submitter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_submitter_id_fkey FOREIGN KEY (submitter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: incident_comments incident_comments_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_comments incident_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: incident_department_tasks incident_department_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_department_tasks
    ADD CONSTRAINT incident_department_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incident_department_tasks incident_department_tasks_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_department_tasks
    ADD CONSTRAINT incident_department_tasks_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: incident_department_tasks incident_department_tasks_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_department_tasks
    ADD CONSTRAINT incident_department_tasks_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_history incident_history_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_history incident_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: incidents incidents_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_escalated_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_escalated_to_fkey FOREIGN KEY (escalated_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: incidents incidents_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: news_read_receipts news_read_receipts_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_read_receipts
    ADD CONSTRAINT news_read_receipts_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON DELETE CASCADE;


--
-- Name: news_read_receipts news_read_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_read_receipts
    ADD CONSTRAINT news_read_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: news_views news_views_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON DELETE CASCADE;


--
-- Name: news_views news_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_department_id_fkey FOREIGN KEY (recipient_department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_idea_id_fkey FOREIGN KEY (related_idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_incident_id_fkey FOREIGN KEY (related_incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_news_id_fkey FOREIGN KEY (related_news_id) REFERENCES public.news(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict mI7CwJfHfffOZrL7S8ydViSSGnVhpWaW6KxFQ3K7y9PC7Pf1CfWepkauYmxtSTk

