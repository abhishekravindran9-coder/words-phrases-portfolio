# Words & Phrases Portfolio

A full-stack personal language learning platform with spaced-repetition flashcard reviews, a vocabulary journal, progress analytics, and email reminders.

---

## Features

| Feature | Description |
|---|---|
| **Authentication** | JWT-based login & registration (bcrypt passwords) |
| **Dashboard** | Daily stats, upcoming reviews, and "word of the day" |
| **Vocabulary Manager** | Add/edit/delete words with definitions, examples, categories |
| **Spaced Repetition Reviews** | SM-2 algorithm — animated flip-card, 0–5 quality grades |
| **Progress Analytics** | Review activity bar chart, mastery doughnut chart, streak counter |
| **Journal** | Markdown-style diary entries with mood tracking and word tags |
| **Categories** | Colour-coded word groups with word-count aggregates |
| **Reminders** | Scheduled email reminders (daily or weekly, configurable time & days) |
| **Responsive UI** | Mobile-first, collapsible sidebar, Tailwind CSS |

---

## Tech Stack

### Backend
- Java 17, Spring Boot 3.2.4
- Spring Security (stateless JWT — HMAC-SHA256 via jjwt 0.11.5)
- Spring Data JPA / Hibernate
- Spring Mail + `@EnableScheduling` for email reminders
- PostgreSQL (H2 for tests)
- Lombok

### Frontend
- React 18, React Router 6
- Tailwind CSS 3.4 (custom primary palette + keyframe animations)
- Chart.js 4 / react-chartjs-2
- Axios (JWT interceptor + 401 redirect)
- react-hot-toast, @heroicons/react

---

## Getting Started

### 1 — Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.9+

### 2 — Database

```sql
CREATE DATABASE wordphrases;
```

### 3 — Backend configuration

Edit `backend/src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/wordphrases
spring.datasource.username=YOUR_USER
spring.datasource.password=YOUR_PASSWORD

# JWT (change in production — minimum 32 characters)
app.jwt.secret=CHANGE_ME_USE_A_LONG_RANDOM_STRING_IN_PRODUCTION
app.jwt.expiration=86400000

# CORS - frontend origin
app.cors.allowed-origin=http://localhost:3000

# Email (for reminders)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your@gmail.com
spring.mail.password=your_app_password
```

### 4 — Run the backend

```bash
cd backend
mvn spring-boot:run
# Server starts on http://localhost:8080
```

Hibernate will auto-create all tables on first run (`spring.jpa.hibernate.ddl-auto=update`).

### 5 — Run the frontend

```bash
cd frontend
npm install
npm start
# App opens on http://localhost:3000
```

---

## Project Structure

```
├── backend/
│   └── src/main/java/com/wordphrases/
│       ├── config/          # SecurityConfig, CorsConfig
│       ├── controller/      # REST controllers
│       ├── dto/
│       │   ├── request/     # Validated request bodies
│       │   └── response/    # API response DTOs
│       ├── exception/       # Custom exceptions + GlobalExceptionHandler
│       ├── model/           # JPA entities (User, Word, Review, …)
│       ├── repository/      # Spring Data JPA interfaces
│       ├── security/        # JwtTokenProvider, JwtAuthenticationFilter
│       └── service/         # Business logic
│
└── frontend/
    └── src/
        ├── components/
        │   ├── common/      # Layout, Sidebar, Navbar, Button, Input, Modal, …
        │   └── features/    # WordCard, Flashcard, ReviewChart, JournalEntryCard, …
        ├── context/         # AuthContext (user + token state)
        ├── pages/           # One file per route
        ├── services/        # Axios-backed API calls
        └── utils/           # constants.js, helpers.js
```

---

## API Reference

All endpoints (except auth) require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Obtain JWT |

### Words

| Method | Path | Description |
|---|---|---|
| GET | `/api/words?page=0&size=20&query=` | Paginated word list with optional search |
| POST | `/api/words` | Add a word |
| GET | `/api/words/{id}` | Get single word |
| PUT | `/api/words/{id}` | Update word |
| DELETE | `/api/words/{id}` | Delete word |

### Reviews

| Method | Path | Description |
|---|---|---|
| GET | `/api/reviews/due` | Words due for review today (SM-2) |
| POST | `/api/reviews` | Submit review result |

### Progress

| Method | Path | Description |
|---|---|---|
| GET | `/api/progress` | Analytics — streak, mastery, charts |

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Stats summary + upcoming reviews + daily highlight |

### Categories

| Method | Path | Description |
|---|---|---|
| GET | `/api/categories` | List all categories with word counts |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |

### Journal

| Method | Path | Description |
|---|---|---|
| GET | `/api/journal?page=0&size=10` | List journal entries |
| POST | `/api/journal` | Create entry |
| GET | `/api/journal/{id}` | Get entry |
| PUT | `/api/journal/{id}` | Update entry |
| DELETE | `/api/journal/{id}` | Delete entry |

### Reminders

| Method | Path | Description |
|---|---|---|
| GET | `/api/reminders` | List reminders |
| POST | `/api/reminders` | Create reminder |
| PUT | `/api/reminders/{id}` | Update reminder |
| DELETE | `/api/reminders/{id}` | Delete reminder |

---

## SM-2 Spaced Repetition

Reviews use a faithful implementation of the SuperMemo SM-2 algorithm (`ReviewService.applySM2`):

- Quality scores 0–2 reset the schedule (review again tomorrow)
- Quality 3–5 advance the interval: first repeat → 1 day, second → 6 days, subsequent → `interval × EF`
- Ease Factor updated: `EF' = EF + 0.1 - (5-q)(0.08 + (5-q)×0.02)`, minimum 1.3
- A word is marked **mastered** after 5 consecutive successful reviews

---

## Database Schema (key tables)

```
users          — id, username, email, password_hash, display_name, timezone
categories     — id, user_id, name, color, description
words          — id, user_id, category_id, word, definition, example_sentence
                 ease_factor, interval_days, repetitions, next_review_date, mastered
reviews        — id, word_id, user_id, review_date, quality, time_taken_seconds
journal_entries— id, user_id, title, content, mood, created_at
journal_words  — journal_entry_id, word_id  (join table)
reminders      — id, user_id, type, frequency, reminder_time, days_of_week, enabled
```

---

## License

MIT
