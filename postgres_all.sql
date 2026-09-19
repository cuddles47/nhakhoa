--
-- PostgreSQL database cluster dump
--

\restrict JZByXnC9QMxtAaeKf7BHTi5ydqNvBwefSIDRaOJtI4TAeVw1djQC2sEB9e1hy5a

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE dental_user;
ALTER ROLE dental_user WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:5JVBEL+CekhRpJIOCNroSA==$zOf7RJYTi8xcPZgSqRnhJrZeVz3He6A4kx6A2O0y1XI=:Bh2O2zScCkR20qJQVToBa0rcKl0e1HYQ39IwCrF1c3E=';
CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:U4Du6XqHz295ZzXu1EA1YA==$RfTR4NkTu5tKtuFgH8DJ9cJHfGAGMSD25RoDxzPHUwg=:8A/7g4HEOYv5OX0MwHTJ0k2Rm755dbVvGU68kNeBj1k=';

--
-- User Configurations
--








\unrestrict JZByXnC9QMxtAaeKf7BHTi5ydqNvBwefSIDRaOJtI4TAeVw1djQC2sEB9e1hy5a

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict FgWUKpvBcgm5Kzk7E6y5VcU3GwnaPz2FdaG8NvRZPo4eEWCthgC8cBbBw46cpMr

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

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
-- PostgreSQL database dump complete
--

\unrestrict FgWUKpvBcgm5Kzk7E6y5VcU3GwnaPz2FdaG8NvRZPo4eEWCthgC8cBbBw46cpMr

--
-- Database "dental_db" dump
--

--
-- PostgreSQL database dump
--

\restrict HdUCHt3uccbYnJnv2meh81eh2QCudE3efhqATo9o4Q98vqDeNNM4WSrrt5VaGIT

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

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
-- Name: dental_db; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE dental_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE dental_db OWNER TO postgres;

\unrestrict HdUCHt3uccbYnJnv2meh81eh2QCudE3efhqATo9o4Q98vqDeNNM4WSrrt5VaGIT
\connect dental_db
\restrict HdUCHt3uccbYnJnv2meh81eh2QCudE3efhqATo9o4Q98vqDeNNM4WSrrt5VaGIT

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: annotation_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.annotation_history (
    id integer NOT NULL,
    annotation_id integer,
    user_id integer,
    old_value integer,
    new_value integer,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.annotation_history OWNER TO postgres;

--
-- Name: TABLE annotation_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.annotation_history IS 'Audit trail for plaque status changes';


--
-- Name: COLUMN annotation_history.old_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.annotation_history.old_value IS 'Previous plaque status value (0, 1, or NULL)';


--
-- Name: COLUMN annotation_history.new_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.annotation_history.new_value IS 'New plaque status value (0, 1, or NULL)';


--
-- Name: annotation_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.annotation_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.annotation_history_id_seq OWNER TO postgres;

--
-- Name: annotation_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.annotation_history_id_seq OWNED BY public.annotation_history.id;


--
-- Name: case_doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.case_doctors (
    case_id integer NOT NULL,
    doctor_id integer NOT NULL,
    role character varying(50)
);


ALTER TABLE public.case_doctors OWNER TO postgres;

--
-- Name: cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cases (
    id integer NOT NULL,
    patient_id integer,
    start_date date,
    end_date date,
    treatment_type character varying(100),
    status character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.cases OWNER TO postgres;

--
-- Name: cases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cases_id_seq OWNER TO postgres;

--
-- Name: cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cases_id_seq OWNED BY public.cases.id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    specialty character varying(100),
    contact character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.doctors_id_seq OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;


--
-- Name: image_annotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image_annotations (
    id integer NOT NULL,
    image_id integer,
    coco_image_id integer NOT NULL,
    category_id integer NOT NULL,
    category_name character varying(50),
    bbox jsonb NOT NULL,
    area double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    source_type character varying(30) DEFAULT 'doctor_upload'::character varying,
    parent_annotation_id integer,
    subbox_region character varying(20),
    plaque_status integer,
    annotated_by integer,
    annotated_at timestamp without time zone,
    predicted_plaque integer
);


ALTER TABLE public.image_annotations OWNER TO postgres;

--
-- Name: TABLE image_annotations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.image_annotations IS 'Stores original COCO annotations and processed subbox annotations';


--
-- Name: COLUMN image_annotations.coco_image_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.coco_image_id IS 'Original image ID from COCO JSON file';


--
-- Name: COLUMN image_annotations.category_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.category_name IS 'Tooth number (11-44) or Brace';


--
-- Name: COLUMN image_annotations.bbox; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.bbox IS 'COCO bbox format [x, y, width, height] in pixels';


--
-- Name: COLUMN image_annotations.source_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.source_type IS 'Origin: doctor_upload (from bulk upload), python_processed (refined by Python), python_subbox (4-corner divisions)';


--
-- Name: COLUMN image_annotations.parent_annotation_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.parent_annotation_id IS 'For subboxes, references the parent tooth annotation';


--
-- Name: COLUMN image_annotations.subbox_region; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.subbox_region IS 'For subboxes: gingival, incisal, mesial, distal';


--
-- Name: COLUMN image_annotations.plaque_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.plaque_status IS '0 = no plaque, 1 = has plaque, NULL = not annotated yet';


--
-- Name: COLUMN image_annotations.annotated_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.annotated_by IS 'User ID of doctor who made the plaque annotation';


--
-- Name: COLUMN image_annotations.annotated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.image_annotations.annotated_at IS 'Timestamp when plaque status was annotated';


--
-- Name: image_annotations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.image_annotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.image_annotations_id_seq OWNER TO postgres;

--
-- Name: image_annotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.image_annotations_id_seq OWNED BY public.image_annotations.id;


--
-- Name: image_validations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image_validations (
    id integer NOT NULL,
    image_id integer,
    criteria character varying(100) NOT NULL,
    result boolean NOT NULL,
    notes text,
    validated_by integer,
    validated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.image_validations OWNER TO postgres;

--
-- Name: image_validations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.image_validations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.image_validations_id_seq OWNER TO postgres;

--
-- Name: image_validations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.image_validations_id_seq OWNED BY public.image_validations.id;


--
-- Name: images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.images (
    id integer NOT NULL,
    visit_id integer,
    url character varying(255) NOT NULL,
    image_category character varying(20) NOT NULL,
    image_type character varying(50),
    image_index integer,
    validation_status character varying(20) DEFAULT 'pending'::character varying,
    taken_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    url_processed text,
    processing_status character varying(50) DEFAULT 'pending'::character varying,
    processed_at timestamp without time zone,
    original_filename character varying(255),
    has_annotations boolean DEFAULT false,
    annotation_count integer DEFAULT 0,
    width integer,
    height integer
);


ALTER TABLE public.images OWNER TO postgres;

--
-- Name: COLUMN images.url_processed; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.url_processed IS 'URL to processed image with bounding boxes';


--
-- Name: COLUMN images.processing_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.processing_status IS 'Status: pending, processing, completed, failed';


--
-- Name: COLUMN images.processed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.processed_at IS 'Timestamp when processing completed';


--
-- Name: COLUMN images.original_filename; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.original_filename IS 'Original filename from upload for matching with COCO annotations';


--
-- Name: COLUMN images.has_annotations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.has_annotations IS 'Flag to quickly query images with annotations';


--
-- Name: COLUMN images.annotation_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.annotation_count IS 'Cached count of annotations for this image';


--
-- Name: COLUMN images.width; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.width IS 'Image width in pixels for coordinate conversion';


--
-- Name: COLUMN images.height; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.images.height IS 'Image height in pixels for coordinate conversion';


--
-- Name: images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.images_id_seq OWNER TO postgres;

--
-- Name: images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;


--
-- Name: labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.labels (
    id integer NOT NULL,
    image_id integer,
    subbox_id integer,
    label_type character varying(50) NOT NULL,
    value character varying(100),
    description text,
    labeled_by integer,
    labeled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.labels OWNER TO postgres;

--
-- Name: labels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.labels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.labels_id_seq OWNER TO postgres;

--
-- Name: labels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.labels_id_seq OWNED BY public.labels.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20),
    dob date,
    gender character varying(10),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.patients_id_seq OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: processing_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.processing_jobs (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    bullmq_job_id character varying(100),
    status character varying(20) DEFAULT 'queued'::character varying NOT NULL,
    progress integer DEFAULT 0,
    total_images integer DEFAULT 0,
    processed_images integer DEFAULT 0,
    error_message text,
    result_data jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.processing_jobs OWNER TO postgres;

--
-- Name: TABLE processing_jobs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.processing_jobs IS 'Tracks async image processing jobs';


--
-- Name: COLUMN processing_jobs.bullmq_job_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.processing_jobs.bullmq_job_id IS 'BullMQ job ID for status lookup';


--
-- Name: COLUMN processing_jobs.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.processing_jobs.status IS 'Status: queued, processing, completed, failed';


--
-- Name: COLUMN processing_jobs.progress; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.processing_jobs.progress IS 'Overall progress percentage (0-100)';


--
-- Name: COLUMN processing_jobs.total_images; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.processing_jobs.total_images IS 'Total number of images to process';


--
-- Name: COLUMN processing_jobs.processed_images; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.processing_jobs.processed_images IS 'Number of images processed so far';


--
-- Name: processing_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.processing_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.processing_jobs_id_seq OWNER TO postgres;

--
-- Name: processing_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.processing_jobs_id_seq OWNED BY public.processing_jobs.id;


--
-- Name: subboxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subboxes (
    id integer NOT NULL,
    image_id integer,
    region character varying(20) NOT NULL,
    coordinates jsonb NOT NULL,
    box_type character varying(20) NOT NULL,
    confidence double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subboxes OWNER TO postgres;

--
-- Name: subboxes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subboxes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subboxes_id_seq OWNER TO postgres;

--
-- Name: subboxes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subboxes_id_seq OWNED BY public.subboxes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    full_name character varying(100),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: visit_reprocess_status; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.visit_reprocess_status AS
SELECT
    NULL::integer AS visit_id,
    NULL::integer AS patient_id,
    NULL::character varying(100) AS patient_name,
    NULL::date AS visit_date,
    NULL::timestamp without time zone AS reprocessed_at,
    NULL::character varying(50) AS reprocessed_by_user,
    NULL::text AS reprocess_notes,
    NULL::bigint AS raw_image_count,
    NULL::bigint AS stained_image_count,
    NULL::text AS reprocess_status;


ALTER TABLE public.visit_reprocess_status OWNER TO postgres;

--
-- Name: VIEW visit_reprocess_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.visit_reprocess_status IS 'Shows reprocessing status of all visits';


--
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id integer NOT NULL,
    patient_id integer,
    case_id integer,
    visit_date date NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    annotation_file_url character varying(500),
    reprocessed_at timestamp without time zone,
    reprocessed_by integer,
    reprocess_notes text
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- Name: COLUMN visits.reprocessed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.visits.reprocessed_at IS 'Timestamp when visit images were last reprocessed with updated logic';


--
-- Name: COLUMN visits.reprocessed_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.visits.reprocessed_by IS 'User ID who triggered the reprocessing';


--
-- Name: COLUMN visits.reprocess_notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.visits.reprocess_notes IS 'Optional notes about what was reprocessed';


--
-- Name: visits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.visits_id_seq OWNER TO postgres;

--
-- Name: visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visits_id_seq OWNED BY public.visits.id;


--
-- Name: annotation_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annotation_history ALTER COLUMN id SET DEFAULT nextval('public.annotation_history_id_seq'::regclass);


--
-- Name: cases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases ALTER COLUMN id SET DEFAULT nextval('public.cases_id_seq'::regclass);


--
-- Name: doctors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);


--
-- Name: image_annotations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_annotations ALTER COLUMN id SET DEFAULT nextval('public.image_annotations_id_seq'::regclass);


--
-- Name: image_validations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_validations ALTER COLUMN id SET DEFAULT nextval('public.image_validations_id_seq'::regclass);


--
-- Name: images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);


--
-- Name: labels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels ALTER COLUMN id SET DEFAULT nextval('public.labels_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: processing_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processing_jobs ALTER COLUMN id SET DEFAULT nextval('public.processing_jobs_id_seq'::regclass);


--
-- Name: subboxes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subboxes ALTER COLUMN id SET DEFAULT nextval('public.subboxes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: visits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits ALTER COLUMN id SET DEFAULT nextval('public.visits_id_seq'::regclass);


--
-- Data for Name: annotation_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.annotation_history (id, annotation_id, user_id, old_value, new_value, changed_at) FROM stdin;
51	2500	2	0	1	2026-09-15 17:35:58.939796
52	2500	2	1	1	2026-09-15 17:35:59.737669
53	2500	2	1	0	2026-09-15 17:36:00.284432
54	2498	2	0	1	2026-09-15 17:36:02.29928
55	2500	2	0	1	2026-09-15 17:36:03.791444
56	2497	2	0	1	2026-09-15 17:36:05.721495
57	2494	2	0	1	2026-09-15 17:36:07.750103
58	2493	2	0	1	2026-09-15 17:36:09.536095
59	2498	2	1	0	2026-09-15 17:41:30.483807
60	2500	2	1	0	2026-09-15 17:41:30.880391
61	2498	2	0	1	2026-09-15 17:42:31.189703
62	2500	2	0	1	2026-09-15 17:42:32.23538
63	2496	2	0	1	2026-09-15 17:42:33.313547
64	2492	2	0	1	2026-09-15 17:42:34.272728
65	2492	2	1	0	2026-09-15 17:42:35.296844
66	2492	2	0	1	2026-09-15 17:42:36.2468
67	2492	2	1	0	2026-09-15 17:42:37.02809
68	2492	2	0	1	2026-09-15 17:42:38.030299
69	2492	2	1	0	2026-09-15 17:42:39.435237
70	2492	2	0	1	2026-09-15 17:42:39.951302
71	2492	2	1	0	2026-09-15 17:42:40.648029
72	2492	2	0	1	2026-09-15 17:42:44.27312
73	2495	2	0	1	2026-09-15 17:42:46.160366
74	2499	2	0	1	2026-09-15 17:42:47.380609
75	2443	2	0	1	2026-09-15 17:49:15.84032
76	2443	2	1	0	2026-09-15 17:49:16.397285
77	2445	2	0	1	2026-09-15 17:49:17.791589
78	2445	2	1	0	2026-09-15 17:49:18.234377
79	2442	2	0	1	2026-09-15 17:49:19.87926
80	2442	2	1	0	2026-09-15 17:49:21.332617
81	2493	2	1	0	2026-09-15 17:49:55.310283
82	2492	2	1	0	2026-09-15 17:49:56.546622
83	2492	2	0	1	2026-09-15 17:49:56.89829
84	2493	2	0	1	2026-09-15 17:51:01.009285
85	2492	2	1	0	2026-09-15 17:51:05.184745
86	2492	2	0	1	2026-09-15 17:51:05.78775
87	2493	2	1	0	2026-09-15 17:51:07.348881
88	2493	2	0	1	2026-09-15 17:51:08.11418
89	2495	2	1	0	2026-09-15 17:51:10.800346
90	2495	2	0	1	2026-09-15 17:51:11.117798
91	2500	2	1	0	2026-09-15 17:51:15.87043
92	2499	2	1	0	2026-09-15 17:51:17.757099
93	2498	2	1	0	2026-09-15 17:51:18.439847
94	2497	2	1	0	2026-09-15 17:51:19.887545
95	2493	2	1	0	2026-09-15 17:51:21.590143
96	2494	2	1	0	2026-09-15 17:51:25.482426
\.


--
-- Data for Name: case_doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.case_doctors (case_id, doctor_id, role) FROM stdin;
\.


--
-- Data for Name: cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cases (id, patient_id, start_date, end_date, treatment_type, status, notes, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (id, user_id, name, specialty, contact, created_at) FROM stdin;
\.


--
-- Data for Name: image_annotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.image_annotations (id, image_id, coco_image_id, category_id, category_name, bbox, area, created_at, source_type, parent_annotation_id, subbox_region, plaque_status, annotated_by, annotated_at, predicted_plaque) FROM stdin;
2432	220	220	0	class_0	[2299, 1142, 896, 410]	367360	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2433	220	220	0	class_0	[2299, 1883, 896, 300]	268800	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2434	220	220	0	class_0	[2299, 1553, 273, 331]	90363	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2435	220	220	0	class_0	[2977, 1553, 218, 331]	72158	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2436	220	220	1	11	[1606, 1357, 702, 895]	628290	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2437	220	220	7	23	[3190, 1145, 841, 1048]	881368	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2438	220	220	7	top_left	[3190, 1145, 841, 394]	331354	2026-09-15 17:34:49.082375	yolo_upload	2437	top_left	0	\N	\N	0
2439	220	220	7	top_right	[3190, 1906, 841, 287]	241367	2026-09-15 17:34:49.082375	yolo_upload	2437	top_right	0	\N	\N	0
2440	220	220	7	bottom_left	[3190, 1540, 295, 366]	107970	2026-09-15 17:34:49.082375	yolo_upload	2437	bottom_left	0	\N	\N	0
2441	220	220	7	bottom_right	[3916, 1540, 115, 366]	42090	2026-09-15 17:34:49.082375	yolo_upload	2437	bottom_right	0	\N	\N	0
2444	220	220	1	bottom_left	[1606, 1556, 55, 329]	18095	2026-09-15 17:34:49.082375	yolo_upload	2436	bottom_left	0	\N	\N	0
2446	221	221	0	class_0	[2298, 1611, 841, 180]	151380	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2447	221	221	0	class_0	[2298, 2093, 841, 283]	238003	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2448	221	221	0	class_0	[2298, 1791, 247, 301]	74347	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2449	221	221	0	class_0	[2915, 1791, 224, 301]	67424	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2450	221	221	1	11	[1637, 1885, 674, 699]	471126	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2451	221	221	7	23	[3145, 1565, 770, 822]	632940	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2452	221	221	7	top_left	[3145, 1565, 770, 243]	187110	2026-09-15 17:34:49.082375	yolo_upload	2451	top_left	0	\N	\N	0
2453	221	221	7	top_right	[3145, 2115, 770, 272]	209440	2026-09-15 17:34:49.082375	yolo_upload	2451	top_right	0	\N	\N	0
2454	221	221	7	bottom_left	[3145, 1808, 240, 307]	73680	2026-09-15 17:34:49.082375	yolo_upload	2451	bottom_left	0	\N	\N	0
2455	221	221	7	bottom_right	[3784, 1808, 131, 307]	40217	2026-09-15 17:34:49.082375	yolo_upload	2451	bottom_right	0	\N	\N	0
2456	221	221	1	top_left	[1637, 1885, 674, 60]	40440	2026-09-15 17:34:49.082375	yolo_upload	2450	top_left	0	\N	\N	0
2457	221	221	1	top_right	[1637, 2251, 674, 333]	224442	2026-09-15 17:34:49.082375	yolo_upload	2450	top_right	0	\N	\N	0
2458	221	221	1	bottom_left	[1637, 1945, 77, 306]	23562	2026-09-15 17:34:49.082375	yolo_upload	2450	bottom_left	0	\N	\N	0
2459	221	221	1	bottom_right	[2042, 1945, 269, 306]	82314	2026-09-15 17:34:49.082375	yolo_upload	2450	bottom_right	0	\N	\N	0
2460	222	222	0	class_0	[1905, 1813, 847, 404]	342188	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2461	222	222	0	class_0	[1905, 2605, 847, 137]	116039	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2462	222	222	0	class_0	[1905, 2217, 253, 388]	98164	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2463	222	222	0	class_0	[2544, 2217, 208, 388]	80704	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	0	\N	\N	\N
2464	222	222	1	11	[1209, 1778, 716, 871]	623636	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2465	222	222	7	23	[2757, 1793, 826, 958]	791308	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2466	222	222	7	top_left	[2757, 1793, 826, 412]	340312	2026-09-15 17:34:49.082375	yolo_upload	2465	top_left	0	\N	\N	0
2467	222	222	7	top_right	[2757, 2586, 826, 165]	136290	2026-09-15 17:34:49.082375	yolo_upload	2465	top_right	0	\N	\N	0
2468	222	222	7	bottom_left	[2757, 2206, 299, 381]	113919	2026-09-15 17:34:49.082375	yolo_upload	2465	bottom_left	0	\N	\N	0
2469	222	222	7	bottom_right	[3468, 2206, 115, 381]	43815	2026-09-15 17:34:49.082375	yolo_upload	2465	bottom_right	0	\N	\N	0
2470	222	222	1	top_left	[1209, 1778, 715, 272]	194480	2026-09-15 17:34:49.082375	yolo_upload	2464	top_left	0	\N	\N	0
2471	222	222	1	top_right	[1209, 2428, 715, 221]	158015	2026-09-15 17:34:49.082375	yolo_upload	2464	top_right	0	\N	\N	0
2472	222	222	1	bottom_left	[1209, 2050, 70, 378]	26460	2026-09-15 17:34:49.082375	yolo_upload	2464	bottom_left	0	\N	\N	0
2473	222	222	1	bottom_right	[1642, 2050, 283, 378]	106974	2026-09-15 17:34:49.082375	yolo_upload	2464	bottom_right	0	\N	\N	0
2474	226	226	3	13	[2960, 1415, 835, 797]	665495	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2475	226	226	3	top_left	[2960, 1415, 835, 121]	101035	2026-09-15 17:34:49.082375	yolo_upload	2474	top_left	0	\N	\N	0
2476	226	226	3	top_right	[2960, 1931, 835, 281]	234635	2026-09-15 17:34:49.082375	yolo_upload	2474	top_right	0	\N	\N	0
2477	226	226	3	bottom_left	[2960, 1535, 131, 395]	51745	2026-09-15 17:34:49.082375	yolo_upload	2474	bottom_left	0	\N	\N	0
2478	226	226	3	bottom_right	[3515, 1535, 280, 395]	110600	2026-09-15 17:34:49.082375	yolo_upload	2474	bottom_right	0	\N	\N	0
2479	227	227	8	24	[1988, 1266, 819, 933]	764127	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2480	227	227	9	31	[2800, 1358, 934, 774]	722916	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2481	227	227	9	top_left	[2800, 1358, 934, 28]	26152	2026-09-15 17:34:49.082375	yolo_upload	2480	top_left	0	\N	\N	0
2445	220	220	1	bottom_right	[2046, 1556, 262, 329]	86198	2026-09-15 17:34:49.082375	yolo_upload	2436	bottom_right	0	2	2026-09-15 17:49:18.234377	0
2482	227	227	9	top_right	[2800, 1807, 934, 325]	303550	2026-09-15 17:34:49.082375	yolo_upload	2480	top_right	0	\N	\N	0
2483	227	227	9	bottom_left	[2800, 1386, 174, 421]	73254	2026-09-15 17:34:49.082375	yolo_upload	2480	bottom_left	0	\N	\N	0
2484	227	227	9	bottom_right	[3401, 1386, 332, 421]	139772	2026-09-15 17:34:49.082375	yolo_upload	2480	bottom_right	0	\N	\N	0
2485	227	227	8	top_left	[1988, 1266, 819, 217]	177723	2026-09-15 17:34:49.082375	yolo_upload	2479	top_left	0	\N	\N	0
2486	227	227	8	top_right	[1988, 1873, 819, 326]	266994	2026-09-15 17:34:49.082375	yolo_upload	2479	top_right	0	\N	\N	0
2487	227	227	8	bottom_left	[1988, 1482, 74, 391]	28934	2026-09-15 17:34:49.082375	yolo_upload	2479	bottom_left	0	\N	\N	0
2488	227	227	8	bottom_right	[2457, 1482, 350, 391]	136850	2026-09-15 17:34:49.082375	yolo_upload	2479	bottom_right	0	\N	\N	0
2489	228	228	7	23	[1531, 843, 661, 1146]	757506	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2490	228	228	8	24	[2191, 1200, 750, 904]	678000	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2491	228	228	9	31	[2948, 1539, 777, 615]	477855	2026-09-15 17:34:49.082375	yolo_upload	\N	\N	\N	\N	\N	\N
2496	228	228	8	bottom_right	[2647, 1542, 294, 365]	107310	2026-09-15 17:34:49.082375	yolo_upload	2490	bottom_right	1	2	2026-09-15 17:42:33.313547	0
2443	220	220	1	top_right	[1606, 1885, 701, 367]	257267	2026-09-15 17:34:49.082375	yolo_upload	2436	top_right	0	2	2026-09-15 17:49:16.397285	0
2442	220	220	1	top_left	[1606, 1357, 701, 199]	139499	2026-09-15 17:34:49.082375	yolo_upload	2436	top_left	0	2	2026-09-15 17:49:21.332617	0
2492	228	228	7	top_left	[1531, 843, 661, 1146]	757506	2026-09-15 17:34:49.082375	yolo_upload	2489	top_left	1	2	2026-09-15 17:51:05.78775	0
2495	228	228	8	bottom_left	[2191, 1542, 71, 365]	25915	2026-09-15 17:34:49.082375	yolo_upload	2490	bottom_left	1	2	2026-09-15 17:51:11.117798	0
2500	228	228	9	bottom_right	[3492, 1671, 233, 333]	77589	2026-09-15 17:34:49.082375	yolo_upload	2491	bottom_right	0	2	2026-09-15 17:51:15.87043	0
2499	228	228	9	bottom_left	[2948, 1671, 126, 333]	41958	2026-09-15 17:34:49.082375	yolo_upload	2491	bottom_left	0	2	2026-09-15 17:51:17.757099	0
2498	228	228	9	top_right	[2948, 2004, 777, 150]	116550	2026-09-15 17:34:49.082375	yolo_upload	2491	top_right	0	2	2026-09-15 17:51:18.439847	0
2497	228	228	9	top_left	[2948, 1539, 777, 132]	102564	2026-09-15 17:34:49.082375	yolo_upload	2491	top_left	0	2	2026-09-15 17:51:19.887545	0
2493	228	228	8	top_left	[2191, 1200, 749, 342]	256158	2026-09-15 17:34:49.082375	yolo_upload	2490	top_left	0	2	2026-09-15 17:51:21.590143	0
2494	228	228	8	top_right	[2191, 1906, 749, 198]	148302	2026-09-15 17:34:49.082375	yolo_upload	2490	top_right	0	2	2026-09-15 17:51:25.482426	0
2501	229	229	13	41	[3346, 1927, 505, 620]	313100	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2502	229	229	14	42	[3841, 1995, 475, 596]	283100	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2503	229	229	19	35	[2804, 1935, 536, 660]	353760	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2504	229	229	20	45	[2285, 1976, 512, 705]	360960	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2505	229	229	19	top_left	[2804, 1935, 536, 231]	123816	2026-09-15 17:52:38.767226	yolo_upload	2503	top_left	0	\N	\N	0
2506	229	229	19	top_right	[2804, 2480, 536, 115]	61640	2026-09-15 17:52:38.767226	yolo_upload	2503	top_right	0	\N	\N	0
2507	229	229	19	bottom_left	[2804, 2166, 104, 313]	32552	2026-09-15 17:52:38.767226	yolo_upload	2503	bottom_left	0	\N	\N	0
2508	229	229	19	bottom_right	[3209, 2166, 131, 313]	41003	2026-09-15 17:52:38.767226	yolo_upload	2503	bottom_right	0	\N	\N	0
2509	229	229	20	top_left	[2285, 1976, 512, 211]	108032	2026-09-15 17:52:38.767226	yolo_upload	2504	top_left	0	\N	\N	0
2510	229	229	20	top_right	[2285, 2483, 512, 198]	101376	2026-09-15 17:52:38.767226	yolo_upload	2504	top_right	0	\N	\N	0
2511	229	229	20	bottom_left	[2285, 2186, 48, 296]	14208	2026-09-15 17:52:38.767226	yolo_upload	2504	bottom_left	0	\N	\N	0
2512	229	229	20	bottom_right	[2609, 2186, 188, 296]	55648	2026-09-15 17:52:38.767226	yolo_upload	2504	bottom_right	0	\N	\N	0
2513	229	229	13	top_left	[3346, 1927, 504, 239]	120456	2026-09-15 17:52:38.767226	yolo_upload	2501	top_left	0	\N	\N	0
2514	229	229	13	top_right	[3346, 2483, 504, 64]	32256	2026-09-15 17:52:38.767226	yolo_upload	2501	top_right	0	\N	\N	0
2515	229	229	13	bottom_left	[3346, 2166, 128, 316]	40448	2026-09-15 17:52:38.767226	yolo_upload	2501	bottom_left	0	\N	\N	0
2516	229	229	13	bottom_right	[3771, 2166, 80, 316]	25280	2026-09-15 17:52:38.767226	yolo_upload	2501	bottom_right	0	\N	\N	0
2517	229	229	14	top_left	[3841, 1995, 475, 175]	83125	2026-09-15 17:52:38.767226	yolo_upload	2502	top_left	0	\N	\N	0
2518	229	229	14	top_right	[3841, 2511, 475, 80]	38000	2026-09-15 17:52:38.767226	yolo_upload	2502	top_right	0	\N	\N	0
2519	229	229	14	bottom_left	[3841, 2170, 124, 341]	42284	2026-09-15 17:52:38.767226	yolo_upload	2502	bottom_left	0	\N	\N	0
2520	229	229	14	bottom_right	[4259, 2170, 57, 341]	19437	2026-09-15 17:52:38.767226	yolo_upload	2502	bottom_right	0	\N	\N	0
2521	230	230	13	41	[2538, 1434, 508, 642]	326136	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2522	230	230	19	35	[2024, 1434, 517, 604]	312268	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2523	230	230	20	45	[1488, 1526, 535, 674]	360590	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2524	230	230	20	top_left	[1488, 1526, 535, 170]	90950	2026-09-15 17:52:38.767226	yolo_upload	2523	top_left	0	\N	\N	0
2525	230	230	20	top_right	[1488, 2003, 535, 197]	105395	2026-09-15 17:52:38.767226	yolo_upload	2523	top_right	0	\N	\N	0
2526	230	230	20	bottom_left	[1488, 1696, 46, 308]	14168	2026-09-15 17:52:38.767226	yolo_upload	2523	bottom_left	0	\N	\N	0
2527	230	230	20	bottom_right	[1830, 1696, 193, 308]	59444	2026-09-15 17:52:38.767226	yolo_upload	2523	bottom_right	0	\N	\N	0
2528	230	230	19	top_left	[2024, 1434, 517, 165]	85305	2026-09-15 17:52:38.767226	yolo_upload	2522	top_left	0	\N	\N	0
2529	230	230	19	top_right	[2024, 1906, 517, 132]	68244	2026-09-15 17:52:38.767226	yolo_upload	2522	top_right	0	\N	\N	0
2530	230	230	19	bottom_left	[2024, 1600, 104, 306]	31824	2026-09-15 17:52:38.767226	yolo_upload	2522	bottom_left	0	\N	\N	0
2531	230	230	19	bottom_right	[2414, 1600, 127, 306]	38862	2026-09-15 17:52:38.767226	yolo_upload	2522	bottom_right	0	\N	\N	0
2532	230	230	13	top_left	[2538, 1434, 508, 175]	88900	2026-09-15 17:52:38.767226	yolo_upload	2521	top_left	0	\N	\N	0
2533	230	230	13	top_right	[2538, 1923, 508, 153]	77724	2026-09-15 17:52:38.767226	yolo_upload	2521	top_right	0	\N	\N	0
2534	230	230	13	bottom_left	[2538, 1609, 140, 314]	43960	2026-09-15 17:52:38.767226	yolo_upload	2521	bottom_left	0	\N	\N	0
2535	230	230	13	bottom_right	[2978, 1609, 68, 314]	21352	2026-09-15 17:52:38.767226	yolo_upload	2521	bottom_right	0	\N	\N	0
2536	232	232	2	12	[2505, 1048, 1013, 733]	742529	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2537	232	232	3	13	[1567, 1027, 956, 613]	586028	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2538	232	232	21	brace	[3324, 1765, 893, 794]	709042	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2539	232	232	22	class_22	[2375, 1716, 954, 814]	776556	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2540	232	232	23	class_23	[1448, 1635, 915, 646]	591090	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2541	232	232	22	top_left	[2375, 1716, 954, 235]	224190	2026-09-15 17:52:38.767226	yolo_upload	2539	top_left	0	\N	\N	0
2542	232	232	22	top_right	[2375, 2364, 954, 166]	158364	2026-09-15 17:52:38.767226	yolo_upload	2539	top_right	0	\N	\N	0
2543	232	232	22	bottom_left	[2375, 1951, 281, 414]	116334	2026-09-15 17:52:38.767226	yolo_upload	2539	bottom_left	0	\N	\N	0
2544	232	232	22	bottom_right	[3107, 1951, 222, 414]	91908	2026-09-15 17:52:38.767226	yolo_upload	2539	bottom_right	0	\N	\N	0
2545	232	232	21	top_left	[3324, 1765, 893, 260]	232180	2026-09-15 17:52:38.767226	yolo_upload	2538	top_left	0	\N	\N	0
2546	232	232	21	top_right	[3324, 2379, 893, 180]	160740	2026-09-15 17:52:38.767226	yolo_upload	2538	top_right	0	\N	\N	0
2547	232	232	21	bottom_left	[3324, 2025, 299, 354]	105846	2026-09-15 17:52:38.767226	yolo_upload	2538	bottom_left	0	\N	\N	0
2548	232	232	21	bottom_right	[4046, 2025, 171, 354]	60534	2026-09-15 17:52:38.767226	yolo_upload	2538	bottom_right	0	\N	\N	0
2549	232	232	2	top_left	[2505, 1048, 1012, 56]	56672	2026-09-15 17:52:38.767226	yolo_upload	2536	top_left	0	\N	\N	0
2550	232	232	2	top_right	[2505, 1469, 1012, 312]	315744	2026-09-15 17:52:38.767226	yolo_upload	2536	top_right	0	\N	\N	0
2551	232	232	2	bottom_left	[2505, 1104, 306, 365]	111690	2026-09-15 17:52:38.767226	yolo_upload	2536	bottom_left	0	\N	\N	0
2552	232	232	2	bottom_right	[3248, 1104, 270, 365]	98550	2026-09-15 17:52:38.767226	yolo_upload	2536	bottom_right	0	\N	\N	0
2553	232	232	3	top_left	[1567, 1027, 956, 39]	37284	2026-09-15 17:52:38.767226	yolo_upload	2537	top_left	0	\N	\N	0
2554	232	232	3	top_right	[1567, 1412, 956, 228]	217968	2026-09-15 17:52:38.767226	yolo_upload	2537	top_right	0	\N	\N	0
2555	232	232	3	bottom_left	[1567, 1065, 211, 346]	73006	2026-09-15 17:52:38.767226	yolo_upload	2537	bottom_left	0	\N	\N	0
2556	232	232	3	bottom_right	[2233, 1065, 290, 346]	100340	2026-09-15 17:52:38.767226	yolo_upload	2537	bottom_right	0	\N	\N	0
2557	232	232	23	top_left	[1448, 1635, 915, 169]	154635	2026-09-15 17:52:38.767226	yolo_upload	2540	top_left	0	\N	\N	0
2558	232	232	23	top_right	[1448, 2205, 915, 76]	69540	2026-09-15 17:52:38.767226	yolo_upload	2540	top_right	0	\N	\N	0
2559	232	232	23	bottom_left	[1448, 1803, 56, 402]	22512	2026-09-15 17:52:38.767226	yolo_upload	2540	bottom_left	0	\N	\N	0
2560	232	232	23	bottom_right	[1978, 1803, 385, 402]	154770	2026-09-15 17:52:38.767226	yolo_upload	2540	bottom_right	0	\N	\N	0
2561	233	233	2	12	[2505, 1014, 942, 709]	667878	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2562	233	233	3	13	[1639, 1127, 916, 663]	607308	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2563	233	233	20	45	[3961, 1566, 714, 851]	607614	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2564	233	233	21	brace	[3092, 1590, 872, 706]	615632	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2565	233	233	21	top_left	[3092, 1590, 872, 166]	144752	2026-09-15 17:52:38.767226	yolo_upload	2564	top_left	0	\N	\N	0
2566	233	233	21	top_right	[3092, 2094, 872, 202]	176144	2026-09-15 17:52:38.767226	yolo_upload	2564	top_right	0	\N	\N	0
2567	233	233	21	bottom_left	[3092, 1756, 160, 339]	54240	2026-09-15 17:52:38.767226	yolo_upload	2564	bottom_left	0	\N	\N	0
2568	233	233	21	bottom_right	[3727, 1756, 237, 339]	80343	2026-09-15 17:52:38.767226	yolo_upload	2564	bottom_right	0	\N	\N	0
2569	233	233	2	top_left	[2505, 1014, 942, 41]	38622	2026-09-15 17:52:38.767226	yolo_upload	2561	top_left	0	\N	\N	0
2570	233	233	2	top_right	[2505, 1393, 942, 330]	310860	2026-09-15 17:52:38.767226	yolo_upload	2561	top_right	0	\N	\N	0
2571	233	233	2	bottom_left	[2505, 1056, 154, 337]	51898	2026-09-15 17:52:38.767226	yolo_upload	2561	bottom_left	0	\N	\N	0
2572	233	233	2	bottom_right	[3107, 1056, 339, 337]	114243	2026-09-15 17:52:38.767226	yolo_upload	2561	bottom_right	0	\N	\N	0
2573	233	233	3	top_left	[1639, 1127, 915, 9]	8235	2026-09-15 17:52:38.767226	yolo_upload	2562	top_left	0	\N	\N	0
2574	233	233	3	top_right	[1639, 1513, 915, 277]	253455	2026-09-15 17:52:38.767226	yolo_upload	2562	top_right	0	\N	\N	0
2575	233	233	3	bottom_left	[1639, 1136, 98, 377]	36946	2026-09-15 17:52:38.767226	yolo_upload	2562	bottom_left	0	\N	\N	0
2576	233	233	3	bottom_right	[2202, 1136, 353, 377]	133081	2026-09-15 17:52:38.767226	yolo_upload	2562	bottom_right	0	\N	\N	0
2577	233	233	20	top_left	[3961, 1566, 714, 213]	152082	2026-09-15 17:52:38.767226	yolo_upload	2563	top_left	0	\N	\N	0
2578	233	233	20	top_right	[3961, 2170, 714, 247]	176358	2026-09-15 17:52:38.767226	yolo_upload	2563	top_right	0	\N	\N	0
2579	233	233	20	bottom_left	[3961, 1779, 249, 391]	97359	2026-09-15 17:52:38.767226	yolo_upload	2563	bottom_left	0	\N	\N	0
2580	233	233	20	bottom_right	[4590, 1779, 85, 391]	33235	2026-09-15 17:52:38.767226	yolo_upload	2563	bottom_right	0	\N	\N	0
2581	234	234	2	12	[2365, 1624, 1048, 615]	644520	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2582	234	234	21	brace	[2979, 2194, 887, 827]	733549	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2583	234	234	22	class_22	[2038, 2198, 935, 918]	858330	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2584	234	234	22	top_left	[2038, 2198, 935, 339]	316965	2026-09-15 17:52:38.767226	yolo_upload	2583	top_left	0	\N	\N	0
2585	234	234	22	top_right	[2038, 2976, 935, 140]	130900	2026-09-15 17:52:38.767226	yolo_upload	2583	top_right	0	\N	\N	0
2586	234	234	22	bottom_left	[2038, 2537, 239, 440]	105160	2026-09-15 17:52:38.767226	yolo_upload	2583	bottom_left	0	\N	\N	0
2587	234	234	22	bottom_right	[2743, 2537, 230, 440]	101200	2026-09-15 17:52:38.767226	yolo_upload	2583	bottom_right	0	\N	\N	0
2588	234	234	21	top_left	[2979, 2194, 887, 323]	286501	2026-09-15 17:52:38.767226	yolo_upload	2582	top_left	0	\N	\N	0
2589	234	234	21	top_right	[2979, 2903, 887, 118]	104666	2026-09-15 17:52:38.767226	yolo_upload	2582	top_right	0	\N	\N	0
2590	234	234	21	bottom_left	[2979, 2517, 303, 386]	116958	2026-09-15 17:52:38.767226	yolo_upload	2582	bottom_left	0	\N	\N	0
2591	234	234	21	bottom_right	[3709, 2517, 156, 386]	60216	2026-09-15 17:52:38.767226	yolo_upload	2582	bottom_right	0	\N	\N	0
2592	234	234	2	top_left	[2365, 1624, 1048, 120]	125760	2026-09-15 17:52:38.767226	yolo_upload	2581	top_left	0	\N	\N	0
2593	234	234	2	top_right	[2365, 2064, 1048, 175]	183400	2026-09-15 17:52:38.767226	yolo_upload	2581	top_right	0	\N	\N	0
2594	234	234	2	bottom_left	[2365, 1743, 259, 321]	83139	2026-09-15 17:52:38.767226	yolo_upload	2581	bottom_left	0	\N	\N	0
2595	234	234	2	bottom_right	[3119, 1743, 293, 321]	94053	2026-09-15 17:52:38.767226	yolo_upload	2581	bottom_right	0	\N	\N	0
2596	235	235	9	31	[2808, 1330, 1110, 936]	1038960	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2597	235	235	10	32	[3899, 1667, 1033, 724]	747892	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2598	235	235	15	43	[2124, 2190, 928, 996]	924288	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2599	235	235	16	44	[3055, 2362, 996, 853]	849588	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2600	235	235	17	15	[4055, 2353, 1048, 694]	727312	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2601	235	235	9	top_left	[2808, 1330, 1110, 186]	206460	2026-09-15 17:52:38.767226	yolo_upload	2596	top_left	0	\N	\N	0
2602	235	235	9	top_right	[2808, 1940, 1110, 326]	361860	2026-09-15 17:52:38.767226	yolo_upload	2596	top_right	0	\N	\N	0
2603	235	235	9	bottom_left	[2808, 1515, 290, 424]	122960	2026-09-15 17:52:38.767226	yolo_upload	2596	bottom_left	0	\N	\N	0
2604	235	235	9	bottom_right	[3634, 1515, 284, 424]	120416	2026-09-15 17:52:38.767226	yolo_upload	2596	bottom_right	0	\N	\N	0
2605	235	235	16	top_left	[3055, 2362, 995, 244]	242780	2026-09-15 17:52:38.767226	yolo_upload	2599	top_left	0	\N	\N	0
2606	235	235	16	top_right	[3055, 3007, 995, 208]	206960	2026-09-15 17:52:38.767226	yolo_upload	2599	top_right	0	\N	\N	0
2607	235	235	16	bottom_left	[3055, 2607, 195, 400]	78000	2026-09-15 17:52:38.767226	yolo_upload	2599	bottom_left	0	\N	\N	0
2608	235	235	16	bottom_right	[3793, 2607, 258, 400]	103200	2026-09-15 17:52:38.767226	yolo_upload	2599	bottom_right	0	\N	\N	0
2609	235	235	10	top_left	[3899, 1667, 1033, 63]	65079	2026-09-15 17:52:38.767226	yolo_upload	2597	top_left	0	\N	\N	0
2610	235	235	10	top_right	[3899, 2086, 1033, 305]	315065	2026-09-15 17:52:38.767226	yolo_upload	2597	top_right	0	\N	\N	0
2611	235	235	10	bottom_left	[3899, 1730, 368, 356]	131008	2026-09-15 17:52:38.767226	yolo_upload	2597	bottom_left	0	\N	\N	0
2612	235	235	10	bottom_right	[4783, 1730, 149, 356]	53044	2026-09-15 17:52:38.767226	yolo_upload	2597	bottom_right	0	\N	\N	0
2613	235	235	17	top_left	[4055, 2353, 1048, 163]	170824	2026-09-15 17:52:38.767226	yolo_upload	2600	top_left	0	\N	\N	0
2614	235	235	17	top_right	[4055, 2912, 1048, 135]	141480	2026-09-15 17:52:38.767226	yolo_upload	2600	top_right	0	\N	\N	0
2615	235	235	17	bottom_left	[4055, 2515, 332, 397]	131804	2026-09-15 17:52:38.767226	yolo_upload	2600	bottom_left	0	\N	\N	0
2616	235	235	17	bottom_right	[4915, 2515, 188, 397]	74636	2026-09-15 17:52:38.767226	yolo_upload	2600	bottom_right	0	\N	\N	0
2617	235	235	15	top_left	[2124, 2190, 928, 349]	323872	2026-09-15 17:52:38.767226	yolo_upload	2598	top_left	0	\N	\N	0
2618	235	235	15	top_right	[2124, 2967, 928, 219]	203232	2026-09-15 17:52:38.767226	yolo_upload	2598	top_right	0	\N	\N	0
2619	235	235	15	bottom_left	[2124, 2538, 13, 429]	5577	2026-09-15 17:52:38.767226	yolo_upload	2598	bottom_left	0	\N	\N	0
2620	235	235	15	bottom_right	[2659, 2538, 393, 429]	168597	2026-09-15 17:52:38.767226	yolo_upload	2598	bottom_right	0	\N	\N	0
2621	236	236	9	31	[2401, 606, 1033, 866]	894578	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2622	236	236	10	32	[3433, 943, 942, 784]	738528	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2623	236	236	15	43	[1711, 1603, 862, 774]	667188	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2624	236	236	16	44	[2586, 1765, 921, 640]	589440	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2625	236	236	15	top_left	[1711, 1603, 862, 207]	178434	2026-09-15 17:52:38.767226	yolo_upload	2623	top_left	0	\N	\N	0
2626	236	236	15	top_right	[1711, 2199, 862, 178]	153436	2026-09-15 17:52:38.767226	yolo_upload	2623	top_right	0	\N	\N	0
2627	236	236	15	bottom_left	[1711, 1810, 30, 388]	11640	2026-09-15 17:52:38.767226	yolo_upload	2623	bottom_left	0	\N	\N	0
2628	236	236	15	bottom_right	[2227, 1810, 346, 388]	134248	2026-09-15 17:52:38.767226	yolo_upload	2623	bottom_right	0	\N	\N	0
2629	236	236	16	top_left	[2586, 1765, 921, 96]	88416	2026-09-15 17:52:38.767226	yolo_upload	2624	top_left	0	\N	\N	0
2630	236	236	16	top_right	[2586, 2225, 921, 180]	165780	2026-09-15 17:52:38.767226	yolo_upload	2624	top_right	0	\N	\N	0
2631	236	236	16	bottom_left	[2586, 1862, 189, 363]	68607	2026-09-15 17:52:38.767226	yolo_upload	2624	bottom_left	0	\N	\N	0
2632	236	236	16	bottom_right	[3258, 1862, 248, 363]	90024	2026-09-15 17:52:38.767226	yolo_upload	2624	bottom_right	0	\N	\N	0
2633	236	236	9	top_left	[2401, 606, 1033, 98]	101234	2026-09-15 17:52:38.767226	yolo_upload	2621	top_left	0	\N	\N	0
2634	236	236	9	top_right	[2401, 1133, 1033, 339]	350187	2026-09-15 17:52:38.767226	yolo_upload	2621	top_right	0	\N	\N	0
2635	236	236	9	bottom_left	[2401, 704, 301, 429]	129129	2026-09-15 17:52:38.767226	yolo_upload	2621	bottom_left	0	\N	\N	0
2636	236	236	9	bottom_right	[3166, 704, 267, 429]	114543	2026-09-15 17:52:38.767226	yolo_upload	2621	bottom_right	0	\N	\N	0
2637	236	236	10	top_left	[3433, 943, 941, 24]	22584	2026-09-15 17:52:38.767226	yolo_upload	2622	top_left	0	\N	\N	0
2638	236	236	10	top_right	[3433, 1423, 941, 304]	286064	2026-09-15 17:52:38.767226	yolo_upload	2622	top_right	0	\N	\N	0
2639	236	236	10	bottom_left	[3433, 967, 331, 456]	150936	2026-09-15 17:52:38.767226	yolo_upload	2622	bottom_left	0	\N	\N	0
2640	236	236	10	bottom_right	[4229, 967, 146, 456]	66576	2026-09-15 17:52:38.767226	yolo_upload	2622	bottom_right	0	\N	\N	0
2641	237	237	9	31	[2515, 1706, 1111, 877]	974347	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2642	237	237	15	43	[1869, 2474, 940, 976]	917440	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2643	237	237	16	44	[2824, 2566, 991, 942]	933522	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2644	237	237	17	15	[3798, 2511, 1077, 771]	830367	2026-09-15 17:52:38.767226	yolo_upload	\N	\N	\N	\N	\N	\N
2645	237	237	9	top_left	[2515, 1706, 1111, 236]	262196	2026-09-15 17:52:38.767226	yolo_upload	2641	top_left	0	\N	\N	0
2646	237	237	9	top_right	[2515, 2343, 1111, 240]	266640	2026-09-15 17:52:38.767226	yolo_upload	2641	top_right	0	\N	\N	0
2647	237	237	9	bottom_left	[2515, 1942, 308, 401]	123508	2026-09-15 17:52:38.767226	yolo_upload	2641	bottom_left	0	\N	\N	0
2648	237	237	9	bottom_right	[3382, 1942, 243, 401]	97443	2026-09-15 17:52:38.767226	yolo_upload	2641	bottom_right	0	\N	\N	0
2649	237	237	16	top_left	[2824, 2566, 991, 329]	326039	2026-09-15 17:52:38.767226	yolo_upload	2643	top_left	0	\N	\N	0
2650	237	237	16	top_right	[2824, 3322, 991, 186]	184326	2026-09-15 17:52:38.767226	yolo_upload	2643	top_right	0	\N	\N	0
2651	237	237	16	bottom_left	[2824, 2895, 215, 426]	91590	2026-09-15 17:52:38.767226	yolo_upload	2643	bottom_left	0	\N	\N	0
2652	237	237	16	bottom_right	[3517, 2895, 297, 426]	126522	2026-09-15 17:52:38.767226	yolo_upload	2643	bottom_right	0	\N	\N	0
2653	237	237	17	top_left	[3798, 2511, 1077, 194]	208938	2026-09-15 17:52:38.767226	yolo_upload	2644	top_left	0	\N	\N	0
2654	237	237	17	top_right	[3798, 3150, 1077, 132]	142164	2026-09-15 17:52:38.767226	yolo_upload	2644	top_right	0	\N	\N	0
2655	237	237	17	bottom_left	[3798, 2706, 346, 444]	153624	2026-09-15 17:52:38.767226	yolo_upload	2644	bottom_left	0	\N	\N	0
2656	237	237	17	bottom_right	[4621, 2706, 253, 444]	112332	2026-09-15 17:52:38.767226	yolo_upload	2644	bottom_right	0	\N	\N	0
2657	237	237	15	top_left	[1869, 2474, 939, 392]	368088	2026-09-15 17:52:38.767226	yolo_upload	2642	top_left	0	\N	\N	0
2658	237	237	15	top_right	[1869, 3285, 939, 165]	154935	2026-09-15 17:52:38.767226	yolo_upload	2642	top_right	0	\N	\N	0
2659	237	237	15	bottom_left	[1869, 2866, 72, 419]	30168	2026-09-15 17:52:38.767226	yolo_upload	2642	bottom_left	0	\N	\N	0
2660	237	237	15	bottom_right	[2451, 2866, 358, 419]	150002	2026-09-15 17:52:38.767226	yolo_upload	2642	bottom_right	0	\N	\N	0
2661	238	238	13	41	[3346, 1927, 505, 620]	313100	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2662	238	238	14	42	[3841, 1995, 475, 596]	283100	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2663	238	238	19	35	[2804, 1935, 536, 660]	353760	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2664	238	238	20	45	[2285, 1976, 512, 705]	360960	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2665	238	238	19	top_left	[2804, 1935, 536, 231]	123816	2026-09-15 18:02:29.684356	yolo_upload	2663	top_left	1	\N	\N	1
2666	238	238	19	top_right	[2804, 2480, 536, 115]	61640	2026-09-15 18:02:29.684356	yolo_upload	2663	top_right	1	\N	\N	1
2667	238	238	19	bottom_left	[2804, 2166, 104, 313]	32552	2026-09-15 18:02:29.684356	yolo_upload	2663	bottom_left	1	\N	\N	1
2668	238	238	19	bottom_right	[3209, 2166, 131, 313]	41003	2026-09-15 18:02:29.684356	yolo_upload	2663	bottom_right	1	\N	\N	1
2669	238	238	20	top_left	[2285, 1976, 512, 211]	108032	2026-09-15 18:02:29.684356	yolo_upload	2664	top_left	1	\N	\N	1
2670	238	238	20	top_right	[2285, 2483, 512, 198]	101376	2026-09-15 18:02:29.684356	yolo_upload	2664	top_right	1	\N	\N	1
2671	238	238	20	bottom_left	[2285, 2186, 48, 296]	14208	2026-09-15 18:02:29.684356	yolo_upload	2664	bottom_left	1	\N	\N	1
2672	238	238	20	bottom_right	[2609, 2186, 188, 296]	55648	2026-09-15 18:02:29.684356	yolo_upload	2664	bottom_right	1	\N	\N	1
2673	238	238	13	top_left	[3346, 1927, 504, 239]	120456	2026-09-15 18:02:29.684356	yolo_upload	2661	top_left	1	\N	\N	1
2674	238	238	13	top_right	[3346, 2483, 504, 64]	32256	2026-09-15 18:02:29.684356	yolo_upload	2661	top_right	1	\N	\N	1
2675	238	238	13	bottom_left	[3346, 2166, 128, 316]	40448	2026-09-15 18:02:29.684356	yolo_upload	2661	bottom_left	1	\N	\N	1
2676	238	238	13	bottom_right	[3771, 2166, 80, 316]	25280	2026-09-15 18:02:29.684356	yolo_upload	2661	bottom_right	1	\N	\N	1
2677	238	238	14	top_left	[3841, 1995, 475, 175]	83125	2026-09-15 18:02:29.684356	yolo_upload	2662	top_left	1	\N	\N	1
2678	238	238	14	top_right	[3841, 2511, 475, 80]	38000	2026-09-15 18:02:29.684356	yolo_upload	2662	top_right	1	\N	\N	1
2679	238	238	14	bottom_left	[3841, 2170, 124, 341]	42284	2026-09-15 18:02:29.684356	yolo_upload	2662	bottom_left	1	\N	\N	1
2680	238	238	14	bottom_right	[4259, 2170, 57, 341]	19437	2026-09-15 18:02:29.684356	yolo_upload	2662	bottom_right	1	\N	\N	1
2681	239	239	13	41	[2538, 1434, 508, 642]	326136	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2682	239	239	19	35	[2024, 1434, 517, 604]	312268	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2683	239	239	20	45	[1488, 1526, 535, 674]	360590	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2684	239	239	20	top_left	[1488, 1526, 535, 170]	90950	2026-09-15 18:02:29.684356	yolo_upload	2683	top_left	1	\N	\N	1
2685	239	239	20	top_right	[1488, 2003, 535, 197]	105395	2026-09-15 18:02:29.684356	yolo_upload	2683	top_right	1	\N	\N	1
2686	239	239	20	bottom_left	[1488, 1696, 46, 308]	14168	2026-09-15 18:02:29.684356	yolo_upload	2683	bottom_left	1	\N	\N	1
2687	239	239	20	bottom_right	[1830, 1696, 193, 308]	59444	2026-09-15 18:02:29.684356	yolo_upload	2683	bottom_right	1	\N	\N	1
2688	239	239	19	top_left	[2024, 1434, 517, 165]	85305	2026-09-15 18:02:29.684356	yolo_upload	2682	top_left	1	\N	\N	1
2689	239	239	19	top_right	[2024, 1906, 517, 132]	68244	2026-09-15 18:02:29.684356	yolo_upload	2682	top_right	1	\N	\N	1
2690	239	239	19	bottom_left	[2024, 1600, 104, 306]	31824	2026-09-15 18:02:29.684356	yolo_upload	2682	bottom_left	1	\N	\N	1
2691	239	239	19	bottom_right	[2414, 1600, 127, 306]	38862	2026-09-15 18:02:29.684356	yolo_upload	2682	bottom_right	1	\N	\N	1
2692	239	239	13	top_left	[2538, 1434, 508, 175]	88900	2026-09-15 18:02:29.684356	yolo_upload	2681	top_left	1	\N	\N	1
2693	239	239	13	top_right	[2538, 1923, 508, 153]	77724	2026-09-15 18:02:29.684356	yolo_upload	2681	top_right	1	\N	\N	1
2694	239	239	13	bottom_left	[2538, 1609, 140, 314]	43960	2026-09-15 18:02:29.684356	yolo_upload	2681	bottom_left	1	\N	\N	1
2695	239	239	13	bottom_right	[2978, 1609, 68, 314]	21352	2026-09-15 18:02:29.684356	yolo_upload	2681	bottom_right	1	\N	\N	1
2696	241	241	2	12	[2505, 1048, 1013, 733]	742529	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2697	241	241	3	13	[1567, 1027, 956, 613]	586028	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2698	241	241	21	brace	[3324, 1765, 893, 794]	709042	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2699	241	241	22	class_22	[2375, 1716, 954, 814]	776556	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2700	241	241	23	class_23	[1448, 1635, 915, 646]	591090	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2701	241	241	22	top_left	[2375, 1716, 954, 235]	224190	2026-09-15 18:02:29.684356	yolo_upload	2699	top_left	1	\N	\N	1
2702	241	241	22	top_right	[2375, 2364, 954, 166]	158364	2026-09-15 18:02:29.684356	yolo_upload	2699	top_right	1	\N	\N	1
2703	241	241	22	bottom_left	[2375, 1951, 281, 414]	116334	2026-09-15 18:02:29.684356	yolo_upload	2699	bottom_left	1	\N	\N	1
2704	241	241	22	bottom_right	[3107, 1951, 222, 414]	91908	2026-09-15 18:02:29.684356	yolo_upload	2699	bottom_right	1	\N	\N	1
2705	241	241	21	top_left	[3324, 1765, 893, 260]	232180	2026-09-15 18:02:29.684356	yolo_upload	2698	top_left	1	\N	\N	1
2706	241	241	21	top_right	[3324, 2379, 893, 180]	160740	2026-09-15 18:02:29.684356	yolo_upload	2698	top_right	1	\N	\N	1
2707	241	241	21	bottom_left	[3324, 2025, 299, 354]	105846	2026-09-15 18:02:29.684356	yolo_upload	2698	bottom_left	1	\N	\N	1
2708	241	241	21	bottom_right	[4046, 2025, 171, 354]	60534	2026-09-15 18:02:29.684356	yolo_upload	2698	bottom_right	1	\N	\N	1
2709	241	241	2	top_left	[2505, 1048, 1012, 56]	56672	2026-09-15 18:02:29.684356	yolo_upload	2696	top_left	1	\N	\N	1
2710	241	241	2	top_right	[2505, 1469, 1012, 312]	315744	2026-09-15 18:02:29.684356	yolo_upload	2696	top_right	1	\N	\N	1
2711	241	241	2	bottom_left	[2505, 1104, 306, 365]	111690	2026-09-15 18:02:29.684356	yolo_upload	2696	bottom_left	1	\N	\N	1
2712	241	241	2	bottom_right	[3248, 1104, 270, 365]	98550	2026-09-15 18:02:29.684356	yolo_upload	2696	bottom_right	1	\N	\N	1
2713	241	241	3	top_left	[1567, 1027, 956, 39]	37284	2026-09-15 18:02:29.684356	yolo_upload	2697	top_left	1	\N	\N	1
2714	241	241	3	top_right	[1567, 1412, 956, 228]	217968	2026-09-15 18:02:29.684356	yolo_upload	2697	top_right	1	\N	\N	1
2715	241	241	3	bottom_left	[1567, 1065, 211, 346]	73006	2026-09-15 18:02:29.684356	yolo_upload	2697	bottom_left	1	\N	\N	1
2716	241	241	3	bottom_right	[2233, 1065, 290, 346]	100340	2026-09-15 18:02:29.684356	yolo_upload	2697	bottom_right	1	\N	\N	1
2717	241	241	23	top_left	[1448, 1635, 915, 169]	154635	2026-09-15 18:02:29.684356	yolo_upload	2700	top_left	1	\N	\N	1
2718	241	241	23	top_right	[1448, 2205, 915, 76]	69540	2026-09-15 18:02:29.684356	yolo_upload	2700	top_right	1	\N	\N	1
2719	241	241	23	bottom_left	[1448, 1803, 56, 402]	22512	2026-09-15 18:02:29.684356	yolo_upload	2700	bottom_left	1	\N	\N	1
2720	241	241	23	bottom_right	[1978, 1803, 385, 402]	154770	2026-09-15 18:02:29.684356	yolo_upload	2700	bottom_right	1	\N	\N	1
2721	242	242	2	12	[2505, 1014, 942, 709]	667878	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2722	242	242	3	13	[1639, 1127, 916, 663]	607308	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2723	242	242	20	45	[3961, 1566, 714, 851]	607614	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2724	242	242	21	brace	[3092, 1590, 872, 706]	615632	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2725	242	242	21	top_left	[3092, 1590, 872, 166]	144752	2026-09-15 18:02:29.684356	yolo_upload	2724	top_left	1	\N	\N	1
2726	242	242	21	top_right	[3092, 2094, 872, 202]	176144	2026-09-15 18:02:29.684356	yolo_upload	2724	top_right	1	\N	\N	1
2727	242	242	21	bottom_left	[3092, 1756, 160, 339]	54240	2026-09-15 18:02:29.684356	yolo_upload	2724	bottom_left	1	\N	\N	1
2728	242	242	21	bottom_right	[3727, 1756, 237, 339]	80343	2026-09-15 18:02:29.684356	yolo_upload	2724	bottom_right	1	\N	\N	1
2729	242	242	2	top_left	[2505, 1014, 942, 41]	38622	2026-09-15 18:02:29.684356	yolo_upload	2721	top_left	1	\N	\N	1
2730	242	242	2	top_right	[2505, 1393, 942, 330]	310860	2026-09-15 18:02:29.684356	yolo_upload	2721	top_right	1	\N	\N	1
2731	242	242	2	bottom_left	[2505, 1056, 154, 337]	51898	2026-09-15 18:02:29.684356	yolo_upload	2721	bottom_left	1	\N	\N	1
2732	242	242	2	bottom_right	[3107, 1056, 339, 337]	114243	2026-09-15 18:02:29.684356	yolo_upload	2721	bottom_right	1	\N	\N	1
2733	242	242	3	top_left	[1639, 1127, 915, 9]	8235	2026-09-15 18:02:29.684356	yolo_upload	2722	top_left	1	\N	\N	1
2734	242	242	3	top_right	[1639, 1513, 915, 277]	253455	2026-09-15 18:02:29.684356	yolo_upload	2722	top_right	1	\N	\N	1
2735	242	242	3	bottom_left	[1639, 1136, 98, 377]	36946	2026-09-15 18:02:29.684356	yolo_upload	2722	bottom_left	1	\N	\N	1
2736	242	242	3	bottom_right	[2202, 1136, 353, 377]	133081	2026-09-15 18:02:29.684356	yolo_upload	2722	bottom_right	1	\N	\N	1
2737	242	242	20	top_left	[3961, 1566, 714, 213]	152082	2026-09-15 18:02:29.684356	yolo_upload	2723	top_left	1	\N	\N	1
2738	242	242	20	top_right	[3961, 2170, 714, 247]	176358	2026-09-15 18:02:29.684356	yolo_upload	2723	top_right	1	\N	\N	1
2739	242	242	20	bottom_left	[3961, 1779, 249, 391]	97359	2026-09-15 18:02:29.684356	yolo_upload	2723	bottom_left	1	\N	\N	1
2740	242	242	20	bottom_right	[4590, 1779, 85, 391]	33235	2026-09-15 18:02:29.684356	yolo_upload	2723	bottom_right	1	\N	\N	1
2741	243	243	2	12	[2365, 1624, 1048, 615]	644520	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2742	243	243	21	brace	[2979, 2194, 887, 827]	733549	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2743	243	243	22	class_22	[2038, 2198, 935, 918]	858330	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2744	243	243	22	top_left	[2038, 2198, 935, 339]	316965	2026-09-15 18:02:29.684356	yolo_upload	2743	top_left	1	\N	\N	1
2745	243	243	22	top_right	[2038, 2976, 935, 140]	130900	2026-09-15 18:02:29.684356	yolo_upload	2743	top_right	1	\N	\N	1
2746	243	243	22	bottom_left	[2038, 2537, 239, 440]	105160	2026-09-15 18:02:29.684356	yolo_upload	2743	bottom_left	1	\N	\N	1
2747	243	243	22	bottom_right	[2743, 2537, 230, 440]	101200	2026-09-15 18:02:29.684356	yolo_upload	2743	bottom_right	1	\N	\N	1
2748	243	243	21	top_left	[2979, 2194, 887, 323]	286501	2026-09-15 18:02:29.684356	yolo_upload	2742	top_left	1	\N	\N	1
2749	243	243	21	top_right	[2979, 2903, 887, 118]	104666	2026-09-15 18:02:29.684356	yolo_upload	2742	top_right	1	\N	\N	1
2750	243	243	21	bottom_left	[2979, 2517, 303, 386]	116958	2026-09-15 18:02:29.684356	yolo_upload	2742	bottom_left	1	\N	\N	1
2751	243	243	21	bottom_right	[3709, 2517, 156, 386]	60216	2026-09-15 18:02:29.684356	yolo_upload	2742	bottom_right	1	\N	\N	1
2752	243	243	2	top_left	[2365, 1624, 1048, 120]	125760	2026-09-15 18:02:29.684356	yolo_upload	2741	top_left	1	\N	\N	1
2753	243	243	2	top_right	[2365, 2064, 1048, 175]	183400	2026-09-15 18:02:29.684356	yolo_upload	2741	top_right	1	\N	\N	1
2754	243	243	2	bottom_left	[2365, 1743, 259, 321]	83139	2026-09-15 18:02:29.684356	yolo_upload	2741	bottom_left	1	\N	\N	1
2755	243	243	2	bottom_right	[3119, 1743, 293, 321]	94053	2026-09-15 18:02:29.684356	yolo_upload	2741	bottom_right	1	\N	\N	1
2756	244	244	9	31	[2808, 1330, 1110, 936]	1038960	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2757	244	244	10	32	[3899, 1667, 1033, 724]	747892	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2758	244	244	15	43	[2124, 2190, 928, 996]	924288	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2759	244	244	16	44	[3055, 2362, 996, 853]	849588	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2760	244	244	17	15	[4055, 2353, 1048, 694]	727312	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2761	244	244	9	top_left	[2808, 1330, 1110, 186]	206460	2026-09-15 18:02:29.684356	yolo_upload	2756	top_left	1	\N	\N	1
2762	244	244	9	top_right	[2808, 1940, 1110, 326]	361860	2026-09-15 18:02:29.684356	yolo_upload	2756	top_right	1	\N	\N	1
2763	244	244	9	bottom_left	[2808, 1515, 290, 424]	122960	2026-09-15 18:02:29.684356	yolo_upload	2756	bottom_left	1	\N	\N	1
2764	244	244	9	bottom_right	[3634, 1515, 284, 424]	120416	2026-09-15 18:02:29.684356	yolo_upload	2756	bottom_right	1	\N	\N	1
2765	244	244	16	top_left	[3055, 2362, 995, 244]	242780	2026-09-15 18:02:29.684356	yolo_upload	2759	top_left	1	\N	\N	1
2766	244	244	16	top_right	[3055, 3007, 995, 208]	206960	2026-09-15 18:02:29.684356	yolo_upload	2759	top_right	1	\N	\N	1
2767	244	244	16	bottom_left	[3055, 2607, 195, 400]	78000	2026-09-15 18:02:29.684356	yolo_upload	2759	bottom_left	1	\N	\N	1
2768	244	244	16	bottom_right	[3793, 2607, 258, 400]	103200	2026-09-15 18:02:29.684356	yolo_upload	2759	bottom_right	1	\N	\N	1
2769	244	244	10	top_left	[3899, 1667, 1033, 63]	65079	2026-09-15 18:02:29.684356	yolo_upload	2757	top_left	1	\N	\N	1
2770	244	244	10	top_right	[3899, 2086, 1033, 305]	315065	2026-09-15 18:02:29.684356	yolo_upload	2757	top_right	1	\N	\N	1
2771	244	244	10	bottom_left	[3899, 1730, 368, 356]	131008	2026-09-15 18:02:29.684356	yolo_upload	2757	bottom_left	1	\N	\N	1
2772	244	244	10	bottom_right	[4783, 1730, 149, 356]	53044	2026-09-15 18:02:29.684356	yolo_upload	2757	bottom_right	1	\N	\N	1
2773	244	244	17	top_left	[4055, 2353, 1048, 163]	170824	2026-09-15 18:02:29.684356	yolo_upload	2760	top_left	1	\N	\N	1
2774	244	244	17	top_right	[4055, 2912, 1048, 135]	141480	2026-09-15 18:02:29.684356	yolo_upload	2760	top_right	1	\N	\N	1
2775	244	244	17	bottom_left	[4055, 2515, 332, 397]	131804	2026-09-15 18:02:29.684356	yolo_upload	2760	bottom_left	1	\N	\N	1
2776	244	244	17	bottom_right	[4915, 2515, 188, 397]	74636	2026-09-15 18:02:29.684356	yolo_upload	2760	bottom_right	1	\N	\N	1
2777	244	244	15	top_left	[2124, 2190, 928, 349]	323872	2026-09-15 18:02:29.684356	yolo_upload	2758	top_left	1	\N	\N	1
2778	244	244	15	top_right	[2124, 2967, 928, 219]	203232	2026-09-15 18:02:29.684356	yolo_upload	2758	top_right	1	\N	\N	1
2779	244	244	15	bottom_left	[2124, 2538, 13, 429]	5577	2026-09-15 18:02:29.684356	yolo_upload	2758	bottom_left	1	\N	\N	1
2780	244	244	15	bottom_right	[2659, 2538, 393, 429]	168597	2026-09-15 18:02:29.684356	yolo_upload	2758	bottom_right	1	\N	\N	1
2781	245	245	9	31	[2401, 606, 1033, 866]	894578	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2782	245	245	10	32	[3433, 943, 942, 784]	738528	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2783	245	245	15	43	[1711, 1603, 862, 774]	667188	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2784	245	245	16	44	[2586, 1765, 921, 640]	589440	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2785	245	245	15	top_left	[1711, 1603, 862, 207]	178434	2026-09-15 18:02:29.684356	yolo_upload	2783	top_left	1	\N	\N	1
2786	245	245	15	top_right	[1711, 2199, 862, 178]	153436	2026-09-15 18:02:29.684356	yolo_upload	2783	top_right	1	\N	\N	1
2787	245	245	15	bottom_left	[1711, 1810, 30, 388]	11640	2026-09-15 18:02:29.684356	yolo_upload	2783	bottom_left	1	\N	\N	1
2788	245	245	15	bottom_right	[2227, 1810, 346, 388]	134248	2026-09-15 18:02:29.684356	yolo_upload	2783	bottom_right	1	\N	\N	1
2789	245	245	16	top_left	[2586, 1765, 921, 96]	88416	2026-09-15 18:02:29.684356	yolo_upload	2784	top_left	1	\N	\N	1
2790	245	245	16	top_right	[2586, 2225, 921, 180]	165780	2026-09-15 18:02:29.684356	yolo_upload	2784	top_right	1	\N	\N	1
2791	245	245	16	bottom_left	[2586, 1862, 189, 363]	68607	2026-09-15 18:02:29.684356	yolo_upload	2784	bottom_left	1	\N	\N	1
2792	245	245	16	bottom_right	[3258, 1862, 248, 363]	90024	2026-09-15 18:02:29.684356	yolo_upload	2784	bottom_right	1	\N	\N	1
2793	245	245	9	top_left	[2401, 606, 1033, 98]	101234	2026-09-15 18:02:29.684356	yolo_upload	2781	top_left	1	\N	\N	1
2794	245	245	9	top_right	[2401, 1133, 1033, 339]	350187	2026-09-15 18:02:29.684356	yolo_upload	2781	top_right	1	\N	\N	1
2795	245	245	9	bottom_left	[2401, 704, 301, 429]	129129	2026-09-15 18:02:29.684356	yolo_upload	2781	bottom_left	1	\N	\N	1
2796	245	245	9	bottom_right	[3166, 704, 267, 429]	114543	2026-09-15 18:02:29.684356	yolo_upload	2781	bottom_right	1	\N	\N	1
2797	245	245	10	top_left	[3433, 943, 941, 24]	22584	2026-09-15 18:02:29.684356	yolo_upload	2782	top_left	1	\N	\N	1
2798	245	245	10	top_right	[3433, 1423, 941, 304]	286064	2026-09-15 18:02:29.684356	yolo_upload	2782	top_right	1	\N	\N	1
2799	245	245	10	bottom_left	[3433, 967, 331, 456]	150936	2026-09-15 18:02:29.684356	yolo_upload	2782	bottom_left	1	\N	\N	1
2800	245	245	10	bottom_right	[4229, 967, 146, 456]	66576	2026-09-15 18:02:29.684356	yolo_upload	2782	bottom_right	1	\N	\N	1
2801	246	246	9	31	[2515, 1706, 1111, 877]	974347	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2802	246	246	15	43	[1869, 2474, 940, 976]	917440	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2803	246	246	16	44	[2824, 2566, 991, 942]	933522	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2804	246	246	17	15	[3798, 2511, 1077, 771]	830367	2026-09-15 18:02:29.684356	yolo_upload	\N	\N	\N	\N	\N	\N
2805	246	246	9	top_left	[2515, 1706, 1111, 236]	262196	2026-09-15 18:02:29.684356	yolo_upload	2801	top_left	1	\N	\N	1
2806	246	246	9	top_right	[2515, 2343, 1111, 240]	266640	2026-09-15 18:02:29.684356	yolo_upload	2801	top_right	1	\N	\N	1
2807	246	246	9	bottom_left	[2515, 1942, 308, 401]	123508	2026-09-15 18:02:29.684356	yolo_upload	2801	bottom_left	1	\N	\N	1
2808	246	246	9	bottom_right	[3382, 1942, 243, 401]	97443	2026-09-15 18:02:29.684356	yolo_upload	2801	bottom_right	1	\N	\N	1
2809	246	246	16	top_left	[2824, 2566, 991, 329]	326039	2026-09-15 18:02:29.684356	yolo_upload	2803	top_left	1	\N	\N	1
2810	246	246	16	top_right	[2824, 3322, 991, 186]	184326	2026-09-15 18:02:29.684356	yolo_upload	2803	top_right	1	\N	\N	1
2811	246	246	16	bottom_left	[2824, 2895, 215, 426]	91590	2026-09-15 18:02:29.684356	yolo_upload	2803	bottom_left	1	\N	\N	1
2812	246	246	16	bottom_right	[3517, 2895, 297, 426]	126522	2026-09-15 18:02:29.684356	yolo_upload	2803	bottom_right	1	\N	\N	1
2813	246	246	17	top_left	[3798, 2511, 1077, 194]	208938	2026-09-15 18:02:29.684356	yolo_upload	2804	top_left	1	\N	\N	1
2814	246	246	17	top_right	[3798, 3150, 1077, 132]	142164	2026-09-15 18:02:29.684356	yolo_upload	2804	top_right	1	\N	\N	1
2815	246	246	17	bottom_left	[3798, 2706, 346, 444]	153624	2026-09-15 18:02:29.684356	yolo_upload	2804	bottom_left	1	\N	\N	1
2816	246	246	17	bottom_right	[4621, 2706, 253, 444]	112332	2026-09-15 18:02:29.684356	yolo_upload	2804	bottom_right	1	\N	\N	1
2817	246	246	15	top_left	[1869, 2474, 939, 392]	368088	2026-09-15 18:02:29.684356	yolo_upload	2802	top_left	1	\N	\N	1
2818	246	246	15	top_right	[1869, 3285, 939, 165]	154935	2026-09-15 18:02:29.684356	yolo_upload	2802	top_right	1	\N	\N	1
2819	246	246	15	bottom_left	[1869, 2866, 72, 419]	30168	2026-09-15 18:02:29.684356	yolo_upload	2802	bottom_left	1	\N	\N	1
2820	246	246	15	bottom_right	[2451, 2866, 358, 419]	150002	2026-09-15 18:02:29.684356	yolo_upload	2802	bottom_right	1	\N	\N	1
2821	247	247	26	class_26	[2214, 1418, 233, 251]	58483	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2822	247	247	26	class_26	[2927, 1410, 259, 244]	63196	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2823	247	247	26	class_26	[1638, 1407, 233, 270]	62910	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2824	247	247	1	11	[1543, 1298, 530, 572]	303160	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2825	247	247	0	class_0	[2059, 1227, 653, 663]	432939	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2826	247	247	7	23	[2716, 1221, 658, 672]	442176	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2827	248	248	26	class_26	[3407, 1221, 305, 294]	89670	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2828	248	248	26	class_26	[1856, 1267, 270, 307]	82890	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2829	248	248	26	class_26	[2530, 1217, 295, 292]	86140	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2830	248	248	1	11	[1744, 1220, 608, 575]	349600	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2831	248	248	7	23	[3144, 1105, 764, 691]	527924	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2832	248	248	0	class_0	[2347, 1062, 797, 687]	547539	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2833	249	249	26	class_26	[2851, 1502, 281, 286]	80366	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2834	249	249	26	class_26	[2128, 1477, 264, 310]	81840	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2835	249	249	26	class_26	[1532, 1327, 232, 290]	67280	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2836	249	249	0	class_0	[1959, 1250, 672, 676]	454272	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2837	249	249	1	11	[1449, 1171, 536, 580]	310880	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2838	249	249	7	23	[2633, 1282, 673, 651]	438123	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2839	250	250	26	class_26	[1313, 1393, 235, 224]	52640	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2840	250	250	26	class_26	[2372, 1562, 217, 225]	48825	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2841	250	250	26	class_26	[2897, 1585, 229, 224]	51296	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2842	250	250	0	class_0	[2633, 1380, 545, 624]	340080	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2843	250	250	1	11	[2165, 1429, 479, 517]	247643	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2844	250	250	3	13	[1265, 1352, 505, 407]	205535	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2845	251	251	26	class_26	[3500, 1971, 227, 240]	54480	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2846	251	251	26	class_26	[2911, 1986, 218, 259]	56462	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2847	251	251	26	class_26	[1732, 2025, 261, 269]	70209	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2848	251	251	26	class_26	[2608, 41, 635, 301]	191135	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2849	251	251	0	class_0	[3222, 1788, 616, 634]	390544	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2850	251	251	1	11	[2630, 1852, 590, 584]	344560	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2851	251	251	2	12	[1655, 2002, 605, 461]	278905	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2852	252	252	26	class_26	[1499, 1483, 233, 273]	63609	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2853	252	252	26	class_26	[2598, 1618, 216, 244]	52704	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2854	252	252	26	class_26	[3129, 1560, 253, 241]	60973	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2855	252	252	0	class_0	[2874, 1338, 566, 619]	350354	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2856	252	252	1	11	[2400, 1448, 476, 560]	266560	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2857	252	252	3	13	[1400, 1457, 513, 379]	194427	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2858	253	253	26	class_26	[2982, 1373, 293, 263]	77059	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2859	253	253	26	class_26	[3588, 1443, 217, 237]	51429	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2860	253	253	11	33	[3350, 1368, 596, 458]	272968	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2861	253	253	10	32	[2805, 1182, 540, 588]	317520	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2862	254	254	26	class_26	[2680, 1299, 275, 278]	76450	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2863	254	254	26	class_26	[3286, 1318, 274, 289]	79186	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2864	254	254	10	32	[2430, 1140, 624, 605]	377520	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2865	254	254	11	33	[3060, 1252, 627, 631]	395637	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2866	255	255	26	class_26	[2556, 1673, 313, 241]	75433	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2867	255	255	26	class_26	[3236, 1613, 231, 315]	72765	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2868	255	255	10	32	[2345, 1389, 606, 661]	400566	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2869	255	255	11	33	[2965, 1572, 612, 494]	302328	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2870	256	256	26	class_26	[3140, 1288, 302, 278]	83956	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2871	256	256	26	class_26	[2418, 1286, 308, 284]	87472	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2872	256	256	26	class_26	[2710, 1966, 270, 270]	72900	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2873	256	256	26	class_26	[3184, 1956, 282, 273]	76986	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2874	256	256	7	23	[2939, 1042, 669, 793]	530517	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2875	256	256	19	35	[2680, 1797, 408, 691]	281928	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2876	256	256	13	41	[3090, 1827, 425, 641]	272425	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2877	256	256	0	class_0	[2275, 960, 657, 847]	556479	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2878	257	257	26	class_26	[3421, 1082, 328, 316]	103648	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2879	257	257	26	class_26	[2910, 1747, 345, 372]	128340	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2880	257	257	26	class_26	[3492, 1777, 297, 365]	108405	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2881	257	257	26	class_26	[2567, 1060, 336, 311]	104496	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2882	257	257	7	23	[3162, 904, 757, 825]	624525	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2883	257	257	0	class_0	[2369, 793, 778, 902]	701756	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2884	257	257	13	41	[3350, 1722, 497, 664]	330008	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2885	257	257	19	35	[2855, 1702, 498, 684]	340632	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2886	258	258	26	class_26	[2224, 1162, 296, 352]	104192	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2887	258	258	26	class_26	[3024, 1162, 292, 346]	101032	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2888	258	258	26	class_26	[2591, 1791, 286, 307]	87802	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2889	258	258	26	class_26	[3076, 1753, 294, 330]	97020	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2890	258	258	7	23	[2771, 896, 725, 765]	554625	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2891	258	258	0	class_0	[2038, 746, 733, 862]	631846	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2892	258	258	19	35	[2533, 1561, 442, 701]	309842	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2893	258	258	13	41	[2985, 1597, 428, 608]	260224	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2894	259	259	26	class_26	[2301, 1656, 245, 307]	75215	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2895	259	259	26	class_26	[891, 2175, 304, 310]	94240	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2896	259	259	26	class_26	[915, 1722, 292, 301]	87892	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2897	259	259	26	class_26	[1643, 1690, 303, 278]	84234	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2898	259	259	26	class_26	[1482, 2276, 298, 296]	88208	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2899	259	259	26	class_26	[2295, 2314, 279, 280]	78120	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2900	259	259	2	12	[1461, 1423, 643, 760]	488680	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2901	259	259	21	brace	[2091, 2084, 545, 778]	424010	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2902	259	259	1	11	[2104, 1328, 566, 768]	434688	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2903	259	259	22	class_22	[1371, 2100, 590, 724]	427160	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2904	259	259	3	13	[843, 1518, 630, 661]	416430	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2905	259	259	23	class_23	[770, 2097, 593, 610]	361730	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2906	260	260	26	class_26	[2522, 1515, 228, 223]	50844	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2907	260	260	26	class_26	[3017, 1520, 201, 222]	44622	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2908	260	260	26	class_26	[2999, 2016, 243, 215]	52245	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2909	260	260	26	class_26	[1953, 1533, 220, 249]	54780	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2910	260	260	26	class_26	[2381, 1967, 230, 243]	55890	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2911	260	260	2	12	[2372, 1341, 509, 602]	306418	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2912	260	260	1	11	[2885, 1320, 424, 602]	255248	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2913	260	260	3	13	[1901, 1409, 472, 540]	254880	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2914	260	260	22	class_22	[2298, 1901, 455, 502]	228410	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2915	260	260	21	brace	[2880, 1882, 400, 561]	224400	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2916	261	261	26	class_26	[1190, 1261, 284, 267]	75828	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2917	261	261	26	class_26	[1054, 1707, 276, 304]	83904	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2918	261	261	26	class_26	[1799, 1739, 273, 286]	78078	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2919	261	261	2	12	[1028, 994, 607, 611]	370877	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2920	261	261	22	class_22	[930, 1532, 567, 601]	340767	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2921	261	261	21	brace	[1620, 1457, 510, 699]	356490	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2922	261	261	26	class_26	[1785, 1197, 278, 292]	81176	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2923	261	261	1	11	[1638, 897, 532, 612]	325584	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2924	262	262	26	class_26	[3067, 1732, 318, 315]	100170	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2925	262	262	26	class_26	[3497, 2354, 261, 296]	77256	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2926	262	262	26	class_26	[4164, 2320, 292, 313]	91396	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2927	262	262	26	class_26	[3924, 1730, 297, 387]	114939	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2928	262	262	26	class_26	[2809, 2360, 281, 298]	83738	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2929	262	262	26	class_26	[2553, 1727, 280, 299]	83720	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2930	262	262	9	31	[3037, 1502, 666, 815]	542790	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2931	262	262	8	24	[2457, 1416, 608, 843]	512544	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2932	262	262	10	32	[3676, 1581, 653, 728]	475384	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2933	262	262	17	15	[3915, 2195, 665, 633]	420945	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2934	262	262	16	44	[3276, 2204, 652, 727]	474004	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2935	262	262	15	43	[2720, 2152, 547, 778]	425566	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2936	263	263	26	class_26	[3065, 2326, 334, 306]	102204	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2937	263	263	26	class_26	[2865, 1828, 312, 290]	90480	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2938	263	263	26	class_26	[4239, 1761, 293, 361]	105773	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2939	263	263	26	class_26	[3746, 2271, 314, 321]	100794	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2940	263	263	26	class_26	[3380, 1734, 331, 359]	118829	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2941	263	263	9	31	[3356, 1592, 647, 806]	521482	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2942	263	263	10	32	[3991, 1648, 655, 719]	470945	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2943	263	263	8	24	[2773, 1678, 599, 717]	429483	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2944	263	263	16	44	[3579, 2265, 662, 616]	407792	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2945	263	263	15	43	[3005, 2295, 572, 561]	320892	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2946	264	264	26	class_26	[2575, 1872, 255, 334]	85170	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2947	264	264	26	class_26	[3090, 1912, 333, 328]	109224	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2948	264	264	26	class_26	[4005, 1917, 272, 296]	80512	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2949	264	264	26	class_26	[3545, 2462, 338, 288]	97344	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2950	264	264	26	class_26	[2810, 2542, 360, 265]	95400	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2951	264	264	8	24	[2440, 1517, 577, 799]	461023	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2952	264	264	9	31	[3030, 1652, 677, 718]	486086	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2953	264	264	10	32	[3720, 1657, 650, 666]	432900	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2954	264	264	15	43	[2740, 2252, 573, 768]	440064	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2955	264	264	16	44	[3325, 2232, 665, 751]	499415	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2956	266	266	26	class_26	[3096, 1063, 272, 273]	74256	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2957	266	266	26	class_26	[2379, 992, 251, 275]	69025	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2958	266	266	26	class_26	[2568, 1616, 220, 284]	62480	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2959	266	266	26	class_26	[3008, 1686, 228, 284]	64752	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2960	266	266	26	class_26	[1824, 997, 211, 287]	60557	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2961	266	266	26	class_26	[2082, 1600, 236, 287]	67732	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2962	266	266	0	class_0	[2164, 807, 693, 695]	481635	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2963	266	266	19	35	[2443, 1514, 454, 614]	278756	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2964	266	266	1	11	[1634, 891, 492, 565]	277980	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2965	266	266	20	45	[2028, 1504, 447, 616]	275352	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2966	266	266	13	41	[2900, 1563, 426, 534]	227484	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2967	266	266	7	23	[2860, 930, 681, 641]	436521	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2968	267	267	26	class_26	[1930, 1460, 304, 351]	106704	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2969	267	267	13	41	[2597, 1931, 471, 558]	262818	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2970	267	267	26	class_26	[2766, 1422, 304, 338]	102752	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2971	267	267	26	class_26	[1316, 1399, 226, 329]	74354	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2972	267	267	26	class_26	[2727, 2151, 245, 304]	74480	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2973	267	267	26	class_26	[2230, 2160, 239, 316]	75524	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2974	267	267	26	class_26	[3422, 1301, 268, 325]	87100	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2975	267	267	1	11	[1114, 1193, 558, 653]	364374	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2976	267	267	0	class_0	[1681, 1179, 808, 752]	607616	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
2977	267	267	7	23	[2476, 1120, 787, 821]	646127	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2978	267	267	8	24	[3260, 1186, 539, 576]	310464	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2979	267	267	19	35	[2087, 1894, 514, 679]	349006	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2980	268	268	26	class_26	[1941, 1594, 204, 203]	41412	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2981	268	268	26	class_26	[2136, 1910, 210, 232]	48720	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2982	268	268	26	class_26	[2517, 1582, 210, 218]	45780	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2983	268	268	2	12	[2328, 1468, 505, 498]	251490	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2984	268	268	22	class_22	[2047, 1810, 450, 424]	190800	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2985	268	268	3	13	[1886, 1494, 451, 407]	183557	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2986	269	269	26	class_26	[2905, 1732, 291, 246]	71586	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2987	269	269	26	class_26	[2127, 2183, 229, 238]	54502	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2988	269	269	26	class_26	[3199, 2185, 246, 282]	69372	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2989	269	269	26	class_26	[2563, 2190, 225, 243]	54675	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2990	269	269	26	class_26	[2293, 1797, 224, 229]	51296	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2991	269	269	26	class_26	[1890, 1833, 246, 230]	56580	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2992	269	269	21	brace	[3022, 2083, 532, 438]	233016	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2993	269	269	2	12	[2750, 1535, 583, 651]	379533	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2994	269	269	3	13	[2245, 1673, 522, 513]	267786	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2995	269	269	4	14	[1830, 1767, 427, 449]	191723	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2996	269	269	22	class_22	[2520, 2062, 487, 495]	241065	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2997	269	269	23	class_23	[2065, 2122, 458, 361]	165338	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2998	270	270	26	class_26	[2562, 1553, 212, 254]	53848	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
2999	270	270	26	class_26	[1512, 1488, 228, 234]	53352	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3000	270	270	26	class_26	[1929, 1563, 219, 231]	50589	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3001	270	270	2	12	[2355, 1427, 552, 483]	266616	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3002	270	270	3	13	[1860, 1417, 483, 439]	212037	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3003	270	270	4	14	[1445, 1467, 408, 306]	124848	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3004	271	271	26	class_26	[3384, 2080, 252, 277]	69804	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3005	271	271	26	class_26	[2555, 1463, 262, 302]	79124	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3006	271	271	10	32	[3081, 1530, 540, 451]	243540	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3007	271	271	26	class_26	[2894, 2115, 227, 255]	57885	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3008	271	271	26	class_26	[3285, 1613, 216, 238]	51408	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3009	271	271	9	31	[2431, 1353, 605, 663]	401115	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3010	271	271	16	44	[2684, 1971, 581, 596]	346276	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3011	271	271	17	15	[3253, 1997, 500, 429]	214500	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3012	272	272	26	class_26	[2610, 996, 312, 291]	90792	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3013	272	272	26	class_26	[3421, 1109, 257, 284]	72988	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3014	272	272	26	class_26	[2998, 1678, 273, 296]	80808	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3015	272	272	26	class_26	[3592, 1672, 277, 298]	82546	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3016	272	272	16	44	[2799, 1594, 617, 569]	351073	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3017	272	272	9	31	[2426, 865, 742, 761]	564662	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3018	272	272	17	15	[3411, 1622, 562, 460]	258520	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3019	272	272	10	32	[3183, 1039, 610, 547]	333670	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3020	273	273	26	class_26	[2146, 1426, 284, 266]	75544	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3021	273	273	26	class_26	[3004, 1898, 280, 298]	83440	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3022	273	273	26	class_26	[2495, 1956, 249, 268]	66732	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3023	273	273	26	class_26	[2866, 1511, 263, 266]	69958	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3024	273	273	26	class_26	[1683, 1887, 274, 261]	71514	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3025	273	273	9	31	[2021, 1219, 639, 683]	436437	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3026	273	273	15	43	[1660, 1656, 553, 604]	334012	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3027	273	273	10	32	[2670, 1483, 547, 349]	190903	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3028	273	273	16	44	[2328, 1752, 545, 601]	327545	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3029	273	273	17	15	[2875, 1742, 485, 508]	246380	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3030	274	274	0	class_0	[2299, 1142, 896, 1041]	932736	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
3031	274	274	26	class_26	[2572, 1553, 405, 331]	134055	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3032	274	274	7	23	[3190, 1145, 841, 1048]	881368	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3033	274	274	26	class_26	[3485, 1540, 430, 366]	157380	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3034	274	274	1	11	[1606, 1357, 701, 895]	627395	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3035	274	274	26	class_26	[1661, 1556, 385, 329]	126665	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3036	275	275	0	class_0	[2298, 1611, 841, 764]	642524	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
3037	275	275	26	class_26	[2544, 1791, 370, 301]	111370	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3038	275	275	7	23	[3145, 1565, 770, 822]	632940	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3039	275	275	26	class_26	[3385, 1808, 400, 307]	122800	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3040	275	275	1	11	[1637, 1885, 674, 699]	471126	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3041	275	275	26	class_26	[1714, 1945, 328, 306]	100368	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3042	276	276	0	class_0	[1905, 1813, 847, 929]	786863	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	1	\N	\N	\N
3043	276	276	26	class_26	[2158, 2217, 386, 388]	149768	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3044	276	276	7	23	[2757, 1793, 826, 958]	791308	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3045	276	276	26	class_26	[3056, 2206, 411, 381]	156591	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3046	276	276	1	11	[1209, 1778, 715, 871]	622765	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3047	276	276	26	class_26	[1279, 2050, 362, 378]	136836	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3048	280	280	3	13	[2960, 1415, 835, 797]	665495	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3049	280	280	26	class_26	[3090, 1535, 424, 395]	167480	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3050	281	281	9	31	[2800, 1358, 934, 775]	723850	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3051	281	281	26	class_26	[2973, 1386, 428, 421]	180188	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3052	281	281	8	24	[1988, 1266, 819, 933]	764127	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3053	281	281	26	class_26	[2062, 1482, 396, 391]	154836	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3054	282	282	26	class_26	[3074, 1671, 417, 333]	138861	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3055	282	282	26	class_26	[2262, 1542, 385, 365]	140525	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3056	282	282	7	23	[1531, 843, 661, 1146]	757506	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3057	282	282	8	24	[2191, 1200, 749, 905]	677845	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3058	282	282	9	31	[2948, 1539, 777, 614]	477078	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3059	283	283	19	35	[2804, 1935, 536, 659]	353224	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3060	283	283	26	class_26	[2908, 2166, 302, 313]	94526	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3061	283	283	20	45	[2285, 1976, 512, 705]	360960	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3062	283	283	26	class_26	[2333, 2186, 276, 296]	81696	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3063	283	283	13	41	[3346, 1927, 504, 619]	311976	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3064	283	283	26	class_26	[3474, 2166, 297, 316]	93852	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3065	283	283	14	42	[3841, 1995, 475, 596]	283100	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3066	283	283	26	class_26	[3964, 2170, 294, 341]	100254	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3067	285	285	22	class_22	[2375, 1716, 954, 815]	777510	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3068	285	285	26	class_26	[2657, 1951, 450, 414]	186300	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3069	285	285	21	brace	[3324, 1765, 893, 794]	709042	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3070	285	285	26	class_26	[3623, 2025, 423, 354]	149742	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3071	285	285	2	12	[2505, 1048, 1012, 733]	741796	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3072	285	285	26	class_26	[2811, 1104, 436, 365]	159140	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3073	285	285	3	13	[1567, 1027, 956, 612]	585072	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3074	285	285	26	class_26	[1778, 1065, 455, 346]	157430	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3075	285	285	23	class_23	[1448, 1635, 915, 646]	591090	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3076	285	285	26	class_26	[1504, 1803, 474, 402]	190548	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3077	286	286	21	brace	[3092, 1590, 872, 706]	615632	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3078	286	286	26	class_26	[3252, 1756, 474, 339]	160686	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3079	286	286	2	12	[2505, 1014, 942, 708]	666936	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3080	286	286	26	class_26	[2659, 1056, 448, 337]	150976	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3081	286	286	3	13	[1639, 1127, 915, 664]	607560	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3082	286	286	26	class_26	[1737, 1136, 464, 377]	174928	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3083	286	286	20	45	[3961, 1566, 714, 851]	607614	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3084	286	286	26	class_26	[4210, 1779, 380, 391]	148580	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3085	287	287	26	class_26	[2277, 2537, 466, 440]	205040	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3086	287	287	22	class_22	[2038, 2198, 935, 919]	859265	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3087	287	287	21	brace	[2979, 2194, 887, 827]	733549	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3088	287	287	26	class_26	[3282, 2517, 427, 386]	164822	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3089	287	287	2	12	[2365, 1624, 1048, 616]	645568	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3090	287	287	26	class_26	[2624, 1743, 495, 321]	158895	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3091	288	288	9	31	[2808, 1330, 1110, 936]	1038960	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3092	288	288	26	class_26	[3098, 1515, 536, 424]	227264	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3093	288	288	16	44	[3055, 2362, 995, 853]	848735	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3094	288	288	26	class_26	[3251, 2607, 542, 400]	216800	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3095	288	288	10	32	[3899, 1667, 1033, 724]	747892	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3096	288	288	26	class_26	[4267, 1730, 516, 356]	183696	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3097	288	288	17	15	[4055, 2353, 1048, 695]	728360	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3098	288	288	26	class_26	[4388, 2515, 528, 397]	209616	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3099	288	288	15	43	[2124, 2190, 928, 996]	924288	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3100	288	288	26	class_26	[2137, 2538, 522, 429]	223938	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3101	289	289	15	43	[1711, 1603, 862, 773]	666326	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3102	289	289	26	class_26	[1741, 1810, 486, 388]	188568	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3103	289	289	16	44	[2586, 1765, 921, 640]	589440	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3104	289	289	26	class_26	[2775, 1862, 483, 363]	175329	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3105	289	289	9	31	[2401, 606, 1033, 865]	893545	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3106	289	289	26	class_26	[2702, 704, 464, 429]	199056	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3107	289	289	10	32	[3433, 943, 941, 785]	738685	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3108	289	289	26	class_26	[3764, 967, 464, 456]	211584	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3109	290	290	9	31	[2515, 1706, 1111, 877]	974347	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3110	290	290	26	class_26	[2823, 1942, 560, 401]	224560	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3111	290	290	16	44	[2824, 2566, 991, 941]	932531	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3112	290	290	26	class_26	[3038, 2895, 479, 426]	204054	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3113	290	290	17	15	[3798, 2511, 1077, 770]	829290	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3114	290	290	26	class_26	[4144, 2706, 478, 444]	212232	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3115	290	290	15	43	[1869, 2474, 939, 977]	917403	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3116	290	290	26	class_26	[1941, 2866, 510, 419]	213690	2026-09-16 03:22:12.431476	yolo_upload	\N	\N	0	\N	\N	\N
3117	291	291	26	class_26	[2299, 2003, 291, 369]	107379	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3118	291	291	26	class_26	[2244, 1271, 288, 396]	114048	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3119	291	291	13	41	[2684, 1799, 414, 693]	286902	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3120	291	291	26	class_26	[3068, 1299, 248, 371]	92008	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3121	291	291	7	23	[2752, 1055, 675, 798]	538650	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3122	291	291	0	class_0	[2093, 1100, 653, 764]	498892	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3123	291	291	26	class_26	[2832, 2017, 248, 357]	88536	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3124	291	291	19	35	[2226, 1814, 452, 652]	294704	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3125	292	292	26	class_26	[2279, 1159, 243, 309]	75087	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3126	292	292	26	class_26	[3047, 1188, 252, 318]	80136	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3127	292	292	26	class_26	[2335, 1770, 251, 324]	81324	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3128	292	292	26	class_26	[2829, 1778, 241, 328]	79048	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3129	292	292	7	23	[2759, 1010, 651, 743]	483693	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3130	292	292	0	class_0	[2133, 1033, 622, 697]	433534	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3131	292	292	19	35	[2275, 1702, 415, 528]	219120	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3132	292	292	13	41	[2700, 1662, 407, 614]	249898	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3133	293	293	26	class_26	[2359, 1356, 256, 386]	98816	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3134	293	293	26	class_26	[3067, 1363, 279, 383]	106857	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3135	293	293	7	23	[2830, 1152, 610, 611]	372710	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3136	293	293	0	class_0	[2225, 1202, 602, 561]	337722	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3137	294	294	26	class_26	[2870, 1862, 267, 349]	93183	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3138	294	294	26	class_26	[1801, 1745, 277, 286]	79222	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3139	294	294	26	class_26	[2706, 1256, 262, 318]	83316	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3140	294	294	26	class_26	[1914, 1184, 258, 305]	78690	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3141	294	294	26	class_26	[2379, 1835, 232, 319]	74008	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3142	294	294	2	12	[2489, 1118, 557, 612]	340884	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3143	294	294	22	class_22	[2255, 1703, 492, 566]	278472	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3144	294	294	3	13	[1857, 1122, 538, 463]	249094	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3145	294	294	21	brace	[2741, 1657, 459, 636]	291924	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3146	294	294	23	class_23	[1745, 1654, 495, 485]	240075	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3147	295	295	26	class_26	[3268, 1726, 244, 283]	69052	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3148	295	295	26	class_26	[2659, 1686, 294, 319]	93786	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3149	295	295	21	brace	[2756, 2115, 484, 585]	283140	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3150	295	295	26	class_26	[2843, 2295, 293, 338]	99034	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3151	295	295	26	class_26	[2338, 2293, 261, 301]	78561	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3152	295	295	2	12	[2488, 1582, 578, 626]	361828	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3153	295	295	1	11	[3066, 1665, 534, 496]	264864	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3154	295	295	22	class_22	[2256, 2208, 499, 504]	251496	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3155	296	296	26	class_26	[1805, 1840, 286, 310]	88660	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3156	296	296	26	class_26	[3432, 1421, 246, 346]	85116	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3157	296	296	26	class_26	[2821, 1455, 252, 337]	84924	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3158	296	296	26	class_26	[2411, 1952, 277, 285]	78945	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3159	296	296	2	12	[2577, 1304, 597, 581]	346857	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3160	296	296	23	class_23	[1757, 1684, 528, 505]	266640	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3161	296	296	22	class_22	[2275, 1742, 542, 638]	345796	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3162	296	296	1	11	[3190, 1297, 567, 536]	303912	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3163	297	297	17	15	[3155, 1927, 545, 480]	261600	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3164	297	297	26	class_26	[2474, 1367, 274, 359]	98366	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3165	297	297	26	class_26	[3240, 1362, 230, 327]	75210	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3166	297	297	26	class_26	[2675, 2101, 258, 321]	82818	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3167	297	297	10	32	[3048, 1281, 563, 568]	319784	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3168	297	297	9	31	[2401, 1348, 614, 526]	322964	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3169	297	297	26	class_26	[3264, 2070, 268, 343]	91924	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3170	297	297	16	44	[2620, 1897, 533, 596]	317668	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3171	298	298	26	class_26	[3114, 2162, 331, 382]	126442	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3172	298	298	26	class_26	[3086, 1381, 299, 385]	115115	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3173	298	298	26	class_26	[2263, 1298, 305, 408]	124440	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3174	298	298	26	class_26	[1824, 2063, 303, 372]	112716	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3175	298	298	26	class_26	[1311, 2017, 294, 414]	121716	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3176	298	298	17	15	[2975, 2046, 609, 513]	312417	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3177	298	298	14	42	[1296, 1894, 524, 608]	318592	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3178	298	298	15	43	[1802, 1912, 565, 666]	376290	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3179	298	298	26	class_26	[1560, 1336, 293, 335]	98155	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3180	298	298	10	32	[2809, 1307, 654, 680]	444720	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3181	298	298	9	31	[2087, 1248, 718, 684]	491112	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3182	298	298	16	44	[2364, 1981, 614, 612]	375768	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3183	298	298	26	class_26	[2508, 2117, 274, 351]	96174	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3184	298	298	8	24	[1469, 1204, 617, 701]	432517	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3185	299	299	26	class_26	[2278, 1067, 265, 342]	90630	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3186	299	299	26	class_26	[2924, 1664, 255, 361]	92055	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3187	299	299	26	class_26	[1651, 1065, 262, 321]	84102	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3188	299	299	26	class_26	[1771, 1702, 290, 357]	103530	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3189	299	299	26	class_26	[2383, 1732, 249, 318]	79182	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3190	299	299	15	43	[1736, 1478, 497, 611]	303667	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3191	299	299	17	15	[2759, 1418, 514, 624]	320736	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3192	299	299	16	44	[2240, 1490, 540, 614]	331560	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3193	299	299	8	24	[1560, 904, 550, 558]	306900	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3194	299	299	9	31	[2100, 995, 608, 478]	290624	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3195	300	300	26	class_26	[2509, 1649, 368, 308]	113344	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3196	300	300	26	class_26	[3310, 1650, 344, 309]	106296	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3197	300	300	26	class_26	[2032, 2302, 260, 283]	73580	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3198	300	300	26	class_26	[2624, 2303, 245, 295]	72275	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3199	300	300	26	class_26	[3136, 2307, 279, 290]	80910	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3200	300	300	0	class_0	[2359, 1445, 685, 746]	511010	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3201	300	300	7	23	[3032, 1434, 708, 736]	521088	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3202	300	300	21	brace	[1966, 2081, 552, 695]	383640	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3203	300	300	19	35	[2490, 2113, 473, 722]	341506	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3204	300	300	13	41	[2970, 2123, 487, 679]	330673	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3205	301	301	26	class_26	[3405, 1891, 328, 300]	98400	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3206	301	301	26	class_26	[2608, 1840, 335, 314]	105190	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3207	301	301	1	11	[1861, 1680, 552, 633]	349416	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3208	301	301	26	class_26	[2744, 2397, 235, 296]	69560	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3209	301	301	13	41	[3133, 2263, 477, 714]	340578	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3210	301	301	19	35	[2640, 2261, 482, 705]	339810	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3211	301	301	26	class_26	[1952, 1793, 263, 310]	81530	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3212	301	301	0	class_0	[2436, 1694, 692, 608]	420736	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3213	301	301	26	class_26	[3236, 2436, 346, 257]	88922	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3214	301	301	7	23	[3130, 1723, 707, 632]	446824	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3215	302	302	26	class_26	[2363, 1829, 344, 340]	116960	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3216	302	302	19	35	[2406, 2293, 472, 682]	321904	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3217	302	302	26	class_26	[3209, 1840, 308, 333]	102564	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3218	302	302	26	class_26	[2496, 2499, 268, 309]	82812	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3219	302	302	26	class_26	[3036, 2502, 256, 322]	82432	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3220	302	302	7	23	[2944, 1646, 704, 684]	481536	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3221	302	302	0	class_0	[2238, 1646, 715, 692]	494780	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3222	302	302	13	41	[2921, 2318, 440, 657]	289080	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3223	303	303	26	class_26	[2169, 1923, 442, 441]	194922	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3224	303	303	26	class_26	[2881, 1253, 394, 373]	146962	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3225	303	303	24	class_24	[1038, 1639, 1027, 665]	682955	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3226	303	303	26	class_26	[3199, 2049, 387, 394]	152478	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3227	303	303	26	class_26	[1160, 1815, 643, 396]	254628	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3228	303	303	23	class_23	[2038, 1776, 822, 578]	475116	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3229	303	303	26	class_26	[1137, 1130, 449, 389]	174661	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3230	303	303	2	12	[2580, 1166, 879, 722]	634638	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3231	303	303	22	class_22	[2912, 1799, 814, 847]	689458	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3232	303	303	4	14	[1045, 1052, 897, 603]	540891	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3233	304	304	26	class_26	[2339, 1850, 441, 346]	152586	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3234	304	304	26	class_26	[3205, 1064, 376, 407]	153032	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3235	304	304	23	class_23	[2243, 1771, 862, 460]	396520	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3236	304	304	26	class_26	[3313, 1936, 464, 378]	175392	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3237	304	304	26	class_26	[1407, 1035, 458, 421]	192818	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3238	304	304	24	class_24	[1095, 1810, 1152, 474]	546048	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3239	304	304	26	class_26	[1346, 1903, 640, 330]	211200	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3240	304	304	4	14	[1372, 1028, 866, 648]	561168	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3241	304	304	2	12	[2854, 1044, 912, 737]	672144	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3242	304	304	22	class_22	[3166, 1804, 807, 658]	531006	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3243	305	305	26	class_26	[1505, 1955, 543, 374]	203082	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3244	305	305	26	class_26	[2413, 2061, 409, 422]	172598	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3245	305	305	26	class_26	[3390, 2150, 353, 412]	145436	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3246	305	305	2	12	[2737, 1266, 868, 709]	615412	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3247	305	305	1	11	[3615, 1202, 692, 712]	492704	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3248	305	305	26	class_26	[3858, 1399, 383, 381]	145923	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3249	305	305	26	class_26	[3066, 1465, 381, 336]	128016	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3250	305	305	22	class_22	[3080, 1873, 757, 775]	586675	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3251	305	305	23	class_23	[2340, 1823, 723, 652]	471396	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3252	305	305	24	class_24	[1230, 1683, 1080, 725]	783000	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3253	306	306	26	class_26	[3241, 2700, 444, 439]	194916	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3254	306	306	26	class_26	[4180, 2658, 695, 406]	282170	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3255	306	306	26	class_26	[2222, 2787, 466, 421]	196186	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3256	306	306	16	44	[2113, 2544, 875, 954]	834750	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3257	306	306	26	class_26	[4202, 1898, 448, 381]	170688	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3258	306	306	17	15	[2989, 2513, 861, 675]	581175	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3259	306	306	26	class_26	[2431, 1914, 347, 393]	136371	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3260	306	306	9	31	[2352, 1820, 958, 781]	748198	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3261	306	306	11	33	[3913, 1803, 946, 639]	604494	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3262	306	306	18	25	[3874, 2482, 1268, 625]	792500	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3263	307	307	26	class_26	[4149, 1209, 390, 419]	163410	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3264	307	307	26	class_26	[2391, 2039, 424, 326]	138224	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3265	307	307	26	class_26	[2498, 1149, 381, 386]	147066	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3266	307	307	26	class_26	[3339, 2032, 452, 341]	154132	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3267	307	307	11	33	[3825, 1182, 868, 620]	538160	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3268	307	307	16	44	[2208, 1914, 859, 733]	629647	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3269	307	307	9	31	[2344, 1084, 928, 819]	760032	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3270	307	307	17	15	[3090, 1933, 800, 562]	449600	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3271	308	308	26	class_26	[2765, 2425, 407, 445]	181115	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3272	308	308	26	class_26	[2076, 1589, 440, 384]	168960	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3273	308	308	26	class_26	[4575, 2242, 641, 421]	269861	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3274	308	308	26	class_26	[3698, 2406, 470, 457]	214790	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3275	308	308	9	31	[2737, 1618, 914, 572]	522808	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3276	308	308	16	44	[2621, 2149, 836, 887]	741532	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3277	308	308	8	24	[2033, 1369, 722, 713]	514786	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3278	308	308	26	class_26	[2798, 1723, 452, 352]	159104	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3279	308	308	17	15	[3456, 2093, 799, 807]	644793	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3280	308	308	18	25	[4290, 2033, 1247, 662]	825514	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3281	309	309	26	class_26	[1975, 1596, 373, 319]	118987	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3282	309	309	26	class_26	[2930, 1588, 377, 328]	123656	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3283	309	309	26	class_26	[2278, 2497, 299, 345]	103155	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3284	309	309	7	23	[2636, 1216, 858, 1031]	884598	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3285	309	309	0	class_0	[1753, 1212, 883, 1047]	924501	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3286	309	309	26	class_26	[2912, 2458, 300, 365]	109500	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3287	309	309	26	class_26	[1683, 2438, 306, 366]	111996	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3288	309	309	19	35	[2173, 2242, 549, 850]	466650	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3289	309	309	13	41	[2720, 2238, 597, 812]	484764	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3290	309	309	20	45	[1615, 2216, 541, 879]	475539	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3291	310	310	26	class_26	[2740, 1823, 433, 424]	183592	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3292	310	310	26	class_26	[3658, 1855, 395, 411]	162345	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3293	310	310	19	35	[2664, 1556, 758, 1136]	861088	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3294	310	310	0	class_0	[2266, 317, 1141, 1231]	1404571	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3295	310	310	26	class_26	[3837, 705, 516, 467]	240972	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3296	310	310	26	class_26	[2521, 676, 545, 387]	210915	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3297	310	310	7	23	[3440, 363, 1150, 1278]	1469700	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3298	310	310	13	41	[3420, 1543, 790, 1125]	888750	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3299	311	311	26	class_26	[2784, 2320, 344, 430]	147920	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3300	311	311	7	23	[3281, 891, 991, 1181]	1170371	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3301	311	311	26	class_26	[3635, 1374, 478, 364]	173992	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3302	311	311	26	class_26	[2521, 1366, 459, 350]	160650	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3303	311	311	26	class_26	[2077, 2199, 336, 451]	151536	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3304	311	311	0	class_0	[2282, 876, 999, 1186]	1184814	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3305	311	311	26	class_26	[3526, 2288, 336, 431]	144816	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3306	311	311	19	35	[2634, 2016, 677, 911]	616747	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3307	311	311	13	41	[3310, 1993, 667, 849]	566283	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3308	311	311	20	45	[1947, 1913, 677, 915]	619455	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3309	312	312	26	class_26	[3302, 2229, 478, 427]	204106	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3310	312	312	26	class_26	[2438, 2157, 399, 371]	148029	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3311	312	312	26	class_26	[1480, 2011, 406, 418]	169708	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3312	312	312	26	class_26	[2674, 1338, 487, 383]	186521	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3313	312	312	26	class_26	[1836, 1341, 294, 373]	109662	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3314	312	312	2	12	[2413, 958, 995, 1117]	1111415	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3315	312	312	4	14	[1610, 1166, 778, 719]	559382	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3316	312	312	24	class_24	[1058, 1740, 1277, 826]	1054802	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3317	312	312	21	brace	[3089, 1924, 855, 1075]	919125	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3318	312	312	23	class_23	[2299, 1983, 811, 804]	652044	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3319	313	313	26	class_26	[3497, 1823, 370, 368]	136160	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3320	313	313	26	class_26	[2045, 1017, 343, 374]	128282	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3321	313	313	2	12	[2696, 731, 867, 961]	833187	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3322	313	313	26	class_26	[2877, 987, 402, 353]	141906	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3323	313	313	26	class_26	[2700, 1749, 335, 322]	107870	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3324	313	313	21	brace	[3281, 1601, 788, 1027]	809276	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3325	313	313	4	14	[1965, 870, 739, 730]	539470	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3326	313	313	26	class_26	[1810, 1711, 381, 319]	121539	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3327	313	313	23	class_23	[2490, 1710, 795, 578]	459510	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3328	313	313	24	class_24	[1500, 1673, 1073, 549]	589077	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3329	314	314	26	class_26	[2851, 1241, 510, 438]	223380	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3330	314	314	26	class_26	[3562, 2023, 441, 451]	198891	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3331	314	314	26	class_26	[4073, 1184, 434, 408]	177072	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3332	314	314	1	11	[3655, 729, 892, 1057]	942844	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3333	314	314	2	12	[2621, 879, 1035, 1017]	1052595	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3334	314	314	21	brace	[3322, 1646, 891, 1107]	986337	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3335	315	315	26	class_26	[2382, 2189, 470, 394]	185180	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3336	315	315	26	class_26	[4308, 2098, 669, 400]	267600	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3337	315	315	26	class_26	[3885, 1292, 358, 432]	154656	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3338	315	315	26	class_26	[2824, 1288, 436, 383]	166988	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3339	315	315	26	class_26	[3215, 2126, 423, 398]	168354	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3340	315	315	15	43	[2261, 1873, 894, 1145]	1023630	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3341	315	315	9	31	[2641, 865, 1014, 1147]	1163058	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3342	315	315	17	15	[3180, 2030, 816, 792]	646272	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3343	315	315	18	25	[3955, 1855, 1390, 862]	1198180	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3344	315	315	11	33	[3660, 1113, 790, 735]	580650	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3345	316	316	26	class_26	[2709, 1335, 411, 347]	142617	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3346	316	316	26	class_26	[3654, 1352, 369, 388]	143172	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3347	316	316	26	class_26	[2349, 2132, 407, 340]	138380	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3348	316	316	26	class_26	[4069, 2051, 586, 298]	174628	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3349	316	316	15	43	[2239, 1997, 784, 882]	691488	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3350	316	316	9	31	[2540, 1063, 877, 998]	875246	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3351	316	316	11	33	[3450, 1223, 713, 745]	531185	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3352	316	316	18	25	[3730, 1973, 1187, 555]	658785	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3353	317	317	26	class_26	[2719, 2754, 412, 369]	152028	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3354	317	317	26	class_26	[2013, 2763, 395, 380]	150100	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3355	317	317	9	31	[2151, 1762, 838, 871]	729898	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3356	317	317	26	class_26	[3245, 2061, 349, 383]	133667	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3357	317	317	26	class_26	[2321, 2026, 382, 445]	169990	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3358	317	317	26	class_26	[3787, 2637, 479, 330]	158070	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3359	317	317	11	33	[3024, 1918, 724, 600]	434400	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3360	317	317	15	43	[1897, 2444, 784, 991]	776944	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3361	317	317	17	15	[2710, 2553, 687, 776]	533112	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3362	317	317	18	25	[3330, 2373, 1213, 709]	860017	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3363	318	318	26	class_26	[2399, 1155, 237, 244]	57828	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3364	318	318	26	class_26	[3097, 1142, 221, 251]	55471	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3365	318	318	26	class_26	[1826, 1184, 265, 238]	63070	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3366	318	318	1	11	[1792, 1082, 450, 550]	247500	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3367	318	318	0	class_0	[2237, 969, 592, 663]	392496	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3368	318	318	7	23	[2828, 954, 583, 658]	383614	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3369	319	319	26	class_26	[2689, 1272, 226, 223]	50398	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3370	319	319	26	class_26	[3350, 1292, 215, 230]	49450	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3371	319	319	26	class_26	[2090, 1332, 239, 255]	60945	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3372	319	319	1	11	[2026, 1307, 451, 507]	228657	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3373	319	319	0	class_0	[2484, 1150, 577, 600]	346200	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3374	319	319	7	23	[3060, 1152, 577, 624]	360048	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3375	320	320	26	class_26	[2447, 1539, 232, 288]	66816	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3376	320	320	26	class_26	[1801, 1379, 263, 311]	81793	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3377	320	320	26	class_26	[3135, 1522, 260, 292]	75920	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3378	320	320	7	23	[2872, 1258, 614, 672]	412608	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3379	320	320	0	class_0	[2233, 1295, 627, 621]	389367	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3380	320	320	1	11	[1775, 1242, 458, 594]	272052	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3381	321	321	26	class_26	[2395, 1392, 222, 246]	54612	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3382	321	321	26	class_26	[1752, 1311, 262, 260]	68120	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3383	321	321	2	12	[2235, 1230, 551, 611]	336661	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3384	321	321	3	13	[1725, 1217, 505, 504]	254520	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3385	322	322	26	class_26	[2758, 1436, 288, 279]	80352	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3386	322	322	26	class_26	[1959, 1476, 314, 280]	87920	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3387	322	322	3	13	[1873, 1357, 650, 635]	412750	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3388	322	322	2	12	[2517, 1254, 682, 730]	497860	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3389	323	323	26	class_26	[2466, 1684, 221, 290]	64090	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3390	323	323	26	class_26	[3240, 1676, 269, 296]	79624	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3391	323	323	1	11	[3012, 1529, 552, 585]	322920	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3392	323	323	2	12	[2261, 1503, 606, 596]	361176	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3393	324	324	26	class_26	[3608, 1534, 269, 261]	70209	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3394	324	324	8	24	[2231, 1441, 566, 565]	319790	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3395	324	324	26	class_26	[2347, 1536, 252, 257]	64764	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3396	324	324	26	class_26	[2946, 1502, 250, 268]	67000	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3397	324	324	10	32	[3411, 1395, 565, 603]	340695	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3398	324	324	9	31	[2800, 1357, 603, 666]	401598	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3399	325	325	26	class_26	[2690, 1386, 274, 269]	73706	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3400	325	325	26	class_26	[3424, 1389, 290, 297]	86130	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3401	325	325	9	31	[2527, 1229, 671, 727]	487817	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3402	325	325	10	32	[3209, 1272, 620, 643]	398660	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3403	326	326	26	class_26	[1995, 1270, 269, 289]	77741	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3404	326	326	26	class_26	[2675, 1288, 256, 288]	73728	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3405	326	326	26	class_26	[3367, 1281, 289, 301]	86989	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3406	326	326	9	31	[2479, 1119, 643, 678]	435954	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3407	326	326	8	24	[1875, 1142, 602, 631]	379862	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3408	326	326	10	32	[3145, 1147, 612, 629]	384948	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3409	327	327	7	23	[2811, 975, 776, 838]	650288	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3410	327	327	26	class_26	[2172, 1257, 358, 309]	110622	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3411	327	327	26	class_26	[2296, 2016, 270, 364]	98280	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3412	327	327	26	class_26	[1732, 2021, 278, 333]	92574	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3413	327	327	26	class_26	[3390, 2015, 265, 338]	89570	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3414	327	327	26	class_26	[2831, 2032, 269, 344]	92536	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3415	327	327	26	class_26	[3037, 1230, 401, 321]	128721	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3416	327	327	0	class_0	[2020, 966, 776, 842]	653392	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3417	327	327	14	42	[3171, 1784, 516, 734]	378744	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3418	327	327	19	35	[2152, 1796, 538, 649]	349162	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3419	327	327	20	45	[1680, 1772, 490, 724]	354760	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3420	327	327	13	41	[2680, 1792, 493, 704]	347072	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3421	328	328	26	class_26	[2566, 1163, 362, 254]	91948	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3422	328	328	26	class_26	[3318, 1202, 342, 314]	107388	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3423	328	328	26	class_26	[2610, 1775, 260, 261]	67860	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3424	328	328	0	class_0	[2456, 1034, 646, 574]	370804	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3425	328	328	26	class_26	[3051, 1803, 255, 291]	74205	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3426	328	328	19	35	[2533, 1601, 432, 611]	263952	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3427	328	328	7	23	[3105, 1072, 673, 627]	421971	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3428	328	328	13	41	[2972, 1637, 423, 656]	277488	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3429	329	329	26	class_26	[3093, 1474, 344, 267]	91848	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3430	329	329	26	class_26	[2295, 1446, 353, 301]	106253	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3431	329	329	7	23	[2879, 1181, 702, 702]	492804	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3432	329	329	0	class_0	[2192, 1146, 667, 725]	483575	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	1	\N	\N	\N
3433	330	330	26	class_26	[2679, 2050, 317, 268]	84956	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3434	330	330	26	class_26	[3325, 2081, 296, 289]	85544	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3435	330	330	26	class_26	[2132, 1932, 278, 288]	80064	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3436	330	330	26	class_26	[3643, 1395, 253, 258]	65274	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3437	330	330	26	class_26	[2245, 1365, 260, 260]	67600	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3438	330	330	26	class_26	[2876, 1380, 329, 292]	96068	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3439	330	330	21	brace	[3160, 1847, 590, 686]	404740	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3440	330	330	3	13	[2190, 1255, 571, 550]	314050	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3441	330	330	22	class_22	[2601, 1844, 569, 606]	344814	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3442	330	330	23	class_23	[2088, 1812, 521, 576]	300096	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3443	330	330	2	12	[2758, 1127, 620, 694]	430280	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3444	330	330	1	11	[3415, 1237, 583, 614]	357962	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3445	331	331	26	class_26	[2128, 1899, 374, 305]	114070	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3446	331	331	26	class_26	[2934, 1892, 345, 311]	107295	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3447	331	331	26	class_26	[3259, 1057, 361, 299]	107939	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3448	331	331	26	class_26	[3609, 1866, 285, 334]	95190	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3449	331	331	21	brace	[2755, 1595, 685, 882]	604170	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3450	331	331	22	class_22	[2082, 1703, 662, 709]	469358	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3451	331	331	26	class_26	[2348, 1090, 352, 327]	115104	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3452	331	331	1	11	[3002, 921, 748, 708]	529584	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3453	331	331	2	12	[2250, 836, 729, 825]	601425	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3454	331	331	20	45	[3450, 1621, 520, 784]	407680	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3455	332	332	26	class_26	[2388, 2162, 335, 291]	97485	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3456	332	332	26	class_26	[3368, 1431, 319, 271]	86449	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3457	332	332	26	class_26	[3089, 2163, 325, 285]	92625	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3458	332	332	26	class_26	[2526, 1498, 372, 291]	108252	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3459	332	332	1	11	[3144, 1218, 650, 654]	425100	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3460	332	332	22	class_22	[2333, 1883, 605, 683]	413215	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3461	332	332	21	brace	[2939, 1877, 610, 732]	446520	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3462	332	332	2	12	[2454, 1204, 667, 667]	444889	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3463	333	333	26	class_26	[3388, 2301, 282, 316]	89112	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3464	333	333	26	class_26	[3228, 1605, 364, 276]	100464	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3465	333	333	26	class_26	[2730, 2287, 295, 269]	79355	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3466	333	333	26	class_26	[3939, 2318, 289, 283]	81787	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3467	333	333	26	class_26	[2630, 1512, 330, 325]	107250	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3468	333	333	26	class_26	[3918, 1667, 323, 290]	93670	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3469	333	333	9	31	[3110, 1383, 620, 701]	434620	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3470	333	333	8	24	[2500, 1369, 603, 649]	391347	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3471	333	333	16	44	[3187, 2142, 555, 618]	342990	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3472	333	333	15	43	[2578, 2011, 593, 798]	473214	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3473	333	333	10	32	[3715, 1562, 610, 593]	361730	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3474	333	333	17	15	[3755, 2137, 570, 615]	350550	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3475	334	334	26	class_26	[3008, 2285, 337, 349]	117613	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3476	334	334	26	class_26	[3642, 1542, 357, 362]	129234	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3477	334	334	26	class_26	[2267, 2244, 340, 315]	107100	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3478	334	334	26	class_26	[2860, 1428, 352, 326]	114752	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3479	334	334	15	43	[2174, 2026, 674, 844]	568856	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3480	334	334	26	class_26	[2185, 1385, 332, 309]	102588	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3481	334	334	16	44	[2836, 2193, 653, 652]	425756	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3482	334	334	10	32	[3420, 1457, 684, 724]	495216	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3483	334	334	8	24	[2054, 1295, 651, 677]	440727	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3484	334	334	9	31	[2710, 1272, 737, 768]	566016	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3485	335	335	26	class_26	[2738, 2249, 279, 285]	79515	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3486	335	335	26	class_26	[2683, 1616, 286, 280]	80080	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3487	335	335	9	31	[3094, 1502, 578, 611]	353158	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3488	335	335	8	24	[2527, 1409, 538, 623]	335174	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3489	335	335	26	class_26	[3335, 2310, 273, 260]	70980	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3490	335	335	26	class_26	[3256, 1665, 287, 302]	86674	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3491	335	335	15	43	[2600, 2017, 537, 703]	377511	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3492	335	335	16	44	[3140, 2082, 533, 618]	329394	2026-09-16 03:27:43.778733	yolo_upload	\N	\N	0	\N	\N	\N
3493	294	294	0	top_left	[2870, 1860, 267, -203]	-54201	2026-09-16 03:31:16.412084	python_subbox	3141	top_left	1	\N	\N	0
3494	294	294	1	top_right	[2870, 2294, 267, -82]	-21894	2026-09-16 03:31:16.429822	python_subbox	3141	top_right	1	\N	\N	1
3495	294	294	1	bottom_left	[2870, 1657, -128, 638]	-81664	2026-09-16 03:31:16.44136	python_subbox	3141	bottom_left	1	\N	\N	1
3496	294	294	0	bottom_right	[3201, 1657, -64, 638]	-40832	2026-09-16 03:31:16.450646	python_subbox	3141	bottom_right	1	\N	\N	0
3497	295	295	0	top_left	[2843, 2294, 294, -182]	-53508	2026-09-16 03:31:16.510938	python_subbox	3151	top_left	1	\N	\N	0
3498	295	295	0	top_right	[2843, 2700, 294, -68]	-19992	2026-09-16 03:31:16.516482	python_subbox	3151	top_right	1	\N	\N	0
3499	295	295	0	bottom_left	[2843, 2116, -85, 584]	-49640	2026-09-16 03:31:16.518421	python_subbox	3151	bottom_left	1	\N	\N	0
3500	295	295	1	bottom_right	[3238, 2116, -102, 584]	-59568	2026-09-16 03:31:16.526612	python_subbox	3151	bottom_right	1	\N	\N	1
\.


--
-- Data for Name: image_validations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.image_validations (id, image_id, criteria, result, notes, validated_by, validated_at) FROM stdin;
\.


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.images (id, visit_id, url, image_category, image_type, image_index, validation_status, taken_at, notes, created_at, deleted_at, url_processed, processing_status, processed_at, original_filename, has_annotations, annotation_count, width, height) FROM stdin;
229	34	/nhakhoa/visits/34/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-15 17:52:38.83547	YOLO upload: patient_add_0001_G.jpg	2026-09-15 17:52:38.83547	\N	/nhakhoa/processed_by_hash/0dfb2bc18f6ec963a6540eff21ee61a008f9500967c4a00a796c7aa9f686d38f.jpg	completed	2026-09-15 17:56:31.31	patient_add_0001_G.jpg	t	16	6240	4160
230	34	/nhakhoa/visits/34/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-15 17:52:38.880553	YOLO upload: patient_add_0001_GCD.jpg	2026-09-15 17:52:38.880553	\N	/nhakhoa/processed_by_hash/d6e721b025d79bcc6e169a477cccd653a50799f0f1c9552b945d109fbe9a8671.jpg	completed	2026-09-15 17:56:31.347	patient_add_0001_GCD.jpg	t	12	5160	3440
231	34	/nhakhoa/visits/34/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-15 17:52:38.914103	YOLO upload: patient_add_0001_GCT.jpg	2026-09-15 17:52:38.914103	\N	/nhakhoa/processed_by_hash/56eb217001e49867d8c3eee4a2c641b13c47113797dec57d738f829e6d8acae3.jpg	completed	2026-09-15 17:56:31.348	patient_add_0001_GCT.jpg	f	0	6240	4160
233	34	/nhakhoa/visits/34/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-15 17:52:38.97877	YOLO upload: patient_add_0001_PCD.jpg	2026-09-15 17:52:38.97877	\N	/nhakhoa/processed_by_hash/a8600c8e58ca503f4411db9a628a41abd28107d321e2bdd7c9f01eceee1e871c.jpg	completed	2026-09-15 17:56:31.394	patient_add_0001_PCD.jpg	t	16	6240	4160
232	34	/nhakhoa/visits/34/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-15 17:52:38.939215	YOLO upload: patient_add_0001_P.jpg	2026-09-15 17:52:38.939215	\N	/nhakhoa/processed_by_hash/c195ec64bc5a31efc31aaffd3740b41e58901adb9b9e35758986436a920fba88.jpg	completed	2026-09-15 17:56:31.376	patient_add_0001_P.jpg	t	20	6240	4160
234	34	/nhakhoa/visits/34/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-15 17:52:39.014092	YOLO upload: patient_add_0001_PCT.jpg	2026-09-15 17:52:39.014092	\N	/nhakhoa/processed_by_hash/ffdb9374899f09b9ad44b9624eaa7cece7cf87d97c71a207fb3c19c16bbeb559.jpg	completed	2026-09-15 17:56:31.412	patient_add_0001_PCT.jpg	t	12	6240	4160
235	34	/nhakhoa/visits/34/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-15 17:52:39.047392	YOLO upload: patient_add_0001_T.jpg	2026-09-15 17:52:39.047392	\N	/nhakhoa/processed_by_hash/3f3b8cda12d879347ca080a38fa2f660c035e7fbc691ea1e83530b90b563c03f.jpg	completed	2026-09-15 17:56:31.427	patient_add_0001_T.jpg	t	20	6240	4160
236	34	/nhakhoa/visits/34/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-15 17:52:39.087361	YOLO upload: patient_add_0001_TCD.jpg	2026-09-15 17:52:39.087361	\N	/nhakhoa/processed_by_hash/572decdd79f44869d22ad4b97da84764bf9f674fbcda123be0ef0770c46d1835.jpg	completed	2026-09-15 17:56:31.438	patient_add_0001_TCD.jpg	t	16	6240	4160
237	34	/nhakhoa/visits/34/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-15 17:52:39.123001	YOLO upload: patient_add_0001_TCT.jpg	2026-09-15 17:52:39.123001	\N	/nhakhoa/processed_by_hash/2fa71ea819f608ddeae56d63f91eaced60c3d62b1b2e2ae45f0c6209e4dcae2b.jpg	completed	2026-09-15 17:56:31.458	patient_add_0001_TCT.jpg	t	16	6240	4160
238	35	/nhakhoa/visits/35/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-15 18:02:29.747185	YOLO upload: patient_add_0001_G.jpg	2026-09-15 18:02:29.747185	\N	/nhakhoa/processed_by_hash/0dfb2bc18f6ec963a6540eff21ee61a008f9500967c4a00a796c7aa9f686d38f.jpg	completed	2026-09-15 18:02:51.162	patient_add_0001_G.jpg	t	16	6240	4160
239	35	/nhakhoa/visits/35/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-15 18:02:29.797076	YOLO upload: patient_add_0001_GCD.jpg	2026-09-15 18:02:29.797076	\N	/nhakhoa/processed_by_hash/d6e721b025d79bcc6e169a477cccd653a50799f0f1c9552b945d109fbe9a8671.jpg	completed	2026-09-15 18:02:51.2	patient_add_0001_GCD.jpg	t	12	5160	3440
240	35	/nhakhoa/visits/35/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-15 18:02:29.832738	YOLO upload: patient_add_0001_GCT.jpg	2026-09-15 18:02:29.832738	\N	/nhakhoa/processed_by_hash/56eb217001e49867d8c3eee4a2c641b13c47113797dec57d738f829e6d8acae3.jpg	completed	2026-09-15 18:02:51.187	patient_add_0001_GCT.jpg	f	0	6240	4160
242	35	/nhakhoa/visits/35/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-15 18:02:29.903459	YOLO upload: patient_add_0001_PCD.jpg	2026-09-15 18:02:29.903459	\N	/nhakhoa/processed_by_hash/a8600c8e58ca503f4411db9a628a41abd28107d321e2bdd7c9f01eceee1e871c.jpg	completed	2026-09-15 18:02:51.215	patient_add_0001_PCD.jpg	t	16	6240	4160
241	35	/nhakhoa/visits/35/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-15 18:02:29.860372	YOLO upload: patient_add_0001_P.jpg	2026-09-15 18:02:29.860372	\N	/nhakhoa/processed_by_hash/c195ec64bc5a31efc31aaffd3740b41e58901adb9b9e35758986436a920fba88.jpg	completed	2026-09-15 18:02:51.224	patient_add_0001_P.jpg	t	20	6240	4160
220	33	/nhakhoa/visits/33/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-15 17:34:49.140033	YOLO upload: patient_add_0002_G.jpg	2026-09-15 17:34:49.140033	\N	/nhakhoa/processed_by_hash/960ea6c56e9cf1e13ff95fec95c5323f9619dde26fd5bc9122ae32a347924dc3.jpg	completed	2026-09-15 17:35:39.092	patient_add_0002_G.jpg	t	12	6240	4160
221	33	/nhakhoa/visits/33/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-15 17:34:49.187379	YOLO upload: patient_add_0002_GCD.jpg	2026-09-15 17:34:49.187379	\N	/nhakhoa/processed_by_hash/09832968692d5f2d60a1c0a6cdb1999768777d0651b190a978630dcaa1397734.jpg	completed	2026-09-15 17:35:39.135	patient_add_0002_GCD.jpg	t	12	6240	4160
222	33	/nhakhoa/visits/33/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-15 17:34:49.227681	YOLO upload: patient_add_0002_GCT.jpg	2026-09-15 17:34:49.227681	\N	/nhakhoa/processed_by_hash/fdfda36793b0f14ad6dab18b2ef1a7d0d066427b402342e2fbed4f45f666dae6.jpg	completed	2026-09-15 17:35:39.131	patient_add_0002_GCT.jpg	t	12	6240	4160
224	33	/nhakhoa/visits/33/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-15 17:34:49.286864	YOLO upload: patient_add_0002_PCD.jpg	2026-09-15 17:34:49.286864	\N	/nhakhoa/processed_by_hash/607e3f6a7cb0309f2175fdf25f6aa1d42efe4fb739b17d26d85b7d928e2b1c28.jpg	completed	2026-09-15 17:35:39.162	patient_add_0002_PCD.jpg	f	0	6240	4160
223	33	/nhakhoa/visits/33/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-15 17:34:49.26172	YOLO upload: patient_add_0002_P.jpg	2026-09-15 17:34:49.26172	\N	/nhakhoa/processed_by_hash/829328c893558ed880249d16ead616163d6f3eba5860f902daf6b44baffc1706.jpg	completed	2026-09-15 17:35:39.146	patient_add_0002_P.jpg	f	0	6240	4160
225	33	/nhakhoa/visits/33/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-15 17:34:49.310822	YOLO upload: patient_add_0002_PCT.jpg	2026-09-15 17:34:49.310822	\N	/nhakhoa/processed_by_hash/0c6a50d7714f1a75e37aca9a1d469904b6b75a81c46e2709cdfdbe933f8937c6.jpg	completed	2026-09-15 17:35:39.173	patient_add_0002_PCT.jpg	f	0	6240	4160
226	33	/nhakhoa/visits/33/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-15 17:34:49.338536	YOLO upload: patient_add_0002_T.jpg	2026-09-15 17:34:49.338536	\N	/nhakhoa/processed_by_hash/29321ffc989362b04596d7f75999501e8ff0ac8850d8dcd8f67cb026bde3e98c.jpg	completed	2026-09-15 17:35:39.184	patient_add_0002_T.jpg	t	4	6240	4160
227	33	/nhakhoa/visits/33/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-15 17:34:49.370025	YOLO upload: patient_add_0002_TCD.jpg	2026-09-15 17:34:49.370025	\N	/nhakhoa/processed_by_hash/01474cfa56c14665862c6bfe4cd2d44aa49831519752ec7915c39c90477450d0.jpg	completed	2026-09-15 17:35:39.198	patient_add_0002_TCD.jpg	t	8	6240	4160
228	33	/nhakhoa/visits/33/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-15 17:34:49.403014	YOLO upload: patient_add_0002_TCT.jpg	2026-09-15 17:34:49.403014	\N	/nhakhoa/processed_by_hash/384d8080ee4fe892558e73db50e757393cff2ff250a089073ae69423b3f901a9.jpg	completed	2026-09-15 17:35:39.227	patient_add_0002_TCT.jpg	t	9	6240	4160
300	42	/nhakhoa/visits/42/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:27:44.073115	YOLO upload: patient_add_0009_G.jpg	2026-09-16 03:27:44.073115	\N	\N	pending	\N	patient_add_0009_G.jpg	t	10	6240	4160
333	45	/nhakhoa/visits/45/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:27:45.020415	YOLO upload: patient_add_0006_T.jpg	2026-09-16 03:27:45.020415	\N	\N	pending	\N	patient_add_0006_T.jpg	t	12	5472	3648
334	45	/nhakhoa/visits/45/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:27:45.048736	YOLO upload: patient_add_0006_TCD.jpg	2026-09-16 03:27:45.048736	\N	\N	pending	\N	patient_add_0006_TCD.jpg	t	10	5472	3648
335	45	/nhakhoa/visits/45/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:27:45.076979	YOLO upload: patient_add_0006_TCT.jpg	2026-09-16 03:27:45.076979	\N	\N	pending	\N	patient_add_0006_TCT.jpg	t	8	5472	3648
291	41	/nhakhoa/visits/41/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:27:43.82797	YOLO upload: patient_add_0010_G.jpg	2026-09-16 03:27:43.82797	\N	/nhakhoa/processed_by_hash/dc0aa89565d578cd65e13b1bf9754bc973c13b80f26071a97b44aaed5bec948e.jpg	completed	2026-09-16 03:31:16.285	patient_add_0010_G.jpg	t	8	5472	3648
244	35	/nhakhoa/visits/35/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-15 18:02:29.975185	YOLO upload: patient_add_0001_T.jpg	2026-09-15 18:02:29.975185	\N	/nhakhoa/processed_by_hash/3f3b8cda12d879347ca080a38fa2f660c035e7fbc691ea1e83530b90b563c03f.jpg	completed	2026-09-15 18:02:51.239	patient_add_0001_T.jpg	t	20	6240	4160
243	35	/nhakhoa/visits/35/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-15 18:02:29.939513	YOLO upload: patient_add_0001_PCT.jpg	2026-09-15 18:02:29.939513	\N	/nhakhoa/processed_by_hash/ffdb9374899f09b9ad44b9624eaa7cece7cf87d97c71a207fb3c19c16bbeb559.jpg	completed	2026-09-15 18:02:51.226	patient_add_0001_PCT.jpg	t	12	6240	4160
245	35	/nhakhoa/visits/35/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-15 18:02:30.018686	YOLO upload: patient_add_0001_TCD.jpg	2026-09-15 18:02:30.018686	\N	/nhakhoa/processed_by_hash/572decdd79f44869d22ad4b97da84764bf9f674fbcda123be0ef0770c46d1835.jpg	completed	2026-09-15 18:02:51.251	patient_add_0001_TCD.jpg	t	16	6240	4160
246	35	/nhakhoa/visits/35/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-15 18:02:30.059719	YOLO upload: patient_add_0001_TCT.jpg	2026-09-15 18:02:30.059719	\N	/nhakhoa/processed_by_hash/2fa71ea819f608ddeae56d63f91eaced60c3d62b1b2e2ae45f0c6209e4dcae2b.jpg	completed	2026-09-15 18:02:51.264	patient_add_0001_TCT.jpg	t	16	6240	4160
299	41	/nhakhoa/visits/41/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:27:44.039371	YOLO upload: patient_add_0010_TCT.jpg	2026-09-16 03:27:44.039371	\N	/nhakhoa/processed_by_hash/d1fc12c37d50914ad92061915ce9c250c1e17a624a4710ab81bbb4bd2d65d82b.jpg	completed	2026-09-16 03:31:16.625	patient_add_0010_TCT.jpg	t	10	4478	2985
247	36	/nhakhoa/visits/36/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:22:12.487546	YOLO upload: patient_add_0005_G.jpg	2026-09-16 03:22:12.487546	\N	\N	pending	\N	patient_add_0005_G.jpg	t	6	5472	3648
248	36	/nhakhoa/visits/36/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:22:12.524652	YOLO upload: patient_add_0005_GCD.jpg	2026-09-16 03:22:12.524652	\N	\N	pending	\N	patient_add_0005_GCD.jpg	t	6	5472	3648
249	36	/nhakhoa/visits/36/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:22:12.551508	YOLO upload: patient_add_0005_GCT.jpg	2026-09-16 03:22:12.551508	\N	\N	pending	\N	patient_add_0005_GCT.jpg	t	6	5472	3648
250	36	/nhakhoa/visits/36/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:22:12.573115	YOLO upload: patient_add_0005_P.jpg	2026-09-16 03:22:12.573115	\N	\N	pending	\N	patient_add_0005_P.jpg	t	6	5472	3648
251	36	/nhakhoa/visits/36/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:22:12.596574	YOLO upload: patient_add_0005_PCD.jpg	2026-09-16 03:22:12.596574	\N	\N	pending	\N	patient_add_0005_PCD.jpg	t	7	5472	3648
252	36	/nhakhoa/visits/36/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:22:12.619375	YOLO upload: patient_add_0005_PCT.jpg	2026-09-16 03:22:12.619375	\N	\N	pending	\N	patient_add_0005_PCT.jpg	t	6	5472	3648
253	36	/nhakhoa/visits/36/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:22:12.640814	YOLO upload: patient_add_0005_T.jpg	2026-09-16 03:22:12.640814	\N	\N	pending	\N	patient_add_0005_T.jpg	t	4	5472	3648
254	36	/nhakhoa/visits/36/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:22:12.66112	YOLO upload: patient_add_0005_TCD.jpg	2026-09-16 03:22:12.66112	\N	\N	pending	\N	patient_add_0005_TCD.jpg	t	4	5472	3648
255	36	/nhakhoa/visits/36/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:22:12.683711	YOLO upload: patient_add_0005_TCT.jpg	2026-09-16 03:22:12.683711	\N	\N	pending	\N	patient_add_0005_TCT.jpg	t	4	5472	3648
256	37	/nhakhoa/visits/37/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:22:12.710119	YOLO upload: patient_add_0004_G.jpg	2026-09-16 03:22:12.710119	\N	\N	pending	\N	patient_add_0004_G.jpg	t	8	5472	3648
257	37	/nhakhoa/visits/37/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:22:12.73586	YOLO upload: patient_add_0004_GCD.jpg	2026-09-16 03:22:12.73586	\N	\N	pending	\N	patient_add_0004_GCD.jpg	t	8	5472	3648
258	37	/nhakhoa/visits/37/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:22:12.765374	YOLO upload: patient_add_0004_GCT.jpg	2026-09-16 03:22:12.765374	\N	\N	pending	\N	patient_add_0004_GCT.jpg	t	8	5472	3648
259	37	/nhakhoa/visits/37/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:22:12.790499	YOLO upload: patient_add_0004_P.jpg	2026-09-16 03:22:12.790499	\N	\N	pending	\N	patient_add_0004_P.jpg	t	12	5472	3648
260	37	/nhakhoa/visits/37/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:22:12.813835	YOLO upload: patient_add_0004_PCD.jpg	2026-09-16 03:22:12.813835	\N	\N	pending	\N	patient_add_0004_PCD.jpg	t	10	5472	3648
261	37	/nhakhoa/visits/37/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:22:12.83778	YOLO upload: patient_add_0004_PCT.jpg	2026-09-16 03:22:12.83778	\N	\N	pending	\N	patient_add_0004_PCT.jpg	t	8	5472	3648
262	37	/nhakhoa/visits/37/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:22:12.863589	YOLO upload: patient_add_0004_T.jpg	2026-09-16 03:22:12.863589	\N	\N	pending	\N	patient_add_0004_T.jpg	t	12	5472	3648
263	37	/nhakhoa/visits/37/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:22:12.889383	YOLO upload: patient_add_0004_TCD.jpg	2026-09-16 03:22:12.889383	\N	\N	pending	\N	patient_add_0004_TCD.jpg	t	10	5472	3648
264	37	/nhakhoa/visits/37/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:22:12.913618	YOLO upload: patient_add_0004_TCT.jpg	2026-09-16 03:22:12.913618	\N	\N	pending	\N	patient_add_0004_TCT.jpg	t	10	5472	3648
265	38	/nhakhoa/visits/38/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:22:12.944779	YOLO upload: patient_add_0003_G.jpg	2026-09-16 03:22:12.944779	\N	\N	pending	\N	patient_add_0003_G.jpg	f	0	5472	3648
266	38	/nhakhoa/visits/38/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:22:12.968991	YOLO upload: patient_add_0003_GCD.jpg	2026-09-16 03:22:12.968991	\N	\N	pending	\N	patient_add_0003_GCD.jpg	t	12	5472	3648
267	38	/nhakhoa/visits/38/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:22:12.996762	YOLO upload: patient_add_0003_GCT.jpg	2026-09-16 03:22:12.996762	\N	\N	pending	\N	patient_add_0003_GCT.jpg	t	12	4774	3183
268	38	/nhakhoa/visits/38/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:22:13.024953	YOLO upload: patient_add_0003_P.jpg	2026-09-16 03:22:13.024953	\N	\N	pending	\N	patient_add_0003_P.jpg	t	6	5472	3648
269	38	/nhakhoa/visits/38/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:22:13.047082	YOLO upload: patient_add_0003_PCD.jpg	2026-09-16 03:22:13.047082	\N	\N	pending	\N	patient_add_0003_PCD.jpg	t	12	5472	3648
270	38	/nhakhoa/visits/38/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:22:13.074229	YOLO upload: patient_add_0003_PCT.jpg	2026-09-16 03:22:13.074229	\N	\N	pending	\N	patient_add_0003_PCT.jpg	t	6	5472	3648
271	38	/nhakhoa/visits/38/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:22:13.09699	YOLO upload: patient_add_0003_T.jpg	2026-09-16 03:22:13.09699	\N	\N	pending	\N	patient_add_0003_T.jpg	t	8	5472	3648
272	38	/nhakhoa/visits/38/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:22:13.122199	YOLO upload: patient_add_0003_TCD.jpg	2026-09-16 03:22:13.122199	\N	\N	pending	\N	patient_add_0003_TCD.jpg	t	8	5472	3648
273	38	/nhakhoa/visits/38/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:22:13.146106	YOLO upload: patient_add_0003_TCT.jpg	2026-09-16 03:22:13.146106	\N	\N	pending	\N	patient_add_0003_TCT.jpg	t	10	5472	3648
274	39	/nhakhoa/visits/39/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:22:13.178011	YOLO upload: patient_add_0002_G.jpg	2026-09-16 03:22:13.178011	\N	/nhakhoa/processed_by_hash/960ea6c56e9cf1e13ff95fec95c5323f9619dde26fd5bc9122ae32a347924dc3.jpg	completed	2026-09-16 03:30:39.737	patient_add_0002_G.jpg	t	6	6240	4160
275	39	/nhakhoa/visits/39/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:22:13.204747	YOLO upload: patient_add_0002_GCD.jpg	2026-09-16 03:22:13.204747	\N	/nhakhoa/processed_by_hash/09832968692d5f2d60a1c0a6cdb1999768777d0651b190a978630dcaa1397734.jpg	completed	2026-09-16 03:30:39.768	patient_add_0002_GCD.jpg	t	6	6240	4160
276	39	/nhakhoa/visits/39/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:22:13.234145	YOLO upload: patient_add_0002_GCT.jpg	2026-09-16 03:22:13.234145	\N	/nhakhoa/processed_by_hash/fdfda36793b0f14ad6dab18b2ef1a7d0d066427b402342e2fbed4f45f666dae6.jpg	completed	2026-09-16 03:30:39.764	patient_add_0002_GCT.jpg	t	6	6240	4160
278	39	/nhakhoa/visits/39/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:22:13.288262	YOLO upload: patient_add_0002_PCD.jpg	2026-09-16 03:22:13.288262	\N	/nhakhoa/processed_by_hash/607e3f6a7cb0309f2175fdf25f6aa1d42efe4fb739b17d26d85b7d928e2b1c28.jpg	completed	2026-09-16 03:30:39.791	patient_add_0002_PCD.jpg	f	0	6240	4160
277	39	/nhakhoa/visits/39/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:22:13.261595	YOLO upload: patient_add_0002_P.jpg	2026-09-16 03:22:13.261595	\N	/nhakhoa/processed_by_hash/829328c893558ed880249d16ead616163d6f3eba5860f902daf6b44baffc1706.jpg	completed	2026-09-16 03:30:39.776	patient_add_0002_P.jpg	f	0	6240	4160
279	39	/nhakhoa/visits/39/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:22:13.315704	YOLO upload: patient_add_0002_PCT.jpg	2026-09-16 03:22:13.315704	\N	/nhakhoa/processed_by_hash/0c6a50d7714f1a75e37aca9a1d469904b6b75a81c46e2709cdfdbe933f8937c6.jpg	completed	2026-09-16 03:30:39.803	patient_add_0002_PCT.jpg	f	0	6240	4160
280	39	/nhakhoa/visits/39/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:22:13.341102	YOLO upload: patient_add_0002_T.jpg	2026-09-16 03:22:13.341102	\N	/nhakhoa/processed_by_hash/29321ffc989362b04596d7f75999501e8ff0ac8850d8dcd8f67cb026bde3e98c.jpg	completed	2026-09-16 03:30:39.816	patient_add_0002_T.jpg	t	2	6240	4160
281	39	/nhakhoa/visits/39/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:22:13.36926	YOLO upload: patient_add_0002_TCD.jpg	2026-09-16 03:22:13.36926	\N	/nhakhoa/processed_by_hash/01474cfa56c14665862c6bfe4cd2d44aa49831519752ec7915c39c90477450d0.jpg	completed	2026-09-16 03:30:39.827	patient_add_0002_TCD.jpg	t	4	6240	4160
292	41	/nhakhoa/visits/41/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:27:43.865014	YOLO upload: patient_add_0010_GCD.jpg	2026-09-16 03:27:43.865014	\N	/nhakhoa/processed_by_hash/b652060dcc8227c70e3b5c8ef8761a48b7eff76f8a19bd28e94806354aab5b98.jpg	completed	2026-09-16 03:31:16.331	patient_add_0010_GCD.jpg	t	8	5472	3648
293	41	/nhakhoa/visits/41/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:27:43.890017	YOLO upload: patient_add_0010_GCT.jpg	2026-09-16 03:27:43.890017	\N	/nhakhoa/processed_by_hash/8592a7bd72e5fde20976165506caa23868b9d74d4a76c40d7a1fa2e79554910f.jpg	completed	2026-09-16 03:31:16.369	patient_add_0010_GCT.jpg	t	4	5472	3648
294	41	/nhakhoa/visits/41/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:27:43.91298	YOLO upload: patient_add_0010_P.jpg	2026-09-16 03:27:43.91298	\N	/nhakhoa/processed_by_hash/38f47972d1859db9e8f6816c784714e26a9be544966618ace9cf8c2c564ea6f8.jpg	completed	2026-09-16 03:31:16.407	patient_add_0010_P.jpg	t	10	5472	3648
295	41	/nhakhoa/visits/41/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:27:43.937978	YOLO upload: patient_add_0010_PCD.jpg	2026-09-16 03:27:43.937978	\N	/nhakhoa/processed_by_hash/f805b78b7fa00f447cac1d321dee26bfcd291c85c3a4de25604714929a11ee13.jpg	completed	2026-09-16 03:31:16.464	patient_add_0010_PCD.jpg	t	8	5472	3648
296	41	/nhakhoa/visits/41/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:27:43.962462	YOLO upload: patient_add_0010_PCT.jpg	2026-09-16 03:27:43.962462	\N	/nhakhoa/processed_by_hash/68ca27d0affa1c02972b7463f75c2acf7369887a3d6b8932f6ddeecdecfd245d.jpg	completed	2026-09-16 03:31:16.515	patient_add_0010_PCT.jpg	t	8	5472	3648
297	41	/nhakhoa/visits/41/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:27:43.986757	YOLO upload: patient_add_0010_T.jpg	2026-09-16 03:27:43.986757	\N	/nhakhoa/processed_by_hash/ddf2a78435a89f677d2d99b51519eeab222bbddc290be333212c6689c414445e.jpg	completed	2026-09-16 03:31:16.554	patient_add_0010_T.jpg	t	8	5472	3648
298	41	/nhakhoa/visits/41/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:27:44.016594	YOLO upload: patient_add_0010_TCD.jpg	2026-09-16 03:27:44.016594	\N	/nhakhoa/processed_by_hash/0339a77942afdc802f34f483b62b7d297b259cfddbd1b3dd4bbfb047c674ca6e.jpg	completed	2026-09-16 03:31:16.591	patient_add_0010_TCD.jpg	t	14	5472	3648
301	42	/nhakhoa/visits/42/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:27:44.105821	YOLO upload: patient_add_0009_GCD.jpg	2026-09-16 03:27:44.105821	\N	\N	pending	\N	patient_add_0009_GCD.jpg	t	10	6240	4160
302	42	/nhakhoa/visits/42/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:27:44.145086	YOLO upload: patient_add_0009_GCT.jpg	2026-09-16 03:27:44.145086	\N	\N	pending	\N	patient_add_0009_GCT.jpg	t	8	6240	4160
303	42	/nhakhoa/visits/42/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:27:44.172473	YOLO upload: patient_add_0009_P.jpg	2026-09-16 03:27:44.172473	\N	\N	pending	\N	patient_add_0009_P.jpg	t	10	6240	4160
304	42	/nhakhoa/visits/42/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:27:44.200008	YOLO upload: patient_add_0009_PCD.jpg	2026-09-16 03:27:44.200008	\N	\N	pending	\N	patient_add_0009_PCD.jpg	t	10	6240	4160
305	42	/nhakhoa/visits/42/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:27:44.228724	YOLO upload: patient_add_0009_PCT.jpg	2026-09-16 03:27:44.228724	\N	\N	pending	\N	patient_add_0009_PCT.jpg	t	10	6240	4160
306	42	/nhakhoa/visits/42/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:27:44.260957	YOLO upload: patient_add_0009_T.jpg	2026-09-16 03:27:44.260957	\N	\N	pending	\N	patient_add_0009_T.jpg	t	10	6240	4160
307	42	/nhakhoa/visits/42/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:27:44.288667	YOLO upload: patient_add_0009_TCD.jpg	2026-09-16 03:27:44.288667	\N	\N	pending	\N	patient_add_0009_TCD.jpg	t	8	6240	4160
308	42	/nhakhoa/visits/42/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:27:44.315488	YOLO upload: patient_add_0009_TCT.jpg	2026-09-16 03:27:44.315488	\N	\N	pending	\N	patient_add_0009_TCT.jpg	t	10	6240	4160
309	43	/nhakhoa/visits/43/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:27:44.349164	YOLO upload: patient_add_0008_G.jpg	2026-09-16 03:27:44.349164	\N	\N	pending	\N	patient_add_0008_G.jpg	t	10	6240	4160
310	43	/nhakhoa/visits/43/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:27:44.379558	YOLO upload: patient_add_0008_GCD.jpg	2026-09-16 03:27:44.379558	\N	\N	pending	\N	patient_add_0008_GCD.jpg	t	8	6240	4160
311	43	/nhakhoa/visits/43/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:27:44.409236	YOLO upload: patient_add_0008_GCT.jpg	2026-09-16 03:27:44.409236	\N	\N	pending	\N	patient_add_0008_GCT.jpg	t	10	6240	4160
312	43	/nhakhoa/visits/43/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:27:44.440629	YOLO upload: patient_add_0008_P.jpg	2026-09-16 03:27:44.440629	\N	\N	pending	\N	patient_add_0008_P.jpg	t	10	6240	4160
313	43	/nhakhoa/visits/43/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:27:44.470716	YOLO upload: patient_add_0008_PCD.jpg	2026-09-16 03:27:44.470716	\N	\N	pending	\N	patient_add_0008_PCD.jpg	t	10	6240	4160
314	43	/nhakhoa/visits/43/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:27:44.500334	YOLO upload: patient_add_0008_PCT.jpg	2026-09-16 03:27:44.500334	\N	\N	pending	\N	patient_add_0008_PCT.jpg	t	6	6240	4160
315	43	/nhakhoa/visits/43/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:27:44.527192	YOLO upload: patient_add_0008_T.jpg	2026-09-16 03:27:44.527192	\N	\N	pending	\N	patient_add_0008_T.jpg	t	10	6240	4160
316	43	/nhakhoa/visits/43/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:27:44.555711	YOLO upload: patient_add_0008_TCD.jpg	2026-09-16 03:27:44.555711	\N	\N	pending	\N	patient_add_0008_TCD.jpg	t	8	6240	4160
317	43	/nhakhoa/visits/43/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:27:44.583678	YOLO upload: patient_add_0008_TCT.jpg	2026-09-16 03:27:44.583678	\N	\N	pending	\N	patient_add_0008_TCT.jpg	t	10	6240	4160
318	44	/nhakhoa/visits/44/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:27:44.616166	YOLO upload: patient_add_0007_G.jpg	2026-09-16 03:27:44.616166	\N	\N	pending	\N	patient_add_0007_G.jpg	t	6	5472	3648
282	39	/nhakhoa/visits/39/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:22:13.397128	YOLO upload: patient_add_0002_TCT.jpg	2026-09-16 03:22:13.397128	\N	/nhakhoa/processed_by_hash/384d8080ee4fe892558e73db50e757393cff2ff250a089073ae69423b3f901a9.jpg	completed	2026-09-16 03:30:39.838	patient_add_0002_TCT.jpg	t	5	6240	4160
283	40	/nhakhoa/visits/40/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:22:13.431162	YOLO upload: patient_add_0001_G.jpg	2026-09-16 03:22:13.431162	\N	\N	pending	\N	patient_add_0001_G.jpg	t	8	6240	4160
284	40	/nhakhoa/visits/40/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:22:13.466915	YOLO upload: patient_add_0001_GCT.jpg	2026-09-16 03:22:13.466915	\N	\N	pending	\N	patient_add_0001_GCT.jpg	f	0	6240	4160
319	44	/nhakhoa/visits/44/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:27:44.643201	YOLO upload: patient_add_0007_GCD.jpg	2026-09-16 03:27:44.643201	\N	\N	pending	\N	patient_add_0007_GCD.jpg	t	6	5472	3648
285	40	/nhakhoa/visits/40/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:22:13.496176	YOLO upload: patient_add_0001_P.jpg	2026-09-16 03:22:13.496176	\N	\N	pending	\N	patient_add_0001_P.jpg	t	10	6240	4160
286	40	/nhakhoa/visits/40/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:22:13.52485	YOLO upload: patient_add_0001_PCD.jpg	2026-09-16 03:22:13.52485	\N	\N	pending	\N	patient_add_0001_PCD.jpg	t	8	6240	4160
320	44	/nhakhoa/visits/44/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:27:44.673376	YOLO upload: patient_add_0007_GCT.jpg	2026-09-16 03:27:44.673376	\N	\N	pending	\N	patient_add_0007_GCT.jpg	t	6	5472	3648
287	40	/nhakhoa/visits/40/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:22:13.551272	YOLO upload: patient_add_0001_PCT.jpg	2026-09-16 03:22:13.551272	\N	\N	pending	\N	patient_add_0001_PCT.jpg	t	6	6240	4160
288	40	/nhakhoa/visits/40/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:22:13.579284	YOLO upload: patient_add_0001_T.jpg	2026-09-16 03:22:13.579284	\N	\N	pending	\N	patient_add_0001_T.jpg	t	10	6240	4160
321	44	/nhakhoa/visits/44/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:27:44.703129	YOLO upload: patient_add_0007_P.jpg	2026-09-16 03:27:44.703129	\N	\N	pending	\N	patient_add_0007_P.jpg	t	4	5472	3648
289	40	/nhakhoa/visits/40/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:22:13.6086	YOLO upload: patient_add_0001_TCD.jpg	2026-09-16 03:22:13.6086	\N	\N	pending	\N	patient_add_0001_TCD.jpg	t	8	6240	4160
290	40	/nhakhoa/visits/40/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:22:13.634821	YOLO upload: patient_add_0001_TCT.jpg	2026-09-16 03:22:13.634821	\N	\N	pending	\N	patient_add_0001_TCT.jpg	t	8	6240	4160
322	44	/nhakhoa/visits/44/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:27:44.725579	YOLO upload: patient_add_0007_PCD.jpg	2026-09-16 03:27:44.725579	\N	\N	pending	\N	patient_add_0007_PCD.jpg	t	4	5472	3648
323	44	/nhakhoa/visits/44/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:27:44.747443	YOLO upload: patient_add_0007_PCT.jpg	2026-09-16 03:27:44.747443	\N	\N	pending	\N	patient_add_0007_PCT.jpg	t	4	5472	3648
324	44	/nhakhoa/visits/44/raw_middle_left.jpg	raw	middle_left	6	pending	2026-09-16 03:27:44.770414	YOLO upload: patient_add_0007_T.jpg	2026-09-16 03:27:44.770414	\N	\N	pending	\N	patient_add_0007_T.jpg	t	6	5472	3648
325	44	/nhakhoa/visits/44/raw_lower_left.jpg	raw	lower_left	9	pending	2026-09-16 03:27:44.801412	YOLO upload: patient_add_0007_TCD.jpg	2026-09-16 03:27:44.801412	\N	\N	pending	\N	patient_add_0007_TCD.jpg	t	4	5472	3648
326	44	/nhakhoa/visits/44/raw_upper_left.jpg	raw	upper_left	3	pending	2026-09-16 03:27:44.825842	YOLO upload: patient_add_0007_TCT.jpg	2026-09-16 03:27:44.825842	\N	\N	pending	\N	patient_add_0007_TCT.jpg	t	6	5472	3648
327	45	/nhakhoa/visits/45/raw_middle_center.jpg	raw	middle_center	5	pending	2026-09-16 03:27:44.855069	YOLO upload: patient_add_0006_G.jpg	2026-09-16 03:27:44.855069	\N	\N	pending	\N	patient_add_0006_G.jpg	t	12	5472	3648
328	45	/nhakhoa/visits/45/raw_lower_center.jpg	raw	lower_center	8	pending	2026-09-16 03:27:44.884453	YOLO upload: patient_add_0006_GCD.jpg	2026-09-16 03:27:44.884453	\N	\N	pending	\N	patient_add_0006_GCD.jpg	t	8	5472	3648
329	45	/nhakhoa/visits/45/raw_upper_center.jpg	raw	upper_center	2	pending	2026-09-16 03:27:44.909933	YOLO upload: patient_add_0006_GCT.jpg	2026-09-16 03:27:44.909933	\N	\N	pending	\N	patient_add_0006_GCT.jpg	t	4	5472	3648
330	45	/nhakhoa/visits/45/raw_middle_right.jpg	raw	middle_right	4	pending	2026-09-16 03:27:44.932413	YOLO upload: patient_add_0006_P.jpg	2026-09-16 03:27:44.932413	\N	\N	pending	\N	patient_add_0006_P.jpg	t	12	5472	3648
331	45	/nhakhoa/visits/45/raw_lower_right.jpg	raw	lower_right	7	pending	2026-09-16 03:27:44.960249	YOLO upload: patient_add_0006_PCD.jpg	2026-09-16 03:27:44.960249	\N	\N	pending	\N	patient_add_0006_PCD.jpg	t	10	5472	3648
332	45	/nhakhoa/visits/45/raw_upper_right.jpg	raw	upper_right	1	pending	2026-09-16 03:27:44.990163	YOLO upload: patient_add_0006_PCT.jpg	2026-09-16 03:27:44.990163	\N	\N	pending	\N	patient_add_0006_PCT.jpg	t	8	5472	3648
\.


--
-- Data for Name: labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.labels (id, image_id, subbox_id, label_type, value, description, labeled_by, labeled_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, name, phone, dob, gender, notes, created_at, updated_at, deleted_at) FROM stdin;
24	Bệnh Nhân #0001		\N	unknown	Patient ID: 0001	2026-09-13 17:34:55.64116	2026-09-13 17:34:55.64116	2026-09-13 17:54:11.096591
25	Bệnh Nhân #0001		\N	unknown	Patient ID: 0001	2026-09-13 17:54:48.008758	2026-09-13 17:54:48.008758	2026-09-14 02:10:37.128629
26	Bệnh Nhân #0001		\N	unknown	Patient ID: 0001	2026-09-15 05:39:37.879885	2026-09-15 05:39:37.879885	2026-09-15 06:05:14.995115
27	Bệnh Nhân #0001		\N	unknown	Patient ID: 0001	2026-09-15 06:08:56.701301	2026-09-15 06:08:56.701301	2026-09-15 06:58:52.800754
28	Bệnh Nhân #0001		\N	unknown	Patient ID: 0001	2026-09-15 07:00:06.618968	2026-09-15 07:00:06.618968	2026-09-15 09:02:38.004634
29	Bệnh Nhân #0001		\N	unknown	Patient ID: 0001	2026-09-15 09:06:20.367683	2026-09-15 09:06:20.367683	2026-09-15 15:40:13.838675
30	Bệnh Nhân #0002		\N	unknown	Patient ID: 0002	2026-09-15 15:56:39.938432	2026-09-15 15:56:39.938432	2026-09-15 16:02:13.33426
31	Bệnh Nhân #0002		\N	unknown	Patient ID: 0002	2026-09-15 16:04:20.985555	2026-09-15 16:04:20.985555	2026-09-15 16:53:29.382412
32	Bệnh Nhân #0002		\N	unknown	Patient ID: 0002	2026-09-15 16:54:24.339213	2026-09-15 16:54:24.339213	2026-09-15 17:34:22.964266
33	Bệnh Nhân #0002		\N	unknown	Patient ID: 0002	2026-09-15 17:34:49.092138	2026-09-15 17:34:49.092138	2026-09-15 17:58:44.2256
34	Bệnh Nhân #0001		\N	unknown	Patient ID: 0001	2026-09-15 17:52:38.790631	2026-09-15 17:52:38.790631	2026-09-15 17:58:49.70687
35	Bệnh Nhân #0001		\N	unknown	Patient ID: 0001	2026-09-15 18:02:29.698379	2026-09-15 18:02:29.698379	\N
36	Bệnh Nhân #0005		\N	unknown	Patient ID: 0005	2026-09-16 03:22:12.443068	2026-09-16 03:22:12.443068	\N
37	Bệnh Nhân #0004		\N	unknown	Patient ID: 0004	2026-09-16 03:22:12.687576	2026-09-16 03:22:12.687576	\N
38	Bệnh Nhân #0003		\N	unknown	Patient ID: 0003	2026-09-16 03:22:12.919202	2026-09-16 03:22:12.919202	\N
39	Bệnh Nhân #0002		\N	unknown	Patient ID: 0002	2026-09-16 03:22:13.151796	2026-09-16 03:22:13.151796	\N
40	Bệnh Nhân #0010		\N	unknown	Patient ID: 0010	2026-09-16 03:27:43.788708	2026-09-16 03:27:43.788708	\N
41	Bệnh Nhân #0009		\N	unknown	Patient ID: 0009	2026-09-16 03:27:44.046573	2026-09-16 03:27:44.046573	\N
42	Bệnh Nhân #0008		\N	unknown	Patient ID: 0008	2026-09-16 03:27:44.321688	2026-09-16 03:27:44.321688	\N
43	Bệnh Nhân #0007		\N	unknown	Patient ID: 0007	2026-09-16 03:27:44.590567	2026-09-16 03:27:44.590567	\N
44	Bệnh Nhân #0006		\N	unknown	Patient ID: 0006	2026-09-16 03:27:44.831354	2026-09-16 03:27:44.831354	\N
\.


--
-- Data for Name: processing_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.processing_jobs (id, visit_id, bullmq_job_id, status, progress, total_images, processed_images, error_message, result_data, created_by, created_at, started_at, completed_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subboxes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subboxes (id, image_id, region, coordinates, box_type, confidence, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role, full_name, email, created_at, updated_at) FROM stdin;
2	admin	$2b$10$u003cw8V1VnAEEq9Ks4L0OPwYRk8yg21vwz6R6XK/3VgLkLkKvjjq	admin	Administrator	admin@nhakhoa.com	2026-01-20 16:35:47.525064	2026-01-20 16:35:47.525064
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visits (id, patient_id, case_id, visit_date, status, notes, created_by, created_at, updated_at, deleted_at, annotation_file_url, reprocessed_at, reprocessed_by, reprocess_notes) FROM stdin;
24	24	\N	2026-09-13	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-13 17:34:55.645604	2026-09-13 17:53:28.016484	\N	\N	2026-09-13 17:53:28.016484	\N	\N
25	25	\N	2026-09-13	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-13 17:54:48.01469	2026-09-14 02:10:07.776128	\N	\N	2026-09-14 02:10:07.776128	\N	\N
26	26	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-15 05:39:37.894085	2026-09-15 05:55:19.574618	\N	\N	2026-09-15 05:55:19.574618	\N	\N
27	27	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-15 06:08:56.707833	2026-09-15 06:09:40.789905	\N	\N	2026-09-15 06:09:40.789905	\N	\N
28	28	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-15 07:00:06.627859	2026-09-15 07:24:42.20287	\N	\N	2026-09-15 07:24:42.20287	\N	\N
29	29	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-15 09:06:20.375716	2026-09-15 09:21:57.104789	\N	\N	2026-09-15 09:21:57.104789	\N	\N
30	30	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0002	\N	2026-09-15 15:56:39.946419	2026-09-15 15:56:39.946419	\N	\N	\N	\N	\N
31	31	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0002	\N	2026-09-15 16:04:20.994609	2026-09-15 16:05:04.603577	\N	\N	2026-09-15 16:05:04.603577	\N	\N
32	32	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0002	\N	2026-09-15 16:54:24.34725	2026-09-15 16:54:55.494488	\N	\N	2026-09-15 16:54:55.494488	\N	\N
33	33	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0002	\N	2026-09-15 17:34:49.099521	2026-09-15 17:35:39.23066	\N	\N	2026-09-15 17:35:39.23066	\N	\N
34	34	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-15 17:52:38.799847	2026-09-15 17:56:31.48583	\N	\N	2026-09-15 17:56:31.48583	\N	\N
35	35	\N	2026-09-15	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-15 18:02:29.706649	2026-09-15 18:02:51.283805	\N	\N	2026-09-15 18:02:51.283805	\N	\N
36	36	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0005	\N	2026-09-16 03:22:12.449954	2026-09-16 03:22:12.449954	\N	\N	\N	\N	\N
37	37	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0004	\N	2026-09-16 03:22:12.688774	2026-09-16 03:22:12.688774	\N	\N	\N	\N	\N
38	38	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0003	\N	2026-09-16 03:22:12.920445	2026-09-16 03:22:12.920445	\N	\N	\N	\N	\N
40	35	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0001	\N	2026-09-16 03:22:13.401913	2026-09-16 03:22:13.401913	\N	\N	\N	\N	\N
42	41	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0009	\N	2026-09-16 03:27:44.047931	2026-09-16 03:27:44.047931	\N	\N	\N	\N	\N
43	42	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0008	\N	2026-09-16 03:27:44.323087	2026-09-16 03:27:44.323087	\N	\N	\N	\N	\N
44	43	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0007	\N	2026-09-16 03:27:44.591963	2026-09-16 03:27:44.591963	\N	\N	\N	\N	\N
45	44	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0006	\N	2026-09-16 03:27:44.832718	2026-09-16 03:27:44.832718	\N	\N	\N	\N	\N
39	39	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0002	\N	2026-09-16 03:22:13.153179	2026-09-16 03:30:39.853789	\N	\N	2026-09-16 03:30:39.853789	\N	\N
41	40	\N	2026-09-16	completed	YOLO bulk upload - Patient ID: 0010	\N	2026-09-16 03:27:43.795397	2026-09-16 03:31:16.642053	\N	\N	2026-09-16 03:31:16.642053	\N	\N
\.


--
-- Name: annotation_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.annotation_history_id_seq', 96, true);


--
-- Name: cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cases_id_seq', 1, false);


--
-- Name: doctors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_id_seq', 1, false);


--
-- Name: image_annotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.image_annotations_id_seq', 3500, true);


--
-- Name: image_validations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.image_validations_id_seq', 1, false);


--
-- Name: images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.images_id_seq', 335, true);


--
-- Name: labels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.labels_id_seq', 1, false);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_id_seq', 44, true);


--
-- Name: processing_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.processing_jobs_id_seq', 5, true);


--
-- Name: subboxes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subboxes_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visits_id_seq', 45, true);


--
-- Name: annotation_history annotation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annotation_history
    ADD CONSTRAINT annotation_history_pkey PRIMARY KEY (id);


--
-- Name: case_doctors case_doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_doctors
    ADD CONSTRAINT case_doctors_pkey PRIMARY KEY (case_id, doctor_id);


--
-- Name: cases cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: image_annotations image_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_annotations
    ADD CONSTRAINT image_annotations_pkey PRIMARY KEY (id);


--
-- Name: image_validations image_validations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_validations
    ADD CONSTRAINT image_validations_pkey PRIMARY KEY (id);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: labels labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: processing_jobs processing_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processing_jobs
    ADD CONSTRAINT processing_jobs_pkey PRIMARY KEY (id);


--
-- Name: subboxes subboxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subboxes
    ADD CONSTRAINT subboxes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: idx_annotation_history_annotation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_annotation_history_annotation_id ON public.annotation_history USING btree (annotation_id);


--
-- Name: idx_annotation_history_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_annotation_history_user_id ON public.annotation_history USING btree (user_id);


--
-- Name: idx_case_doctors_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_case_doctors_case_id ON public.case_doctors USING btree (case_id);


--
-- Name: idx_case_doctors_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_case_doctors_doctor_id ON public.case_doctors USING btree (doctor_id);


--
-- Name: idx_cases_patient_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_patient_status ON public.cases USING btree (patient_id, status) WHERE (deleted_at IS NULL);


--
-- Name: idx_image_annotations_annotated_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_image_annotations_annotated_by ON public.image_annotations USING btree (annotated_by);


--
-- Name: idx_image_annotations_coco_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_image_annotations_coco_image_id ON public.image_annotations USING btree (coco_image_id);


--
-- Name: idx_image_annotations_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_image_annotations_image_id ON public.image_annotations USING btree (image_id);


--
-- Name: idx_image_annotations_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_image_annotations_parent_id ON public.image_annotations USING btree (parent_annotation_id) WHERE (parent_annotation_id IS NOT NULL);


--
-- Name: idx_image_annotations_plaque_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_image_annotations_plaque_status ON public.image_annotations USING btree (plaque_status) WHERE (plaque_status IS NOT NULL);


--
-- Name: idx_image_annotations_source_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_image_annotations_source_type ON public.image_annotations USING btree (source_type);


--
-- Name: idx_image_validations_validated_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_image_validations_validated_by ON public.image_validations USING btree (validated_by);


--
-- Name: idx_images_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_category ON public.images USING btree (image_category);


--
-- Name: idx_images_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_deleted_at ON public.images USING btree (deleted_at);


--
-- Name: idx_images_has_annotations; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_has_annotations ON public.images USING btree (has_annotations) WHERE (has_annotations = true);


--
-- Name: idx_images_original_filename; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_original_filename ON public.images USING btree (original_filename) WHERE (original_filename IS NOT NULL);


--
-- Name: idx_images_processing_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_processing_status ON public.images USING btree (processing_status);


--
-- Name: idx_images_url_processed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_url_processed ON public.images USING btree (visit_id) WHERE (url_processed IS NOT NULL);


--
-- Name: idx_images_validation_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_validation_status ON public.images USING btree (validation_status) WHERE (deleted_at IS NULL);


--
-- Name: idx_images_visit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_visit ON public.images USING btree (visit_id);


--
-- Name: idx_images_visit_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_visit_category ON public.images USING btree (visit_id, image_category) WHERE (deleted_at IS NULL);


--
-- Name: idx_labels_image; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labels_image ON public.labels USING btree (image_id);


--
-- Name: idx_labels_labeled_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labels_labeled_by ON public.labels USING btree (labeled_by);


--
-- Name: idx_patients_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_deleted_at ON public.patients USING btree (deleted_at);


--
-- Name: idx_patients_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_name ON public.patients USING btree (name);


--
-- Name: idx_patients_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_phone ON public.patients USING btree (phone);


--
-- Name: idx_patients_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_search ON public.patients USING gin (to_tsvector('simple'::regconfig, (((name)::text || ' '::text) || (COALESCE(phone, ''::character varying))::text))) WHERE (deleted_at IS NULL);


--
-- Name: idx_processing_jobs_bullmq_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_processing_jobs_bullmq_job_id ON public.processing_jobs USING btree (bullmq_job_id);


--
-- Name: idx_processing_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_processing_jobs_status ON public.processing_jobs USING btree (status) WHERE ((status)::text = ANY (ARRAY[('queued'::character varying)::text, ('processing'::character varying)::text]));


--
-- Name: idx_processing_jobs_visit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_processing_jobs_visit_id ON public.processing_jobs USING btree (visit_id);


--
-- Name: idx_subboxes_image; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subboxes_image ON public.subboxes USING btree (image_id);


--
-- Name: idx_visits_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_date ON public.visits USING btree (visit_date);


--
-- Name: idx_visits_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_deleted_at ON public.visits USING btree (deleted_at);


--
-- Name: idx_visits_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_patient ON public.visits USING btree (patient_id);


--
-- Name: idx_visits_reprocessed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_reprocessed_at ON public.visits USING btree (reprocessed_at) WHERE (reprocessed_at IS NOT NULL);


--
-- Name: idx_visits_status_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_status_date ON public.visits USING btree (status, visit_date) WHERE (deleted_at IS NULL);


--
-- Name: uq_image_parent_subbox_region; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_image_parent_subbox_region ON public.image_annotations USING btree (image_id, parent_annotation_id, subbox_region) WHERE (subbox_region IS NOT NULL);


--
-- Name: visit_reprocess_status _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.visit_reprocess_status AS
 SELECT v.id AS visit_id,
    v.patient_id,
    p.name AS patient_name,
    v.visit_date,
    v.reprocessed_at,
    u.username AS reprocessed_by_user,
    v.reprocess_notes,
    count(DISTINCT i.id) FILTER (WHERE (((i.image_category)::text = 'raw'::text) AND (i.deleted_at IS NULL))) AS raw_image_count,
    count(DISTINCT i.id) FILTER (WHERE (((i.image_category)::text = 'stained'::text) AND (i.deleted_at IS NULL))) AS stained_image_count,
        CASE
            WHEN (v.reprocessed_at IS NULL) THEN 'pending'::text
            WHEN (v.reprocessed_at < v.updated_at) THEN 'outdated'::text
            ELSE 'completed'::text
        END AS reprocess_status
   FROM (((public.visits v
     JOIN public.patients p ON ((v.patient_id = p.id)))
     LEFT JOIN public.users u ON ((v.reprocessed_by = u.id)))
     LEFT JOIN public.images i ON ((v.id = i.visit_id)))
  WHERE (v.deleted_at IS NULL)
  GROUP BY v.id, p.name, u.username
  ORDER BY v.reprocessed_at NULLS FIRST, v.id;


--
-- Name: annotation_history annotation_history_annotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annotation_history
    ADD CONSTRAINT annotation_history_annotation_id_fkey FOREIGN KEY (annotation_id) REFERENCES public.image_annotations(id) ON DELETE CASCADE;


--
-- Name: annotation_history annotation_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annotation_history
    ADD CONSTRAINT annotation_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: case_doctors case_doctors_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_doctors
    ADD CONSTRAINT case_doctors_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;


--
-- Name: case_doctors case_doctors_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_doctors
    ADD CONSTRAINT case_doctors_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: cases cases_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: image_annotations image_annotations_annotated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_annotations
    ADD CONSTRAINT image_annotations_annotated_by_fkey FOREIGN KEY (annotated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: image_annotations image_annotations_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_annotations
    ADD CONSTRAINT image_annotations_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id) ON DELETE CASCADE;


--
-- Name: image_annotations image_annotations_parent_annotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_annotations
    ADD CONSTRAINT image_annotations_parent_annotation_id_fkey FOREIGN KEY (parent_annotation_id) REFERENCES public.image_annotations(id) ON DELETE SET NULL;


--
-- Name: image_validations image_validations_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_validations
    ADD CONSTRAINT image_validations_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id) ON DELETE CASCADE;


--
-- Name: image_validations image_validations_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_validations
    ADD CONSTRAINT image_validations_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: images images_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- Name: labels labels_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id) ON DELETE CASCADE;


--
-- Name: labels labels_labeled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_labeled_by_fkey FOREIGN KEY (labeled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: labels labels_subbox_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_subbox_id_fkey FOREIGN KEY (subbox_id) REFERENCES public.subboxes(id) ON DELETE SET NULL;


--
-- Name: processing_jobs processing_jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processing_jobs
    ADD CONSTRAINT processing_jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: processing_jobs processing_jobs_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processing_jobs
    ADD CONSTRAINT processing_jobs_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id);


--
-- Name: subboxes subboxes_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subboxes
    ADD CONSTRAINT subboxes_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id) ON DELETE CASCADE;


--
-- Name: visits visits_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE SET NULL;


--
-- Name: visits visits_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: visits visits_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: visits visits_reprocessed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_reprocessed_by_fkey FOREIGN KEY (reprocessed_by) REFERENCES public.users(id);


--
-- Name: DATABASE dental_db; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON DATABASE dental_db TO dental_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict HdUCHt3uccbYnJnv2meh81eh2QCudE3efhqATo9o4Q98vqDeNNM4WSrrt5VaGIT

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict xVxyakyWdGFJGMVkCh8S7sAKDL9LwtHEuniEgP5c7xxUs59jtg7j1nfhxi04SdW

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: case_doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.case_doctors (
    case_id integer NOT NULL,
    doctor_id integer NOT NULL,
    role character varying(50)
);


ALTER TABLE public.case_doctors OWNER TO postgres;

--
-- Name: cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cases (
    id integer NOT NULL,
    patient_id integer,
    start_date date,
    end_date date,
    treatment_type character varying(100),
    status character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cases OWNER TO postgres;

--
-- Name: cases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cases_id_seq OWNER TO postgres;

--
-- Name: cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cases_id_seq OWNED BY public.cases.id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    specialty character varying(100),
    contact character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.doctors_id_seq OWNER TO postgres;

--
-- Name: doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;


--
-- Name: image_validations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image_validations (
    id integer NOT NULL,
    image_id integer,
    criteria character varying(100) NOT NULL,
    result boolean NOT NULL,
    notes text,
    validated_by integer,
    validated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.image_validations OWNER TO postgres;

--
-- Name: image_validations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.image_validations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.image_validations_id_seq OWNER TO postgres;

--
-- Name: image_validations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.image_validations_id_seq OWNED BY public.image_validations.id;


--
-- Name: images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.images (
    id integer NOT NULL,
    visit_id integer,
    url_minio character varying(255) NOT NULL,
    image_category character varying(20) NOT NULL,
    image_type character varying(50),
    image_index integer,
    validation_status character varying(20) DEFAULT 'pending'::character varying,
    taken_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.images OWNER TO postgres;

--
-- Name: images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.images_id_seq OWNER TO postgres;

--
-- Name: images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;


--
-- Name: labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.labels (
    id integer NOT NULL,
    image_id integer,
    subbox_id integer,
    label_type character varying(50) NOT NULL,
    value character varying(100),
    description text,
    labeled_by integer,
    labeled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.labels OWNER TO postgres;

--
-- Name: labels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.labels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.labels_id_seq OWNER TO postgres;

--
-- Name: labels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.labels_id_seq OWNED BY public.labels.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20),
    dob date,
    gender character varying(10),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.patients_id_seq OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: subboxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subboxes (
    id integer NOT NULL,
    image_id integer,
    region character varying(20) NOT NULL,
    coordinates jsonb NOT NULL,
    box_type character varying(20) NOT NULL,
    confidence double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subboxes OWNER TO postgres;

--
-- Name: subboxes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subboxes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subboxes_id_seq OWNER TO postgres;

--
-- Name: subboxes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subboxes_id_seq OWNED BY public.subboxes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    full_name character varying(100),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id integer NOT NULL,
    patient_id integer,
    case_id integer,
    visit_date date NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- Name: visits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.visits_id_seq OWNER TO postgres;

--
-- Name: visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visits_id_seq OWNED BY public.visits.id;


--
-- Name: cases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases ALTER COLUMN id SET DEFAULT nextval('public.cases_id_seq'::regclass);


--
-- Name: doctors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);


--
-- Name: image_validations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_validations ALTER COLUMN id SET DEFAULT nextval('public.image_validations_id_seq'::regclass);


--
-- Name: images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);


--
-- Name: labels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels ALTER COLUMN id SET DEFAULT nextval('public.labels_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: subboxes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subboxes ALTER COLUMN id SET DEFAULT nextval('public.subboxes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: visits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits ALTER COLUMN id SET DEFAULT nextval('public.visits_id_seq'::regclass);


--
-- Data for Name: case_doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.case_doctors (case_id, doctor_id, role) FROM stdin;
\.


--
-- Data for Name: cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cases (id, patient_id, start_date, end_date, treatment_type, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (id, user_id, name, specialty, contact, created_at) FROM stdin;
\.


--
-- Data for Name: image_validations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.image_validations (id, image_id, criteria, result, notes, validated_by, validated_at) FROM stdin;
\.


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.images (id, visit_id, url_minio, image_category, image_type, image_index, validation_status, taken_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.labels (id, image_id, subbox_id, label_type, value, description, labeled_by, labeled_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, name, phone, dob, gender, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: subboxes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subboxes (id, image_id, region, coordinates, box_type, confidence, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role, full_name, email, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visits (id, patient_id, case_id, visit_date, status, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Name: cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cases_id_seq', 1, false);


--
-- Name: doctors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_id_seq', 1, false);


--
-- Name: image_validations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.image_validations_id_seq', 1, false);


--
-- Name: images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.images_id_seq', 1, false);


--
-- Name: labels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.labels_id_seq', 1, false);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_id_seq', 1, false);


--
-- Name: subboxes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subboxes_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visits_id_seq', 1, false);


--
-- Name: case_doctors case_doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_doctors
    ADD CONSTRAINT case_doctors_pkey PRIMARY KEY (case_id, doctor_id);


--
-- Name: cases cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: image_validations image_validations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_validations
    ADD CONSTRAINT image_validations_pkey PRIMARY KEY (id);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: labels labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: subboxes subboxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subboxes
    ADD CONSTRAINT subboxes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: idx_images_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_category ON public.images USING btree (image_category);


--
-- Name: idx_images_visit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_images_visit ON public.images USING btree (visit_id);


--
-- Name: idx_labels_image; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labels_image ON public.labels USING btree (image_id);


--
-- Name: idx_patients_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_name ON public.patients USING btree (name);


--
-- Name: idx_patients_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_phone ON public.patients USING btree (phone);


--
-- Name: idx_subboxes_image; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subboxes_image ON public.subboxes USING btree (image_id);


--
-- Name: idx_visits_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_date ON public.visits USING btree (visit_date);


--
-- Name: idx_visits_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_visits_patient ON public.visits USING btree (patient_id);


--
-- Name: case_doctors case_doctors_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_doctors
    ADD CONSTRAINT case_doctors_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;


--
-- Name: case_doctors case_doctors_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_doctors
    ADD CONSTRAINT case_doctors_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: cases cases_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: image_validations image_validations_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_validations
    ADD CONSTRAINT image_validations_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id) ON DELETE CASCADE;


--
-- Name: image_validations image_validations_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_validations
    ADD CONSTRAINT image_validations_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: images images_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- Name: labels labels_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id) ON DELETE CASCADE;


--
-- Name: labels labels_labeled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_labeled_by_fkey FOREIGN KEY (labeled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: labels labels_subbox_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_subbox_id_fkey FOREIGN KEY (subbox_id) REFERENCES public.subboxes(id) ON DELETE SET NULL;


--
-- Name: subboxes subboxes_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subboxes
    ADD CONSTRAINT subboxes_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.images(id) ON DELETE CASCADE;


--
-- Name: visits visits_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE SET NULL;


--
-- Name: visits visits_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: visits visits_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict xVxyakyWdGFJGMVkCh8S7sAKDL9LwtHEuniEgP5c7xxUs59jtg7j1nfhxi04SdW

--
-- PostgreSQL database cluster dump complete
--

