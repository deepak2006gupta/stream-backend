import {v2 as cloudinary} from 'cloudinary';
import {fs} from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (filePath) => {
    try {
        if(!filePath) return null;

        //Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })
        //file uploaded successfully
        console.log("File uploaded successfully: ", response.url);
        return response;


    }catch (error) {
        fs.unlinkSync(filePath); // remove localy saved temporary file when failed
        console.error("Error uploading file to cloudinary: ", error);
        throw error;
    }
}

export { uploadToCloudinary };