# StreamMe Backend - A YouTube-like Application Backend

This is the backend service for a video-sharing platform, providing functionalities similar to YouTube. It handles user authentication, data management, and file uploads.
## ✨ Features

*   **User Authentication**: Secure user registration and login.
*   **JWT Support**: Uses JSON Web Tokens (Access and Refresh Tokens) for authentication.
*   **Image Uploads**: Supports uploading user avatars and cover images to Cloudinary.
*   **Cookie-based Sessions**: Manages user sessions by sending tokens in secure, HTTP-only cookies.
*   **User Profile Management**: Allows users to view and update their profile information.

## 🛠️ Technologies Used

*   **Node.js**: JavaScript runtime environment.
*   **Express.js**: Web framework for Node.js.
*   **MongoDB**: NoSQL database for storing user data.
*   **Mongoose**: Object Data Modeling (ODM) library for MongoDB.
*   **Cloudinary**: Cloud-based service for image and video management.
*   **JWT (JSON Web Token)**: For creating access and refresh tokens.
*   **bcrypt**: Library for hashing passwords.
*   **cookie-parser**: Middleware to parse cookie header.

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js and npm installed on your machine. You will also need a MongoDB database and a Cloudinary account.

### Installation

1.  Clone the repository:
    ```sh
    git clone <your-repository-url>
    ```
2.  Navigate to the project directory:
    ```sh
    cd Chai-Backend
    ```
3.  Install the dependencies:
    ```sh
    npm install
    ```
4.  Create a `.env` file in the root directory and add the following environment variables:
    ```env
    MONGODB_URI=<your_mongodb_connection_string>
    CORS_ORIGIN=*
    ACCESS_TOKEN_SECRET=<your_access_token_secret>
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=<your_refresh_token_secret>
    REFRESH_TOKEN_EXPIRY=10d
    CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
    CLOUDINARY_API_KEY=<your_cloudinary_api_key>
    CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
    ```
5.  Start the server:
    ```sh
    npm run dev
    ```
