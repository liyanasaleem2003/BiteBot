# BiteBot

bitebot-backend/
│
├── app/
│   ├── main.py              # Entry point for FastAPI app
│   ├── models.py            # Pydantic models
│   ├── database.py          # MongoDB connection setup
│   ├── routes/
│   │   ├── auth.py          # Login/Signup routes
│   │   ├── profile.py       # User profile-related routes
│   │   ├── chatbot.py       # GPT-4 conversational routes
│   │   ├── meal_plan.py     # Meal plan generation routes
│   │   └── wellness.py      # Wellness advice routes
│   └── utils.py             # Utility functions (e.g., GPT API calls)
├── .env                     # Environment variables
├── requirements.txt         # Python dependencies
└── README.md
