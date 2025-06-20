# 🍽️ Yummy - Restaurant Reservation API

Yummy is a robust RESTful API built with Express.js designed for managing restaurant reservations, menus, and promotional offers.  
It offers secure, role-based access for **users**, **restaurant owners**, and **admins**, with complete authentication and authorization flows.

---

## 🌟 Features

- **User Authentication**: JWT (via cookies), Google OAuth, and Facebook OAuth.
- **Role-Based Access**: Distinct routes for users, restaurant owners, and admins.
- **Restaurant Management**: Owners can register menus, special offers, coupons and handle reservations.
- **Reservation System**: Users can make and cancel bookings, owners can approve or reject them.
- **Rate Limiting**: Protects API from abuse with request throttling.
- **Secure Cookie Handling**: JWT stored in HTTP-only cookies.
- **Database Integration**: PostgreSQL.

---

## 🛠 Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, Google OAuth (`passport-google-oauth20`), Facebook OAuth (`passport-facebook`)
- **Validation**: Joi
- **Security**: bcrypt.js, helmet, cors, express-rate-limit
- **Email**: Nodemailer (Gmail SMTP)

---

## 🚀 Installation

1. **Clone the repository**:

   ```sh
   git clone https://github.com/AthanasiosOikonomou/Yummy.git
   cd Yummy
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add the following:

   ```sh
   # JWT
   JWT_SECRET=xxxxx

   # PostgreSQL Database
   PGHOST=xxxxx
   PGDATABASE=xxxxx
   PGUSER=xxxxx
   PGPASSWORD=xxxxx

   # Google OAuth
   GOOGLE_CLIENT_ID=xxxxx
   GOOGLE_CLIENT_SECRET=xxxxx
   GOOGLE_CALLBACK_URL=http://localhost:3000/user/auth/google/callback

   # Facebook OAuth
   FACEBOOK_CLIENT_ID=xxxxx
   FACEBOOK_CLIENT_SECRET=xxxxx
   FACEBOOK_CALLBACK_URL=http://localhost:3000/user/auth/facebook/callback

   # Environment
   NODE_ENV=development
   FRONT_END_URL=http://localhost
   envPORT=3000

   # Email Credentials
   EMAIL_USER=xxxxx
   EMAIL_PASS=xxxxx
   ```

4. Start the server:
   ```sh
   npm start
   ```

## 🔗 API Endpoints

### All endpoints has the domain/api/v1 before the rest of the path.

### 🛡 Admin Management

| Method | Endpoint                  | Description                      |
| ------ | ------------------------- | -------------------------------- |
| POST   | `/admin/register`         | Register new admin               |
| POST   | `/admin/login`            | Login admin                      |
| POST   | `/admin/createRestaurant` | Create a restaurant (admin only) |

### 🛡 User Management

| Method | Endpoint                              | Description                          |
| ------ | ------------------------------------- | ------------------------------------ |
| POST   | `/user/register`                      | Register new user                    |
| POST   | `/user/login`                         | Login user with email/password       |
| PATCH  | `/user/update`                        | Update user profile                  |
| GET    | `/user/profile`                       | Get user profile                     |
| GET    | `/user/auth/status`                   | Check current user auth status       |
| GET    | `/user/logout`                        | Logout user                          |
| GET    | `/user/auth/google`                   | Google OAuth2 login (redirect)       |
| GET    | `/user/auth/google/callback`          | Google OAuth2 callback handler       |
| GET    | `/user/auth/facebook`                 | Facebook OAuth login (redirect)      |
| GET    | `/user/auth/facebook/callback`        | Facebook OAuth callback handler      |
| GET    | `/user/verify-email`                  | Verify user email via token          |
| POST   | `/user/resend-verification`           | Resend email verification link       |
| GET    | `/user/points`                        | Get current user points              |
| GET    | `/user/favorites`                     | Get list of favorite restaurants     |
| POST   | `/user/favorites/toggle`              | Add/remove restaurant from favorites |
| POST   | `/user/password/reset/request`        | Request password reset email         |
| POST   | `/user/password/reset`                | Reset user password                  |
| POST   | `/user/password/reset/validate/token` | Validate password reset token        |

### 👨‍🍳 Owner Management

| Method | Endpoint                               | Description                     |
| ------ | -------------------------------------- | ------------------------------- |
| POST   | `/owner/register`                      | Register new owner              |
| POST   | `/owner/login`                         | Login owner with email/password |
| PATCH  | `/owner/update`                        | Update owner profile            |
| GET    | `/owner/profile`                       | Get owner profile               |
| GET    | `/owner/verify-email`                  | Verify owner email via token    |
| POST   | `/owner/resend-verification`           | Resend email verification link  |
| POST   | `/owner/password/reset/request`        | Request password reset email    |
| POST   | `/owner/password/reset`                | Reset owner password            |
| POST   | `/owner/password/reset/validate/token` | Validate password reset token   |
| GET    | `/owner/auth/status`                   | Check current owner auth status |
| GET    | `/owner/logout`                        | Logout owner                    |
| GET    | `/owner/auth/google`                   | Google OAuth2 login (redirect)  |
| GET    | `/owner/auth/google/callback`          | Google OAuth2 callback handler  |
| GET    | `/owner/auth/facebook`                 | Facebook OAuth login (redirect) |
| GET    | `/owner/auth/facebook/callback`        | Facebook OAuth callback handler |

### 🍽 Restaurant Management

| Method | Endpoint                 | Description                      |
| ------ | ------------------------ | -------------------------------- |
| GET    | `/restaurant/id/:id`     | Get restaurant by ID             |
| GET    | `/restaurant`            | Get filtered list of restaurants |
| GET    | `/restaurant/trending`   | Get trending restaurants         |
| GET    | `/restaurant/discounted` | Get discounted restaurants       |
| PATCH  | `/restaurant/:id`        | Update restaurant by ID          |

### 📋 Special Menus Management

| Method | Endpoint            | Description               |
| ------ | ------------------- | ------------------------- |
| POST   | `/specialMenus`     | Create a new special menu |
| PATCH  | `/specialMenus/:id` | Update special menu by ID |
| DELETE | `/specialMenus/:id` | Delete special menu by ID |

### 📋 🍽️ Special Menu Items Management

| Method | Endpoint              | Description                             |
| ------ | --------------------- | --------------------------------------- |
| POST   | `/special-menu-items` | Create link between special menu & item |
| DELETE | `/special-menu-items` | Delete link between special menu & item |

### 📝 Testimonials Routes

| Method | Endpoint            | Description            |
| ------ | ------------------- | ---------------------- |
| GET    | `/testimonials/all` | Fetch all testimonials |

### 🍲 Menu Items Routes

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| POST   | `/menuItems`     | Create a menu item     |
| PATCH  | `/menuItems/:id` | Update menu item by ID |
| DELETE | `/menuItems/:id` | Delete menu item by ID |

### 🎟️ Coupons Routes

| Method | Endpoint                         | Description                            |
| ------ | -------------------------------- | -------------------------------------- |
| GET    | `/coupons/ownedByUser`           | Get coupons owned by the user          |
| POST   | `/coupons/purchase`              | Purchase a coupon                      |
| GET    | `/coupons/available`             | Get available coupons                  |
| GET    | `/coupons/purchased/restaurants` | Get restaurants with purchased coupons |
| POST   | `/coupons/creation`              | Create a new coupon                    |
| PATCH  | `/coupons/edit`                  | Edit a coupon                          |
| DELETE | `/coupons/delete`                | Delete a coupon                        |

### 📅 Reservations Routes

| Method | Endpoint                       | Description                         |
| ------ | ------------------------------ | ----------------------------------- |
| GET    | `/reservations/user`           | Get reservations for current user   |
| GET    | `/reservations/user/filtered`  | Get filtered reservations for user  |
| GET    | `/reservations/:id`            | Get reservation by ID               |
| POST   | `/reservations`                | Create a new reservation            |
| DELETE | `/reservations/:id`            | Delete reservation by ID            |
| POST   | `/reservations/cancel/:id`     | Cancel reservation by ID            |
| PATCH  | `/reservations/owner`          | Update reservation as owner         |
| GET    | `/reservations/filtered/owner` | Get filtered reservations for owner |

## 🏗 Middleware

- **Authentication Middleware**: `cookieJWTAuth.js` for securing routes.
- **Rate Limiting**: `rateLimiter.js` to prevent excessive requests.
- **Google Auth**: `authGoogle.js` for google authorization.
- **Facebook Auth**: `authFacebook.js` for facebook authorization.

## 🎨 Frontend Authentication UI

This project includes a simple frontend authentication page:

- `loginPage.html` - Displays login buttons for Google and Facebook.
- `loginPage.js` - Handles UI updates and interactions.
- `loginPage.css` - Displays the css of the loginPage.
- `verify.html` - Verification process landing page via email.
- `verify.js` - Verification process script.
- `reset-password.html` - Displays the reset password logic.
- `reset-password.css` - Displays the css of the reset password.
- `reset-password-owner.html` - Displays the reset password owner logic.
- `reset-password-owner.css` - Displays the css of the reset password owner.

## Future Implementations

1. Image upload for restaurants/ menus/ profile image of users.
2. Dashboard analytics for owners.

Developed by Me! Athanasios Oikonomou.
