-- ============================================================
-- SMART DINING SYSTEM — POSTGRESQL SCHEMA
-- Multi-tenant restaurant reservation, ordering & billing platform
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ------------------------------------------------------------
-- SUPER ADMIN
-- Only super admins can create new restaurant tenants (signup).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS super_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- RESTAURANTS (TENANTS)
-- Created only via super admin. Owner logs in — no self-signup.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurants (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        TEXT NOT NULL,
    address                     TEXT,
    email                       TEXT NOT NULL UNIQUE,
    phone                       TEXT,
    password_hash               TEXT NOT NULL,          -- primary owner login
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    avg_dining_duration_minutes INTEGER NOT NULL DEFAULT 60,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_super_admin_id   UUID REFERENCES super_admins(id)
);

-- ------------------------------------------------------------
-- RESTAURANT STAFF (owner + staff logins under one restaurant)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (restaurant_id, email)
);

-- ------------------------------------------------------------
-- TABLES (floor plan)
-- grid_row / grid_col make 4-directional adjacency checkable
-- for the merge algorithm.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number    TEXT NOT NULL,
    capacity        INTEGER NOT NULL CHECK (capacity > 0),
    grid_row        INTEGER NOT NULL,
    grid_col        INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'free'
                        CHECK (status IN ('free', 'occupied', 'reserved')),
    order_status    TEXT CHECK (order_status IN
                        ('seated', 'order_placed', 'food_served', 'checkout_in_progress')),
    seated_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (restaurant_id, table_number),
    UNIQUE (restaurant_id, grid_row, grid_col)
);

CREATE INDEX IF NOT EXISTS idx_tables_restaurant_status ON tables(restaurant_id, status);

-- ------------------------------------------------------------
-- RESERVATIONS
-- Covers instant, future, and staff-manually-created bookings.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT NOT NULL,                  -- required: SMS notifications
    group_size          INTEGER NOT NULL CHECK (group_size > 0),
    booking_type        TEXT NOT NULL CHECK (booking_type IN ('instant', 'future')),
    scheduled_time       TIMESTAMPTZ,                     -- set only for 'future' bookings
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN
                                ('pending', 'queued', 'confirmed', 'seated',
                                 'completed', 'cancelled')),
    is_vip              BOOLEAN NOT NULL DEFAULT false,
    created_by          TEXT NOT NULL DEFAULT 'customer'
                            CHECK (created_by IN ('customer', 'staff')),
    created_by_staff_id UUID REFERENCES restaurant_staff(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at        TIMESTAMPTZ,
    seated_at           TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_status ON reservations(restaurant_id, status);

-- ------------------------------------------------------------
-- RESERVATION <-> TABLES (junction — supports merged tables)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservation_tables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    table_id        UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    UNIQUE (reservation_id, table_id)
);

CREATE INDEX IF NOT EXISTS idx_reservation_tables_table ON reservation_tables(table_id);

-- ------------------------------------------------------------
-- WAITING QUEUE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS waiting_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id  UUID NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    priority_score  NUMERIC NOT NULL DEFAULT 0,
    is_vip          BOOLEAN NOT NULL DEFAULT false,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    status          TEXT NOT NULL DEFAULT 'waiting'
                        CHECK (status IN ('waiting', 'allocated', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_waiting_queue_restaurant_status_score
    ON waiting_queue(restaurant_id, status, priority_score DESC);

-- ------------------------------------------------------------
-- MENU
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    display_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    is_available    BOOLEAN NOT NULL DEFAULT true,
    image_url       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'placed'
                        CHECK (status IN
                            ('placed', 'preparing', 'served', 'completed', 'cancelled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_reservation ON orders(reservation_id);

CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(10,2) NOT NULL,
    notes           TEXT
);

-- ------------------------------------------------------------
-- BILLS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    subtotal        NUMERIC(10,2) NOT NULL,
    tax             NUMERIC(10,2) NOT NULL DEFAULT 0,
    total           NUMERIC(10,2) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'generated'
                        CHECK (status IN ('generated', 'paid')),
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at         TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
    customer_name   TEXT,
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);

-- ------------------------------------------------------------
-- SMS NOTIFICATIONS LOG
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
    phone           TEXT NOT NULL,
    message         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at         TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- AUDIT LOG
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_id      UUID NOT NULL REFERENCES super_admins(id),
    restaurant_id       UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    table_name          TEXT NOT NULL,
    record_id           UUID,
    action               TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    before_data         JSONB,
    after_data          JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_restaurant ON audit_log(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_super_admin ON audit_log(super_admin_id);
