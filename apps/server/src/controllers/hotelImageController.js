const path = require('path');
const fs = require('fs');
const { Hotel, HotelImage } = require('../models');

function toPublicUrl(filename) {
  return `/uploads/${filename}`;
}

// GET /api/hotels/:id/images
exports.listHotelImages = async (req, res, next) => {
  try {
    const hotelId = Number(req.params.id);

    const images = await HotelImage.findAll({
      where: { hotel_id: hotelId },
      order: [['is_main', 'DESC'], ['order', 'ASC'], ['id', 'ASC']],
    });

    res.json({ success: true, images });
  } catch (err) {
    next(err);
  }
};

// POST /api/hotels/:id/images
// form-data: images(多张), 可选 alt_text(字符串), 可选 mainIndex(数字)
exports.uploadHotelImages = async (req, res, next) => {
  try {
    const hotelId = Number(req.params.id);
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: 'No files uploaded' });

    const altText = req.body?.alt_text || null;
    const mainIndexRaw = req.body?.mainIndex;
    const mainIndex = Number.isFinite(Number(mainIndexRaw)) ? Number(mainIndexRaw) : 0;

    const rows = await Promise.all(
      files.map((f, idx) =>
        HotelImage.create({
          hotel_id: hotelId,
          url: toPublicUrl(f.filename),
          alt_text: altText,
          is_main: idx === mainIndex,
          order: idx,
        })
      )
    );

    res.status(201).json({ success: true, message: 'Uploaded', images: rows });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/hotels/:id/images/:imageId
exports.deleteHotelImage = async (req, res, next) => {
  try {
    const hotelId = Number(req.params.id);
    const imageId = Number(req.params.imageId);

    const row = await HotelImage.findOne({ where: { id: imageId, hotel_id: hotelId } });
    if (!row) return res.status(404).json({ message: 'Image not found' });

    const filename = (row.url || '').replace(/^\/uploads\//, '');
    const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
    if (filename && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await row.destroy();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
