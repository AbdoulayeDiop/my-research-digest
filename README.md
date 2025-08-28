# My Research Digest

## 📚 Project Overview

"My Research Digest" is a comprehensive application designed to help users stay updated with the latest research in their fields of interest. It automates the process of discovering, analyzing, and summarizing research papers, delivering personalized newsletters directly to users.

The application consists of a React-based frontend, a Node.js backend for user and newsletter management, and a Python backend for research paper searching, analysis, and newsletter generation.

## ✨ Features

*   **Personalized Newsletters:** Users can create newsletters on specific topics.
*   **Automated Paper Discovery:** The Python backend automatically searches for new research papers using the Semantic Scholar API.
*   **AI-Powered Analysis:** Papers are analyzed and summarized using AI (via OpenAI's GPT models) to extract key insights and usefulness.
*   **Newsletter Generation:** Automatically compiles analyzed papers into well-structured newsletter issues.
*   **Email Delivery:** Delivers new newsletter issues directly to users' inboxes.
*   **User Authentication:** Secure user management via Auth0.
*   **Admin Dashboard:** (Implied) Functionality for managing newsletters and users.

## 🚀 Technologies Used

*   **Frontend:**
    *   React (with Vite)
    *   TypeScript
    *   Tailwind CSS
    *   Auth0 (for authentication)
    *   React Router DOM
*   **Backend (Node.js):**
    *   Express.js
    *   MongoDB (for data storage)
    *   Mongoose (ODM)
*   **Backend (Python):**
    *   Python 3
    *   Langchain (for AI integration)
    *   OpenAI API (for paper analysis and summarization)
    *   Requests (for API interactions)
    *   Semantic Scholar API (for paper search)
    *   SMTP (for email sending)
*   **Containerization:** Docker, Docker Compose
*   **Web Server:** Nginx
*   **SSL/TLS:** Certbot

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

*   [Git](https://git-scm.com/)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Engine and Docker Compose)
*   [Node.js](https://nodejs.org/en/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   [Python 3](https://www.python.org/downloads/)
*   [pip](https://pip.pypa.io/en/stable/installation/) (comes with Python 3)

## ⚙️ Getting Started

Follow these steps to set up and run the application locally.

### 1. Clone the Repository

```bash
git clone https://github.com/AbdoulayeDiop/my-research-digest.git
cd my-research-digest
```

### 2. Environment Variables Setup

Create `.env` files for both the root and the backend services.

#### Root `.env`

Create a `.env` file in the root directory of the project (`my-research-digest/`) with the following content:

```dotenv
# Node.js Backend API URL (used by Python backend)
NODE_API_BASE_URL=http://localhost:5000

# Frontend Application Domain (used for email links)
APP_DOMAIN=http://localhost:5173

# Auth0 Configuration (for frontend)
VITE_AUTH0_DOMAIN=your_auth0_domain
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_REDIRECT_URI=http://localhost:5173

# SMTP Configuration (for Python backend to send emails)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SENDER_NAME="My Research Digest"

# OpenAI API Key (for Python backend analysis)
OPENAI_API_KEY=your_openai_api_key
```

**Note:** Replace placeholder values (`your_auth0_domain`, `your_openai_api_key`, etc.) with your actual credentials. For `VITE_AUTH0_REDIRECT_URI`, ensure it matches the callback URL configured in your Auth0 application.

#### Backend Python `prod.env`

The `backend-python` service uses a `prod.env` file for its environment variables. This file is already present but ensure it contains the necessary variables for production deployment if you were to deploy it. For local development, the variables in the root `.env` are sufficient as they are passed to the Docker containers.

### 3. Build and Run with Docker Compose

Navigate to the root of your project and run Docker Compose to build and start all services:

```bash
docker-compose -f docker-compose-dev.yml up --build
```

This command will:
*   Build Docker images for the Node.js backend, Python backend, and frontend.
*   Start the MongoDB database.
*   Start the Node.js backend.
*   Start the Python backend (which runs the daily newsletter generation cycle).
*   Start the Nginx web server to serve the frontend.

### 4. Access the Application

Once all services are up and running (this might take a few minutes on the first run), you can access the frontend application in your web browser at:

```
http://localhost:5173
```

## 💡 Usage

*   **Frontend:** Interact with the web interface to create newsletters, view issues, and manage your account.
*   **Python Backend:** The Python backend runs in the background, automatically searching for papers, analyzing them, generating newsletters, and sending emails based on the configured schedule (daily).

## 📂 Project Structure

```
.
├── .gitignore
├── docker-compose-dev.yml       # Docker Compose for development
├── docker-compose.yml           # Docker Compose for production (if applicable)
├── backend-node/                # Node.js Express backend
│   ├── src/                     # Node.js source code
│   ├── package.json             # Node.js dependencies
│   └── ...
├── backend-python/              # Python backend for paper processing
│   ├── api_client.py            # API client for Node.js backend
│   ├── analyser.py              # AI-powered paper analysis
│   ├── paper_search.py          # Semantic Scholar integration
│   ├── writer.py                # Newsletter content generation
│   ├── send_email.py            # Email sending utility
│   ├── main.py                  # Main entry point for daily job
│   ├── requirements.txt         # Python dependencies
│   └── ...
├── certbot/                     # Certbot configuration for SSL
├── frontend/                    # React TypeScript frontend
│   ├── public/                  # Static assets
│   ├── src/                     # React source code
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── App.tsx              # Main React application component
│   │   ├── main.tsx             # React entry point
│   │   └── ...
│   ├── index.html               # Main HTML file
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── vite.config.ts           # Vite build configuration
│   └── ...
└── nginx/                       # Nginx web server configuration
    └── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
