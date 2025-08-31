-- Facts table
CREATE TABLE IF NOT EXISTS facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR NOT NULL CHECK (
        type IN (
            'number',
            'string',
            'boolean',
            'list'
        )
    ),
    options JSONB,
    json_definition JSONB,
    dynamic BOOLEAN DEFAULT FALSE,
    dynamic_config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Outcomes table
CREATE TABLE IF NOT EXISTS outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    type VARCHAR NOT NULL,
    params JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR NOT NULL,
    description TEXT,
    json_conditions JSONB NOT NULL,
    event_id UUID REFERENCES outcomes (id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test Cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    rule_id UUID REFERENCES rules (id),
    name VARCHAR,
    input_facts JSONB NOT NULL,
    expected_output JSONB,
    actual_output JSONB,
    last_run_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);