import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteLocalFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Local file deleted:", filePath);
    }
  } catch (err) {
    console.error("Failed to delete local file:", err.message);
  }
};

const uploadToCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;

    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    console.log("File uploaded successfully:", response.secure_url);

    // delete temp file after successful upload
    deleteLocalFile(filePath);

    return response;
  } catch (error) {
    // delete temp file even if upload fails
    deleteLocalFile(filePath);

    console.error("Error uploading file to Cloudinary:", error.message);
    throw error;
  }
};

export { uploadToCloudinary };