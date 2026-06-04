# 🧠 E-commerce Backend API

A scalable backend for an e-commerce platform built with Node.js, Express, MongoDB, and Stripe integration.

---

## 🚀 Features

* JWT Authentication (User & Admin)
* Product Management
* Category System
* Order Management
* Stripe Payment Integration
* Webhook handling
* Admin Dashboard APIs
* Secure payment flow

---

## 🧱 Tech Stack

* Node.js
* Express.js
* MongoDB + Mongoose
* Stripe API
* JWT Authentication
* dotenv

---

## 🔌 API Base URL

```
http://localhost:3000/api
```

---

## 🔐 Authentication

All protected routes require:

```http
Authorization: Bearer <token>
```

---

## 🛍️ Products

* GET /products
* POST /products (admin)
* PUT /products/:id (admin)
* DELETE /products/:id (admin)

---

## 📂 Categories

* GET /category
* POST /category (admin)

---

## 📦 Orders

### User

* POST /order
* GET /order
* GET /order/:id
* PUT /order/:id/cancel

### Admin

* GET /order/admin/all
* PUT /order/admin/:id/status
* DELETE /order/admin/:id

---

## 💳 Stripe Integration

### Create Checkout Session

```http
POST /payment/create-checkout-session
```

### Verify Payment

```http
GET /payment/verify/:sessionId
```

---

## 🔔 Stripe Webhook

```http
POST /payment/webhook
```

### Events handled:

* checkout.session.completed
* payment_intent.payment_failed

---

## 🧾 Order Schema

Includes:

* user
* items
* total
* status
* paymentStatus
* shippingAddress
* stripeSessionId
* stripePaymentIntentId

---

## 📊 Admin Dashboard

```http
GET /admin/dashboard?range=12m
```

Returns:

* stats
* sales chart
* recent orders
* top products
* activities

---

## 🧪 Setup

```bash
npm install
npm run dev
```

---

## 🔐 Environment Variables

```env
PORT=3000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

FRONTEND_URL=http://localhost:5173
```

---

## 🔥 Stripe CLI (Dev)

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

---

## 📁 Folder Structure

```
/modules
  /auth
  /products
  /orders
  /categories
  /payment

/middleware
/models
/routes
/utils
```

---

## 🛡️ Security Rules

* Never trust frontend prices
* Validate stock before checkout
* Verify Stripe webhook signature
* Protect admin routes
