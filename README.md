# Yummy - Restaurant Reservation API

Yummy is an Express.js-based REST API designed for restaurant reservations.
It provides functionalities for users, restaurant owners, and authentication using JWT and Google OAuth.
The API allows users to find and book restaurants, while owners can manage their listings.

## 🌟 Features

- **User Authentication**: Supports JWT, Google OAuth and Facebook OAuth for secure login.
- **Role-based Access**: Separate routes and permissions for users, restaurant owners, and admins.
- **Restaurant Management**: Owners can register and manage restaurants.
- **Rate Limiting**: Prevents API abuse by restricting excessive requests.
- **Secure Cookie Handling**: Implements JWT authentication via cookies.
- **Database Integration**: Uses PostgreSQL for data storage.

## 🛠 Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, Google OAuth (passport-google-oauth20), Facebook Oauth (passport-facebook)
- **Validation**: Joi
- **Security**: bcrypt.js, helmet, cors, express-rate-limit

## 🚀 Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/Yummy.git
   cd Yummy
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add the following:

   ```sh
   // JWT
      JWT_SECRET= 'xxxxx'

      // Database
      PGHOST='xxxxx'
      PGDATABASE='xxxxx'
      PGUSER='xxxxx'
      PGPASSWORD='xxxxx'

      // Google
      GOOGLE_CLIENT_ID = 'xxxxx'
      GOOGLE_CLIENT_SECRET = 'xxxxx'
      GOOGLE_CALLBACK_URL = 'http://localhost:3000/user/auth/google/callback'

      // Environment (cookie)
      NODE_ENV = 'development'
      FRONT_END_URL = 'http://localhost'
      envPORT = 3000

      // Gmail mail sender
      EMAIL_USER = 'xxxxx'
      EMAIL_PASS = 'xxxxx'

      // Facebook
      FACEBOOK_CLIENT_ID = 'xxxxx'
      FACEBOOK_CLIENT_SECRET = 'xxxxx'
      FACEBOOK_CALLBACK_URL = "http://localhost:3000/user/auth/facebook/callback"
   ```

4. Start the server:
   ```sh
   npm start
   ```

## 🔗 API Endpoints

### 🛡 Authentication

| Method | Endpoint         | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/auth/google`   | Redirects for Google OAuth   |
| POST   | `/auth/login`    | User login (JWT)             |
| POST   | `/auth/register` | User registration            |
| GET    | `/auth/logout`   | User logout                  |
| GET    | `/auth/facebook` | Redirects for Facebook OAuth |

### 👥 User Management

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | `/users`     | Get all users       |
| GET    | `/users/:id` | Get a user by ID    |
| PUT    | `/users/:id` | Update user details |
| DELETE | `/users/:id` | Delete a user       |

### 🍽 Restaurant Management

| Method | Endpoint           | Description                      |
| ------ | ------------------ | -------------------------------- |
| GET    | `/restaurants`     | Get all restaurants              |
| GET    | `/restaurants/:id` | Get a restaurant by ID           |
| POST   | `/restaurants`     | Create a restaurant (Owner only) |
| PUT    | `/restaurants/:id` | Update restaurant (Owner only)   |
| DELETE | `/restaurants/:id` | Delete restaurant (Owner only)   |

### 👨‍🍳 Owner Management

| Method | Endpoint      | Description                     |
| ------ | ------------- | ------------------------------- |
| GET    | `/owners`     | Get all restaurant owners       |
| GET    | `/owners/:id` | Get owner details by ID         |
| POST   | `/owners`     | Register a new restaurant owner |
| PUT    | `/owners/:id` | Update owner details            |
| DELETE | `/owners/:id` | Delete an owner                 |

## 🏗 Middleware

- **Authentication Middleware**: `cookieJWTAuth.js` for securing routes.
- **Rate Limiting**: `rateLimiter.js` to prevent excessive requests.
- **Google Auth**: `authGoogle.js` for google authorization.
- **Facebook Auth**: `authFacebook.js` for facebook authorization.

## 🎨 Frontend Authentication UI

This project includes a simple frontend authentication page:

- `loginPage.html` - Displays login buttons for Google and Facebook.
- `loginPage.js` - Handles UI updates and interactions.
- `loginPage.js` - Displays the css of the loginPage.
- `verify.html` - Verification process landing page via email.
- `verify.js` - Verification process script.

## Future Implementations

1. Email Verification. (done)
2. Facebook Authorization. (Done)

Developed by Me! Athanasios Oikonomou.
