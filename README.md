# React + Vite

# Offline-First CRUD Application with RxDB and MongoDB Atlas

This application demonstrates an offline-first approach to managing businesses and articles with automatic synchronization to MongoDB Atlas when online.

## Features

- Create, read businesses and articles
- Works offline with local data persistence
- Automatic synchronization when online
- Simple and intuitive UI

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up MongoDB Atlas:
   - Create a free account
   - Create a cluster
   - Create a database user
   - Whitelist your IP
4. Update the connection string in `src/database.js`
5. Run the application: `npm start`

## How It Works

- **Offline-First**: All data is stored locally using RxDB with PouchDB/IndexedDB
- **Automatic Sync**: When online, changes are replicated to MongoDB Atlas
- **Data Models**: Businesses and Articles with a one-to-many relationship
- **Reactivity**: UI updates automatically when data changes


<!-- https://www.npmjs.com/package/realm-web -->

<!-- https://www.mongodb.com/docs/atlas/app-services/data-api/ -->