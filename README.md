# Luxury Estate

This project is a luxury estate website built with Node.js, Express, and PostgreSQL. It also provides users with property recommendations based on their past interactions.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/property-recommendation-system.git
    cd property-recommendation-system
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Set up the database:
    - Create a PostgreSQL database.
	- Initialize the schema given in the `schema.sql` file
    - Run the `initData.js` file to add dummy data.

4. Create a `.env` file in the root directory and add your environment variables:
    ```env
    PORT=3000
    DATABASE_URL=your_database_url
	SESSION_SECRET=your_session_secret
    ```

5. Start the server:
    ```sh
    npm start
    ```

## Usage

- Open your browser and navigate to `http://localhost:3000`.
- Register or log in to your account.
- Interact with properties to receive recommendations.

## Project Structure
- `app.js`: Main application file.
- `public/`: Public assets like images and stylesheets.
- `views/`: EJS templates for rendering HTML pages.