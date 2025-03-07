// middleware/rateLimiter.js
const { RateLimiterMemory } = require("rate-limiter-flexible");

const initialBlockDuration = 10; // First ban is 10 seconds
const banMultiplier = 2; // Ban time doubles on each violation
const maxBanDuration = 3600; // Max ban is 1 hour

const banList = new Map(); // Store IPs and their block duration

const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 1, // per second
});

// Middleware function
const rateLimiterMiddleware = async (req, res, next) => {
  const ip = req.ip;
  const currentBanDuration = banList.get(ip) || initialBlockDuration;

  try {
    await rateLimiter.consume(ip); // Consume a request
    next();
  } catch (err) {
    // If the IP is already in the ban list, extend its ban
    banList.set(
      ip,
      Math.min(currentBanDuration * banMultiplier, maxBanDuration)
    );

    res.status(429).json({
      message: `Too many requests. You are banned for ${Math.ceil(
        currentBanDuration / 60
      )} minutes.`,
    });

    // Block the IP by setting a temporary ban
    setTimeout(() => {
      banList.delete(ip); // Remove IP from ban list after the duration ends
    }, currentBanDuration * 1000);
  }
};

module.exports = { rateLimiter: rateLimiterMiddleware };
