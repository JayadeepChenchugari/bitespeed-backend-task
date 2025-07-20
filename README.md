Here’s a well-structured and professional `README.md` for your **Bitespeed Backend Task: Identity Reconciliation** project:

---

````markdown
# 🛠️ Bitespeed Backend Task: Identity Reconciliation

This project is a solution to the Bitespeed Backend Engineering Task focused on **Identity Reconciliation** — determining primary and secondary contact identities from user inputs (email and/or phone number).

---

## 📌 Problem Statement

The core challenge is to resolve multiple user records that may share one or more identifiers (email or phone number) into a **single, unified contact structure**. The service returns the primary contact along with all associated identifiers and secondary contact IDs.

---

## 🚀 Features

- Identify primary and secondary contact records based on new input.
- Merge and resolve multiple user identities.
- Handles partial or full overlap in email and phone numbers.
- Real-time resolution via a single API call.

---

## 📂 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Hosting:** Render
- **Environment Management:** dotenv

---

## 🔧 Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/JayadeepChenchugari/bitespeed-backend-task.git
cd bitespeed-backend-task
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the root and configure:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<host>:<port>/<db>"
PORT=10000
```

### 4. Run Migrations (if needed)

```bash
npx prisma db push
```

### 5. Start the Server

```bash
npm start
```

---

## 🧪 API Usage

### Endpoint: `POST /identify`

**Payload Examples:**

```json
{
  "email": "john@example.com"
}
```

or

```json
{
  "phoneNumber": "1234567890"
}
```

or both:

```json
{
  "email": "john@example.com",
  "phoneNumber": "1234567890"
}
```

### Response Structure:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["john@example.com", "john.alt@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## ✅ Testing

* Unit & Integration tests using **Jest**
* Tested with Render Health Check
* Fully compatible with Supabase PostgreSQL

---

## 🧠 Logic Summary

* When a contact is submitted:

  * If it doesn't exist → create a new **primary** contact.
  * If it partially exists → link it as **secondary** under the existing primary.
  * If both exist under different primaries → **merge** them into a single contact chain.

---

## 📎 Helpful Commands

* Generate Prisma client: `npx prisma generate`
* Push schema: `npx prisma db push`
* Start local server: `npm run dev`
* Deploy: Push to GitHub, auto-build on [Render](https://render.com/)

---

## 📬 Contact

**Developer:** Jayadeep Chenchugari
**GitHub:** [@JayadeepChenchugari](https://github.com/JayadeepChenchugari)
**Deployed URL:** [https://bitespeed-backend-task-qidi.onrender.com](https://bitespeed-backend-task-qidi.onrender.com)

---

## 📌 License

This project is licensed under the [MIT License](LICENSE).

```

---

Let me know if you want this in a downloadable `README.md` file or want me to push it to your GitHub repo directly.
```
