# 📚 BookNook — Backend Server

<p align="center">
  **Powering the BookNook Online Library**
  <br />
  A RESTful backend API for managing books, borrowing operations, and library data.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>
<p align="center">
  <a href="https://booknook-server-pi-ten.vercel.app/">
    <strong>🌐 Live Server</strong>
  </a>
  &nbsp; • &nbsp;
  <a href="https://booknook-client-new.vercel.app/">
    <strong>📖 Live Application</strong>
  </a>
</p>

---

## ✨ About the Project

**BookNook** is a small online library application where users can explore books, add books to the collection, borrow books, and return borrowed books.

This repository contains the backend server responsible for API operations, database management, borrowing workflows, and authentication-related request validation.

## 🚀 Key Features

| Feature | Description |
|---|---|
| 📚 Book Management | Create, read, update, and delete books |
| 🔄 Borrowing System | Handle book borrowing and returning |
| 📦 Copy Management | Track available copies of each book |
| 🛡️ JWT Authentication | Validate protected API requests |
| 🚫 Duplicate Prevention | Prevent users from borrowing the same book twice |
| 🗄️ Database Integration | Store and manage data using MongoDB |

## 🧰 Technology Stack

- **Runtime:** Node.js
- **Backend Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB
- **Authentication:** JSON Web Token (JWT)
- **Deployment:** Vercel

## ⚙️ Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB database

### Installation

**1. Clone the repository**

```bash
git clone YOUR_SERVER_REPOSITORY_URL
```

**2. Navigate to the project folder**

```bash
cd booknook-server
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a `.env` file in the project root and configure the required environment variables.

**5. Run the development server**

```bash
npm run dev
```

The server will start on the configured port.

## 🌐 Deployment

The BookNook backend is deployed on Vercel.

**Live API:** https://booknook-server-pi-ten.vercel.app/

## 🔗 Project Links

| Resource | Link |
|---|---|
| Frontend Repository | [BookNook Client](https://github.com/Avijit35cse/booknook-client) |
| Backend Repository | This Repository |
| Live Application | [BookNook](https://booknook-client-new.vercel.app/) |
| Live Server | [BookNook API](https://booknook-server-pi-ten.vercel.app/) |

---
