# BiteBot - Your Personalized South Asian Wellness Guide 🥘

BiteBot is a comprehensive wellness platform that helps users maintain a healthy lifestyle while staying connected to their South Asian culinary roots. The application combines modern nutritional science with traditional South Asian cooking to provide personalized meal recommendations, recipe modifications, and health tracking.

## Features 🌟

### Meal Analysis & Logging 📸
- **AI-Powered Food Tracking**
  - Upload food images for automatic ingredient detection
  - Interactive chat for meal details
  - Get personalized recipe suggestions
  - Detailed Meal Analysis:
    - Macronutrients (protein, carbs, fats)
    - Sugar, Fiber, Sodium
    - Caloric content
    - Potential Concerns, Meal Improvements

### Health Scoring System 📊
- **Personalized Health Metrics**:
  - Glycemic Index Score
  - Inflammatory Score
  - Heart Health Score
  - Digestive Score
  - Meal Balance Score
  - Micronutrient Balance Score

### Personal Dashboard 📱
- Monitor daily nutrient intake
- View meal history
- Track health goals progress
- Access saved recipes
- Personalized recipe recommendations

### Recipe Management 🍳
- **Browse & Search**:
  - Filter by dietary preferences (Vegetarian, Vegan, etc.)
  - Search by health goals (Low-Sugar, High-Protein, etc.)
  - Sort by meal types and cultural styles
  - Add Ingredients to Shopping List
  - Save Shopping List to device
- **Save & Customize**:
  - Save favorite recipes
  - View detailed nutritional information

### EatWell Guide 📖
- Cultural nutrition insights
- Healthy cooking techniques
- Ingredient substitutions
- Traditional wisdom meets modern nutrition

## Tech Stack 💻

### Frontend
- React.js
- TailwindCSS
- Lucide React (Icons)
- React Router
- Axios for API calls

### Backend
- FastAPI
- MongoDB
- Python 3.x
- Docker
- OpenAI GPT-4 Vision API

## Getting Started 🚀

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- Docker and Docker Compose (optional)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/BiteBot.git
cd BiteBot
```

2. Frontend Setup:
```bash
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

npm start
```
The frontend will be available at http://localhost:3000

3. Backend Setup:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

uvicorn app.main:app --reload
```
The backend API will be available at http://localhost:8000

### Docker Setup (Alternative)
```bash
docker-compose up --build
```

## Available Scripts 🛠️

### Frontend Scripts
- `npm start`: Run the app in development mode (http://localhost:3000)
- `npm test`: Launch the test runner in interactive watch mode
- `npm run build`: Build the app for production (outputs to `build` folder)
- `npm run eject`: Eject from Create React App (one-way operation)

### Backend Scripts
- `uvicorn app.main:app --reload`: Start the backend server with hot reload
- `pytest`: Run backend tests
- `python run.py`: Start the backend server

## Project Structure 📁

```
BiteBot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.js
│   ├── package.json
│   └── Dockerfile
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── models/
│   │   └── recipes.json
│   ├── requirements.txt
│   └── Dockerfile
└── docker-compose.yml
```

## Environment Variables 🔐

### Backend (.env)
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
```

### Frontend (.env.local)
```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact 📧

Your Name - liyanasaleem0@gmail.com
Project Link: https://github.com/liyanasaleem2003/BiteBot
