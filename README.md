# ChronoPlate

An elegant and illustrative meal tracking application to log and review your daily nutrition with ease.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/arnondb/meal-tracker)

ChronoPlate is a visually stunning and whimsical meal tracking application designed with a human-centered aesthetic. It allows users to effortlessly log their daily meals, including descriptions, types, and specific date/time. The core experience is centered around a beautiful dashboard that provides an at-a-glance view of the day's meals.

## ✨ Key Features

- **Effortless Meal Logging**: Quickly log meal descriptions, types, and the exact date and time.
- **Illustrative Dashboard**: A beautiful, chronological view of your daily meals.
- **Seamless UX**: Add or edit meals using an elegant slide-in panel, with no jarring page reloads.
- **Flexible Meal Types**: Choose from pre-set meal types like 'Breakfast' or 'Lunch', or enter a custom type.
- **Simple Management**: Easily delete meal entries with a smooth, animated confirmation process.
- **Robust & Serverless**: Built on a modern Cloudflare architecture, ensuring your data is persistent and always available.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, Zustand, Framer Motion, React Hook Form
- **Backend**: Hono on Cloudflare Workers
- **Database**: Cloudflare Durable Objects
- **Language**: TypeScript

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following tools installed:

- [Bun](https://bun.sh/) (v1.0 or higher)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare's CLI tool)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd chronoplate
    ```

2.  **Install dependencies:**
    The project uses Bun for package management.
    ```sh
    bun install
    ```

## 💻 Development

To start the local development server, which includes both the Vite frontend and the local Wrangler server for the backend, run:

```sh
bun dev
```

This will start the application, typically on `http://localhost:3000`. The frontend will automatically proxy API requests to the worker backend.

## ☁️ Deployment

This application is designed for easy deployment to Cloudflare's global network.

1.  **Login to Cloudflare:**
    If you haven't already, authenticate Wrangler with your Cloudflare account.
    ```sh
    wrangler login
    ```

2.  **Deploy the application:**
    Run the deploy script to build the application and deploy it to your Cloudflare account.
    ```sh
    bun deploy
    ```

Alternatively, you can deploy your own version of this project with a single click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/arnondb/meal-tracker)

## 📂 Project Structure

The codebase is organized into three main directories:

-   `src/`: Contains the entire frontend React application, including pages, components, hooks, and utility functions.
-   `worker/`: Contains the Hono backend application that runs on Cloudflare Workers, including API routes and entity definitions for Durable Objects.
-   `shared/`: Contains TypeScript types and interfaces that are shared between the frontend and the backend to ensure type safety.