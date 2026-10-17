const service = require("./bookings.service");

async function createBooking(req, res) {
  try {
    const booking = await service.createBookingService(req.body);
    res.status(201).json(booking);
  } catch (error) {
    console.error("createBooking error:", error);
    res.status(400).json({ message: error.message || "Không thể tạo vé" });
  }
}

async function lookupBooking(req, res) {
  try {
    const { bookingCode, phone } = req.query;
    if (!bookingCode) {
      return res.status(400).json({ message: "Vui lòng nhập mã đặt vé (bookingCode)" });
    }
    const booking = await service.lookupBookingService(bookingCode, phone);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy thông tin vé phù hợp" });
    }
    res.json(booking);
  } catch (error) {
    console.error("lookupBooking error:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi tra cứu vé" });
  }
}

async function getBooking(req, res) {
  try {
    const booking = await service.getBookingService(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
    }
    res.json(booking);
  } catch (error) {
    console.error("getBooking error:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
}

async function cancelBooking(req, res) {
  try {
    const booking = await service.cancelBookingService(req.params.id);
    res.json(booking);
  } catch (error) {
    console.error("cancelBooking error:", error);
    res.status(400).json({ message: error.message || "Không thể hủy vé" });
  }
}

async function statusCheck(req, res) {
  try {
    const { codes } = req.query;
    if (!codes) {
      return res.json([]);
    }
    const codeList = String(codes)
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const results = await service.statusCheckService(codeList);
    res.json(results);
  } catch (error) {
    console.error("statusCheck error:", error);
    res.status(500).json({ message: "Lỗi kiểm tra trạng thái vé" });
  }
}

async function getMyBookings(req, res) {
  try {
    const userId = req.user?.id || req.query.userId;
    const phone = req.query.phone;
    const email = req.query.email;
    const bookings = await service.getMyBookingsService(userId, phone, email);
    res.json(bookings);
  } catch (error) {
    console.error("getMyBookings error:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách vé" });
  }
}

module.exports = {
  createBooking,
  lookupBooking,
  getBooking,
  cancelBooking,
  statusCheck,
  getMyBookings,
};
