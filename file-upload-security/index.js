import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = 3000;

// Serve static files for the HTML page
app.use(express.static("public"));


//In a real world application this should be a DB
const fileMapping = new Map();
// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: "./uploads",
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
  filename: (req, file, cb) => {
    const uuid = uuidv4()
    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${uuid}${ext}`);
  },
  fileFilter: (req, file, cb) => {
    // Accept only certain file types, e.g., images
    const fileTypes = /jpeg|jpg|png|webp|gif/;
    const allowedMimeTypes = /^image\/(jpeg|jpg|png|webp|gif)$/;
    const extName = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    const isExtNameValid = fileTypes.test(extName);
    const isMimeTypeValid = allowedMimeTypes.test(mimeType);

    if (isExtNameValid && isMimeTypeValid) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

// Initialize upload middleware
const upload = multer({
  storage,
});

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    const fileUUID = path.basename(req.file.filename, path.extname(req.file.filename))

    fileMapping.set(fileUUID, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date()
    })
    res.json({
      message: "File uploaded successfully",
      file: fileUUID
    }).status(200)
  } else {
    res.status(400).json("File upload failed")
  }
});

// Secure file serving endpoint using mapping
app.get('/files/:id', (req, res) => {
  const publicId = req.params.id;
  const fileInfo = fileMapping.get(publicId);
  
  if (!fileInfo) {
    return res.status(404).send('File not found');
  }
  
  // Security: Set proper headers
  res.setHeader('Content-Type', fileInfo.mimetype);
  
  // Send the actual file
  res.sendFile(path.resolve(fileInfo.path));
});

// Error handling for file upload
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).send(err.message);
  } else if (err) {
    res.status(400).json(err.message);
  } else {
    next();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
