const {
  getTestimonials,
  getTestimonialsTotal,
} = require("../queries/testimonialsQueries");

const fetchTestimonials = async (req, res, pool) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.limit, 10) || 10;

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  try {
    const testimonials = await pool.query(getTestimonials, [limit, offset]);

    const allTestimonials = testimonials.rows;

    if (allTestimonials.length === 0) {
      return res.status(404).json({ error: "Not Testimonials Found." });
    }

    const countResult = await pool.query(getTestimonialsTotal);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Calculate pagination information
    const currentPage = page;
    const recordsOnCurrentPage = allTestimonials.length; // This will be pageSize or less if it's the last page
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    res.json({
      allTestimonials,
      Pagination: {
        currentPage: currentPage,
        recordsOnCurrentPage: recordsOnCurrentPage,
        viewedRecords: viewedRecords,
        remainingRecords: remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching testimonials:", err);
    res.status(500).json({ message: "Failed to load testimonials." });
  }
};

module.exports = { fetchTestimonials };
