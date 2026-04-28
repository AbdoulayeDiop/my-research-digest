# Node.js Backend

The Node.js backend is the central API for My Research Digest. Built with **Express.js** and **MongoDB**, it handles user data, newsletters, issues, papers, and provides the interface used by both the frontend and the Python worker.

## Tech Stack

- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: [Auth0](https://auth0.com/) — JWT validation via `express-oauth2-jwt-bearer`
- **Email**: Nodemailer (newsletter confirmation, announcements)

## Project Structure

```
backend-node/src
├── controllers/
│   ├── userController.js
│   ├── newsletterController.js
│   ├── issueController.js
│   ├── paperController.js
│   ├── publicController.js       # Unauthenticated email actions
│   └── announcementController.js # Admin broadcast emails
├── middleware/
│   ├── authMiddleware.js          # JWT validation (Auth0)
│   └── adminMiddleware.js         # Admin or Python backend check
├── models/
│   ├── User.js
│   ├── Newsletter.js
│   ├── Issue.js
│   ├── Paper.js
│   ├── Reading.js                 # Tracks per-user read status per issue
│   └── SavedPaper.js
├── routes/
│   ├── users.js
│   ├── newsletters.js
│   ├── issues.js
│   ├── papers.js
│   ├── public.js                  # Unauthenticated routes
│   └── announcements.js
└── server.js
```

## API Endpoints

All routes are prefixed with `/api/`. Protected routes require a valid Auth0 JWT in the `Authorization` header. Routes marked **admin** require the caller to be either the Python M2M client or a user whose email is in `ADMIN_EMAILS`.

### Users — `/api/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/count` | admin | Total user count |
| GET | `/active-count` | admin | Users active in last 7 days |
| GET | `/with-newsletter-count` | admin | All users with newsletter counts |
| GET | `/:id` | admin | Get user by MongoDB ID |
| DELETE | `/:id` | user | Delete own account and all associated data |

### Newsletters — `/api/newsletters`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | Get authenticated user's newsletters |
| POST | `/` | user | Create a newsletter |
| GET | `/all` | admin | Get all newsletters |
| GET | `/count` | admin | Total newsletter count |
| GET | `/overdue` | admin | Active newsletters not run in 7+ days |
| GET | `/:id` | user | Get newsletter by ID |
| PUT | `/:id` | user | Update newsletter settings |
| DELETE | `/:id` | user | Delete newsletter and all its data |
| POST | `/:id/reset-last-search` | admin | Queue newsletter for next worker run |
| POST | `/:id/test-search` | user | Run a test paper search with current settings |

### Issues — `/api/issues`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | Get all issues for authenticated user |
| POST | `/` | user/backend | Create an issue |
| GET | `/count` | admin | Total issue count |
| GET | `/byNewsletterId/:id` | user | Get issues for a newsletter |
| GET | `/byNewsletterId/:id/consecutive-unread/:userId` | admin | Count consecutive unread issues |
| GET | `/:id` | user | Get issue by ID |
| PUT | `/:id` | user | Update issue |
| DELETE | `/:id` | user | Delete issue |
| PUT | `/:id/read` | user | Toggle read status |
| GET | `/:id/readStatus` | user | Get read status for authenticated user |
| GET | `/:id/paperCount` | user | Paper count for an issue |

### Papers — `/api/papers`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | backend | Create papers (batch) |
| GET | `/count` | admin | Total paper count |
| GET | `/byIssueId/:id` | user | Get papers for an issue |
| PUT | `/:id/feedback` | user | Submit like/dislike/heart feedback |
| POST | `/save` | user | Save a paper to personal library |
| DELETE | `/saved/:id` | user | Remove a saved paper |
| GET | `/saved` | user | Get all saved papers |

### Announcements — `/api/announcements`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/send` | admin | Send an HTML email to all users. Supports `{{name}}` placeholder. Returns `{ total, sent, failed }`. |

### Public (no auth) — `/api/public/issues`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/:issueId/mark-as-read` | Records a Reading entry via HMAC-signed URL (from email) |
| GET | `/:issueId/feedback` | Records issue rating (`useful`/`not_useful`) via HMAC-signed URL (from email) |

## Database Models

### `User`
Stores Auth0 identity (`auth0Id`), email, name, and `lastLoginAt`.

### `Newsletter`
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | Owner |
| `topic` | String | |
| `description` | String | |
| `status` | String | `active` / `inactive` |
| `queries` | [String] | AI-generated search queries |
| `rankingStrategy` | String | `author_based` / `embedding_based` |
| `filters` | Object | venues, publicationTypes, minCitationCount, openAccessPdf |
| `lastSearch` | Date | Set at start of each worker run |
| `inactivityWarningSentAt` | Date | Set when a 3-issue unread warning is sent; cleared on re-engagement |

### `Issue`
| Field | Type | Notes |
|-------|------|-------|
| `newsletterId` | ObjectId | |
| `title` | String | |
| `publicationDate` | Date | |
| `summary` | String | |
| `introduction` | String | |
| `conclusion` | String | |
| `contentMarkdown` | String | |
| `status` | String | `published` / `draft` |
| `rating` | String | `useful` / `not_useful` / null — set via email feedback link |

### `Paper`
Stores title, authors, abstract, URL, venue, publication date, citation score, and AI-generated `synthesis` and `usefulness` fields. Also stores user feedback (`like`, `dislike`, `heart`).

### `Reading`
Junction model: `userId` + `issueId` + `readAt`. Used to track per-user read status and to compute consecutive unread counts for inactivity management.

### `SavedPaper`
Links a `userId` to a `paperId` for the personal saved-papers library.

## Authentication

- **Frontend → Node.js**: Auth0 JWTs validated by `express-oauth2-jwt-bearer` on all protected routes.
- **Python → Node.js**: Auth0 M2M client credentials flow. The Python service obtains a token and the `adminOrBackendCheck` middleware grants access when the JWT `sub` matches `AUTH0_PYTHON_CLIENT_ID`.
- **Email actions (public)**: HMAC-SHA256 signed URLs (`URL_SIGNATURE_SECRET`). The signature covers `issueId + userId` (mark-as-read) or `issueId + userId + rating` (feedback) to prevent tampering.
