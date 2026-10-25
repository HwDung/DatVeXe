const multer = require("multer");
const { HttpError } = require("../../utils/http-error");

const allowedMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, parts: 2 },
  fileFilter: (_request, file, callback) => {
    const extension = file.originalname.toLowerCase().split(".").pop();
    if (!allowedMimeTypes.has(file.mimetype) || extension !== "xlsx") {
      callback(new HttpError(400, "UNSUPPORTED_FILE_TYPE", "Upload an .xlsx Excel file"));
      return;
    }
    callback(null, true);
  },
});

function receiveExcelFile(request, response, next) {
  upload.single("file")(request, response, (error) => {
    if (!error) {
      if (!request.file) {
        next(new HttpError(400, "EXCEL_FILE_REQUIRED", "Upload an Excel file in the 'file' field"));
        return;
      }
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const code = error.code === "LIMIT_FILE_SIZE" ? "FILE_TOO_LARGE" : "INVALID_UPLOAD";
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Excel file must be 5 MB or smaller"
        : "Upload exactly one Excel file using the 'file' field";
      next(new HttpError(400, code, message));
      return;
    }

    next(error);
  });
}

module.exports = { receiveExcelFile };
