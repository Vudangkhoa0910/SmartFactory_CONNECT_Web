--
-- PostgreSQL database dump
--

\restrict RTV8dfNcOHD24mVDWE1mAI4clOAsPWbI0t9xcdIADRKqicLRHVPMQZUnL36T2bR

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
\.


--
-- Data for Name: idea_responses; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.idea_responses (id, idea_id, user_id, response, attachments, created_at) FROM stdin;
\.


--
-- Data for Name: ideas; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.ideas (id, ideabox_type, category, title, description, expected_benefit, submitter_id, department_id, is_anonymous, assigned_to, status, attachments, reviewed_by, reviewed_at, review_notes, feasibility_score, impact_score, implemented_at, implementation_notes, actual_benefit, created_at, updated_at, handler_level) FROM stdin;
789d1c96-7f5d-4785-8d53-c7945ed0c8a0	white	process_improvement	Ý tưởng cải tiến quy trình 1	Mô tả chi tiết cho ý tưởng cải tiến số 1. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.812856	2025-11-20 12:10:21.812856	supervisor
751b7e9a-9d26-4927-9362-b3de4af14d69	white	process_improvement	Ý tưởng cải tiến quy trình 2	Mô tả chi tiết cho ý tưởng cải tiến số 2. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	5410f259-7926-4a34-a48a-e8969c009813	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.817871	2025-11-20 12:10:21.817871	supervisor
b52466d3-f620-4f0d-83f6-dd9ac88642c6	white	process_improvement	Ý tưởng cải tiến quy trình 3	Mô tả chi tiết cho ý tưởng cải tiến số 3. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	978cf7b5-3cf1-45b8-859c-4e5261ad7a7a	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.819139	2025-11-20 12:10:21.819139	supervisor
c59df04b-d6ef-45a3-86e6-35cd31ba81f2	white	process_improvement	Ý tưởng cải tiến quy trình 4	Mô tả chi tiết cho ý tưởng cải tiến số 4. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	64a06277-5886-46c3-b6bd-313977905431	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.820116	2025-11-20 12:10:21.820116	supervisor
2932456c-1b89-444b-8959-76f6e3a540e0	white	process_improvement	Ý tưởng cải tiến quy trình 5	Mô tả chi tiết cho ý tưởng cải tiến số 5. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	da4e7caf-e1f2-4c07-b218-507bb599c568	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.821198	2025-11-20 12:10:21.821198	supervisor
44ae534a-2cc8-4310-a8f9-39d692a1f540	white	process_improvement	Ý tưởng cải tiến quy trình 6	Mô tả chi tiết cho ý tưởng cải tiến số 6. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.822215	2025-11-20 12:10:21.822215	supervisor
2d6425d6-7ce5-4e9c-92d6-c93a84341e1c	white	process_improvement	Ý tưởng cải tiến quy trình 7	Mô tả chi tiết cho ý tưởng cải tiến số 7. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.823291	2025-11-20 12:10:21.823291	supervisor
bbb662a7-b583-4e37-b0b2-81b38532c48c	white	process_improvement	Ý tưởng cải tiến quy trình 8	Mô tả chi tiết cho ý tưởng cải tiến số 8. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	57d83193-a73c-4141-b2d0-070193a6c150	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.824228	2025-11-20 12:10:21.824228	supervisor
fd48b5c6-6db1-4a90-bc49-0b29db8616fb	white	process_improvement	Ý tưởng cải tiến quy trình 9	Mô tả chi tiết cho ý tưởng cải tiến số 9. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	da4e7caf-e1f2-4c07-b218-507bb599c568	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.825649	2025-11-20 12:10:21.825649	supervisor
eb4d0721-009d-4625-8db4-ff4f05bfd459	white	process_improvement	Ý tưởng cải tiến quy trình 10	Mô tả chi tiết cho ý tưởng cải tiến số 10. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f02b86fb-d681-4d1c-afd8-9c659867d4b8	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.826786	2025-11-20 12:10:21.826786	supervisor
c2064d19-31c9-41c3-a785-c894818a53ee	white	process_improvement	Ý tưởng cải tiến quy trình 11	Mô tả chi tiết cho ý tưởng cải tiến số 11. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.827657	2025-11-20 12:10:21.827657	supervisor
95bfa349-2af7-4184-b8f7-6c012cad9131	white	process_improvement	Ý tưởng cải tiến quy trình 12	Mô tả chi tiết cho ý tưởng cải tiến số 12. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f02b86fb-d681-4d1c-afd8-9c659867d4b8	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.828521	2025-11-20 12:10:21.828521	supervisor
df65636c-01b7-48d2-aeda-30007c61a919	white	process_improvement	Ý tưởng cải tiến quy trình 13	Mô tả chi tiết cho ý tưởng cải tiến số 13. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	b735780f-1839-47db-ad94-aa6bf4549ab7	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.8293	2025-11-20 12:10:21.8293	supervisor
76054be1-18fc-4216-8726-15720527bbd4	white	process_improvement	Ý tưởng cải tiến quy trình 14	Mô tả chi tiết cho ý tưởng cải tiến số 14. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f02b86fb-d681-4d1c-afd8-9c659867d4b8	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.830202	2025-11-20 12:10:21.830202	supervisor
cc4b5cac-f691-41bc-8341-a220d1234a3f	white	process_improvement	Ý tưởng cải tiến quy trình 15	Mô tả chi tiết cho ý tưởng cải tiến số 15. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	b735780f-1839-47db-ad94-aa6bf4549ab7	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.831091	2025-11-20 12:10:21.831091	supervisor
b573baf2-bded-40b1-a7af-9b23990c0804	white	process_improvement	Ý tưởng cải tiến quy trình 16	Mô tả chi tiết cho ý tưởng cải tiến số 16. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	64a06277-5886-46c3-b6bd-313977905431	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.832079	2025-11-20 12:10:21.832079	supervisor
622b96f8-cbfb-4665-9951-22f94b60ed22	white	process_improvement	Ý tưởng cải tiến quy trình 17	Mô tả chi tiết cho ý tưởng cải tiến số 17. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.832933	2025-11-20 12:10:21.832933	supervisor
7a8df97d-6200-42a3-bce8-eccc0e81efe0	white	process_improvement	Ý tưởng cải tiến quy trình 18	Mô tả chi tiết cho ý tưởng cải tiến số 18. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.833773	2025-11-20 12:10:21.833773	supervisor
23bbd0a4-18ec-417a-bc81-62bb3e491c1f	white	process_improvement	Ý tưởng cải tiến quy trình 19	Mô tả chi tiết cho ý tưởng cải tiến số 19. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	57d83193-a73c-4141-b2d0-070193a6c150	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.834582	2025-11-20 12:10:21.834582	supervisor
f1164d29-a269-4487-b135-2e99e090f0d5	white	process_improvement	Ý tưởng cải tiến quy trình 20	Mô tả chi tiết cho ý tưởng cải tiến số 20. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	57d83193-a73c-4141-b2d0-070193a6c150	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.835415	2025-11-20 12:10:21.835415	supervisor
0724f785-2d54-416b-9a30-189415e37909	white	process_improvement	Ý tưởng cải tiến quy trình 21	Mô tả chi tiết cho ý tưởng cải tiến số 21. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	57d83193-a73c-4141-b2d0-070193a6c150	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.836221	2025-11-20 12:10:21.836221	supervisor
ca16eb5b-f10b-4a89-9939-54537ebc2746	white	process_improvement	Ý tưởng cải tiến quy trình 22	Mô tả chi tiết cho ý tưởng cải tiến số 22. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	b735780f-1839-47db-ad94-aa6bf4549ab7	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.837025	2025-11-20 12:10:21.837025	supervisor
a6851534-3e60-4195-9aab-11d989c9a9d7	white	process_improvement	Ý tưởng cải tiến quy trình 23	Mô tả chi tiết cho ý tưởng cải tiến số 23. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f02b86fb-d681-4d1c-afd8-9c659867d4b8	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.837873	2025-11-20 12:10:21.837873	supervisor
f112269a-45f2-43d6-8d9f-71c4f9954ed4	white	process_improvement	Ý tưởng cải tiến quy trình 24	Mô tả chi tiết cho ý tưởng cải tiến số 24. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	b735780f-1839-47db-ad94-aa6bf4549ab7	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.838776	2025-11-20 12:10:21.838776	supervisor
69d41e67-e487-46db-9b69-bab06039f992	white	process_improvement	Ý tưởng cải tiến quy trình 25	Mô tả chi tiết cho ý tưởng cải tiến số 25. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	5410f259-7926-4a34-a48a-e8969c009813	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.839878	2025-11-20 12:10:21.839878	supervisor
ae54645c-f7ae-4512-96dd-a69ec13f536d	white	process_improvement	Ý tưởng cải tiến quy trình 26	Mô tả chi tiết cho ý tưởng cải tiến số 26. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	5410f259-7926-4a34-a48a-e8969c009813	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.840964	2025-11-20 12:10:21.840964	supervisor
feb4ebb8-572e-41b8-a58f-d388723ac843	white	process_improvement	Ý tưởng cải tiến quy trình 27	Mô tả chi tiết cho ý tưởng cải tiến số 27. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	da4e7caf-e1f2-4c07-b218-507bb599c568	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.841911	2025-11-20 12:10:21.841911	supervisor
e81e6a68-e98d-490a-8faf-db87e3385704	white	process_improvement	Ý tưởng cải tiến quy trình 28	Mô tả chi tiết cho ý tưởng cải tiến số 28. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	b735780f-1839-47db-ad94-aa6bf4549ab7	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.842789	2025-11-20 12:10:21.842789	supervisor
96ea93ff-88b8-442f-a616-006889b3fb46	white	process_improvement	Ý tưởng cải tiến quy trình 29	Mô tả chi tiết cho ý tưởng cải tiến số 29. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	57d83193-a73c-4141-b2d0-070193a6c150	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.843631	2025-11-20 12:10:21.843631	supervisor
10d23d51-63ba-4813-bb1b-784cbaba9909	white	process_improvement	Ý tưởng cải tiến quy trình 30	Mô tả chi tiết cho ý tưởng cải tiến số 30. Cần tối ưu hóa dây chuyền sản xuất để giảm lãng phí và tăng năng suất.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f02b86fb-d681-4d1c-afd8-9c659867d4b8	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.844644	2025-11-20 12:10:21.844644	supervisor
48b834bf-6a5f-4275-a6a4-98184f933340	pink	workplace	Đề xuất phúc lợi 1	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 1. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.846052	2025-11-20 12:10:21.846052	supervisor
a8188d9b-ef37-49be-be29-9a72c3256405	pink	workplace	Đề xuất phúc lợi 2	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 2. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.847182	2025-11-20 12:10:21.847182	supervisor
fa8561ee-e44e-4456-8a24-ca39f9ee15d8	pink	workplace	Đề xuất phúc lợi 3	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 3. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f02b86fb-d681-4d1c-afd8-9c659867d4b8	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.848001	2025-11-20 12:10:21.848001	supervisor
f2226fd9-584d-43a8-8609-636289f7474b	pink	workplace	Đề xuất phúc lợi 4	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 4. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	b735780f-1839-47db-ad94-aa6bf4549ab7	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.848796	2025-11-20 12:10:21.848796	supervisor
1c1b85a4-f8fb-4c72-9d34-ce8289fd78fe	pink	workplace	Đề xuất phúc lợi 5	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 5. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	5410f259-7926-4a34-a48a-e8969c009813	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.849707	2025-11-20 12:10:21.849707	supervisor
9f277549-ced2-4624-8f91-57956f328f2d	pink	workplace	Đề xuất phúc lợi 6	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 6. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.850485	2025-11-20 12:10:21.850485	supervisor
521aaff2-8c55-4270-8f6b-a8aa4ce6b360	pink	workplace	Đề xuất phúc lợi 7	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 7. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	5410f259-7926-4a34-a48a-e8969c009813	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.851228	2025-11-20 12:10:21.851228	supervisor
a5b78e6d-fcdd-4ca3-b3eb-881565f67fb6	pink	workplace	Đề xuất phúc lợi 8	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 8. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	5410f259-7926-4a34-a48a-e8969c009813	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.852041	2025-11-20 12:10:21.852041	supervisor
bac3848a-8cff-49e9-b752-099d8f306518	pink	workplace	Đề xuất phúc lợi 9	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 9. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f02b86fb-d681-4d1c-afd8-9c659867d4b8	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.853007	2025-11-20 12:10:21.853007	supervisor
d8bef41d-36b7-4e09-af57-b770b6b369b0	pink	workplace	Đề xuất phúc lợi 10	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 10. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	5410f259-7926-4a34-a48a-e8969c009813	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.854014	2025-11-20 12:10:21.854014	supervisor
5d95cd16-9cd0-4bd4-8d96-287031fb148b	pink	workplace	Đề xuất phúc lợi 11	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 11. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.854849	2025-11-20 12:10:21.854849	supervisor
cfb0b68f-84a0-40ff-8dcf-22cebb9d1fe6	pink	workplace	Đề xuất phúc lợi 12	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 12. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	f02b86fb-d681-4d1c-afd8-9c659867d4b8	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.855705	2025-11-20 12:10:21.855705	supervisor
de8a7471-c432-4744-a874-773d4acf031e	pink	workplace	Đề xuất phúc lợi 13	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 13. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.856531	2025-11-20 12:10:21.856531	supervisor
c9bc3e1f-f3a6-4169-8c9b-8c9ba1073770	pink	workplace	Đề xuất phúc lợi 14	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 14. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.857439	2025-11-20 12:10:21.857439	supervisor
b3939764-f385-415e-adba-e229bbd546f1	pink	workplace	Đề xuất phúc lợi 15	Đề xuất cải thiện bữa ăn trưa và khu vực nghỉ ngơi số 15. Mong công ty xem xét bổ sung thêm tiện ích.	\N	3d25ff39-5149-4b65-9db7-e70213707bb7	da4e7caf-e1f2-4c07-b218-507bb599c568	f	\N	pending	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.858484	2025-11-20 12:10:21.858484	supervisor
\.


--
-- Data for Name: incident_comments; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.incident_comments (id, incident_id, user_id, comment, attachments, created_at, media_urls, media_metadata) FROM stdin;
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
dd696b27-0f45-4b4c-a1c8-299906a75cb2	681913a8-c3b4-467c-b70e-7882c5e9a11f	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-20 12:11:30.617135
6e9dbbc6-cd5b-42ca-b994-7cb1206df7cc	23a8971b-5477-4fb1-8331-d37a0ebcceb9	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-20 12:12:03.704372
de8e5131-e6d2-48d2-8b7b-a1d078b091b1	b9775439-ce84-4a70-a547-1fee51131acc	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "assigned", "old_status": "unknown"}	2025-11-20 12:12:04.570136
e267909b-490c-48f7-9506-e563da70ef49	964592ef-582d-45b3-b2f6-ca4a88cb55c8	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-20 12:12:07.22906
98c21308-dec5-4d5f-aa70-d4a0474f9c55	14e9833b-a89c-4623-b498-991ebf001f7b	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-20 12:12:08.148696
8bdfe3e8-e6e6-4701-ab84-2be77223136a	275f6a71-3bfe-49ce-b68a-cd12608ee977	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-20 12:12:09.131437
9592cb6e-855e-406e-82bf-81a5df45c3d3	a264c21b-9686-42c7-8d24-a339b7d9ed88	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "on_hold", "old_status": "unknown"}	2025-11-20 12:12:10.184589
3e39946a-fd53-4e28-a540-0a84e3ab000d	dd3a2602-30ba-4fbd-9cae-673a0fb1e3fc	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "closed", "old_status": "unknown"}	2025-11-20 12:12:13.563391
b2082d51-b943-48df-a90d-15d33e3752c6	e20c622a-674b-4199-8c58-6c399e4fa15a	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "closed", "old_status": "unknown"}	2025-11-20 12:12:14.567606
2e5fbbf4-1e9d-492c-8169-54081e5a2917	46da0f1a-78a5-4593-8c65-1dfc2f73cfa7	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "closed", "old_status": "unknown"}	2025-11-20 12:12:15.650381
09e29ef2-e858-4613-be98-4b7a976bc7b1	15130779-0386-472c-8f1f-05f02a8643c0	status_changed	3d25ff39-5149-4b65-9db7-e70213707bb7	{"new_status": "closed", "old_status": "unknown"}	2025-11-20 12:12:16.808861
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.incidents (id, incident_type, title, description, location, department_id, reporter_id, assigned_to, priority, status, attachments, escalated_to, escalated_at, escalation_level, resolved_by, resolved_at, resolution_notes, root_cause, corrective_actions, rating, rating_feedback, created_at, updated_at, media_urls, media_metadata, assigned_department_id, accepted_at, accepted_by, notification_sent, notification_sent_at) FROM stdin;
8324dd9c-0ded-4f60-b113-ff60e91dd1d0	equipment	Sự cố máy móc chờ xử lý 1	Máy số 1 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 2	b735780f-1839-47db-ad94-aa6bf4549ab7	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.859845	2025-11-20 12:10:21.859845	\N	\N	\N	\N	\N	f	\N
602252d4-f0cc-4872-8eb4-fb672af3eb07	equipment	Sự cố máy móc chờ xử lý 2	Máy số 2 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 3	57d83193-a73c-4141-b2d0-070193a6c150	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.863914	2025-11-20 12:10:21.863914	\N	\N	\N	\N	\N	f	\N
b9775439-ce84-4a70-a547-1fee51131acc	equipment	Sự cố máy móc chờ xử lý 3	Máy số 3 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 4	57d83193-a73c-4141-b2d0-070193a6c150	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	assigned	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.865117	2025-11-20 12:12:04.563994	\N	\N	\N	\N	\N	f	\N
3164d77f-3ab4-4ad5-b902-00e028edb757	equipment	Sự cố máy móc chờ xử lý 5	Máy số 5 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 1	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.868731	2025-11-20 12:10:21.868731	\N	\N	\N	\N	\N	f	\N
26a6f15e-bd50-4d8d-a128-4e8e215ec008	equipment	Sự cố máy móc chờ xử lý 6	Máy số 6 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 2	b735780f-1839-47db-ad94-aa6bf4549ab7	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.870052	2025-11-20 12:10:21.870052	\N	\N	\N	\N	\N	f	\N
9a272ec7-03da-452d-93b0-58a7f384eba9	equipment	Sự cố máy móc chờ xử lý 7	Máy số 7 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 3	978cf7b5-3cf1-45b8-859c-4e5261ad7a7a	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.871136	2025-11-20 12:10:21.871136	\N	\N	\N	\N	\N	f	\N
3470ea5e-5294-48ae-969f-59979a56ad25	equipment	Sự cố máy móc chờ xử lý 8	Máy số 8 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 4	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.872056	2025-11-20 12:10:21.872056	\N	\N	\N	\N	\N	f	\N
7190734b-3e40-4510-a0b8-c2ef9d77deb9	equipment	Sự cố máy móc chờ xử lý 9	Máy số 9 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 5	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.873137	2025-11-20 12:10:21.873137	\N	\N	\N	\N	\N	f	\N
ca139d73-26a4-4c92-b368-e4b1a65dd479	equipment	Sự cố máy móc chờ xử lý 10	Máy số 10 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 1	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.874251	2025-11-20 12:10:21.874251	\N	\N	\N	\N	\N	f	\N
5a21107b-90c4-40d3-b716-f9b1a81e3710	equipment	Sự cố máy móc chờ xử lý 11	Máy số 11 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 2	f02b86fb-d681-4d1c-afd8-9c659867d4b8	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.875283	2025-11-20 12:10:21.875283	\N	\N	\N	\N	\N	f	\N
9f663d37-7218-4a6e-8eac-0a7fa4e021b1	equipment	Sự cố máy móc chờ xử lý 12	Máy số 12 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 3	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.876159	2025-11-20 12:10:21.876159	\N	\N	\N	\N	\N	f	\N
051cb484-2b67-44ae-9f6b-dec623a19361	equipment	Sự cố máy móc chờ xử lý 13	Máy số 13 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 4	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.877154	2025-11-20 12:10:21.877154	\N	\N	\N	\N	\N	f	\N
e4c48376-5a14-4fcf-a605-823d33d17e6c	equipment	Sự cố máy móc chờ xử lý 14	Máy số 14 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 5	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.878461	2025-11-20 12:10:21.878461	\N	\N	\N	\N	\N	f	\N
0e310bd3-4ab8-4c07-83d0-6284d0ab5e50	equipment	Sự cố máy móc chờ xử lý 15	Máy số 15 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 1	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.879575	2025-11-20 12:10:21.879575	\N	\N	\N	\N	\N	f	\N
d0073961-1300-4dec-b6b7-3ce9d8c40092	equipment	Sự cố máy móc chờ xử lý 16	Máy số 16 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 2	57d83193-a73c-4141-b2d0-070193a6c150	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.880485	2025-11-20 12:10:21.880485	\N	\N	\N	\N	\N	f	\N
f15cf41d-76c1-4487-9fca-ef2b09119c53	equipment	Sự cố máy móc chờ xử lý 17	Máy số 17 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 3	64a06277-5886-46c3-b6bd-313977905431	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.88177	2025-11-20 12:10:21.88177	\N	\N	\N	\N	\N	f	\N
66fa2e84-97d8-4416-8947-66ce9df81266	equipment	Sự cố máy móc chờ xử lý 18	Máy số 18 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 4	64a06277-5886-46c3-b6bd-313977905431	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.882794	2025-11-20 12:10:21.882794	\N	\N	\N	\N	\N	f	\N
455f5b12-3b26-4655-af68-727469d0303e	equipment	Sự cố máy móc chờ xử lý 19	Máy số 19 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 5	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.883734	2025-11-20 12:10:21.883734	\N	\N	\N	\N	\N	f	\N
1d2d95ca-b1da-421e-897b-cb41aec43aa3	equipment	Sự cố máy móc chờ xử lý 20	Máy số 20 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 1	978cf7b5-3cf1-45b8-859c-4e5261ad7a7a	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.884679	2025-11-20 12:10:21.884679	\N	\N	\N	\N	\N	f	\N
410218ad-4843-41f0-9c98-f462cb827073	equipment	Sự cố máy móc chờ xử lý 21	Máy số 21 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 2	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.885619	2025-11-20 12:10:21.885619	\N	\N	\N	\N	\N	f	\N
60af4b22-e138-4be0-8704-b09861ff330e	equipment	Sự cố máy móc chờ xử lý 22	Máy số 22 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 3	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.886705	2025-11-20 12:10:21.886705	\N	\N	\N	\N	\N	f	\N
af976246-aac2-4a26-841b-6602469c1606	equipment	Sự cố máy móc chờ xử lý 23	Máy số 23 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 4	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.88774	2025-11-20 12:10:21.88774	\N	\N	\N	\N	\N	f	\N
6651446c-1f90-45ed-a099-7a5995b933b6	equipment	Sự cố máy móc chờ xử lý 24	Máy số 24 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 5	f02b86fb-d681-4d1c-afd8-9c659867d4b8	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.888853	2025-11-20 12:10:21.888853	\N	\N	\N	\N	\N	f	\N
b72a7c44-d0ad-4a0c-aa45-2d9112c277d7	equipment	Sự cố máy móc chờ xử lý 25	Máy số 25 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 1	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.889681	2025-11-20 12:10:21.889681	\N	\N	\N	\N	\N	f	\N
f2393f1d-b97f-47d2-bdd7-b5fe8e356baf	equipment	Sự cố máy móc chờ xử lý 26	Máy số 26 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 2	64a06277-5886-46c3-b6bd-313977905431	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.890491	2025-11-20 12:10:21.890491	\N	\N	\N	\N	\N	f	\N
0e2b5667-7f8e-45f1-8260-ba71108a2912	equipment	Sự cố máy móc chờ xử lý 27	Máy số 27 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 3	978cf7b5-3cf1-45b8-859c-4e5261ad7a7a	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.891472	2025-11-20 12:10:21.891472	\N	\N	\N	\N	\N	f	\N
e13244ef-01c8-48e3-b833-cce88d15702d	equipment	Sự cố máy móc chờ xử lý 28	Máy số 28 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 4	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.892357	2025-11-20 12:10:21.892357	\N	\N	\N	\N	\N	f	\N
b330e26f-6f45-47c0-933c-d27dfa119507	equipment	Sự cố máy móc chờ xử lý 29	Máy số 29 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 5	64a06277-5886-46c3-b6bd-313977905431	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	pending	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.893273	2025-11-20 12:10:21.893273	\N	\N	\N	\N	\N	f	\N
5426f818-6625-41c9-a82d-2b87360b6194	safety	Sự cố an toàn 1	Phát hiện nguy cơ trượt ngã tại khu vực 1. Đã đặt biển cảnh báo.	Kho 2	978cf7b5-3cf1-45b8-859c-4e5261ad7a7a	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.896387	2025-11-20 12:10:21.896387	\N	\N	\N	\N	\N	f	\N
152534bb-c8e1-4ad8-ade2-ae9721da518a	safety	Sự cố an toàn 2	Phát hiện nguy cơ trượt ngã tại khu vực 2. Đã đặt biển cảnh báo.	Kho 3	64a06277-5886-46c3-b6bd-313977905431	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.897519	2025-11-20 12:10:21.897519	\N	\N	\N	\N	\N	f	\N
23a8971b-5477-4fb1-8331-d37a0ebcceb9	equipment	Sự cố máy móc chờ xử lý 4	Máy số 4 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 5	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	assigned	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.86654	2025-11-20 12:12:03.686065	\N	\N	\N	\N	\N	f	\N
467f06b9-ce34-4cf0-b59c-4010306dca9a	safety	Sự cố an toàn 3	Phát hiện nguy cơ trượt ngã tại khu vực 3. Đã đặt biển cảnh báo.	Kho 1	978cf7b5-3cf1-45b8-859c-4e5261ad7a7a	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.898307	2025-11-20 12:10:21.898307	\N	\N	\N	\N	\N	f	\N
94693bd4-7286-44be-a0cb-95ff987375ca	safety	Sự cố an toàn 4	Phát hiện nguy cơ trượt ngã tại khu vực 4. Đã đặt biển cảnh báo.	Kho 2	b735780f-1839-47db-ad94-aa6bf4549ab7	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.899453	2025-11-20 12:10:21.899453	\N	\N	\N	\N	\N	f	\N
9011e69d-35d2-428b-b524-502eb87533f3	safety	Sự cố an toàn 5	Phát hiện nguy cơ trượt ngã tại khu vực 5. Đã đặt biển cảnh báo.	Kho 3	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.900554	2025-11-20 12:10:21.900554	\N	\N	\N	\N	\N	f	\N
c1de0086-66f9-4f8d-b670-0311ec1eacb6	safety	Sự cố an toàn 6	Phát hiện nguy cơ trượt ngã tại khu vực 6. Đã đặt biển cảnh báo.	Kho 1	978cf7b5-3cf1-45b8-859c-4e5261ad7a7a	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.901953	2025-11-20 12:10:21.901953	\N	\N	\N	\N	\N	f	\N
3a251e4f-7475-4068-91e0-7b1a23acee69	safety	Sự cố an toàn 7	Phát hiện nguy cơ trượt ngã tại khu vực 7. Đã đặt biển cảnh báo.	Kho 2	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.903431	2025-11-20 12:10:21.903431	\N	\N	\N	\N	\N	f	\N
04ead9e6-911f-4c82-afca-41e5dd7ad96e	safety	Sự cố an toàn 8	Phát hiện nguy cơ trượt ngã tại khu vực 8. Đã đặt biển cảnh báo.	Kho 3	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.904449	2025-11-20 12:10:21.904449	\N	\N	\N	\N	\N	f	\N
7326872e-9de1-4d9a-a9fd-024339671dbe	safety	Sự cố an toàn 9	Phát hiện nguy cơ trượt ngã tại khu vực 9. Đã đặt biển cảnh báo.	Kho 1	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.905307	2025-11-20 12:10:21.905307	\N	\N	\N	\N	\N	f	\N
c7e9d551-c55f-4ad6-bb2a-0fc931a04329	safety	Sự cố an toàn 10	Phát hiện nguy cơ trượt ngã tại khu vực 10. Đã đặt biển cảnh báo.	Kho 2	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.906267	2025-11-20 12:10:21.906267	\N	\N	\N	\N	\N	f	\N
3407398b-61d0-401d-ab4f-1944825cade4	safety	Sự cố an toàn 11	Phát hiện nguy cơ trượt ngã tại khu vực 11. Đã đặt biển cảnh báo.	Kho 3	b735780f-1839-47db-ad94-aa6bf4549ab7	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.907206	2025-11-20 12:10:21.907206	\N	\N	\N	\N	\N	f	\N
f1f77c10-77ed-4121-a62a-c9edc25ff4cf	safety	Sự cố an toàn 12	Phát hiện nguy cơ trượt ngã tại khu vực 12. Đã đặt biển cảnh báo.	Kho 1	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.908027	2025-11-20 12:10:21.908027	\N	\N	\N	\N	\N	f	\N
a2ded204-c550-4d96-b015-01edfacf812f	safety	Sự cố an toàn 13	Phát hiện nguy cơ trượt ngã tại khu vực 13. Đã đặt biển cảnh báo.	Kho 2	57d83193-a73c-4141-b2d0-070193a6c150	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.908937	2025-11-20 12:10:21.908937	\N	\N	\N	\N	\N	f	\N
fcaa16a4-1329-47b0-8ee0-d3752f790064	safety	Sự cố an toàn 14	Phát hiện nguy cơ trượt ngã tại khu vực 14. Đã đặt biển cảnh báo.	Kho 3	da4e7caf-e1f2-4c07-b218-507bb599c568	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.90995	2025-11-20 12:10:21.90995	\N	\N	\N	\N	\N	f	\N
56f51cdf-af22-4251-8fe5-7211aaddc4dd	safety	Sự cố an toàn 15	Phát hiện nguy cơ trượt ngã tại khu vực 15. Đã đặt biển cảnh báo.	Kho 1	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.910926	2025-11-20 12:10:21.910926	\N	\N	\N	\N	\N	f	\N
dcf89e82-31e8-4e83-a52e-153c82348acc	safety	Sự cố an toàn 16	Phát hiện nguy cơ trượt ngã tại khu vực 16. Đã đặt biển cảnh báo.	Kho 2	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.911893	2025-11-20 12:10:21.911893	\N	\N	\N	\N	\N	f	\N
aa61780b-0883-4f4c-8f68-664120eaa0ac	safety	Sự cố an toàn 17	Phát hiện nguy cơ trượt ngã tại khu vực 17. Đã đặt biển cảnh báo.	Kho 3	64a06277-5886-46c3-b6bd-313977905431	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.912862	2025-11-20 12:10:21.912862	\N	\N	\N	\N	\N	f	\N
b81a4c81-d9a1-47bc-baaa-cd4e10f95520	safety	Sự cố an toàn 20	Phát hiện nguy cơ trượt ngã tại khu vực 20. Đã đặt biển cảnh báo.	Kho 3	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.916263	2025-11-20 12:10:21.916263	\N	\N	\N	\N	\N	f	\N
b0eaf1c1-9a5b-440d-80e4-a2f65f14f93d	safety	Sự cố an toàn 21	Phát hiện nguy cơ trượt ngã tại khu vực 21. Đã đặt biển cảnh báo.	Kho 1	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.917736	2025-11-20 12:10:21.917736	\N	\N	\N	\N	\N	f	\N
cedf9004-d426-4870-97c2-7bad204578a6	safety	Sự cố an toàn 24	Phát hiện nguy cơ trượt ngã tại khu vực 24. Đã đặt biển cảnh báo.	Kho 1	ce43ac98-5107-47d2-aac4-26cb4ecde5ce	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.920846	2025-11-20 12:10:21.920846	\N	\N	\N	\N	\N	f	\N
3c72360c-80c0-4896-943d-579d20048a59	safety	Sự cố an toàn 28	Phát hiện nguy cơ trượt ngã tại khu vực 28. Đã đặt biển cảnh báo.	Kho 2	f02b86fb-d681-4d1c-afd8-9c659867d4b8	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	resolved	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.925552	2025-11-20 12:10:21.925552	\N	\N	\N	\N	\N	f	\N
cf759b04-aa9d-4195-ae69-c26f259aa305	safety	Sự cố an toàn 29	Phát hiện nguy cơ trượt ngã tại khu vực 29. Đã đặt biển cảnh báo.	Kho 3	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	in_progress	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.926594	2025-11-20 12:10:21.926594	\N	\N	\N	\N	\N	f	\N
681913a8-c3b4-467c-b70e-7882c5e9a11f	equipment	Sự cố máy móc chờ xử lý 30	Máy số 30 gặp trục trặc, cần kiểm tra ngay. Tiếng ồn lạ phát ra từ động cơ.	Line 1	f02b86fb-d681-4d1c-afd8-9c659867d4b8	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	high	assigned	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.894673	2025-11-20 12:11:30.592624	\N	\N	\N	\N	\N	f	\N
964592ef-582d-45b3-b2f6-ca4a88cb55c8	safety	Sự cố an toàn 27	Phát hiện nguy cơ trượt ngã tại khu vực 27. Đã đặt biển cảnh báo.	Kho 1	f02b86fb-d681-4d1c-afd8-9c659867d4b8	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	on_hold	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.924154	2025-11-20 12:12:07.226752	\N	\N	\N	\N	\N	f	\N
14e9833b-a89c-4623-b498-991ebf001f7b	safety	Sự cố an toàn 23	Phát hiện nguy cơ trượt ngã tại khu vực 23. Đã đặt biển cảnh báo.	Kho 3	f17694bb-56c8-45fa-aad3-f6fa3fa30f70	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	on_hold	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.919808	2025-11-20 12:12:08.14282	\N	\N	\N	\N	\N	f	\N
275f6a71-3bfe-49ce-b68a-cd12608ee977	safety	Sự cố an toàn 25	Phát hiện nguy cơ trượt ngã tại khu vực 25. Đã đặt biển cảnh báo.	Kho 2	b735780f-1839-47db-ad94-aa6bf4549ab7	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	on_hold	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.922049	2025-11-20 12:12:09.12558	\N	\N	\N	\N	\N	f	\N
a264c21b-9686-42c7-8d24-a339b7d9ed88	safety	Sự cố an toàn 19	Phát hiện nguy cơ trượt ngã tại khu vực 19. Đã đặt biển cảnh báo.	Kho 2	f02b86fb-d681-4d1c-afd8-9c659867d4b8	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	on_hold	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.915011	2025-11-20 12:12:10.178697	\N	\N	\N	\N	\N	f	\N
dd3a2602-30ba-4fbd-9cae-673a0fb1e3fc	safety	Sự cố an toàn 30	Phát hiện nguy cơ trượt ngã tại khu vực 30. Đã đặt biển cảnh báo.	Kho 1	5410f259-7926-4a34-a48a-e8969c009813	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	closed	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.927529	2025-11-20 12:12:13.557322	\N	\N	\N	\N	\N	f	\N
e20c622a-674b-4199-8c58-6c399e4fa15a	safety	Sự cố an toàn 26	Phát hiện nguy cơ trượt ngã tại khu vực 26. Đã đặt biển cảnh báo.	Kho 3	b735780f-1839-47db-ad94-aa6bf4549ab7	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	closed	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.923201	2025-11-20 12:12:14.561831	\N	\N	\N	\N	\N	f	\N
46da0f1a-78a5-4593-8c65-1dfc2f73cfa7	safety	Sự cố an toàn 22	Phát hiện nguy cơ trượt ngã tại khu vực 22. Đã đặt biển cảnh báo.	Kho 2	64a06277-5886-46c3-b6bd-313977905431	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	closed	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.918724	2025-11-20 12:12:15.644519	\N	\N	\N	\N	\N	f	\N
15130779-0386-472c-8f1f-05f02a8643c0	safety	Sự cố an toàn 18	Phát hiện nguy cơ trượt ngã tại khu vực 18. Đã đặt biển cảnh báo.	Kho 1	b735780f-1839-47db-ad94-aa6bf4549ab7	3d25ff39-5149-4b65-9db7-e70213707bb7	\N	medium	closed	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2025-11-20 12:10:21.913812	2025-11-20 12:12:16.802882	\N	\N	\N	\N	\N	f	\N
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: tuan
--

COPY public.news (id, category, title, content, excerpt, author_id, target_audience, target_departments, is_priority, publish_at, status, attachments, created_at, updated_at) FROM stdin;
a3ae8299-b1e3-4e04-827d-284b6f4e26a5	company_announcement	Thông báo quan trọng số 1	Nội dung chi tiết của thông báo số 1. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 1...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.928902	published	\N	2025-11-20 12:10:21.928902	2025-11-20 12:10:21.928902
a33a4d82-9d34-4ea4-9583-b3d938ff6cf8	company_announcement	Thông báo quan trọng số 2	Nội dung chi tiết của thông báo số 2. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 2...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.931278	published	\N	2025-11-20 12:10:21.931278	2025-11-20 12:10:21.931278
96f5ed12-35e9-4cc3-9d78-b293b884876b	company_announcement	Thông báo quan trọng số 3	Nội dung chi tiết của thông báo số 3. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 3...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.932446	published	\N	2025-11-20 12:10:21.932446	2025-11-20 12:10:21.932446
8af97e53-4c9f-4cf7-a045-764ff5547c0e	company_announcement	Thông báo quan trọng số 4	Nội dung chi tiết của thông báo số 4. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 4...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.933568	published	\N	2025-11-20 12:10:21.933568	2025-11-20 12:10:21.933568
cecc1053-b802-4895-a246-1d597fc5a85b	company_announcement	Thông báo quan trọng số 5	Nội dung chi tiết của thông báo số 5. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 5...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.934586	published	\N	2025-11-20 12:10:21.934586	2025-11-20 12:10:21.934586
b90b0c29-2970-4c31-9445-75751586eb31	company_announcement	Thông báo quan trọng số 6	Nội dung chi tiết của thông báo số 6. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 6...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.935523	published	\N	2025-11-20 12:10:21.935523	2025-11-20 12:10:21.935523
b7aa4476-5499-40bc-b022-25de14437178	company_announcement	Thông báo quan trọng số 7	Nội dung chi tiết của thông báo số 7. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 7...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.936567	published	\N	2025-11-20 12:10:21.936567	2025-11-20 12:10:21.936567
d422414e-8097-4ee9-b00a-9612dfcdde07	company_announcement	Thông báo quan trọng số 8	Nội dung chi tiết của thông báo số 8. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 8...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.937514	published	\N	2025-11-20 12:10:21.937514	2025-11-20 12:10:21.937514
24b239e4-6272-486f-9b65-284e5ccc30a5	company_announcement	Thông báo quan trọng số 9	Nội dung chi tiết của thông báo số 9. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 9...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.938352	published	\N	2025-11-20 12:10:21.938352	2025-11-20 12:10:21.938352
5c6d8f10-bea7-41e0-a998-cdc136a49209	company_announcement	Thông báo quan trọng số 10	Nội dung chi tiết của thông báo số 10. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 10...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.939135	published	\N	2025-11-20 12:10:21.939135	2025-11-20 12:10:21.939135
9c9dc561-ee5c-45f0-af0d-6916cca5ada2	company_announcement	Thông báo quan trọng số 11	Nội dung chi tiết của thông báo số 11. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 11...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.940205	published	\N	2025-11-20 12:10:21.940205	2025-11-20 12:10:21.940205
e2ea7854-dc54-4cdc-a030-dff5542bd1cb	company_announcement	Thông báo quan trọng số 12	Nội dung chi tiết của thông báo số 12. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 12...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.941061	published	\N	2025-11-20 12:10:21.941061	2025-11-20 12:10:21.941061
43cad161-6e65-43d3-90ac-567226116c6d	company_announcement	Thông báo quan trọng số 13	Nội dung chi tiết của thông báo số 13. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 13...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.941957	published	\N	2025-11-20 12:10:21.941957	2025-11-20 12:10:21.941957
7bc9a933-547d-41e4-b4fb-8a1717654406	company_announcement	Thông báo quan trọng số 14	Nội dung chi tiết của thông báo số 14. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 14...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.942715	published	\N	2025-11-20 12:10:21.942715	2025-11-20 12:10:21.942715
4d053f80-c799-4a73-9b1f-176c253c00b6	company_announcement	Thông báo quan trọng số 15	Nội dung chi tiết của thông báo số 15. Vui lòng cập nhật thông tin mới nhất từ ban giám đốc về kế hoạch sản xuất tháng tới.	Tóm tắt thông báo quan trọng 15...	3d25ff39-5149-4b65-9db7-e70213707bb7	all	\N	f	2025-11-20 12:10:21.943592	published	\N	2025-11-20 12:10:21.943592	2025-11-20 12:10:21.943592
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

\unrestrict RTV8dfNcOHD24mVDWE1mAI4clOAsPWbI0t9xcdIADRKqicLRHVPMQZUnL36T2bR

