-- CONTAINER: Database [Container: PostgreSQL]
-- PURPOSE: Defines the CMS shared-schema multi-tenant data model according to ERD design

-- ENUM TYPES
CREATE TYPE user_role AS ENUM(
    'Consumer', 
    'Agent', 
    'Support Person', 
    'Manager', 
    'Admin'
);

CREATE TYPE complaint_status AS ENUM(
    'Submitted', 
    'In Progress', 
    'Resolved', 
    'Closed'
);

CREATE TYPE complaint_category AS ENUM(
    'Account Access', 'Transaction Issues', 'Fraudulent Activity','Card Services', 
    'Online Banking', 'Mobile App','Customer Service', 'Billing & Payments', 'General'
);

CREATE TYPE audit_event_type AS ENUM(
    'COMPLAINT_SUBMITTED', 
    'STATUS_UPDATED',
    'COMPLAINT_ASSIGNED', 
    'AUTH_FAILED', 
    'AUTH_SUCCESS'
);


-- TABLES according to ERD design 
CREATE TABLE tenants (
    tenant_id SERIAL PRIMARY KEY,
    tenant_name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    logo VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_type user_role NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE complaints (
    complaint_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,  -- tenant_id on complaints for row-level multi-tenancy isolation
    consumer_id INT NOT NULL REFERENCES users(user_id),
    assigned_agent_id INT REFERENCES users(user_id),
    complaint_status complaint_status NOT NULL DEFAULT 'Submitted',
    category complaint_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    complaint_description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP, -- nullable & only set when status reaches 'Resolved'
    updated_at TIMESTAMP
);

CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    complaint_id INT REFERENCES complaints(complaint_id) ON DELETE SET NULL,
    user_id INT NOT NULL REFERENCES users(user_id),
    event_type audit_event_type NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT NOW(),
    payload JSON -- stores event specific JSON e.g. old/new status for audit trail
);


