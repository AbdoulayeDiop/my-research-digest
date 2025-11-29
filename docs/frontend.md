# Frontend Application

The frontend of My Research Digest is a modern single-page application (SPA) built with **React** and **Vite**. It uses **TypeScript** for type safety and is styled with **Tailwind CSS** and a custom set of reusable components from **shadcn/ui**.

## Tech Stack

-   **Framework**: [React](https://reactjs.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
-   **HTTP Client**: [Axios](https://axios-http.com/)

## Project Structure

The frontend code is located in the `frontend/src` directory.

```
frontend/src
├── components/         # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AddNewsletterDialog.tsx
│   ├── Dashboard.tsx
│   ├── IssueDetail.tsx
│   ├── LandingPage.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   └── useUserSync.ts
├── lib/                # Library configurations and utilities
│   └── axios.ts
├── App.tsx             # Main application component with routing
└── main.tsx            # Application entry point
```

## Core Components

The application is structured around a set of core components that provide the user interface and functionality.

### Landing Page & Marketing

-   `LandingPage.tsx`: The main landing page for new users.
-   `HeroSection.tsx`, `BenefitsSection.tsx`, `FeaturesDeepDiveSection.tsx`: Components that make up the marketing content of the landing page.

### Authentication

-   `AuthPage.tsx`: The page where users can log in or sign up. Authentication is handled via Auth0.
-   `ProtectedRoute.tsx`: A higher-order component that protects routes that require authentication.

### User Dashboard

-   `Dashboard.tsx`: The main dashboard for authenticated users. It displays the user's newsletters.
-   `AdminDashboard.tsx`: A special dashboard for admin users with additional functionalities.
-   `NewsletterCard.tsx`: A card component to display a summary of a single newsletter.
-   `AddNewsletterDialog.tsx`: A dialog for creating new newsletters.

### Newsletter and Issues

-   `IssuesList.tsx`: Displays a list of all issues for a given newsletter.
-   `IssueDetail.tsx`: Renders the full content of a single newsletter issue in Markdown format.

## State Management

The application uses a combination of React's built-in state management (`useState`, `useContext`) and custom hooks for managing application-wide state.

-   **User State**: User authentication and profile information are managed through the `useUserSync.ts` hook, which syncs the user's data with the backend.
-   **Component State**: Most components manage their own state using `useState`.
-   **API Data**: Data fetched from the backend is typically managed within the component that needs it, using `useEffect` and `useState` to handle loading, data, and error states.

## API Communication

All communication with the Node.js backend is handled by an **Axios** instance configured in `lib/axios.ts`. This instance is pre-configured with the base URL of the API and handles request interceptors for attaching authentication tokens.
