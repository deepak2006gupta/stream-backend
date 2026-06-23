import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const path = process.env.CLOUDINARY_UPLOAD_PATH || "uploads";

const uploadToCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;

        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        });

        // Remove local file after successful upload
        fs.unlinkSync(filePath);

        console.log("File uploaded successfully:", response.secure_url);

        return response;
    } catch (error) {
        // Remove local file if upload fails
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        console.error("Error uploading file to Cloudinary:", error);
        throw error;
    }
};

export { uploadToCloudinary };