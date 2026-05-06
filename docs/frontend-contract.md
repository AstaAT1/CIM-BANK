# Frontend Contract

This document is the backend/frontend handoff for the Laravel + React + Inertia banking app.

The goal of this phase is the normal banking foundation only:

- customer profile
- account opening request
- appointment booking
- document upload/review
- bank account display
- transactions
- beneficiaries
- transfers
- audit logs

Credit intelligence is out of scope for now.

## Demo Login Accounts

Use these demo accounts in the UI when they exist in seed data:

- `admin@example.com`
- `employee@example.com`
- `customer@example.com`
- `test@example.com`

Password: `password` if the environment uses the default Laravel factory password.

Current note:

- `test@example.com` is seeded in the current backend seeders.
- The other demo accounts are part of the intended frontend contract and may be added by backend seed data next.

## Roles

- `admin`: full access, including users, employees, roles, permissions, and all banking operations
- `employee`: bank staff operations
- `customer`: customer area only

## Status Reference

Account opening request statuses:

- `draft`
- `submitted`
- `appointment_scheduled`
- `under_review`
- `approved`
- `rejected`
- `account_created`

Appointment statuses:

- `scheduled`
- `completed`
- `cancelled`
- `missed`
- `rescheduled`

Document statuses:

- `pending`
- `approved`
- `rejected`

Bank account statuses:

- `active`
- `pending`
- `frozen`
- `closed`

Transfer statuses:

- `pending`
- `processing`
- `completed`
- `failed`
- `cancelled`
- `rejected`

## Backend Responsibility

React pages should only display props, render status/state, and submit forms.

Frontend must not calculate or decide:

- account balances
- transfer completion
- account creation
- credit decisions
- approval/rejection business rules

Backend owns all banking logic, validation, authorization, state transitions, and final write operations.

## Customer Routes

### `/customer/dashboard`

- Purpose: customer home screen with profile/account/request summary
- Expected Inertia page: `customer/dashboard`
- Main props:
- `auth.user`
- `profile`
- `accounts`
- `recentTransactions`
- `pendingAccountOpeningRequest`
- `upcomingAppointment`
- `beneficiariesCount`
- `transfersSummary`
- Important statuses:
- account opening request statuses
- appointment statuses
- bank account statuses

### `/customer/profile`

- Purpose: customer identity and personal banking profile
- Expected Inertia page: `customer/profile`
- Main props:
- `auth.user`
- `profile`
- `profileStatuses`
- `validationRules` if needed for form hints
- Important statuses:
- customer profile status is currently stored as string values such as `pending`, `verified`, `rejected`, `blocked`

### `/customer/account-opening`

- Purpose: create, review, and track account opening request
- Expected Inertia page: `customer/account-opening/index`
- Main props:
- `auth.user`
- `profile`
- `branches`
- `request`
- `requestHistory`
- `requiredDocumentTypes`
- `appointment`
- Important statuses:
- `draft`
- `submitted`
- `appointment_scheduled`
- `under_review`
- `approved`
- `rejected`
- `account_created`

### `/customer/documents`

- Purpose: upload and track customer documents
- Expected Inertia page: `customer/documents/index`
- Main props:
- `auth.user`
- `documents`
- `documentTypes`
- `activeRequest`
- `uploadLimits`
- Important statuses:
- `pending`
- `approved`
- `rejected`

### `/customer/appointments`

- Purpose: view and manage branch appointments related to account opening
- Expected Inertia page: `customer/appointments/index`
- Main props:
- `auth.user`
- `appointments`
- `branches`
- `activeRequest`
- Important statuses:
- `scheduled`
- `completed`
- `cancelled`
- `missed`
- `rescheduled`

### `/customer/accounts`

- Purpose: list customer bank accounts
- Expected Inertia page: `customer/accounts/index`
- Main props:
- `auth.user`
- `accounts`
- `accountsSummary`
- Important statuses:
- `active`
- `pending`
- `frozen`
- `closed`

### `/customer/transactions`

- Purpose: account transaction history
- Expected Inertia page: `customer/transactions/index`
- Main props:
- `auth.user`
- `accounts`
- `selectedAccount`
- `transactions`
- `filters`
- pagination props such as `page`, `perPage`, `total`
- Important statuses:
- transaction records are mostly display-oriented
- related account status may still affect available actions

### `/customer/beneficiaries`

- Purpose: manage saved transfer beneficiaries
- Expected Inertia page: `customer/beneficiaries/index`
- Main props:
- `auth.user`
- `beneficiaries`
- `beneficiaryStatuses`
- Important statuses:
- beneficiary status is currently stored as string values such as `pending`, `active`, `blocked`

### `/customer/transfers`

- Purpose: create and track transfer requests
- Expected Inertia page: `customer/transfers/index`
- Main props:
- `auth.user`
- `accounts`
- `beneficiaries`
- `transferRequests`
- `fees`
- `limits`
- Important statuses:
- `pending`
- `processing`
- `completed`
- `failed`
- `cancelled`
- `rejected`

## Admin Routes

### `/admin/dashboard`

- Purpose: admin overview of operational activity
- Expected Inertia page: `admin/dashboard`
- Main props:
- `auth.user`
- `stats`
- `recentAccountOpeningRequests`
- `recentTransfers`
- `recentDocuments`
- `upcomingAppointments`
- `auditSummary`
- Important statuses:
- request statuses
- document statuses
- appointment statuses
- transfer statuses

### `/admin/customers`

- Purpose: customer management list
- Expected Inertia page: `admin/customers/index`
- Main props:
- `auth.user`
- `customers`
- `filters`
- pagination props
- summary counts by profile status if available
- Important statuses:
- customer profile status values such as `pending`, `verified`, `rejected`, `blocked`

### `/admin/customers/{user}`

- Purpose: customer detail page across profile, requests, documents, accounts, and beneficiaries
- Expected Inertia page: `admin/customers/show`
- Main props:
- `auth.user`
- `customer`
- `profile`
- `accountOpeningRequests`
- `documents`
- `accounts`
- `beneficiaries`
- `appointments`
- `auditLogs`
- Important statuses:
- request statuses
- document statuses
- account statuses
- appointment statuses

### `/admin/account-opening-requests`

- Purpose: operational review queue for account opening requests
- Expected Inertia page: `admin/account-opening-requests/index`
- Main props:
- `auth.user`
- `requests`
- `branches`
- `filters`
- pagination props
- Important statuses:
- `draft`
- `submitted`
- `appointment_scheduled`
- `under_review`
- `approved`
- `rejected`
- `account_created`

### `/admin/account-opening-requests/{request}`

- Purpose: review one account opening request in detail
- Expected Inertia page: `admin/account-opening-requests/show`
- Main props:
- `auth.user`
- `request`
- `customer`
- `profile`
- `branch`
- `documents`
- `appointment`
- `reviewActions`
- Important statuses:
- `draft`
- `submitted`
- `appointment_scheduled`
- `under_review`
- `approved`
- `rejected`
- `account_created`

### `/admin/documents`

- Purpose: review uploaded customer documents
- Expected Inertia page: `admin/documents/index`
- Main props:
- `auth.user`
- `documents`
- `filters`
- `documentTypes`
- pagination props
- Important statuses:
- `pending`
- `approved`
- `rejected`

### `/admin/appointments`

- Purpose: branch appointment management
- Expected Inertia page: `admin/appointments/index`
- Main props:
- `auth.user`
- `appointments`
- `branches`
- `filters`
- pagination props
- Important statuses:
- `scheduled`
- `completed`
- `cancelled`
- `missed`
- `rescheduled`

### `/admin/accounts`

- Purpose: bank account operations and status tracking
- Expected Inertia page: `admin/accounts/index`
- Main props:
- `auth.user`
- `accounts`
- `filters`
- pagination props
- Important statuses:
- `active`
- `pending`
- `frozen`
- `closed`

### `/admin/transfers`

- Purpose: transfer request monitoring and processing
- Expected Inertia page: `admin/transfers/index`
- Main props:
- `auth.user`
- `transferRequests`
- `filters`
- pagination props
- `accounts` if needed for drill-down
- `beneficiaries` if needed for drill-down
- Important statuses:
- `pending`
- `processing`
- `completed`
- `failed`
- `cancelled`
- `rejected`

### `/admin/audit-logs`

- Purpose: operational audit trail
- Expected Inertia page: `admin/audit-logs/index`
- Main props:
- `auth.user`
- `auditLogs`
- `filters`
- pagination props
- Important statuses:
- audit logs do not currently use a separate status field

### `/admin/users`

- Purpose: admin user and role management
- Expected Inertia page: `admin/users/index`
- Main props:
- `auth.user`
- `users`
- `roles`
- `permissions`
- `filters`
- pagination props
- Important statuses:
- no dedicated status field required by current backend contract

## Prop Shape Guidance

Backend responses should prefer simple, explicit payloads over frontend-derived joins.

Examples:

- `profile`: customer profile record or `null`
- `accounts`: array of bank accounts
- `transactions`: paginated transaction list for one account or filtered customer accounts
- `documents`: array or paginated list with uploader, request link, and review fields
- `request`: one account opening request object
- `appointment`: one appointment object or `null`
- `auditLogs`: paginated log list with `user`, `action`, `model_type`, `model_id`, `description`, `ip_address`, `created_at`

## Suggested Page Mapping

The current repo uses lowercase Inertia page names such as `dashboard` and `settings/profile`.

Continue with that convention:

- `resources/js/pages/customer/...`
- `resources/js/pages/admin/...`

Examples:

- `/customer/dashboard` -> `customer/dashboard.tsx`
- `/customer/accounts` -> `customer/accounts/index.tsx`
- `/admin/customers/{user}` -> `admin/customers/show.tsx`
- `/admin/account-opening-requests` -> `admin/account-opening-requests/index.tsx`
