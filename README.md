# 🏦 CIM Bank — Credit Intelligence Mizan

CIM Bank (Credit Intelligence Mizan) is a modern digital banking platform built to simulate a real banking experience with secure customer onboarding, intelligent admin workflows, ATM operations, internal transfers, bill autopay, and project-based financing through Machrou3i.

---

## 🚀 Overview

CIM is a full-stack banking system built with:

- **Laravel** — backend logic, routes, database, mails, jobs, commands
- **Inertia.js + React** — SPA-style banking UI
- **Spatie Permissions** — role-based access control
- **SQLite / MySQL** — relational database
- **Leaflet.js** — ATM map and location experience
- **Laravel Scheduler** — recurring jobs such as bill autopay

The platform is designed around a realistic banking flow:

- Guest → register
- Customer → submit onboarding / verification request
- Staff → approve or reject
- Verified customer → access banking dashboard
- Staff → manage customers, ATM operations, and project financing requests

---

## ✨ Core Features

### 👤 Customer Banking

- Account opening / onboarding flow
- Customer profile and document upload
- Verified / pending / rejected access control
- Customer dashboard with:
  - balance
  - RIB / account number
  - bank card preview
  - latest transactions
  - account status
  - quick actions
- Internal transfers between CIM users
- Beneficiaries for transfers
- ATM locator with real cash status
- ATM withdrawals
- ATM cash deposits
- Bills & AutoPay
- Machrou3i project financing applications
- Exchange rates page
- Chat / banking assistant

### 🏢 Admin / Employee Operations

- Role-based access (Admin / Employee / Customer)
- Customers Dashboard
- Account opening verification
- Document review
- Appointment / attendance management
- Bank account creation and activation
- ATM operations:
  - load cash
  - stop / enable ATM
  - track withdrawals and deposits
- Machrou3i review workspace
- Audit logs for critical operations

---

## 🏧 ATM System

CIM includes a complete ATM management and cash flow simulation:

- ATM map with active branches / locations
- Real-time ATM status
- ATM cash tracking
- Admin cash loading
- Customer cash withdrawals
- Customer cash deposits
- ATM stop / maintenance mode
- Safe transaction checks:
  - cannot withdraw more than account balance
  - cannot withdraw more than ATM available cash
  - cannot deposit / withdraw if ATM is stopped

### ATM Cash Loop

ATM cash is updated dynamically:

- Admin loads cash → ATM cash increases
- Customer withdraws → ATM cash decreases
- Customer deposits → ATM cash increases

This keeps ATM cash balances consistent across all operations.

---

## 🔁 Internal Transfers

Customers can send money to other CIM users through a safe internal transfer flow:

- Add beneficiary
- Beneficiary validates instantly against active CIM accounts
- Beneficiary becomes active immediately if valid
- Transfer money to active beneficiaries
- Sender balance decreases
- Receiver balance increases
- Both sides receive transaction records
- Atomic transfer safety with DB transactions and row locks

---

## 💳 Beneficiaries

Beneficiaries are used to store trusted transfer targets:

- Full name
- RIB / account number
- bank name
- phone (optional)
- active / invalid validation

Important:
- No admin approval is needed anymore for internal CIM beneficiaries
- Valid beneficiaries are activated instantly
- Invalid or duplicate beneficiaries are rejected safely

---

## 🧾 Bills & AutoPay

Customers can manage recurring bills and subscriptions:

- Water / electricity
- WiFi / internet
- School fees
- Phone bills
- Subscriptions

### AutoPay features

- Manual bill payment
- Recurring AutoPay
- Reminder email before payment
- Automatic payment when due
- Minimum balance protection
- Failed payment handling
- Payment history tracking

The scheduler processes due bills automatically.

---

## 🧠 Machrou3i

Machrou3i is a project financing workspace for salaried customers who want to start a small or medium business.

### Customer flow

- Employment and salary details
- Salary proof upload
- Project idea and financial expectations
- Preliminary risk preview
- Submit application
- Track status and offers

### Admin flow

- Review applicant dossier
- Inspect salary proof
- Review salary, account balance, transactions, and obligations
- Calculate risk level
- Pre-approve full amount
- Pre-approve lower amount
- Reject
- Request more documents

### Important

Machrou3i v1 is review-based only.

It does **not** disburse money to the customer balance yet.

---

## 💱 Exchange Rates

CIM includes exchange rate fetching and conversion support.

- Fetch latest exchange rates from the configured provider
- Store rates locally
- Use USD base conversion logic
- Show exchange rates in the customer dashboard and exchange page

Command:

```bash
php artisan exchange-rates:fetch

## 🌐 Live Demo

You can test CIM Bank directly online without installation:

👉 https://cim-bank-production.up.railway.app

### 🧪 Testing Tips

- Use a **demo account** or create a new one
- Complete onboarding to access full features
- Test core modules:
  - ATM withdrawals & deposits
  - Internal transfers
  - Bills & AutoPay
  - Machrou3i application
- Admin features require a seeded/admin account

⚠️ Note:
This is a demo environment. Data may be reset periodically.

## 🔑 Demo Accounts
| Role | Email | Password |
 | Role | -----------------Email--------------------------- | Password |
| Admin | [admin@cim.test](mailto:admin@example.com) | Password123! |
| Employee | [employee@cim.test](mailto:employee@example.com) | Password123! |
| Customer | [customer@cim.test](mailto:customer@example.com) | Password123! |
