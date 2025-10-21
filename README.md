# SubScribe - Full Stack SaaS Subscription App (Server)

This repository contains the **back-end server** for the SubScribe application. It is a robust Node.js API built with Express, TypeScript, and Prisma, designed to handle authentication, billing, and real-time communication.

➡️ **[Link to the Front-end Client Repository](https://github.com/RoRoberto94/saas-subscription-client)**

---

## 🏛️ Architecture

This server follows a clean, scalable architecture pattern, separating concerns into distinct layers:

- **Routes:** Define the API endpoints.
- **Controllers:** Handle incoming HTTP requests and responses.
- **Services:** Contain the core business logic.
- **Middlewares:** Used for cross-cutting concerns like authentication, authorization (RBAC), and validation.
- **Prisma:** Acts as the Object-Relational Mapper (ORM) for database interactions with PostgreSQL.

A simple diagram of the full application architecture:

![Application Architecture](https://github.com/RoRoberto94/saas-subscription-server/blob/main/docs/architecture-diagram.png?raw=true)

---

## ✨ Features

- **RESTful API:** A well-structured API for managing users, authentication, and billing.
- **Secure Authentication:** JWT-based authentication with password hashing (bcrypt).
- **Role-Based Access Control:** `isAuthenticated` and `isAdmin` middlewares to protect routes.
- **Stripe Integration:**
  - Manages Stripe Customer creation.
  - Creates Stripe Checkout Sessions for new subscriptions.
  - Provides a secure endpoint for the Stripe Customer Portal.
  - Handles Stripe webhooks to keep the database in sync with billing events (`checkout.session.completed`, `customer.subscription.updated`, etc.).
- **Real-time Communication:** A Socket.IO server that pushes real-time notifications to clients upon subscription events.
- **Type-Safe Code:** Built entirely with TypeScript, using Zod for validation and Prisma for type-safe database queries.
- **Integration Testing:** API endpoints are tested with Jest and Supertest to ensure reliability.

---

## 🛠️ Tech Stack

| Category         | Technology                                                                                                                                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**         | ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white) |
| **Database**     | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?logo=prisma&logoColor=white)                                                                                          |
| **Auth/Billing** | ![JWT](https://img.shields.io/badge/-JWT-000000?logo=jsonwebtokens&logoColor=white) ![Stripe](https://img.shields.io/badge/-Stripe-626CD9?logo=stripe&logoColor=white)                                                                                                     |
| **Real-time**    | ![Socket.IO](https://img.shields.io/badge/-Socket.IO-010101?logo=socket.io&logoColor=white)                                                                                                                                                                                |
| **Testing**      | ![Jest](https://img.shields.io/badge/-Jest-C21325?logo=jest&logoColor=white) ![Supertest](https://img.shields.io/badge/-Supertest-E33332)                                                                                                                                  |

---

## ⚙️ Running Locally

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/RoRoberto94/saas-subscription-server.git
    cd saas-subscription-server
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up PostgreSQL Database:**

    - Make sure you have PostgreSQL installed and running.
    - Create a new database or use an existing one.

4.  **Set up environment variables:**

    - Create a `.env` file in the root of the `server` directory.
    - Populate it with the required variables based on `.env.example` (pe care îl vom crea).

5.  **Run database migrations:**

    ```bash
    npx prisma migrate dev
    ```

6.  **Start the server:**
    ```bash
    npm run dev
    ```
    The API will be available at `http://localhost:3001`.
