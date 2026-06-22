<div align="center">

# 🚀 Fable Server - Backend API

### RESTful API for Fable Ebook Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-blue?style=for-the-badge&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)

</div>

---

## 📋 Overview

This is the backend API for the **Fable** ebook sharing platform. Built with Node.js, Express, and MongoDB, it provides secure authentication, payment processing, and comprehensive CRUD operations.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.18
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + bcrypt
- **Payment:** Stripe API
- **Image Upload:** imgBB API
- **Security:** Helmet, CORS, dotenv

---

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/fable-server.git
cd fable-server

##Project Structure
fable-server/
├── controllers/
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── ebook.controller.js
│   ├── payment.controller.js
│   ├── upload.controller.js
│   └── user.controller.js
├── middleware/
│   ├── auth.middleware.js
│   └── error.middleware.js
├── models/
│   ├── Ebook.js
│   ├── Transaction.js
│   └── User.js
├── routes/
│   ├── admin.routes.js
│   ├── auth.routes.js
│   ├── ebook.routes.js
│   ├── payment.routes.js
│   ├── upload.routes.js
│   └── user.routes.js
├── scripts/
│   ├── createWriter.js
│   └── fixUnknownWriters.js
├── utils/
│   └── imgbbUpload.js
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md


🔌 API Endpoints
Authentication
Method
Endpoint
Description
POST
/api/auth/register
Register new user
POST
/api/auth/login
Login user
GET
/api/auth/me
Get current user
Ebooks
Method
Endpoint
Description
GET
/api/ebooks
Get all ebooks (with filters)
GET
/api/ebooks/:id
Get ebook by ID
POST
/api/ebooks
Create ebook (writer)
PUT
/api/ebooks/:id
Update ebook (writer)
DELETE
/api/ebooks/:id
Delete ebook (writer)
GET
/api/ebooks/my-ebooks
Get writer's ebooks
PATCH
/api/ebooks/:id/publish
Toggle publish status
GET
/api/ebooks/featured
Get featured ebooks
Payments
Method
Endpoint
Description
POST
/api/payments/create-checkout
Create Stripe session
POST
/api/payments/verify
Verify payment
GET
/api/payments/writer-sales
Get writer's sales
Admin
Method
Endpoint
Description
GET
/api/admin/stats/overview
Overview stats
GET
/api/admin/stats/monthly-sales
Monthly sales
GET
/api/admin/stats/ebooks-by-genre
Genre distribution
GET
/api/admin/users
Get all users
PATCH
/api/admin/users/:id/role
Change user role
DELETE
/api/admin/users/:id
Delete user
GET
/api/admin/ebooks
Get all ebooks
DELETE
/api/admin/ebooks/:id
Delete ebook
GET
/api/admin/transactions
All transactions
Upload
Method
Endpoint
Description
POST
/api/upload
Upload image to imgBB


🔒 Security Features
✅ Password hashing with bcrypt (10 rounds)
✅ JWT authentication with 7-day expiry
✅ Role-based authorization middleware
✅ CORS configuration
✅ Helmet for security headers
✅ Rate limiting
✅ Input validation
✅ Environment variables for secrets


<div align="center">

Built with ❤️ by Tamanna Akter]
</div>
```