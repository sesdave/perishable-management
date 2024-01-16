# Elite Backend Test

A backend test application for Elite Software Automation.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Redis](#redis)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Description

Esa Backend Test is a backend application developed as part of a test for Elite Software Automation. The application provides endpoints for managing items. It is built using Node.js, Express.js, Sequelize ORM, Redis, Postgresql Database.

## Features
- CRUD operations for managing items
- Automatic cleanup of expired database records(This job runs hourly)
- Rate limiting and request throttling

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js
- npm
- PostgreSQL database server
- Redis server

## Installation

1. Unzip the gzipped/zipped git repository:

```bash
cd esa-backend-test
```

2. Install dependencies:
```bash
npm install
```
2. Set up your environment variables by creating a .env file (see Environment Variables).

3. Set up your PostgreSQL database and Redis server (see Database and Redis).

4. Build the project:
```bash
npm run build

```

## Usage

To start the application, run:
```bash
npm start
```
The server will start on the specified port (default is 3000). You can access the API endpoints using a tool like Postman or by making requests from your frontend application.

## Endpoints

### Items

- **POST /:item/add**: Add item to Inventory.
- **POST /:item/sell**: Sell Item that has not Expired.
- **GET /:item/quantity**: Get Item Quantity.

## Environment Variables

Create a `.env` file in the root directory of the project with the following environment variables:

```dotenv
POSTGRES_NAME=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=your_db_host
POSTGRES_PORT=5432

REDIS_URL=your_redis_url
CLEANUP_WINDOW=cron_period_to_cleandb 
```



### Redis

The application uses Redis for caching Before running the application, ensure you have a running Redis server. To configure Redis, update the settings in `src/utils/cache.ts`.



## Testing

Run tests using:
```bash
npm test
```

## Documentation

Api Documentation can be accessed using postman on 

https://documenter.getpostman.com/view/7170305/2s9YsQ6oxL


## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
