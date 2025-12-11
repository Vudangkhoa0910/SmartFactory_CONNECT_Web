--
-- PostgreSQL database dump
--

\restrict rb9KmOFPrrksmnx5YpcjFuFvrWMRFtMazbN8Rc5eXXrVRKZl8H5h2h2xd6tGZM2

-- Dumped from database version 14.20
-- Dumped by pg_dump version 14.20

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
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: idea_category; Type: TYPE; Schema: public; Owner: tuan
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


ALTER TYPE public.idea_category OWNER TO tuan;

--
-- Name: idea_status; Type: TYPE; Schema: public; Owner: tuan
--

CREATE TYPE public.idea_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'implemented',
    'on_hold'
);


ALTER TYPE public.idea_status OWNER TO tuan;

--
-- Name: ideabox_type; Type: TYPE; Schema: public; Owner: tuan
--

CREATE TYPE public.ideabox_type AS ENUM (
    'white',
    'pink'
);


ALTER TYPE public.ideabox_type OWNER TO tuan;

--
-- Name: incident_status; Type: TYPE; Schema: public; Owner: tuan
--

CREATE TYPE public.incident_status AS ENUM (
    'pending',
    'assigned',
    'in_progress',
    'resolved',
    'closed',
    'cancelled',
    'escalated',
    'on_hold'
);


ALTER TYPE public.incident_status OWNER TO tuan;

--
-- Name: incident_type; Type: TYPE; Schema: public; Owner: tuan
--

CREATE TYPE public.incident_type AS ENUM (
    'safety',
    'quality',
    'equipment',
    'other'
);


ALTER TYPE public.incident_type OWNER TO tuan;

--
-- Name: news_category; Type: TYPE; Schema: public; Owner: tuan
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


ALTER TYPE public.news_category OWNER TO tuan;

--
-- Name: news_status; Type: TYPE; Schema: public; Owner: tuan
--

CREATE TYPE public.news_status AS ENUM (
    'draft',
    'published',
    'archived',
    'deleted'
);


ALTER TYPE public.news_status OWNER TO tuan;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: tuan
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


ALTER TYPE public.notification_type OWNER TO tuan;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: tuan
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO tuan;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: tuan
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


ALTER TABLE public.departments OWNER TO tuan;

--
-- Name: TABLE departments; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON TABLE public.departments IS 'Factory departments and organizational structure';


--
-- Name: ideas; Type: TABLE; Schema: public; Owner: tuan
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
    handler_level character varying(50) DEFAULT 'supervisor'::character varying,
    CONSTRAINT ideas_feasibility_score_check CHECK (((feasibility_score >= 1) AND (feasibility_score <= 10))),
    CONSTRAINT ideas_impact_score_check CHECK (((impact_score >= 1) AND (impact_score <= 10)))
);


ALTER TABLE public.ideas OWNER TO tuan;

--
-- Name: TABLE ideas; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON TABLE public.ideas IS 'Employee ideas and suggestions (White and Pink Box)';


--
-- Name: users; Type: TABLE; Schema: public; Owner: tuan
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


ALTER TABLE public.users OWNER TO tuan;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON TABLE public.users IS 'System users with roles and permissions';


--
-- Name: active_ideas; Type: VIEW; Schema: public; Owner: tuan
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


ALTER TABLE public.active_ideas OWNER TO tuan;

--
-- Name: incidents; Type: TABLE; Schema: public; Owner: tuan
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


ALTER TABLE public.incidents OWNER TO tuan;

--
-- Name: TABLE incidents; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON TABLE public.incidents IS 'Incident reports from factory floor';


--
-- Name: COLUMN incidents.media_urls; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON COLUMN public.incidents.media_urls IS 'Array of uploaded media file URLs (images/videos)';


--
-- Name: COLUMN incidents.media_metadata; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON COLUMN public.incidents.media_metadata IS 'Metadata for media files: type, size, dimensions, thumbnail';


--
-- Name: COLUMN incidents.assigned_department_id; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON COLUMN public.incidents.assigned_department_id IS 'Department assigned to handle this incident';


--
-- Name: COLUMN incidents.accepted_at; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON COLUMN public.incidents.accepted_at IS 'When incident was accepted from queue';


--
-- Name: COLUMN incidents.accepted_by; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON COLUMN public.incidents.accepted_by IS 'User who accepted the incident';


--
-- Name: active_incidents; Type: VIEW; Schema: public; Owner: tuan
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


ALTER TABLE public.active_incidents OWNER TO tuan;

--
-- Name: idea_history; Type: TABLE; Schema: public; Owner: tuan
--

CREATE TABLE public.idea_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    idea_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    performed_by uuid NOT NULL,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.idea_history OWNER TO tuan;

--
-- Name: idea_responses; Type: TABLE; Schema: public; Owner: tuan
--

CREATE TABLE public.idea_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    idea_id uuid NOT NULL,
    user_id uuid NOT NULL,
    response text NOT NULL,
    attachments jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.idea_responses OWNER TO tuan;

--
-- Name: incident_comments; Type: TABLE; Schema: public; Owner: tuan
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


ALTER TABLE public.incident_comments OWNER TO tuan;

--
-- Name: incident_department_tasks; Type: TABLE; Schema: public; Owner: tuan
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


ALTER TABLE public.incident_department_tasks OWNER TO tuan;

--
-- Name: incident_history; Type: TABLE; Schema: public; Owner: tuan
--

CREATE TABLE public.incident_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incident_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    performed_by uuid NOT NULL,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.incident_history OWNER TO tuan;

--
-- Name: news; Type: TABLE; Schema: public; Owner: tuan
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


ALTER TABLE public.news OWNER TO tuan;

--
-- Name: TABLE news; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON TABLE public.news IS 'Company news and announcements';


--
-- Name: news_read_receipts; Type: TABLE; Schema: public; Owner: tuan
--

CREATE TABLE public.news_read_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    news_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.news_read_receipts OWNER TO tuan;

--
-- Name: news_views; Type: TABLE; Schema: public; Owner: tuan
--

CREATE TABLE public.news_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    news_id uuid NOT NULL,
    user_id uuid NOT NULL,
    viewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.news_views OWNER TO tuan;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: tuan
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


ALTER TABLE public.notifications OWNER TO tuan;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON TABLE public.notifications IS 'System-wide notifications for incidents, ideas, news';


--
-- Name: COLUMN notifications.recipient_department_id; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON COLUMN public.notifications.recipient_department_id IS 'Notify entire department';


--
-- Name: COLUMN notifications.related_incident_id; Type: COMMENT; Schema: public; Owner: tuan
--

COMMENT ON COLUMN public.notifications.related_incident_id IS 'Link to incident';


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.departments (id, code, name, description, parent_id, manager_id, is_active, created_at, updated_at) FROM stdin;
ce43ac98-5107-47d2-aac4-26cb4ecde5ce	PROD	Sản xuất	Quản lý công nhân, nhận yêu cầu hỗ trợ, thực hiện quy trình sản xuất	\N	\N	t	2025-11-19 16:21:21.154816	2025-11-19 16:21:21.154816
f17694bb-56c8-45fa-aad3-f6fa3fa30f70	EXT_INSP	Kiểm tra ngoài	Mũ đỏ: kiểm tra cuối cùng; Mũ xanh: kiểm tra đầu vào	\N	\N	t	2025-11-19 16:21:21.156875	2025-11-19 16:21:21.156875
64a06277-5886-46c3-b6bd-313977905431	TRANS	Vận chuyển	Di chuyển nguyên vật liệu, thành phẩm nội bộ	\N	\N	t	2025-11-19 16:21:21.158134	2025-11-19 16:21:21.158134
da4e7caf-e1f2-4c07-b218-507bb599c568	LOG	Logistic	Quản lý xe tải, vận chuyển khách hàng	\N	\N	t	2025-11-19 16:21:21.159493	2025-11-19 16:21:21.159493
5410f259-7926-4a34-a48a-e8969c009813	FAC	Phòng thiết bị	Cấp điện, khí, sửa chữa hạ tầng	\N	\N	t	2025-11-19 16:21:21.161337	2025-11-19 16:21:21.161337
57d83193-a73c-4141-b2d0-070193a6c150	MA	MA	Sửa chữa, bảo trì máy móc, hỗ trợ kỹ thuật	\N	\N	t	2025-11-19 16:21:21.163153	2025-11-19 16:21:21.163153
978cf7b5-3cf1-45b8-859c-4e5261ad7a7a	PE	Kỹ thuật sản xuất	Giám sát điều kiện sản xuất, tối ưu dây chuyền	\N	\N	t	2025-11-19 16:21:21.16435	2025-11-19 16:21:21.16435
b735780f-1839-47db-ad94-aa6bf4549ab7	QA	Phòng đánh giá chất lượng	Kiểm tra chất lượng, báo cáo lỗi	\N	\N	t	2025-11-19 16:21:21.165744	2025-11-19 16:21:21.165744
f02b86fb-d681-4d1c-afd8-9c659867d4b8	PM	Quản lý sản xuất	Kiểm kê, thống kê, KPI	\N	\N	t	2025-11-19 16:21:21.167326	2025-11-19 16:21:21.167326
\.


--
-- Data for Name: idea_history; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.idea_history (id, idea_id, action, performed_by, details, created_at) FROM stdin;
2c41ac30-9acc-4680-bb99-8c96cbf564ef	d9ff6eaf-10ea-4c1d-aeca-c093afccd7e8	submitted	47a342ff-e959-47ff-a49d-4cadd357ea7a	{"status": "pending", "ideabox_type": "pink"}	2025-11-20 00:28:59.225766
5f2c4a18-6e3f-47ae-80fb-b8633642f487	47116e67-24c5-4c3f-9ad9-d39499bf4c5b	submitted	47a342ff-e959-47ff-a49d-4cadd357ea7a	{"status": "pending", "ideabox_type": "white"}	2025-11-20 00:29:24.827392
4b751423-bffb-42f2-97ed-08d002f1f7e1	47116e67-24c5-4c3f-9ad9-d39499bf4c5b	escalated	0ff4679e-723b-4712-ba0b-6f4af00824fc	{"reason": "Forwarded", "to_level": "manager", "from_level": "supervisor"}	2025-11-20 00:29:49.382114
ded0c315-9e45-49c3-97f1-b52afed2d35d	47116e67-24c5-4c3f-9ad9-d39499bf4c5b	escalated	4f65dd1d-a644-4785-8432-275d28a7f1ac	{"reason": "Forwarded", "to_level": "general_manager", "from_level": "manager"}	2025-11-20 00:30:07.272571
\.


--
-- Data for Name: idea_responses; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.idea_responses (id, idea_id, user_id, response, attachments, created_at) FROM stdin;
8f2bf1c2-4ada-4f18-b1e1-84839307dc63	47116e67-24c5-4c3f-9ad9-d39499bf4c5b	0ff4679e-723b-4712-ba0b-6f4af00824fc	Escalated to manager. Reason: Forwarded	\N	2025-11-20 00:29:49.383493
5fc4d6ca-ab4b-464b-8e2e-33e4205d73d6	47116e67-24c5-4c3f-9ad9-d39499bf4c5b	4f65dd1d-a644-4785-8432-275d28a7f1ac	Escalated to general_manager. Reason: Forwarded	\N	2025-11-20 00:30:07.273633
\.


--
-- Data for Name: ideas; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.ideas (id, ideabox_type, category, title, description, expected_benefit, submitter_id, department_id, is_anonymous, assigned_to, status, attachments, reviewed_by, reviewed_at, review_notes, feasibility_score, impact_score, implemented_at, implementation_notes, actual_benefit, created_at, updated_at, handler_level) FROM stdin;
d9ff6eaf-10ea-4c1d-aeca-c093afccd7e8	pink	workplace	ggggg	ggggg	ffff	47a342ff-e959-47ff-a49d-4cadd357ea7a	\N	t	\N	pending	[]	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 00:28:59.213946	2025-11-20 00:28:59.213946	general_manager
47116e67-24c5-4c3f-9ad9-d39499bf4c5b	white	quality_improvement	rrrrrrr	rrrrrrr	ttttrrt	47a342ff-e959-47ff-a49d-4cadd357ea7a	\N	f	\N	under_review	[]	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 00:29:24.824892	2025-11-20 00:30:07.271315	general_manager
\.


--
-- Data for Name: incident_comments; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.incident_comments (id, incident_id, user_id, comment, attachments, created_at, media_urls, media_metadata) FROM stdin;
c04e58b0-7333-4a13-88ab-755bebc11073	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	4f65dd1d-a644-4785-8432-275d28a7f1ac	Thử nghiệm	[]	2025-11-19 18:28:19.357716	\N	\N
\.


--
-- Data for Name: incident_department_tasks; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.incident_department_tasks (id, incident_id, department_id, assigned_to, task_description, status, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: incident_history; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.incident_history (id, incident_id, action, performed_by, details, created_at) FROM stdin;
883b8c5f-5101-40c9-979a-659e3461eee8	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:34:03.856244
d8284066-fa6a-487e-866f-534a6c40d3f1	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:34:05.136861
4ba02ffb-01e9-423d-8d9a-dc9df964011a	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:34:06.739952
13ba0f08-1ae6-462c-8960-849626fddef7	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:34:10.514859
3f2c869b-fec0-42a7-86fb-5c9426b434ff	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:34:11.842307
452d4c85-71e6-4430-ba99-574194fe42cf	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 15:34:12.847501
573b9d1e-ae35-40f1-a423-1345386c1786	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:34:14.183145
62c1d150-08ca-409e-aa65-9106b510b639	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:34:15.923268
74b90749-95a3-4429-b6a1-fb7d05b66a9c	3d9e9af1-8ad6-4f0a-b6a9-6306a7e49705	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:36:12.840761
64b7ec91-25ef-42af-bbc8-2eb53092e60c	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:36:13.837075
6345c952-906e-46e4-8d98-9a365a936154	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:36:23.388531
9c73dec1-2150-4375-8294-54d5a20d5d19	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:36:24.300645
f580d487-10d2-4c1b-984e-e3f2799f8a02	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:36:25.307312
3861cdc4-e5e1-4a2e-9371-38b1201905ac	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:37:12.804082
ba93b9cb-9c68-4f95-8f14-3811489f3443	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:37:13.73249
610e5790-477c-4c87-9d1b-42e122ef1ae8	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:37:14.468658
a5fbceee-3e45-40b1-bddb-3d39b70839c4	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:37:15.236537
0ec728b9-2112-46af-a238-a962584260aa	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:37:15.95107
6034ce3f-775f-454c-bd3f-e9f676aee2cd	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:37:16.709725
2b59e6c6-cb6f-496d-afea-2f1478dfe822	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:37:17.962986
25f3ddfe-9a22-4bee-b325-3fa280e4fda4	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:37:19.090931
79b78b06-a8f8-491c-a970-0cc211dc561b	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 15:37:19.916603
e667f200-ab3a-47cb-b49f-af6696acba9e	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 15:37:20.887389
721528cc-94f1-4f06-810d-57792ae57bdd	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 15:37:24.803836
b6f0fc54-5a1e-4ca1-b292-627b65527d4f	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:28:41.083425
64ee2dc6-cb8b-4017-8336-0592b03f1425	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 16:28:42.196242
655f08cb-eb86-4235-b305-e70279054005	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:28:43.509769
b704def9-85b3-4187-9c9a-33e9dc83c0bf	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 16:28:44.733733
0b4e1d26-cdf8-4d6c-8ea5-75d53c43db00	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 16:28:46.022233
dde7c1ea-f6d7-4adf-873e-00949bfe3eb5	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:28:46.858427
c7f11e96-6f26-4b08-93db-22595cb67a5f	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:28:49.374873
3a9b9bd9-3735-425f-ab74-c2eb2bd95e2c	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:28:51.317214
39383cc9-5a3d-4476-b7c9-8ce37d62a0c6	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 16:28:52.739509
3cd7328a-5961-40b5-900c-bbbd1bd7b67c	3d9e9af1-8ad6-4f0a-b6a9-6306a7e49705	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 16:28:53.980542
9a61de40-557e-4ed6-8237-01b858e0714f	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 16:28:55.064193
aae8c1b0-d727-4010-9036-cd43274aae0c	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 16:28:56.405484
f3d788eb-aaf4-497c-821e-a62a48867dd1	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:28:57.543444
138dca97-64d8-43f7-96bb-7e2275546c6e	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:28:58.769893
c13b0b0f-9825-439a-82db-33658afe1f6c	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 16:28:59.930572
01248f9c-e90c-4cef-8eea-d3fd64a107f4	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:29:00.725332
c1122542-d628-4c1c-a872-11366f3dd550	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:29:01.995875
53d91a42-9f83-4a55-af2d-99d32433a3d5	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 16:29:03.563783
6d6c57b6-043f-4b5f-a019-05fc32137393	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:29:05.279575
e6b7c920-6874-41de-86c3-956bf8db9106	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 16:30:35.383357
cc20c670-3737-4234-8688-96299ea34a90	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 16:30:36.58211
63709f17-24bf-48f6-b6d0-25b88bfdc551	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 16:30:37.76104
e97bb0f3-7182-4f11-a9ec-ecbed4ad6c61	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-19 16:30:41.864581
2032fdf7-214c-4085-aa90-5563b74a1c40	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:56:25.58285
8a04fade-1e80-4a2a-b10b-b0e536a8e370	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 16:56:26.524068
dc48e95d-5f73-42c0-8ff6-ad070bcc35d1	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:56:27.476848
c47190dd-b10d-4d79-9974-6479edd87445	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 16:56:28.481086
1d9e06a8-3bbe-4ca3-9ad7-ba3f299af779	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 16:56:29.70137
6027bd00-adfe-420a-9d17-b04f8524911f	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 18:19:27.397698
a0f1afcb-02ef-472e-ad17-30293a5c03b9	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 18:19:28.93157
61cad91e-a3c9-4b09-85d6-50f10cab1f61	3d9e9af1-8ad6-4f0a-b6a9-6306a7e49705	resolved	4f65dd1d-a644-4785-8432-275d28a7f1ac	{"root_cause": "N/A", "resolution_notes": "Resolved via Command Room", "corrective_actions": "N/A"}	2025-11-19 18:27:42.005041
349947be-8453-4667-adef-85c1a1f8086c	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	resolved	4f65dd1d-a644-4785-8432-275d28a7f1ac	{"root_cause": "N/A", "resolution_notes": "Resolved via Command Room", "corrective_actions": "N/A"}	2025-11-19 18:27:42.885505
986384dc-807d-48be-b1a0-41d90dfc8775	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	resolved	4f65dd1d-a644-4785-8432-275d28a7f1ac	{"root_cause": "N/A", "resolution_notes": "Resolved via Command Room", "corrective_actions": "N/A"}	2025-11-19 18:27:55.898027
c7a00846-ffd8-4007-ad1e-4a2295912981	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	acknowledged	4f65dd1d-a644-4785-8432-275d28a7f1ac	{"status": "assigned"}	2025-11-19 18:28:19.346979
c14c7ad9-9618-418d-8823-165e9a936499	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	resolved	4f65dd1d-a644-4785-8432-275d28a7f1ac	{"root_cause": "N/A", "resolution_notes": "Resolved via Command Room", "corrective_actions": "N/A"}	2025-11-19 18:28:23.306403
7150101e-0293-4e57-b752-29be7216fcd5	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-19 20:03:49.290742
923d7cbf-d77e-42a3-b762-709b0f238f2a	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "resolved", "old_status": "unknown"}	2025-11-19 20:03:51.52059
ba57e7d4-3fc1-4d0b-a723-f637f9f2b5c4	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-19 20:03:53.152932
8b9f7412-0aba-4ca1-9515-0318bae3b201	3d9e9af1-8ad6-4f0a-b6a9-6306a7e49705	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-19 20:03:54.294326
fa4c8928-e012-4acf-b9dd-426670eea6f0	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 20:21:50.848949
5ea3e959-a70f-42e1-8425-656e507710c0	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 20:21:52.804246
8033ba6a-7c3b-4f0d-9aa2-ecf0979c746e	c9f1e6dc-a99a-4d8c-89d3-7c159079c170	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 20:21:53.797007
56a0514a-b71b-40a1-9ad5-983db643745e	cd7a5ab0-7513-4482-a1b0-ba87297f1f35	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "pending", "old_status": "unknown"}	2025-11-19 20:21:55.186267
65703a4c-f495-4ac7-8d8b-652ee9fdedee	3d9e9af1-8ad6-4f0a-b6a9-6306a7e49705	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 20:21:56.838613
a3fd2579-5c8c-4324-96b5-5342770bd192	3d9e9af1-8ad6-4f0a-b6a9-6306a7e49705	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-19 20:21:57.873284
7258c5cb-fcfc-4e23-8642-4dbe1850897d	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-19 20:22:04.566063
10e0d704-0ce7-42b8-853b-896968bb1cf8	4a8f91d4-7aa5-40fc-a7d7-429241e496c1	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "in_progress", "old_status": "unknown"}	2025-11-19 20:22:09.871439
cbd57838-9ec5-4aef-ab1e-9cd8b17f70a7	54fd9fbf-cb69-43be-82eb-a92718af9d7c	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-19 20:22:12.096861
3da50a8d-1c89-45ff-af79-16e23f7b54e2	014c9634-705f-4d03-bdca-9261f9b93b79	created	47a342ff-e959-47ff-a49d-4cadd357ea7a	{"status": "pending"}	2025-11-19 22:50:44.944289
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.incidents (id, incident_type, title, description, location, department_id, reporter_id, assigned_to, priority, status, attachments, escalated_to, escalated_at, escalation_level, resolved_by, resolved_at, resolution_notes, root_cause, corrective_actions, rating, rating_feedback, created_at, updated_at, media_urls, media_metadata, assigned_department_id, accepted_at, accepted_by, notification_sent, notification_sent_at) FROM stdin;
c9f1e6dc-a99a-4d8c-89d3-7c159079c170	safety	Oil Spill Cleanup	Small oil spill in assembly line.	\N	\N	e3084203-e4cf-48b9-8f55-7365f30a2175	3b3c0baf-e68b-4c59-94b2-54731d57726f	high	pending	\N	\N	\N	0	4f65dd1d-a644-4785-8432-275d28a7f1ac	2025-11-19 18:27:55.893038	Resolved via Command Room	N/A	N/A	\N	\N	2025-11-19 15:33:52.852969	2025-11-19 20:21:53.791692	\N	\N	\N	\N	\N	f	\N
cd7a5ab0-7513-4482-a1b0-ba87297f1f35	safety	Safety Guard Broken	Safety guard on conveyor belt B is loose.	\N	\N	e3084203-e4cf-48b9-8f55-7365f30a2175	4f65dd1d-a644-4785-8432-275d28a7f1ac	critical	pending	\N	\N	\N	0	4f65dd1d-a644-4785-8432-275d28a7f1ac	2025-11-19 18:28:23.301062	Resolved via Command Room	N/A	N/A	\N	\N	2025-11-19 15:33:52.84765	2025-11-19 20:21:55.181177	\N	\N	\N	\N	\N	f	\N
3d9e9af1-8ad6-4f0a-b6a9-6306a7e49705	equipment	Machine #3 Overheating	Production machine #3 is showing high temperature warnings.	\N	\N	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	high	assigned	\N	\N	\N	0	4f65dd1d-a644-4785-8432-275d28a7f1ac	2025-11-19 18:27:41.99954	Resolved via Command Room	N/A	N/A	\N	\N	2025-11-19 15:33:52.832217	2025-11-19 20:21:57.867713	\N	\N	\N	\N	\N	f	\N
4a8f91d4-7aa5-40fc-a7d7-429241e496c1	equipment	Software Glitch in HMI	HMI screen freezes intermittently.	\N	\N	e3084203-e4cf-48b9-8f55-7365f30a2175	\N	medium	in_progress	\N	\N	\N	0	4f65dd1d-a644-4785-8432-275d28a7f1ac	2025-11-19 18:27:42.880085	Resolved via Command Room	N/A	N/A	\N	\N	2025-11-19 15:33:52.852119	2025-11-19 20:22:09.866484	\N	\N	\N	\N	\N	f	\N
54fd9fbf-cb69-43be-82eb-a92718af9d7c	quality	Quality Check Failure Batch #99	High rejection rate in batch #99 due to dimension errors.	\N	\N	e3084203-e4cf-48b9-8f55-7365f30a2175	0ff4679e-723b-4712-ba0b-6f4af00824fc	medium	on_hold	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-19 15:33:52.849054	2025-11-19 20:22:12.091628	\N	\N	\N	\N	\N	f	\N
014c9634-705f-4d03-bdca-9261f9b93b79	safety	Test	Okskdadadasdasdadasdasdadadasdasdasdasdasdasdasda	May 1	\N	47a342ff-e959-47ff-a49d-4cadd357ea7a	\N	medium	pending	[]	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-19 22:50:44.931054	2025-11-19 22:50:44.931054	\N	\N	\N	\N	\N	f	\N
95bdd161-8734-4de6-a585-0ac05980bb2c	other	Leaking Pipe in Area A	Water pipe leaking near the entrance.	\N	\N	e3084203-e4cf-48b9-8f55-7365f30a2175	614b0b0b-4097-4117-8d4a-d7962bb92c1a	low	resolved	\N	\N	\N	0	614b0b0b-4097-4117-8d4a-d7962bb92c1a	2025-11-19 08:33:52.83	\N	\N	\N	\N	\N	2025-11-19 15:33:52.850041	2025-11-19 16:21:21.129065	\N	\N	\N	\N	\N	f	\N
ea9266a6-2717-4df1-9684-53f5980028a9	equipment	Forklift Maintenance Required	Forklift #2 needs scheduled maintenance.	\N	\N	e3084203-e4cf-48b9-8f55-7365f30a2175	614b0b0b-4097-4117-8d4a-d7962bb92c1a	medium	closed	\N	\N	\N	0	614b0b0b-4097-4117-8d4a-d7962bb92c1a	2025-11-19 08:33:52.83	\N	\N	\N	\N	\N	2025-11-19 15:33:52.851164	2025-11-19 16:21:21.129065	\N	\N	\N	\N	\N	f	\N
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.news (id, category, title, content, excerpt, author_id, target_audience, target_departments, is_priority, publish_at, status, attachments, created_at, updated_at) FROM stdin;
cd15c81d-4524-4be7-b883-7310f87f91ab	company_announcement	Abc	abc	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-19 06:15:06.672	draft	[]	2025-11-19 13:15:06.692591	2025-11-19 13:15:06.692591
5933c934-2320-434c-9d1b-0f8331539536	company_announcement	Abc	oooo	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-19 07:28:54.604	draft	[]	2025-11-19 14:28:54.62488	2025-11-19 14:28:54.62488
13165b52-b6f2-4b60-83d9-a5be592916b7	company_announcement	jjj	kpkp	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-19 07:33:56.512	draft	[]	2025-11-19 14:33:56.942372	2025-11-19 14:33:56.942372
b17245ef-63ce-450c-a466-d248a34fde02	company_announcement	koko	ooko	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-19 07:34:38.017	draft	[]	2025-11-19 14:34:38.427411	2025-11-19 14:34:38.427411
61d166c3-baf3-4408-b55b-028fc5a2f6d2	company_announcement	sdadasd	adsadasdad	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-19 07:36:28.503	draft	[]	2025-11-19 14:36:28.529341	2025-11-19 14:36:28.529341
d63c0ad8-0d76-42ec-a10e-a98f5a75a69a	company_announcement	Test News 1763539736481	This is a test news content.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	\N	draft	[]	2025-11-19 15:08:56.496558	2025-11-19 15:08:56.496558
e1215928-582a-4fb0-9015-08eced870822	company_announcement	Test News 1763539830788	This is a test news content.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	\N	draft	[]	2025-11-19 15:10:30.801778	2025-11-19 15:10:30.801778
f2887d8a-eac3-4a75-b4a8-7bf5e1257543	company_announcement	Test News 1763540059665	This is a test news content.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	\N	draft	[]	2025-11-19 15:14:19.678535	2025-11-19 15:14:19.678535
9ce7df08-0dae-40d3-9165-da350c8cb016	company_announcement	ádasdasd	ádadasas	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-19 07:39:19.974	deleted	[]	2025-11-19 14:39:20.002083	2025-11-19 15:30:25.789939
8afdd216-8828-4694-acb0-5590b5d423c6	company_announcement	ababas	áassa	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-19 08:30:32.852	deleted	[]	2025-11-19 15:30:32.872946	2025-11-19 21:57:51.383113
3f0a0567-5535-4be2-b3e6-682bd6c2e2e0	safety_alert	Toà A2 bị sập	Chú nhé nhé ae	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	t	2025-11-19 14:55:45.22	deleted	[]	2025-11-19 21:55:45.725627	2025-11-19 22:10:00.701799
72635098-fc85-4a26-8455-5f3d395593cd	maintenance	Khẩn cấp	Khét	Cháy	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	t	2025-11-19 15:10:43.596	published	[]	2025-11-19 22:10:43.687153	2025-11-19 22:10:43.687153
\.


--
-- Data for Name: news_read_receipts; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.news_read_receipts (id, news_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: news_views; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.news_views (id, news_id, user_id, viewed_at) FROM stdin;
391b3340-534c-49ec-bfc5-fd6cebdcac8c	8afdd216-8828-4694-acb0-5590b5d423c6	0ff4679e-723b-4712-ba0b-6f4af00824fc	2025-11-19 20:25:41.907457
3089368d-2c5e-4b2b-ac63-e956ed6957fb	8afdd216-8828-4694-acb0-5590b5d423c6	3d25ff39-5149-4b65-9db7-e70213707bb7	2025-11-19 21:57:46.882448
b8fe3999-1260-4e18-ad36-fb9a948083b8	3f0a0567-5535-4be2-b3e6-682bd6c2e2e0	3d25ff39-5149-4b65-9db7-e70213707bb7	2025-11-19 21:57:59.791754
c60251c0-86a7-4282-ae9d-6032bc152c04	3f0a0567-5535-4be2-b3e6-682bd6c2e2e0	47a342ff-e959-47ff-a49d-4cadd357ea7a	2025-11-19 22:07:09.487108
4bbc95a1-e266-43cf-8bca-ea0c753a5a1e	72635098-fc85-4a26-8455-5f3d395593cd	47a342ff-e959-47ff-a49d-4cadd357ea7a	2025-11-19 23:09:23.487407
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.notifications (id, recipient_id, type, title, message, reference_type, reference_id, action_url, is_read, read_at, created_at, recipient_department_id, related_incident_id, related_idea_id, related_news_id, sent_via, metadata) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.users (id, employee_code, email, password, full_name, phone, role, level, department_id, is_active, password_reset_token, password_reset_expires, last_login, created_at, updated_at, username, avatar_url) FROM stdin;
cbb86a19-c894-43f1-8475-fb5201a31041	QC001	qc.manager@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Phạm Thị Chất Lượng	\N	qc_inspector	8	\N	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-19 16:21:21.108716	qc_manager	\N
3b3c0baf-e68b-4c59-94b2-54731d57726f	LOG001	logistics.manager@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Hoàng Văn Kho Vận	\N	team_leader	5	\N	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-19 16:21:21.108716	logistics_manager	\N
ada87914-6ca1-494f-80b9-a390564bd3e9	TL001	teamlead.prod@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Ngô Văn Trưởng Nhóm	\N	team_leader	5	\N	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-19 16:21:21.108716	team_leader	\N
e3084203-e4cf-48b9-8f55-7365f30a2175	OP001	operator@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Vũ Thị Công Nhân	\N	operator	6	\N	t	\N	\N	\N	2025-11-18 00:07:25.108263	2025-11-19 16:21:21.108716	operator	\N
614b0b0b-4097-4117-8d4a-d7962bb92c1a	MA001	ma.manager@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Lê Văn Bảo Trì	\N	manager	2	\N	t	\N	\N	2025-11-19 14:28:20.621122	2025-11-18 00:07:25.108263	2025-11-19 16:21:21.108716	ma_manager	\N
4f65dd1d-a644-4785-8432-275d28a7f1ac	PROD001	prod.manager@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Trần Thị Sản Xuất	\N	manager	2	\N	t	\N	\N	2025-11-19 18:27:12.951608	2025-11-18 00:07:25.108263	2025-11-19 18:27:12.951608	prod_manager	\N
2130c835-b75d-4b17-bf57-76d58a2b706f	MGR001	leader@smartfactory.com	$2a$12$uhMm7BF.g0tGzFXy7m8jUumZq4i9shv9hJSj/qr6cCPbn.EiE0mFG	Trần Thị Q	\N	team_leader	5	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	t	\N	\N	\N	2025-11-19 20:14:34.644806	2025-11-19 20:14:34.644806	\N	\N
47a342ff-e959-47ff-a49d-4cadd357ea7a	EMP001	worker@smartfactory.com	$2a$12$uhMm7BF.g0tGzFXy7m8jUumZq4i9shv9hJSj/qr6cCPbn.EiE0mFG	Nguyễn Văn A	\N	operator	6	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	t	\N	\N	2025-11-19 21:25:58.449391	2025-11-19 20:14:34.627593	2025-11-19 21:25:58.449391	\N	\N
3d25ff39-5149-4b65-9db7-e70213707bb7	ADMIN001	admin@smartfactory.com	$2a$12$SVuZZbx74qtJ07ERikbiE.xm2c3Lhds090nm6wv2MXfrB1yIk4/7C	System Administrator	\N	admin	1	\N	t	\N	\N	2025-11-19 21:36:35.718853	2025-11-16 15:42:32.75194	2025-11-19 21:36:35.718853	\N	\N
0ff4679e-723b-4712-ba0b-6f4af00824fc	SUP001	supervisor@smartfactory.com	$2a$12$lw8wd/E9AeAyGnTb92lTReBPmV7jy/iBLml3OqnvoomXpvLXo4.6y	Nguyễn Văn Giám Sát	\N	supervisor	3	\N	t	\N	\N	2025-11-19 23:55:18.068059	2025-11-18 00:07:25.108263	2025-11-19 23:55:18.068059	supervisor	\N
\.


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: idea_history idea_history_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.idea_history
    ADD CONSTRAINT idea_history_pkey PRIMARY KEY (id);


--
-- Name: idea_responses idea_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.idea_responses
    ADD CONSTRAINT idea_responses_pkey PRIMARY KEY (id);


--
-- Name: ideas ideas_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_pkey PRIMARY KEY (id);


--
-- Name: incident_comments incident_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_pkey PRIMARY KEY (id);


--
-- Name: incident_department_tasks incident_department_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_department_tasks
    ADD CONSTRAINT incident_department_tasks_pkey PRIMARY KEY (id);


--
-- Name: incident_history incident_history_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: news_read_receipts news_read_receipts_news_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news_read_receipts
    ADD CONSTRAINT news_read_receipts_news_id_user_id_key UNIQUE (news_id, user_id);


--
-- Name: news_read_receipts news_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news_read_receipts
    ADD CONSTRAINT news_read_receipts_pkey PRIMARY KEY (id);


--
-- Name: news_views news_views_news_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_news_id_user_id_key UNIQUE (news_id, user_id);


--
-- Name: news_views news_views_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_code_key UNIQUE (employee_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_departments_code; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_departments_code ON public.departments USING btree (code);


--
-- Name: idx_departments_manager_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_departments_manager_id ON public.departments USING btree (manager_id);


--
-- Name: idx_departments_parent_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_departments_parent_id ON public.departments USING btree (parent_id);


--
-- Name: idx_idea_responses_idea_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_idea_responses_idea_id ON public.idea_responses USING btree (idea_id);


--
-- Name: idx_idea_responses_user_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_idea_responses_user_id ON public.idea_responses USING btree (user_id);


--
-- Name: idx_ideas_assigned_to; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_ideas_assigned_to ON public.ideas USING btree (assigned_to);


--
-- Name: idx_ideas_created_at; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_ideas_created_at ON public.ideas USING btree (created_at);


--
-- Name: idx_ideas_department_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_ideas_department_id ON public.ideas USING btree (department_id);


--
-- Name: idx_ideas_ideabox_type; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_ideas_ideabox_type ON public.ideas USING btree (ideabox_type);


--
-- Name: idx_ideas_status; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_ideas_status ON public.ideas USING btree (status);


--
-- Name: idx_ideas_submitter_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_ideas_submitter_id ON public.ideas USING btree (submitter_id);


--
-- Name: idx_incident_comments_incident_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incident_comments_incident_id ON public.incident_comments USING btree (incident_id);


--
-- Name: idx_incident_comments_user_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incident_comments_user_id ON public.incident_comments USING btree (user_id);


--
-- Name: idx_incidents_accepted; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_accepted ON public.incidents USING btree (accepted_at, accepted_by);


--
-- Name: idx_incidents_assigned_dept; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_assigned_dept ON public.incidents USING btree (assigned_department_id);


--
-- Name: idx_incidents_assigned_to; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_assigned_to ON public.incidents USING btree (assigned_to);


--
-- Name: idx_incidents_created_at; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_created_at ON public.incidents USING btree (created_at);


--
-- Name: idx_incidents_department_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_department_id ON public.incidents USING btree (department_id);


--
-- Name: idx_incidents_media; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_media ON public.incidents USING gin (media_urls);


--
-- Name: idx_incidents_priority; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_priority ON public.incidents USING btree (priority);


--
-- Name: idx_incidents_reporter_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_reporter_id ON public.incidents USING btree (reporter_id);


--
-- Name: idx_incidents_status; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_incidents_status ON public.incidents USING btree (status);


--
-- Name: idx_news_author_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_news_author_id ON public.news USING btree (author_id);


--
-- Name: idx_news_category; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_news_category ON public.news USING btree (category);


--
-- Name: idx_news_created_at; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_news_created_at ON public.news USING btree (created_at);


--
-- Name: idx_news_publish_at; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_news_publish_at ON public.news USING btree (publish_at);


--
-- Name: idx_news_status; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_news_status ON public.news USING btree (status);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_dept; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_notifications_dept ON public.notifications USING btree (recipient_department_id, is_read);


--
-- Name: idx_notifications_incident; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_notifications_incident ON public.notifications USING btree (related_incident_id);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_recipient; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_id, is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (recipient_id);


--
-- Name: idx_users_department; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_users_department ON public.users USING btree (department_id);


--
-- Name: idx_users_department_id; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_users_department_id ON public.users USING btree (department_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_employee_code; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_users_employee_code ON public.users USING btree (employee_code);


--
-- Name: idx_users_password_reset_token; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: tuan
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: departments update_departments_timestamp; Type: TRIGGER; Schema: public; Owner: tuan
--

CREATE TRIGGER update_departments_timestamp BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: ideas update_ideas_timestamp; Type: TRIGGER; Schema: public; Owner: tuan
--

CREATE TRIGGER update_ideas_timestamp BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: incidents update_incidents_timestamp; Type: TRIGGER; Schema: public; Owner: tuan
--

CREATE TRIGGER update_incidents_timestamp BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: news update_news_timestamp; Type: TRIGGER; Schema: public; Owner: tuan
--

CREATE TRIGGER update_news_timestamp BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: users update_users_timestamp; Type: TRIGGER; Schema: public; Owner: tuan
--

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: departments fk_departments_manager; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: idea_history idea_history_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.idea_history
    ADD CONSTRAINT idea_history_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;


--
-- Name: idea_history idea_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.idea_history
    ADD CONSTRAINT idea_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: idea_responses idea_responses_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.idea_responses
    ADD CONSTRAINT idea_responses_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;


--
-- Name: idea_responses idea_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.idea_responses
    ADD CONSTRAINT idea_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ideas ideas_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ideas ideas_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: ideas ideas_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ideas ideas_submitter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_submitter_id_fkey FOREIGN KEY (submitter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: incident_comments incident_comments_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_comments incident_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: incident_department_tasks incident_department_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_department_tasks
    ADD CONSTRAINT incident_department_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incident_department_tasks incident_department_tasks_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_department_tasks
    ADD CONSTRAINT incident_department_tasks_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: incident_department_tasks incident_department_tasks_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_department_tasks
    ADD CONSTRAINT incident_department_tasks_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_history incident_history_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incident_history incident_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: incidents incidents_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_escalated_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_escalated_to_fkey FOREIGN KEY (escalated_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: incidents incidents_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: news_read_receipts news_read_receipts_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news_read_receipts
    ADD CONSTRAINT news_read_receipts_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON DELETE CASCADE;


--
-- Name: news_read_receipts news_read_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news_read_receipts
    ADD CONSTRAINT news_read_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: news_views news_views_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON DELETE CASCADE;


--
-- Name: news_views news_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_department_id_fkey FOREIGN KEY (recipient_department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_idea_id_fkey FOREIGN KEY (related_idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_incident_id_fkey FOREIGN KEY (related_incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_news_id_fkey FOREIGN KEY (related_news_id) REFERENCES public.news(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tuan
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: tuan
--

REVOKE ALL ON SCHEMA public FROM postgres;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO tuan;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict rb9KmOFPrrksmnx5YpcjFuFvrWMRFtMazbN8Rc5eXXrVRKZl8H5h2h2xd6tGZM2

