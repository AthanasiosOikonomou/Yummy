# Yummy - Restaurant Reservation API

Yummy is an Express.js-based REST API for restaurant reservations.
It provides functionalities for users, restaurant owners, and authentication using JWT and Google OAuth.
The API includes user authentication, restaurant management, and owner functionalities.

## Features
- **User Authentication**: Supports JWT and Google OAuth for secure login.
- **Role-based Access**: Separate routes and permissions for users, restaurant owners, and admins.
- **Restaurant Management**: Owners can register and manage restaurants.
- **Rate Limiting**: Prevents abuse of API endpoints.
- **Secure Cookie Handling**: Implements JWT authentication via cookies.

## Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, Google OAuth (passport-google-oauth20)
- **Validation**: express-validator
- **Security**: bcrypt.js, helmet, cors, express-rate-limit

## Installation

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
   PORT=3000
   DATABASE_URL=your_postgres_database_url
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   COOKIE_SECRET=your_cookie_secret
   ```

4. Start the server:
   ```sh
   npm start
   ```

## API Endpoints

### Authentication
| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| POST   | `/auth/google`     | Google OAuth login           |
| POST   | `/auth/login`      | User login (JWT)            |
| POST   | `/auth/register`   | User registration           |
| POST   | `/auth/logout`     | User logout                 |

### User Management
| Method | Endpoint          | Description                      |
|--------|-------------------|----------------------------------|
| GET    | `/users`          | Get all users                   |
| GET    | `/users/:id`      | Get a user by ID                |
| PUT    | `/users/:id`      | Update user details             |
| DELETE | `/users/:id`      | Delete a user                   |

### Restaurant Management
| Method | Endpoint                  | Description                         |
|--------|---------------------------|-------------------------------------|
| GET    | `/restaurants`             | Get all restaurants                 |
| GET    | `/restaurants/:id`         | Get a restaurant by ID              |
| POST   | `/restaurants`             | Create a restaurant (Owner only)    |
| PUT    | `/restaurants/:id`         | Update restaurant (Owner only)      |
| DELETE | `/restaurants/:id`         | Delete restaurant (Owner only)      |

### Owner Management
| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| GET    | `/owners`         | Get all restaurant owners          |
| GET    | `/owners/:id`     | Get owner details by ID            |
| POST   | `/owners`         | Register a new restaurant owner    |
| PUT    | `/owners/:id`     | Update owner details               |
| DELETE | `/owners/:id`     | Delete an owner                    |

## Middleware
- **Authentication Middleware**: `cookieJWTAuth.js` for securing routes.
- **Rate Limiting**: `rateLimiter.js` to prevent excessive requests.

## Future Implementations

1) Email Verification.
2) Facebook Autharization.
3) Instagram Autharization.
4) Owner -> Google/ Facebook/ Instagram Auth.

Developed by Me! Athanasios Oikonomou.
