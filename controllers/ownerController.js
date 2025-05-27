const confirmReservation = async (req, res, pool) => {
  const { reservation_id } = req.body;
  const ownerId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: reservationRows } = await client.query(
      `SELECT r.*, rest.owner_id, rest.name AS restaurant_name
       FROM reservations r
       JOIN restaurants rest ON r.restaurant_id = rest.id
       WHERE r.id = $1`,
      [reservation_id]
    );

    if (reservationRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Reservation not found." });
    }

    const reservation = reservationRows[0];
    if (reservation.owner_id !== ownerId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επιβεβαιώσετε αυτή την κράτηση." });
    }

    // ✅ Επιβεβαίωση κράτησης
    await client.query(
      `UPDATE reservations SET status = 'confirmed' WHERE id = $1`,
      [reservation_id]
    );

    // ✅ Οριστικοποίηση κουπονιού (αν υπάρχει)
    if (reservation.coupon_id) {
      await client.query(
        `UPDATE purchased_coupons
         SET is_used = true, is_locked = false
         WHERE user_id = $1 AND coupon_id = $2`,
        [reservation.user_id, reservation.coupon_id]
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Η κράτηση επιβεβαιώθηκε με επιτυχία." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error confirming reservation:", err);
    res.status(500).json({ message: "Failed to confirm reservation." });
  } finally {
    client.release();
  }
};


const cancelReservation = async (req, res, pool) => {
  const { reservation_id } = req.body;
  const ownerId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: reservationRows } = await client.query(
      `SELECT r.*, rest.owner_id, rest.name AS restaurant_name
       FROM reservations r
       JOIN restaurants rest ON r.restaurant_id = rest.id
       WHERE r.id = $1`,
      [reservation_id]
    );

    if (reservationRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Reservation not found." });
    }

    const reservation = reservationRows[0];
    if (reservation.owner_id !== ownerId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Δεν έχετε δικαίωμα να ακυρώσετε αυτή την κράτηση." });
    }

    // ✅ Ακύρωση κράτησης
    await client.query(
      `UPDATE reservations SET status = 'cancelled' WHERE id = $1`,
      [reservation_id]
    );

    // ✅ Ξεκλείδωμα κουπονιού (αν υπάρχει και δεν έχει χρησιμοποιηθεί)
    if (reservation.coupon_id) {
      await client.query(
        `UPDATE purchased_coupons
         SET is_locked = false
         WHERE user_id = $1 AND coupon_id = $2 AND is_used = false`,
        [reservation.user_id, reservation.coupon_id]
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Η κράτηση ακυρώθηκε και το κουπόνι αποδεσμεύτηκε." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error cancelling reservation:", err);
    res.status(500).json({ message: "Failed to cancel reservation." });
  } finally {
    client.release();
  }
};
