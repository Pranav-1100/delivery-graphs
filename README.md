# Dijkstra Route Optimization

**Finding the shortest and most optimized delivery routes using Dijkstra's Algorithm**

##  Quick Links

- **Demo Video:** [Video](https://drive.google.com/file/d/1Npbb0nBbGJr_Bet0RgG96qAa-Viy88iz/view?usp=sharing)

##  What it does

This application optimizes delivery routes for delivery partners using **Dijkstra's shortest path algorithm**. It automatically assigns orders to delivery partners while respecting time and capacity constraints, ensuring the most efficient delivery routes.

**Key Features:**
-  Real-time route optimization using Google Maps API
-  30-minute delivery time constraints
-  Maximum 5 packages per partner
-  Smart auto-assignment algorithm
-  Step-by-step algorithm visualization

##  How to Use

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd delivery-graphs
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the `server` directory:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
PORT=5000
MAX_PACKAGES_PER_PARTNER=5
MAX_DELIVERY_TIME_MINUTES=30
```

### 4. Run the Application

**Option A: Run Both Together**
```bash
# From root directory
npm start  # Starts frontend on port 3000
cd server && npm start  # Starts backend on port 5000
```

**Option B: Run Separately**
```bash
# Terminal 1 - Frontend
npm start

# Terminal 2 - Backend
cd server
npm run dev
```

### 5. Use the App
1. Open `http://localhost:3000` in your browser
2. Click **" Load Demo Data"** to initialize sample partners and orders
3. Click **" Auto Assign with Dijkstra Algorithm"** to see the optimization in action
4. View the step-by-step algorithm execution and optimal routes

## Tech Stack

- **Frontend:** React.js, CSS
- **Backend:** Node.js, Express.js
- **Algorithm:** Dijkstra's Shortest Path
- **Maps:** Google Maps Distance Matrix API
- **Data:** In-memory storage with constraint validation


## Algorithm Details

The application uses **Dijkstra's Algorithm** to find optimal delivery routes by:

1. Building a graph with all pickup/delivery locations
2. Calculating real distances using Google Maps API
3. Finding shortest paths between all locations
4. Optimizing pickup → delivery sequence
5. Validating time and capacity constraints
