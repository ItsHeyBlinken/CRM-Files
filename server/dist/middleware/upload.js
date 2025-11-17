"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFiles = exports.processImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, file, cb) => {
        let uploadPath = uploadDir;
        if (file.fieldname === 'avatar') {
            uploadPath = path_1.default.join(uploadDir, 'avatars');
        }
        else if (file.fieldname === 'document') {
            uploadPath = path_1.default.join(uploadDir, 'documents');
        }
        else if (file.fieldname === 'attachment') {
            uploadPath = path_1.default.join(uploadDir, 'attachments');
        }
        else {
            uploadPath = path_1.default.join(uploadDir, 'general');
        }
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}-${Date.now()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-powerpoint' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        file.mimetype === 'text/plain' ||
        file.mimetype === 'text/csv';
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only image files and documents are allowed!'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'),
        files: 10,
    },
});
const processImage = async (req, _res, next) => {
    if (!req.file)
        return next();
    try {
        const filePath = req.file.path;
        const processedPath = filePath.replace(path_1.default.extname(filePath), '_processed.jpg');
        await (0, sharp_1.default)(filePath)
            .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
        })
            .jpeg({ quality: 85 })
            .toFile(processedPath);
        fs_1.default.unlinkSync(filePath);
        fs_1.default.renameSync(processedPath, filePath);
        req.file.processed = true;
        next();
    }
    catch (error) {
        console.error('Image processing error:', error);
        next(error);
    }
};
exports.processImage = processImage;
const processFiles = async (req, _res, next) => {
    if (!req.files || req.files.length === 0)
        return next();
    try {
        const processedFiles = [];
        for (const file of req.files) {
            const filePath = file.path;
            const ext = path_1.default.extname(filePath).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                const processedPath = filePath.replace(ext, '_processed.jpg');
                await (0, sharp_1.default)(filePath)
                    .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                    .jpeg({ quality: 85 })
                    .toFile(processedPath);
                fs_1.default.unlinkSync(filePath);
                fs_1.default.renameSync(processedPath, filePath);
            }
            processedFiles.push({
                ...file,
                processed: true,
            });
        }
        req.files = processedFiles;
        next();
    }
    catch (error) {
        console.error('Files processing error:', error);
        next(error);
    }
};
exports.processFiles = processFiles;
//# sourceMappingURL=upload.js.map