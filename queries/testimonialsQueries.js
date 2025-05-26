const getTestimonials = `SELECT id, message, author
     FROM testimonials
     ORDER BY id
     LIMIT $1 OFFSET $2`;

const getTestimonialsTotal = `
    SELECT COUNT(*) 
    FROM testimonials
`;

module.exports = {
  getTestimonials,
  getTestimonialsTotal,
};
