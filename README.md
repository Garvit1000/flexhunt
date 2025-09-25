# FlexHunt

FlexHunt is a comprehensive platform designed to connect freelancers and clients, offering a centralized hub for finding jobs, internships, and freelance opportunities. The platform also integrates a secure payment gateway for purchasing services or "gigs."

## Features

- **Job Listings:** Browse and search for a wide range of jobs, internships, and freelance projects.
- **User Authentication:** Secure user registration and login functionality.
- **Payment Integration:** A built-in payment system powered by PayPal for seamless transactions.
- **Responsive Design:** A user-friendly interface that works on both desktop and mobile devices.

## Technologies Used

### Backend

- **Node.js:** A JavaScript runtime for building the server-side application.
- **Express:** A web application framework for Node.js.
- **Firebase Admin:** For backend integration with Firebase services.
- **PayPal Checkout SDK:** For processing payments.
- **CORS:** To enable Cross-Origin Resource Sharing.
- **Dotenv:** For managing environment variables.

### Frontend

- **React:** A JavaScript library for building user interfaces.
- **Vite:** A fast build tool for modern web development.
- **Tailwind CSS:** A utility-first CSS framework for styling.
- **ESLint:** For code linting and quality control.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A code editor of your choice (e.g., [VS Code](https://code.visualstudio.com/))

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Garvit1000/flexhunt.git
   cd flexhunt
   ```

2. **Install all dependencies:**
   This command will install the necessary packages for both the backend and frontend.
   ```sh
   npm run install-all
   ```
   This is equivalent to running `npm install` in both the `Backend` and `frontend` directories.

3. **Set up environment variables:**
   - Navigate to the `Backend` directory:
     ```sh
     cd Backend
     ```
   - Create a `.env` file by copying the example:
     ```sh
     cp .env.example .env
     ```
   - Open the `.env` file and add your Firebase and PayPal API credentials.

## Usage

To run the application, you will need to start both the backend and frontend servers.

1. **Start the backend server:**
   From the root directory, run:
   ```sh

   npm start
   ```

2. **Start the frontend development server:**
   Open a new terminal window, navigate to the `frontend` directory, and run:
   ```sh
   cd frontend
   npm run dev
   ```

The application should now be running, with the frontend accessible at `http://localhost:5173` (or another port if specified) and the backend server running on its configured port.

## Project Structure

The repository is organized into two main directories:

- **`Backend/`**: Contains the Node.js and Express server-side code.
  - **`config/`**: Configuration files (e.g., Firebase).
  - **`models/`**: Data models (if any).
  - **`routes/`**: API route definitions.
  - **`server.js`**: The main entry point for the backend server.
- **`frontend/`**: Contains the React client-side application.
  - **`src/`**: The main source code for the React app.
    - **`components/`**: Reusable React components.
    - **`pages/`**: Top-level page components.
    - **`App.jsx`**: The root component of the application.
  - **`public/`**: Static assets.

## Contributing

Contributions are welcome! If you have suggestions for improving the application, please feel free to open an issue or submit a pull request.

1. **Fork the repository.**
2. **Create a new branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes and commit them:** `git commit -m 'Add some feature'`
4. **Push to the branch:** `git push origin feature/your-feature-name`
5. **Open a pull request.**

## License

This project is licensed under the ISC License. See the `LICENSE` file for more details.
