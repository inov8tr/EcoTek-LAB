\!--
\-- PostgreSQL database dump
\--

\restrict YV7eW4fcloAnvMXObrkSuUROPjLX1YVnmiELgJpvtHwE5dQfYUrmnd0UFlhwCEc

\-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
\-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

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

\--
\-- Name: BinderTestStatus; Type: TYPE; Schema: public; Owner: -
\--

CREATE TYPE public."BinderTestStatus" AS ENUM (
    'PENDING_REVIEW',
    'READY',
    'ARCHIVED'
);


\--
\-- Name: DeleteStatus; Type: TYPE; Schema: public; Owner: -
\--

CREATE TYPE public."DeleteStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


\--
\-- Name: RequirementComparison; Type: TYPE; Schema: public; Owner: -
\--

CREATE TYPE public."RequirementComparison" AS ENUM (
    'LTE',
    'GTE',
    'BETWEEN'
);


\--
\-- Name: TestOutcome; Type: TYPE; Schema: public; Owner: -
\--

CREATE TYPE public."TestOutcome" AS ENUM (
    'PASS',
    'FAIL',
    'PARTIAL'
);


\--
\-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
\--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'RESEARCHER',
    'VIEWER'
);


\--
\-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
\--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

\--
\-- Name: Batch; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."Batch" (
    id integer NOT NULL,
    slug text NOT NULL,
    "batchCode" text NOT NULL,
    "formulationId" integer NOT NULL,
    "dateMixed" timestamp(3) without time zone NOT NULL,
    operator text,
    rpm integer,
    "mixingTempInitial" double precision,
    "mixingTempFinal" double precision,
    "mixingDurationMinutes" integer,
    "mixingNotes" text,
    "mixingCurve" jsonb,
    "reagentPercentage" double precision,
    status text,
    "capsuleDosagePct" double precision,
    "binderName" text,
    "binderPgHigh" integer,
    "binderPgLow" integer,
    "mixingTempC" double precision,
    "mixingTimeMin" double precision,
    "shearRpm" integer,
    "testDate" timestamp(3) without time zone,
    "labName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone
);


\--
\-- Name: Batch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."Batch_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: Batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."Batch_id_seq" OWNED BY public."Batch".id;


\--
\-- Name: BinderTest; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."BinderTest" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    name text,
    "testName" text DEFAULT 'Untitled Binder Test'::text NOT NULL,
    "folderName" text DEFAULT 'legacy-binder-test'::text NOT NULL,
    "pmaFormulaId" text,
    "batchId" text,
    "binderSource" text,
    operator text,
    lab text,
    "crmPct" double precision,
    "reagentPct" double precision,
    "aerosilPct" double precision,
    notes text,
    "pgHigh" integer,
    "pgLow" integer,
    "softeningPointC" double precision,
    "viscosity155_cP" double precision,
    "ductilityCm" double precision,
    "recoveryPct" double precision,
    jnr_3_2 double precision,
    "dsrData" jsonb,
    "originalFiles" jsonb NOT NULL,
    "aiExtractedData" jsonb,
    "aiConfidence" double precision,
    "manualEdits" jsonb,
    status public."BinderTestStatus" DEFAULT 'PENDING_REVIEW'::public."BinderTestStatus" NOT NULL
);


\--
\-- Name: BinderTestData; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."BinderTestData" (
    id text NOT NULL,
    "testName" text NOT NULL,
    "batchId" text,
    "binderSource" text,
    "crmPercent" double precision,
    "reagentPercent" double precision,
    "aerosilPercent" double precision,
    operator text,
    lab text,
    status text DEFAULT 'Pending'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: BinderTestDataFile; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."BinderTestDataFile" (
    id text NOT NULL,
    "binderTestId" text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileType" text NOT NULL,
    label text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: BinderTestDataMedia; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."BinderTestDataMedia" (
    id text NOT NULL,
    "binderTestId" text NOT NULL,
    "mediaUrl" text NOT NULL,
    "mediaType" text NOT NULL,
    label text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: BinderTestDataResult; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."BinderTestDataResult" (
    id text NOT NULL,
    "binderTestId" text NOT NULL,
    temperature double precision,
    "gOriginal" double precision,
    "gRtfo" double precision,
    "gPav" double precision,
    "pgHigh" integer,
    "pgLow" integer,
    "passFail" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: BinderTestDocument; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."BinderTestDocument" (
    id text NOT NULL,
    "binderTestId" text NOT NULL,
    "referenceNumber" text,
    "testNumber" text,
    "originalName" text NOT NULL,
    "storedPath" text NOT NULL,
    "mimeType" text,
    "sizeBytes" integer,
    hash text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: BitumenBaseTest; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."BitumenBaseTest" (
    id text NOT NULL,
    "bitumenOriginId" text NOT NULL,
    "batchCode" text NOT NULL,
    "softeningPoint" double precision,
    penetration double precision,
    viscosity135 double precision,
    viscosity165 double precision,
    "basePgHigh" integer,
    "basePgLow" integer,
    "baseDuctility" double precision,
    "baseRecovery" double precision,
    notes text,
    "testedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: BitumenOrigin; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."BitumenOrigin" (
    id text NOT NULL,
    "refineryName" text NOT NULL,
    "binderGrade" text NOT NULL,
    "originCountry" text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: CapsuleFormula; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."CapsuleFormula" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: CapsuleFormulaMaterial; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."CapsuleFormulaMaterial" (
    id text NOT NULL,
    "capsuleFormulaId" text NOT NULL,
    "materialName" text NOT NULL,
    percentage double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: DeletionRequest; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."DeletionRequest" (
    id integer NOT NULL,
    "targetTable" text NOT NULL,
    "targetId" text NOT NULL,
    reason text NOT NULL,
    status public."DeleteStatus" DEFAULT 'PENDING'::public."DeleteStatus" NOT NULL,
    "requesterId" text NOT NULL,
    "reviewerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


\--
\-- Name: DeletionRequest_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."DeletionRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: DeletionRequest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."DeletionRequest_id_seq" OWNED BY public."DeletionRequest".id;


\--
\-- Name: EmailVerificationToken; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."EmailVerificationToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: FileAttachment; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."FileAttachment" (
    id integer NOT NULL,
    "fileName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    "storagePath" text NOT NULL,
    "uploadedById" text NOT NULL,
    "batchId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: FileAttachment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."FileAttachment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: FileAttachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."FileAttachment_id_seq" OWNED BY public."FileAttachment".id;


\--
\-- Name: Formulation; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."Formulation" (
    id integer NOT NULL,
    slug text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "ecoCapPercentage" double precision,
    "reagentPercentage" double precision,
    "bitumenGrade" text,
    notes text,
    "targetPgHigh" integer,
    "targetPgLow" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone
);

\--
\-- Name: FormulationComponent; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."FormulationComponent" (
    id integer NOT NULL,
    "formulationId" integer NOT NULL,
    "materialId" integer,
    "materialName" text NOT NULL,
    percentage double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: FormulationComponent_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."FormulationComponent_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: FormulationComponent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."FormulationComponent_id_seq" OWNED BY public."FormulationComponent".id;


\--
\-- Name: Formulation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."Formulation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: Formulation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."Formulation_id_seq" OWNED BY public."Formulation".id;


\--
\-- Name: Market; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."Market" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL
);

\--
\-- Name: Market_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."Market_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: Market_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."Market_id_seq" OWNED BY public."Market".id;


\--
\-- Name: Material; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."Material" (
    id integer NOT NULL,
    name text NOT NULL,
    description text
);


\--
\-- Name: Material_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."Material_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: Material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."Material_id_seq" OWNED BY public."Material".id;


\--
\-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: PmaBatch; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."PmaBatch" (
    id text NOT NULL,
    "pmaFormulaId" text NOT NULL,
    "batchCode" text NOT NULL,
    "sampleDate" timestamp(3) without time zone,
    "testedById" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: PmaFormula; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."PmaFormula" (
    id text NOT NULL,
    name text DEFAULT 'PMA Formula'::text NOT NULL,
    "capsuleFormulaId" text NOT NULL,
    "bitumenOriginId" text NOT NULL,
    "bitumenTestId" text,
    "ecoCapPercentage" double precision NOT NULL,
    "reagentPercentage" double precision NOT NULL,
    "mixRpm" integer,
    "mixTimeMinutes" double precision,
    "pmaTargetPgHigh" integer,
    "pmaTargetPgLow" integer,
    "bitumenGradeOverride" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: PmaTestResult; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."PmaTestResult" (
    id text NOT NULL,
    "pmaBatchId" text NOT NULL,
    "softeningPoint" double precision,
    viscosity135 double precision,
    viscosity165 double precision,
    ductility double precision,
    "elasticRecovery" double precision,
    "storageStabilityDifference" double precision,
    "pgHigh" integer,
    "pgLow" integer,
    "dsrOriginalTemp" double precision,
    "dsrOriginalGOverSin" double precision,
    "dsrRtfoTemp" double precision,
    "dsrRtfoGOverSin" double precision,
    "dsrPavTemp" double precision,
    "dsrPavGTimesSin" double precision,
    "bbrTemp" double precision,
    "bbrStiffness" double precision,
    "bbrMValue" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: RecoveryCode; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."RecoveryCode" (
    id text NOT NULL,
    "userId" text NOT NULL,
    code text NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "usedAt" timestamp(3) without time zone
);


\--
\-- Name: SecurityEvent; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."SecurityEvent" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "eventType" text NOT NULL,
    detail text,
    "ipAddress" text,
    "userAgent" text,
    category text,
    channel text,
    link text,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: Session; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    jti text NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "loginNotified" boolean DEFAULT false NOT NULL
);


\--
\-- Name: Standard; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."Standard" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "marketId" integer NOT NULL
);


\--
\-- Name: StandardRequirement; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."StandardRequirement" (
    id integer NOT NULL,
    "standardId" integer NOT NULL,
    metric text NOT NULL,
    comparison public."RequirementComparison" NOT NULL,
    "thresholdMin" double precision,
    "thresholdMax" double precision,
    unit text,
    notes text
);


\--
\-- Name: StandardRequirement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."StandardRequirement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: StandardRequirement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."StandardRequirement_id_seq" OWNED BY public."StandardRequirement".id;


\--
\-- Name: Standard_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."Standard_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: Standard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."Standard_id_seq" OWNED BY public."Standard".id;


\--
\-- Name: SupportRequest; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."SupportRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


\--
\-- Name: TestResult; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."TestResult" (
    id integer NOT NULL,
    "batchId" integer NOT NULL,
    label text,
    "labReportId" text,
    "storabilityPct" double precision,
    "solubilityPct" double precision,
    jnr double precision,
    "elasticRecoveryPct" double precision,
    "softeningPointC" double precision,
    "ductilityCm" double precision,
    "viscosityPaS" double precision,
    "pgHigh" integer,
    "pgLow" integer,
    "temperatureC" double precision,
    remarks text,
    "overallOutcome" public."TestOutcome" DEFAULT 'PARTIAL'::public."TestOutcome" NOT NULL,
    "failedReasons" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: TestResult_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."TestResult_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: TestResult_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."TestResult_id_seq" OWNED BY public."TestResult".id;


\--
\-- Name: TestStandard; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."TestStandard" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "maxStorabilityPct" double precision,
    "minSolubilityPct" double precision,
    "maxJnr" double precision,
    "minElasticRecoveryPct" double precision,
    "minSofteningPointC" double precision,
    "minDuctilityCm" double precision,
    "maxViscosityPaS" double precision,
    "minPgHigh" integer,
    "maxPgLow" integer,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: TestStandard_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public."TestStandard_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: TestStandard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public."TestStandard_id_seq" OWNED BY public."TestStandard".id;


\--
\-- Name: User; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    "displayName" text,
    "avatarUrl" text,
    "bannerUrl" text,
    handle text,
    pronouns text,
    bio text,
    locale text DEFAULT 'en-US'::text,
    "timeZone" text DEFAULT 'UTC'::text,
    theme text DEFAULT 'system'::text,
    "loginAlerts" boolean DEFAULT false NOT NULL,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text,
    "notificationEmailOptIn" boolean DEFAULT true NOT NULL,
    "notificationPushOptIn" boolean DEFAULT false NOT NULL,
    "notificationInAppOptIn" boolean DEFAULT true NOT NULL,
    role public."UserRole" DEFAULT 'VIEWER'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'PENDING'::public."UserStatus" NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


\--
\-- Name: capsule_formula; Type: TABLE; Schema: public; Owner: -
\--

CREATE TABLE public.capsule_formula (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


\--
\-- Name: capsule_formula_id_seq; Type: SEQUENCE; Schema: public; Owner: -
\--

CREATE SEQUENCE public.capsule_formula_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


\--
\-- Name: capsule_formula_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
\--

ALTER SEQUENCE public.capsule_formula_id_seq OWNED BY public.capsule_formula.id;


\--
\-- Name: Batch id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Batch" ALTER COLUMN id SET DEFAULT nextval('public."Batch_id_seq"'::regclass);


\--
\-- Name: DeletionRequest id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."DeletionRequest" ALTER COLUMN id SET DEFAULT nextval('public."DeletionRequest_id_seq"'::regclass);


\--
\-- Name: FileAttachment id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."FileAttachment" ALTER COLUMN id SET DEFAULT nextval('public."FileAttachment_id_seq"'::regclass);


\--
\-- Name: Formulation id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Formulation" ALTER COLUMN id SET DEFAULT nextval('public."Formulation_id_seq"'::regclass);


\--
\-- Name: FormulationComponent id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."FormulationComponent" ALTER COLUMN id SET DEFAULT nextval('public."FormulationComponent_id_seq"'::regclass);


\--
\-- Name: Market id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Market" ALTER COLUMN id SET DEFAULT nextval('public."Market_id_seq"'::regclass);


\--
\-- Name: Material id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Material" ALTER COLUMN id SET DEFAULT nextval('public."Material_id_seq"'::regclass);


\--
\-- Name: Standard id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Standard" ALTER COLUMN id SET DEFAULT nextval('public."Standard_id_seq"'::regclass);


\--
\-- Name: StandardRequirement id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."StandardRequirement" ALTER COLUMN id SET DEFAULT nextval('public."StandardRequirement_id_seq"'::regclass);


\--
\-- Name: TestResult id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."TestResult" ALTER COLUMN id SET DEFAULT nextval('public."TestResult_id_seq"'::regclass);


\--
\-- Name: TestStandard id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."TestStandard" ALTER COLUMN id SET DEFAULT nextval('public."TestStandard_id_seq"'::regclass);


\--
\-- Name: capsule_formula id; Type: DEFAULT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public.capsule_formula ALTER COLUMN id SET DEFAULT nextval('public.capsule_formula_id_seq'::regclass);


\--
\-- Name: Batch Batch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_pkey" PRIMARY KEY (id);


\--
\-- Name: BinderTestDataFile BinderTestDataFile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestDataFile"
    ADD CONSTRAINT "BinderTestDataFile_pkey" PRIMARY KEY (id);


\--
\-- Name: BinderTestDataMedia BinderTestDataMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestDataMedia"
    ADD CONSTRAINT "BinderTestDataMedia_pkey" PRIMARY KEY (id);


\--
\-- Name: BinderTestDataResult BinderTestDataResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestDataResult"
    ADD CONSTRAINT "BinderTestDataResult_pkey" PRIMARY KEY (id);


\--
\-- Name: BinderTestData BinderTestData_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestData"
    ADD CONSTRAINT "BinderTestData_pkey" PRIMARY KEY (id);


\--
\-- Name: BinderTestDocument BinderTestDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestDocument"
    ADD CONSTRAINT "BinderTestDocument_pkey" PRIMARY KEY (id);


\--
\-- Name: BinderTest BinderTest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTest"
    ADD CONSTRAINT "BinderTest_pkey" PRIMARY KEY (id);


\--
\-- Name: BitumenBaseTest BitumenBaseTest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BitumenBaseTest"
    ADD CONSTRAINT "BitumenBaseTest_pkey" PRIMARY KEY (id);


\--
\-- Name: BitumenOrigin BitumenOrigin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BitumenOrigin"
    ADD CONSTRAINT "BitumenOrigin_pkey" PRIMARY KEY (id);


\--
\-- Name: CapsuleFormulaMaterial CapsuleFormulaMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."CapsuleFormulaMaterial"
    ADD CONSTRAINT "CapsuleFormulaMaterial_pkey" PRIMARY KEY (id);


\--
\-- Name: CapsuleFormula CapsuleFormula_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."CapsuleFormula"
    ADD CONSTRAINT "CapsuleFormula_pkey" PRIMARY KEY (id);


\--
\-- Name: DeletionRequest DeletionRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."DeletionRequest"
    ADD CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY (id);


\--
\-- Name: EmailVerificationToken EmailVerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY (id);


\--
\-- Name: FileAttachment FileAttachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."FileAttachment"
    ADD CONSTRAINT "FileAttachment_pkey" PRIMARY KEY (id);


\--
\-- Name: FormulationComponent FormulationComponent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."FormulationComponent"
    ADD CONSTRAINT "FormulationComponent_pkey" PRIMARY KEY (id);


\--
\-- Name: Formulation Formulation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Formulation"
    ADD CONSTRAINT "Formulation_pkey" PRIMARY KEY (id);


\--
\-- Name: Market Market_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Market"
    ADD CONSTRAINT "Market_pkey" PRIMARY KEY (id);


\--
\-- Name: Material Material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Material"
    ADD CONSTRAINT "Material_pkey" PRIMARY KEY (id);


\--
\-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


\--
\-- Name: PmaBatch PmaBatch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaBatch"
    ADD CONSTRAINT "PmaBatch_pkey" PRIMARY KEY (id);


\--
\-- Name: PmaFormula PmaFormula_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaFormula"
    ADD CONSTRAINT "PmaFormula_pkey" PRIMARY KEY (id);


\--
\-- Name: PmaTestResult PmaTestResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaTestResult"
    ADD CONSTRAINT "PmaTestResult_pkey" PRIMARY KEY (id);


\--
\-- Name: RecoveryCode RecoveryCode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."RecoveryCode"
    ADD CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY (id);


\--
\-- Name: SecurityEvent SecurityEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."SecurityEvent"
    ADD CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY (id);


\--
\-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


\--
\-- Name: StandardRequirement StandardRequirement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."StandardRequirement"
    ADD CONSTRAINT "StandardRequirement_pkey" PRIMARY KEY (id);


\--
\-- Name: Standard Standard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Standard"
    ADD CONSTRAINT "Standard_pkey" PRIMARY KEY (id);


\--
\-- Name: SupportRequest SupportRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."SupportRequest"
    ADD CONSTRAINT "SupportRequest_pkey" PRIMARY KEY (id);


\--
\-- Name: TestResult TestResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."TestResult"
    ADD CONSTRAINT "TestResult_pkey" PRIMARY KEY (id);


\--
\-- Name: TestStandard TestStandard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."TestStandard"
    ADD CONSTRAINT "TestStandard_pkey" PRIMARY KEY (id);


\--
\-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


\--
\-- Name: capsule_formula capsule_formula_pkey; Type: CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public.capsule_formula
    ADD CONSTRAINT capsule_formula_pkey PRIMARY KEY (id);


\--
\-- Name: Batch_batchCode_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "Batch_batchCode_key" ON public."Batch" USING btree ("batchCode");


\--
\-- Name: Batch_slug_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "Batch_slug_key" ON public."Batch" USING btree (slug);


\--
\-- Name: EmailVerificationToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON public."EmailVerificationToken" USING btree ("expiresAt");


\--
\-- Name: EmailVerificationToken_token_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON public."EmailVerificationToken" USING btree (token);


\--
\-- Name: EmailVerificationToken_userId_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "EmailVerificationToken_userId_idx" ON public."EmailVerificationToken" USING btree ("userId");


\--
\-- Name: Formulation_code_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "Formulation_code_key" ON public."Formulation" USING btree (code);


\--
\-- Name: Formulation_slug_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "Formulation_slug_key" ON public."Formulation" USING btree (slug);


\--
\-- Name: Market_code_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "Market_code_key" ON public."Market" USING btree (code);


\--
\-- Name: Material_name_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "Material_name_key" ON public."Material" USING btree (name);


\--
\-- Name: PasswordResetToken_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "PasswordResetToken_expiresAt_idx" ON public."PasswordResetToken" USING btree ("expiresAt");


\--
\-- Name: PasswordResetToken_token_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON public."PasswordResetToken" USING btree (token);


\--
\-- Name: PasswordResetToken_userId_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "PasswordResetToken_userId_idx" ON public."PasswordResetToken" USING btree ("userId");


\--
\-- Name: PmaBatch_batchCode_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "PmaBatch_batchCode_key" ON public."PmaBatch" USING btree ("batchCode");


\--
\-- Name: RecoveryCode_userId_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "RecoveryCode_userId_idx" ON public."RecoveryCode" USING btree ("userId");


\--
\-- Name: SecurityEvent_eventType_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "SecurityEvent_eventType_idx" ON public."SecurityEvent" USING btree ("eventType");


\--
\-- Name: SecurityEvent_userId_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "SecurityEvent_userId_idx" ON public."SecurityEvent" USING btree ("userId");


\--
\-- Name: SecurityEvent_userId_readAt_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "SecurityEvent_userId_readAt_idx" ON public."SecurityEvent" USING btree ("userId", "readAt");


\--
\-- Name: Session_jti_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "Session_jti_key" ON public."Session" USING btree (jti);


\--
\-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


\--
\-- Name: Standard_code_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "Standard_code_key" ON public."Standard" USING btree (code);


\--
\-- Name: SupportRequest_status_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "SupportRequest_status_idx" ON public."SupportRequest" USING btree (status);


\--
\-- Name: SupportRequest_userId_idx; Type: INDEX; Schema: public; Owner: -
\--

CREATE INDEX "SupportRequest_userId_idx" ON public."SupportRequest" USING btree ("userId");


\--
\-- Name: TestStandard_name_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "TestStandard_name_key" ON public."TestStandard" USING btree (name);


\--
\-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


\--
\-- Name: User_handle_key; Type: INDEX; Schema: public; Owner: -
\--

CREATE UNIQUE INDEX "User_handle_key" ON public."User" USING btree (handle);


\--
\-- Name: Batch Batch_formulationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES public."Formulation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: BinderTestDataFile BinderTestDataFile_binderTestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestDataFile"
    ADD CONSTRAINT "BinderTestDataFile_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES public."BinderTestData"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: BinderTestDataMedia BinderTestDataMedia_binderTestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestDataMedia"
    ADD CONSTRAINT "BinderTestDataMedia_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES public."BinderTestData"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: BinderTestDataResult BinderTestDataResult_binderTestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestDataResult"
    ADD CONSTRAINT "BinderTestDataResult_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES public."BinderTestData"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: BinderTestDocument BinderTestDocument_binderTestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTestDocument"
    ADD CONSTRAINT "BinderTestDocument_binderTestId_fkey" FOREIGN KEY ("binderTestId") REFERENCES public."BinderTest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: BinderTest BinderTest_pmaFormulaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BinderTest"
    ADD CONSTRAINT "BinderTest_pmaFormulaId_fkey" FOREIGN KEY ("pmaFormulaId") REFERENCES public."PmaFormula"(id) ON UPDATE CASCADE ON DELETE SET NULL;


\--
\-- Name: BitumenBaseTest BitumenBaseTest_bitumenOriginId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."BitumenBaseTest"
    ADD CONSTRAINT "BitumenBaseTest_bitumenOriginId_fkey" FOREIGN KEY ("bitumenOriginId") REFERENCES public."BitumenOrigin"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: CapsuleFormulaMaterial CapsuleFormulaMaterial_capsuleFormulaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."CapsuleFormulaMaterial"
    ADD CONSTRAINT "CapsuleFormulaMaterial_capsuleFormulaId_fkey" FOREIGN KEY ("capsuleFormulaId") REFERENCES public."CapsuleFormula"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: CapsuleFormula CapsuleFormula_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."CapsuleFormula"
    ADD CONSTRAINT "CapsuleFormula_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


\--
\-- Name: DeletionRequest DeletionRequest_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."DeletionRequest"
    ADD CONSTRAINT "DeletionRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


\--
\-- Name: DeletionRequest DeletionRequest_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."DeletionRequest"
    ADD CONSTRAINT "DeletionRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


\--
\-- Name: EmailVerificationToken EmailVerificationToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: FileAttachment FileAttachment_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."FileAttachment"
    ADD CONSTRAINT "FileAttachment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: FileAttachment FileAttachment_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."FileAttachment"
    ADD CONSTRAINT "FileAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


\--
\-- Name: FormulationComponent FormulationComponent_formulationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."FormulationComponent"
    ADD CONSTRAINT "FormulationComponent_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES public."Formulation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: FormulationComponent FormulationComponent_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."FormulationComponent"
    ADD CONSTRAINT "FormulationComponent_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."Material"(id) ON UPDATE CASCADE ON DELETE SET NULL;


\--
\-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: PmaBatch PmaBatch_pmaFormulaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaBatch"
    ADD CONSTRAINT "PmaBatch_pmaFormulaId_fkey" FOREIGN KEY ("pmaFormulaId") REFERENCES public."PmaFormula"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: PmaBatch PmaBatch_testedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaBatch"
    ADD CONSTRAINT "PmaBatch_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


\--
\-- Name: PmaFormula PmaFormula_bitumenOriginId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaFormula"
    ADD CONSTRAINT "PmaFormula_bitumenOriginId_fkey" FOREIGN KEY ("bitumenOriginId") REFERENCES public."BitumenOrigin"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: PmaFormula PmaFormula_bitumenTestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaFormula"
    ADD CONSTRAINT "PmaFormula_bitumenTestId_fkey" FOREIGN KEY ("bitumenTestId") REFERENCES public."BitumenBaseTest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


\--
\-- Name: PmaFormula PmaFormula_capsuleFormulaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaFormula"
    ADD CONSTRAINT "PmaFormula_capsuleFormulaId_fkey" FOREIGN KEY ("capsuleFormulaId") REFERENCES public."CapsuleFormula"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: PmaTestResult PmaTestResult_pmaBatchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."PmaTestResult"
    ADD CONSTRAINT "PmaTestResult_pmaBatchId_fkey" FOREIGN KEY ("pmaBatchId") REFERENCES public."PmaBatch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: RecoveryCode RecoveryCode_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."RecoveryCode"
    ADD CONSTRAINT "RecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: SecurityEvent SecurityEvent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."SecurityEvent"
    ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: StandardRequirement StandardRequirement_standardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."StandardRequirement"
    ADD CONSTRAINT "StandardRequirement_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES public."Standard"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: Standard Standard_marketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."Standard"
    ADD CONSTRAINT "Standard_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES public."Market"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: SupportRequest SupportRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."SupportRequest"
    ADD CONSTRAINT "SupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- Name: TestResult TestResult_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
\--

ALTER TABLE ONLY public."TestResult"
    ADD CONSTRAINT "TestResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


\--
\-- PostgreSQL database dump complete
\--

\unrestrict YV7eW4fcloAnvMXObrkSuUROPjLX1YVnmiELgJpvtHwE5dQfYUrmnd0UFlhwCEc
