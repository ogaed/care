-- Organizations table
CREATE TABLE orgs (
    org_id                  SERIAL PRIMARY KEY,
    org_name                VARCHAR(50) NOT NULL UNIQUE,
    org_full_name           VARCHAR(120),
    details                 TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users/Entities table
CREATE TABLE entitys (
    entity_id               SERIAL PRIMARY KEY,
    org_id                  INTEGER NOT NULL REFERENCES orgs(org_id) ON DELETE CASCADE,
    entity_name             VARCHAR(120) NOT NULL,
    user_name               VARCHAR(120) NOT NULL UNIQUE,
    primary_email           VARCHAR(120),
    primary_telephone       VARCHAR(50),
    super_user              BOOLEAN DEFAULT FALSE NOT NULL,
    entity_password         VARCHAR(64) NOT NULL,
    first_password          VARCHAR(64) NOT NULL,
    role                    VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    firebase_uid            VARCHAR(255),
    details                 TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX entitys_org_id ON entitys (org_id);
CREATE INDEX entitys_user_name ON entitys (user_name);
CREATE INDEX entitys_firebase_uid ON entitys (firebase_uid);

-- Wallet table
CREATE TABLE wallets (
    wallet_id               SERIAL PRIMARY KEY,
    entity_id               INTEGER NOT NULL REFERENCES entitys(entity_id) ON DELETE CASCADE,
    org_id                  INTEGER NOT NULL REFERENCES orgs(org_id) ON DELETE CASCADE,
    balance                 DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    total_saved             DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    currency                VARCHAR(3) DEFAULT 'KSH',
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX wallets_entity_id ON wallets (entity_id);
CREATE INDEX wallets_org_id ON wallets (org_id);

-- Deposits/Transactions table
CREATE TABLE deposits (
    deposit_id              SERIAL PRIMARY KEY,
    wallet_id               INTEGER NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    entity_id               INTEGER NOT NULL REFERENCES entitys(entity_id) ON DELETE CASCADE,
    org_id                  INTEGER NOT NULL REFERENCES orgs(org_id) ON DELETE CASCADE,
    amount                  DECIMAL(10, 2) NOT NULL,
    transaction_type        VARCHAR(20) DEFAULT 'deposit' CHECK (transaction_type IN ('deposit', 'withdrawal', 'spending')),
    description             VARCHAR(255),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX deposits_wallet_id ON deposits (wallet_id);
CREATE INDEX deposits_entity_id ON deposits (entity_id);
CREATE INDEX deposits_created_at ON deposits (created_at);

-- Savings Goals table
CREATE TABLE savings_goals (
    goal_id                 SERIAL PRIMARY KEY,
    entity_id               INTEGER NOT NULL REFERENCES entitys(entity_id) ON DELETE CASCADE,
    org_id                  INTEGER NOT NULL REFERENCES orgs(org_id) ON DELETE CASCADE,
    goal_name               VARCHAR(255) NOT NULL,
    goal_amount             DECIMAL(10, 2) NOT NULL,
    amount_saved            DECIMAL(10, 2) DEFAULT 0.00,
    goal_type               VARCHAR(50) DEFAULT 'health',
    target_date             DATE,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX savings_goals_entity_id ON savings_goals (entity_id);
CREATE INDEX savings_goals_org_id ON savings_goals (org_id);

-- Expenses table
CREATE TABLE expenses (
    expense_id              SERIAL PRIMARY KEY,
    entity_id               INTEGER NOT NULL REFERENCES entitys(entity_id) ON DELETE CASCADE,
    org_id                  INTEGER NOT NULL REFERENCES orgs(org_id) ON DELETE CASCADE,
    goal_id                 INTEGER REFERENCES savings_goals(goal_id) ON DELETE SET NULL,
    amount                  DECIMAL(10, 2) NOT NULL,
    expense_category        VARCHAR(100),
    description             VARCHAR(255),
    expense_date            DATE NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX expenses_entity_id ON expenses (entity_id);
CREATE INDEX expenses_goal_id ON expenses (goal_id);
CREATE INDEX expenses_expense_date ON expenses (expense_date);

-- SMS Reminders table
CREATE TABLE sms_reminders (
    reminder_id             SERIAL PRIMARY KEY,
    entity_id               INTEGER NOT NULL REFERENCES entitys(entity_id) ON DELETE CASCADE,
    org_id                  INTEGER NOT NULL REFERENCES orgs(org_id) ON DELETE CASCADE,
    phone_number            VARCHAR(50) NOT NULL,
    reminder_frequency      VARCHAR(20) DEFAULT 'daily' CHECK (reminder_frequency IN ('daily', 'weekly', 'monthly')),
    reminder_type           VARCHAR(50) DEFAULT 'savings' CHECK (reminder_type IN ('savings', 'goal', 'expense')),
    last_sent_at            TIMESTAMP,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX sms_reminders_entity_id ON sms_reminders (entity_id);
CREATE INDEX sms_reminders_phone_number ON sms_reminders (phone_number);

-- Audit log table
CREATE TABLE audit_logs (
    log_id                  SERIAL PRIMARY KEY,
    entity_id               INTEGER REFERENCES entitys(entity_id) ON DELETE SET NULL,
    org_id                  INTEGER NOT NULL REFERENCES orgs(org_id) ON DELETE CASCADE,
    action                  VARCHAR(100) NOT NULL,
    details                 JSONB,
    ip_address              VARCHAR(50),
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX audit_logs_entity_id ON audit_logs (entity_id);
CREATE INDEX audit_logs_org_id ON audit_logs (org_id);
CREATE INDEX audit_logs_created_at ON audit_logs (created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER update_entitys_updated_at
BEFORE UPDATE ON entitys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at
BEFORE UPDATE ON savings_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update wallet balance on deposits
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'deposit' THEN
        UPDATE wallets
        SET balance = balance + NEW.amount,
            total_saved = total_saved + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE wallet_id = NEW.wallet_id;
    ELSIF NEW.transaction_type = 'withdrawal' THEN
        UPDATE wallets
        SET balance = balance - NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE wallet_id = NEW.wallet_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER update_wallet_on_deposit
AFTER INSERT ON deposits
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance();

-- Trigger to create wallet when user is created
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (entity_id, org_id, balance, total_saved)
    VALUES (NEW.entity_id, NEW.org_id, 0.00, 0.00);
    RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER create_wallet_on_user_insert
AFTER INSERT ON entitys
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_user();
