import React, { useState, useRef, useEffect, useCallback } from "react";
import "./LogMyMeal.css";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button-ui";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ImageIcon, SendIcon, UploadIcon, ClockIcon, PlusIcon, Trash2, Heart } from "lucide-react";
import { API_BASE_URL } from '../config';
import Navbar from "../components/ui/Navbar";
import { useNavigate } from 'react-router-dom';
import { useFavoriteRecipes } from "../context/FavoriteRecipesContext";

const LogMyMeal = () => {
  const navigate = useNavigate();
  const { isFavorite, addFavoriteRecipe, removeFavoriteRecipe } = useFavoriteRecipes();
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: "bot-1",
      type: "bot",
      content: `Hi ${JSON.parse(localStorage.getItem('userProfile') || '{}').name || 'there'}! I'm BiteBot, and I'm here to help you log your meal. Would you like to upload a picture of your meal?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState("initial");
  const [mealAnalysis, setMealAnalysis] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '', show: false });
  const messagesEndRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzingMeal, setIsAnalyzingMeal] = useState(false);
  const [lastUploadedImageUrl, setLastUploadedImageUrl] = useState(null);
  const [openRecipeModalIdx, setOpenRecipeModalIdx] = useState(null);

  // --- Add ref for previous activeChat --- Add this section
  const prevActiveChatRef = useRef();

  // Add a mount ref
  const isMounted = useRef(false);

  // Add a ref to track the last saved meal
  const lastSavedMealRef = useRef(null);

  // Add loading state ref
  const isLoadingRef = useRef(false);

  // Add a ref to track if the current analysis result has been saved to backend
  const hasSavedAnalysisRef = useRef(null);

  // Add a ref to track the unique analysis session ID
  const analysisSessionIdRef = useRef(null);

  // Load chat history on component mount
  useEffect(() => {
    // Skip if already mounted or loading
    if (isMounted.current || isLoadingRef.current) {
      return;
    }
    isMounted.current = true;
    isLoadingRef.current = true;

    const loadChatHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        console.log('Loading chat history...');
        const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }
        
        const data = await response.json();
        console.log('Received chat history:', data);
        
        if (data.data && Array.isArray(data.data)) {
          // Process each chat to ensure proper formatting
          const processedChats = data.data.map(chat => ({
            ...chat,
            _id: chat.id || chat._id, // Ensure we have a consistent ID field
            title: chat.meal_analysis?.meal_name || chat.title || "Analyzed Meal",
            timestamp: chat.timestamp || chat.created_at || new Date().toISOString(),
            messages: chat.messages || [],
            meal_analysis: chat.meal_analysis || null
          }));
          
          console.log('Processed chat history:', processedChats);
          setChatHistory(processedChats);
          
          // Check if we're starting a new chat or continuing an existing one
          const urlParams = new URLSearchParams(window.location.search);
          const chatId = urlParams.get('chatId');
          
          if (chatId && processedChats.length > 0) {
            // Find the specific chat if chatId is provided
            const selectedChat = processedChats.find(chat => chat._id === chatId);
            if (selectedChat) {
              console.log('Loading existing chat:', selectedChat);
              setActiveChat(selectedChat._id);
              setMessages(selectedChat.messages);
              setMealAnalysis(selectedChat.meal_analysis);
              
              // Update the URL to remove the chatId parameter
              const newUrl = window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
              return;
            }
          }
          
          // If no chatId or chat not found, start a new chat
          console.log('Starting a new chat session');
          handleStartNewChat();
        } else {
          console.log('No chat history found, starting new chat');
          handleStartNewChat();
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // If there's an error, still start a new chat
        handleStartNewChat();
      } finally {
        isLoadingRef.current = false;
      }
    };
    
    loadChatHistory();

    // Cleanup function
    return () => {
      isMounted.current = false;
      isLoadingRef.current = false;
    };
  }, []); // Empty dependency array to run only once on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update the message ID generation to include a random component
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Update handleStartNewChat to prevent multiple new chats
  const handleStartNewChat = useCallback(() => {
    // Prevent starting new chat during or after analysis
    if (isAnalyzingMeal || mealAnalysis) {
      console.log('Preventing new chat start: Analysis in progress or recently completed.');
      return;
    }

    // Check if there's already a temporary chat
    const existingTempChat = chatHistory.find(chat => chat._id?.startsWith('temp-'));
    if (existingTempChat) {
      console.log('Using existing temporary chat:', existingTempChat);
      setActiveChat(existingTempChat._id);
      setMessages(existingTempChat.messages);
      return;
    }

    const now = new Date();
    
    // Clear any previous state
    setActiveChat(null);
    setConversationHistory([]);
    setCurrentQuestion(null);
    setCurrentStep("initial");
    setMealAnalysis(null);
    
    // Set initial welcome message with unique ID and personalized greeting
    const initialMessage = {
      id: generateUniqueId(),
      type: "bot",
      content: `Hi ${JSON.parse(localStorage.getItem('userProfile') || '{}').name || 'there'}! I'm BiteBot, and I'm here to help you log your meal. Would you like to upload a picture of your meal?`,
      timestamp: now.toISOString(),
    };
    
    setMessages([initialMessage]);

    // Add a new chat entry with timestamp
    const newChatId = `temp-${Date.now()}`;
    setActiveChat(newChatId);
    
    // Create new chat entry
    const newChat = {
      _id: newChatId,
      title: "New Meal Analysis",
      messages: [initialMessage],
      meal_analysis: null,
      timestamp: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    
    // Update chat history by replacing any existing temporary chats
    setChatHistory(prev => {
      const filteredChats = prev.filter(chat => !chat._id?.startsWith('temp-'));
      return [newChat, ...filteredChats];
    });
    
    console.log('New chat started:', newChat);
  }, [chatHistory, isAnalyzingMeal, mealAnalysis]);

  // Handle deleting a chat
  const handleDeleteChat = async (chatId, event) => {
    // Prevent event propagation if event is provided
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      // Validate chat ID
      if (!chatId || typeof chatId !== 'string') {
        console.error('Invalid chat ID provided for deletion:', chatId);
        setNotification({
          message: 'Error: Cannot delete this chat (invalid ID)',
          type: 'error',
          show: true
        });
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
        return;
      }
      
      console.log(`Deleting chat with ID: ${chatId}`);
      
      // Check if this is a temporary chat (client-side only)
      if (chatId.startsWith('temp-')) {
        console.log('Deleting temporary chat from local state only');
        
        // Remove from local state only
        setChatHistory(prevChats => prevChats.filter(chat => chat._id !== chatId));
        
        // If the deleted chat was the active chat, reset the state
        if (activeChat === chatId) {
          setActiveChat(null);
          handleStartNewChat();
        }
        
        setNotification({
          message: 'Chat deleted successfully',
          type: 'success',
          show: true
        });
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
        
        return;
      }
      
      // For permanent chats, delete from the backend
      setIsLoading(true);
      console.log(`Attempting to delete chat with ID: ${chatId} from backend`);
      
      // Get token and ensure it exists
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Remove Bearer prefix if it exists
      const cleanToken = token.replace('Bearer ', '');
      
      // Log the full URL and headers for debugging
      const deleteUrl = `${API_BASE_URL}/api/chat/history/${chatId}`;
      console.log('Delete URL:', deleteUrl);
      console.log('Headers:', {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      });
      
      // Send a request to delete the chat from the backend
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete chat' }));
        console.error('Delete error response:', errorData);
        
        if (response.status === 401) {
          // Handle authentication error
          localStorage.removeItem('token');
          navigate('/signup');
          throw new Error('Authentication error. Please log in again.');
        }
        throw new Error(errorData.detail || 'Failed to delete chat from the backend');
      }

      // Fetch updated chat history from the backend
      const historyResponse = await fetch(`${API_BASE_URL}/api/chat/history`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        }
      });

      if (!historyResponse.ok) {
        throw new Error('Failed to fetch updated chat history');
      }

      const historyData = await historyResponse.json();
      setChatHistory(historyData.data);

      // If the deleted chat was the active chat, start a new chat
      if (activeChat === chatId) {
        setActiveChat(null);
        setMessages([{
          id: generateUniqueId(),
          type: "bot",
          content: `Hi ${JSON.parse(localStorage.getItem('userProfile') || '{}').name || 'there'}! I'm BiteBot, and I'm here to help you log your meal. Would you like to upload a picture of your meal?`,
          timestamp: new Date(),
        }]);
      }
      
      setNotification({
        message: 'Chat deleted successfully',
        type: 'success',
        show: true
      });
      
    } catch (error) {
      console.error('Error deleting chat:', error);
      setNotification({
        message: `Error: ${error.message}`,
        type: 'error',
        show: true
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // Save chat to backend
  const saveChatToBackend = async (chatId, messages, mealAnalysis) => {
    try {
      // Process messages to ensure recipe recommendations are properly serialized
      const processedMessages = messages.map(message => {
        if (message.isComponent && message.recipesData) {
          return {
            ...message,
            content: {
              type: 'RecipeRecommendations',
              props: {
                recipes: message.recipesData
              }
            }
          };
        }
        return message;
      });

      const response = await fetch(`${API_BASE_URL}/api/chat/history/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: processedMessages,
          meal_analysis: mealAnalysis
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save chat');
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const handleFileUpload = async (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    // Get the selected file
    const file = event.target.files[0];
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file.');
      return;
    }
    
    // Check file size
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert('Please select an image smaller than 5MB.');
      return;
    }
    
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Clear the previous image
      setLastUploadedImageUrl(null);
      
      // Add user message with image
      const userMessage = {
        id: generateUniqueId(),
        type: "user",
        content: "",
        timestamp: new Date().toISOString(),
        image: URL.createObjectURL(file),
      };
      
      // Add loading message
      const loadingMessage = {
        id: generateUniqueId(),
        type: "bot",
        content: "Analyzing your meal image...",
        timestamp: new Date().toISOString(),
        isLoading: true,
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage, loadingMessage]);
      
      // Scroll to the bottom after adding messages
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      // Upload the image
      const uploadResponse = await fetch(`${API_BASE_URL}/api/nutrition/analyze-meal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const uploadData = await uploadResponse.json();
      console.log('Image upload response:', uploadData);
      
      // Set the uploaded image URL
      const imageUrl = uploadData.data.image_url;
      setLastUploadedImageUrl(imageUrl);
      
      // Use the data from uploadResponse
      const analysisData = uploadData.data;
      
      // Update the loading message with the analysis
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
        
        if (loadingIndex !== -1) {
          updatedMessages[loadingIndex] = {
            ...updatedMessages[loadingIndex],
            content: `I've analyzed your meal! I can see ${analysisData.detected_ingredients?.map(
              item => `${item.name} (${item.portion})`
            ).join(", ") || "some ingredients"}. Let me ask you a few questions to get more details.`,
            isLoading: false,
          };
        }
        
        // Add first clarifying question if available
        if (analysisData.clarifying_questions && analysisData.clarifying_questions.length > 0) {
          const firstQuestion = analysisData.clarifying_questions[0];
          updatedMessages.push({
            id: generateUniqueId(),
            type: "bot",
            content: firstQuestion.question,
            timestamp: new Date().toISOString(),
            isQuestion: true,
            category: firstQuestion.category,
            validation: firstQuestion.validation_rules
          });
          
          // Set the current question and meal analysis
          setCurrentQuestion(firstQuestion);
          setMealAnalysis(analysisData);
        }
        
        return updatedMessages;
      });
      
      // Update current step
      setCurrentStep("conversation");
      
    } catch (error) {
      console.error("Error handling file upload:", error);
      
      // Replace the loading message with an error
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isLoading 
            ? {
                ...msg,
                content: `Error analyzing image: ${error.message}. Please try again.`,
                isLoading: false,
                isError: true
              }
            : msg
        )
      );
    }
  };

  const validateUserResponse = (question, response) => {
    // Add validation logic based on question type
    if (question.includes("oil/fat")) {
      return response.toLowerCase().includes("tbsp") || response.toLowerCase().includes("tsp") || response.toLowerCase().includes("ml");
    }
    if (question.includes("serving size")) {
      return response.toLowerCase().includes("cup") || response.toLowerCase().includes("g") || response.toLowerCase().includes("piece");
    }
    if (question.includes("cooking method")) {
      return response.toLowerCase().includes("fried") || response.toLowerCase().includes("baked") || response.toLowerCase().includes("boiled") || response.toLowerCase().includes("roasted");
    }
    return true;
  };

  // Update handleUserMessage to pass updatedMessages to getFinalAnalysis
  const handleUserMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const message = inputMessage;
    setInputMessage(""); // Clear input after sending

    // Create a new message object with unique ID
    const newUserMessage = {
      id: generateUniqueId(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Add the user message to the messages array
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    // Save the updated chat to the backend
    await saveChatToBackend(activeChat, updatedMessages, mealAnalysis);

    try {
      // Check if this is a response to the recipe recommendations question
      const lastBotMessage = messages[messages.length - 1];
      if (lastBotMessage?.type === "bot" && 
          lastBotMessage.content.includes("Would you like to see recommended recipes")) {
        
        // If user says yes, show recipe recommendations
        if (message.toLowerCase().trim() === "yes") {
          // Add loading message
          const loadingMessage = {
            id: generateUniqueId(),
            type: "bot",
            content: "Fetching recipe recommendations...",
            isLoading: true,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, loadingMessage]);

          try {
            // Use hardcoded recipes directly
            const recipes = [
              {
                name: "Tomato & Herb Chicken Pasta",
                description: "A delicious pasta dish with tender chicken, fresh tomatoes, and aromatic herbs. Perfect for a quick and healthy dinner.",
                ingredients: [
                  "200g whole wheat pasta",
                  "2 chicken breasts",
                  "4 ripe tomatoes",
                  "Fresh basil and oregano",
                  "2 cloves garlic",
                  "2 tbsp olive oil",
                  "Salt and pepper to taste"
                ],
                benefits: [
                  "High in protein",
                  "Rich in antioxidants",
                  "Supports heart health",
                  "Balanced macronutrients"
                ]
              },
              {
                name: "Manipuri Eromba",
                description: "A traditional Manipuri dish made with vegetables and fermented fish, rich in probiotics and essential nutrients.",
                ingredients: [
                  "Mixed vegetables (pumpkin, potato, beans)",
                  "Fermented fish (ngari)",
                  "Green chilies",
                  "Fresh herbs",
                  "Bamboo shoot",
                  "Salt to taste"
                ],
                benefits: [
                  "Rich in probiotics",
                  "High in fiber",
                  "Supports gut health",
                  "Traditional preparation"
                ]
              },
              {
                name: "Peshawari Chapli Kebab",
                description: "A flavorful minced meat kebab from Peshawar, packed with aromatic spices and herbs.",
                ingredients: [
                  "500g minced meat",
                  "Onion and tomatoes",
                  "Fresh coriander",
                  "Pomegranate seeds",
                  "Spices (cumin, coriander, chili)",
                  "Egg for binding"
                ],
                benefits: [
                  "High in protein",
                  "Rich in iron",
                  "Low carb option",
                  "Traditional preparation"
                ]
              }
            ];

            // Remove loading message
            setMessages(prev => prev.filter(msg => !msg.isLoading));
            
            // Create a single message with all recipes
            const recipeMessage = {
              id: generateUniqueId(),
              type: "bot",
              content: <RecipeRecommendations recipes={recipes} />,
              timestamp: new Date().toISOString(),
              isComponent: true,
              // Add the recipes data separately for serialization
              recipesData: recipes
            };
            
            // Update messages with recipe recommendations
            const updatedMessagesWithRecipes = [...updatedMessages, recipeMessage];
            setMessages(updatedMessagesWithRecipes);
            
            // Save the updated messages with recipes to the backend
            await saveChatToBackend(activeChat, updatedMessagesWithRecipes, mealAnalysis);
          } catch (error) {
            // Remove loading message
            setMessages(prev => prev.filter(msg => !msg.isLoading));
            
            // Add error message
            const errorMessage = {
              id: generateUniqueId(),
              type: "bot",
              content: `Sorry, I encountered an error while preparing recipe recommendations: ${error.message}. Please try again.`,
              timestamp: new Date().toISOString(),
            };
            
            const updatedMessagesWithError = [...updatedMessages, errorMessage];
            setMessages(updatedMessagesWithError);
            
            // Save the updated messages to the backend
            await saveChatToBackend(activeChat, updatedMessagesWithError, mealAnalysis);
          }
          return;
        } else {
          // If user says anything other than yes, end the chat
          const endChatMessage = {
            id: generateUniqueId(),
            type: "bot",
            content: "Thank you for using BiteBot! Feel free to start a new chat when you want to analyze another meal.",
            timestamp: new Date().toISOString(),
          };
          
          const updatedMessagesWithEndChat = [...updatedMessages, endChatMessage];
          setMessages(updatedMessagesWithEndChat);
          
          // Save the updated messages to the backend
          await saveChatToBackend(activeChat, updatedMessagesWithEndChat, mealAnalysis);
          return;
        }
      }

      if (currentQuestion) {
        // Validate user response
        if (!validateUserResponse(currentQuestion.question, message)) {
          setMessages(prev => [...prev, {
            id: generateUniqueId(),
            type: "bot",
            content: "I need more specific information. Could you please provide the amount and unit? For example, '2 tablespoons olive oil' or '1 cup rice'.",
            timestamp: new Date().toISOString(),
          }]);
          return;
        }

        // Add user response to conversation history
        setConversationHistory(prev => [...prev, {
          role: "user",
          content: message
        }]);

        // Find the current question index
        const currentIndex = mealAnalysis?.clarifying_questions?.findIndex(
          q => q.question === currentQuestion.question
        ) ?? -1;

        // Check if there are more questions
        if (currentIndex !== -1 && currentIndex < (mealAnalysis?.clarifying_questions?.length ?? 0) - 1) {
          // Move to next question
          const nextQuestion = mealAnalysis.clarifying_questions[currentIndex + 1];
          setCurrentQuestion(nextQuestion);
          // Add next question to messages
          setMessages(prev => [...prev, {
            id: generateUniqueId(),
            type: "bot",
            content: nextQuestion.question,
            timestamp: new Date().toISOString(),
            isQuestion: true,
            category: nextQuestion.category,
            validation: nextQuestion.validation_rules
          }]);
        } else {
          // No more questions, get final analysis using the up-to-date messages
          await getFinalAnalysis(updatedMessages);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        type: "bot",
        content: `Sorry, I encountered an error while processing your response: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  // Update getFinalAnalysis to accept messagesArg
  const getFinalAnalysis = async (messagesArg) => {
    // --- Add log at beginning of getFinalAnalysis --- Add this line
    console.log("getFinalAnalysis entered.");
    
    // Generate a unique ID for this analysis session if it doesn't exist
    if (!analysisSessionIdRef.current) {
      analysisSessionIdRef.current = generateUniqueId();
      console.log("New analysis session ID created:", analysisSessionIdRef.current);
    }

    // Prevent multiple analysis calls if already analyzing
    if (isAnalyzingMeal) {
      console.log("Analysis already in progress, skipping getFinalAnalysis call.");
      return;
    }

    try {
      setIsAnalyzingMeal(true);
      setIsAnalyzing(true);
      setError(null);
      
      // Add loading message
      const loadingMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
        type: "bot",
        content: "Analyzing your meal...",
        isLoading: true,
        timestamp: new Date().toISOString(),
      };
      
      // Add the loading message to the messages array
      const updatedMessages = [...messagesArg, loadingMessage];
      setMessages(updatedMessages);
      
      // Prepare conversation history
      const conversationHistory = [
        ...messagesArg.map(msg => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content
        }))
      ];
      
      const response = await fetch(`${API_BASE_URL}/api/nutrition/analyze-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversation_history: conversationHistory,
          user_profile: JSON.parse(localStorage.getItem('userProfile') || '{}')
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to analyze meal: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Directly call handleAnalysisDone here after successful analysis fetch, passing the session ID
      await handleAnalysisDone(data, analysisSessionIdRef.current);
      
    } catch (error) {
      setError(error.message || "Failed to analyze meal. Please try again.");
      // Replace the loading message with an error
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isLoading 
            ? {
                ...msg,
                content: `Error analyzing meal: ${error.message}. Please try again.`, // Specific error
                isLoading: false,
                isError: true
              }
            : msg
        )
      );
      console.error("Error in getFinalAnalysis:", error);
      
    } finally {
      // Ensure loading states are reset in finally block
      setIsAnalyzing(false);
      setIsAnalyzingMeal(false);
      console.log("getFinalAnalysis exited.");
    }
  };

  // Update handleAnalysisDone to prevent duplicate meal entries and accept session ID
  const handleAnalysisDone = async (data, sessionId) => {
    console.log("=== MEAL SAVING PROCESS STARTED ===");
    console.log("Session ID:", sessionId);
    console.log("Raw analysis data:", data);

    try {
      // Set the analysis results in state
      setMealAnalysis(data);
      
      // Get the meal data from the correct location in the response
      const mealData = data.data || data;
      console.log("Extracted meal data:", mealData);
      
      // Get the meal name from the data
      const mealName = mealData.meal_name || "Analyzed Meal";
      console.log("Meal name extracted:", mealName);
      
      // Check for duplicate prevention
      console.log("Checking for duplicate meals...");
      console.log("Last saved meal ref:", lastSavedMealRef.current);
      console.log("Has saved analysis ref:", hasSavedAnalysisRef.current);
      
      if (lastSavedMealRef.current &&
        lastSavedMealRef.current.meal_name === mealName &&
        hasSavedAnalysisRef.current === lastSavedMealRef.current.id) {
        console.log('DUPLICATE PREVENTION: Analysis for this session already saved (checked by meal name and ID)');
        return;
      }

      // Check for recent saves
      const now = new Date();
      const lastSavedMeal = lastSavedMealRef.current;
      if (lastSavedMeal &&
        lastSavedMeal.meal_name === mealName &&
        now - lastSavedMeal.timestamp < 500) {
        console.log('DUPLICATE PREVENTION: Meal was recently saved within 0.5s window');
        if (lastSavedMeal.id) {
          hasSavedAnalysisRef.current = lastSavedMeal.id;
        }
        return;
      }
      
      // Save to localStorage
      console.log("Saving to localStorage...");
      localStorage.setItem('lastAnalyzedMeal', JSON.stringify(mealData));
      localStorage.setItem('lastAnalyzedMealName', mealName);
      
      // Get image URL
      const imageUrl = lastUploadedImageUrl || mealData.image_url || '';
      console.log("Image URL for meal:", imageUrl);

      // Generate timestamps
      const saveTimestamp = new Date();
      const formattedDate = saveTimestamp.toISOString().split('T')[0];
      const formattedTimestamp = saveTimestamp.toISOString();
      console.log("Generated timestamps:", { formattedDate, formattedTimestamp });

      // Prepare meal data with proper fallbacks
      console.log("Preparing meal data for database...");
      const formattedMealData = {
        meal_name: mealName,
        date: formattedDate,
        timestamp: formattedTimestamp,
        image_url: imageUrl,
        ingredients: mealData.ingredients || [],
        cooking_method: mealData.cooking_method || '',
        serving_size: mealData.serving_size || '',
        macronutrients: {
          calories: Math.round(mealData.macronutrients?.calories || 0),
          protein: Math.round(mealData.macronutrients?.protein || 0),
          carbs: Math.round(mealData.macronutrients?.carbs || 0),
          fats: Math.round(mealData.macronutrients?.fats || 0),
          fiber: Math.round(mealData.macronutrients?.fiber || 0),
          sugar: Math.round(mealData.macronutrients?.sugar || 0),
          sodium: Math.round(mealData.macronutrients?.sodium || 0)
        },
        scores: {
          glycemic_index: Math.round(mealData.scores?.glycemic_index || 0),
          inflammatory: Math.round(mealData.scores?.inflammatory || 0),
          heart_health: Math.round(mealData.scores?.heart_health || 0),
          digestive: Math.round(mealData.scores?.digestive || 0),
          meal_balance: Math.round(mealData.scores?.meal_balance || 0)
        },
        health_tags: mealData.health_tags || [],
        health_benefits: mealData.health_benefits || [],
        potential_concerns: mealData.potential_concerns || [],
        suggestions: mealData.suggestions || [],
        // Convert recipe objects to strings
        recommended_recipes: (mealData.recommended_recipes || []).map(recipe => 
          typeof recipe === 'string' ? recipe : recipe.name
        ),
        micronutrient_balance: {
          score: Math.round(mealData.micronutrient_balance?.score || 0),
          priority_nutrients: (mealData.micronutrient_balance?.priority_nutrients || []).map(nutrient => ({
            name: nutrient.name || '',
            percentage: Math.round(nutrient.percentage || 0),
            description: nutrient.description || ''
          }))
        }
      };
      
      console.log("Prepared meal data:", formattedMealData);
      console.log("Sending POST request to /api/nutrition/meals...");

      // Save meal to database
      const mealResponse = await fetch(`${API_BASE_URL}/api/nutrition/meals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedMealData)
      });

      console.log("Meal save response status:", mealResponse.status);

      if (!mealResponse.ok) {
        const errorData = await mealResponse.json();
        console.error('Failed to save meal:', errorData);
        console.error('Error details:', errorData.detail);
        throw new Error(`Failed to save meal to database: ${JSON.stringify(errorData.detail)}`);
      }

      const savedMeal = await mealResponse.json();
      console.log("Meal saved successfully:", savedMeal);

      // Update refs
      lastSavedMealRef.current = {
        meal_name: mealName,
        timestamp: now,
        id: savedMeal.id
      };
      console.log("Updated lastSavedMealRef:", lastSavedMealRef.current);

      // Store saved meal ID
      const savedMealId = savedMeal.id;
      console.log("Saved meal ID:", savedMealId);

      // Prepare chat messages
      console.log("Preparing chat messages...");
      const timestamp = Date.now();
      const analysisMessageId = `analysis-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      const dashboardPromptId = `dashboard-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      const recipePromptId = `recipe-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

      // Create messages
      const analysisMessage = {
        id: analysisMessageId,
        type: "bot",
        content: generateAnalysisContent(mealData),
        timestamp: new Date().toISOString(),
        isAnalysis: true,
      };
      
      const dashboardPromptMessage = {
        id: dashboardPromptId,
        type: "bot",
        content: "Would you like to view this meal in your dashboard?",
        timestamp: new Date().toISOString(),
      };
      
      const recipePromptMessage = {
        id: recipePromptId,
        type: "bot",
        content: "Would you like to see recommended recipes based on this meal?",
        timestamp: new Date().toISOString(),
        isRecipePrompt: true,
      };
      
      // Update messages
      const updatedMessages = [...messages, analysisMessage, dashboardPromptMessage, recipePromptMessage];
      console.log("Updated messages array length:", updatedMessages.length);
      setMessages(updatedMessages);

      // Create new permanent chat
      console.log('Creating new permanent chat...');
      console.log("Chat creation params:", { activeChat, savedMealId, mealName });
      
      const newChatResponse = await fetch(`${API_BASE_URL}/api/chat/history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: mealName,
          messages: updatedMessages,
          image_url: imageUrl,
          meal_id: savedMealId,
          timestamp: formattedTimestamp,
          meal_analysis: formattedMealData
        })
      });

      console.log("Chat creation response status:", newChatResponse.status);

      if (!newChatResponse.ok) {
        throw new Error('Failed to create new chat');
      }

      const newChat = await newChatResponse.json();
      console.log('New chat created:', newChat);
      
      // Update flags and state
      hasSavedAnalysisRef.current = savedMealId;
      console.log("Updated hasSavedAnalysisRef:", hasSavedAnalysisRef.current);

      // Update chat history
      setChatHistory(prev => {
        const filteredChats = prev.filter(chat => !chat._id?.startsWith('temp-'));
        return [newChat.data, ...filteredChats];
      });
      
      // Set active chat
      setActiveChat(newChat.data._id);
      console.log("Set active chat to:", newChat.data._id);

      // Show success notification
      setNotification({
        message: 'Meal analysis completed successfully!',
        type: 'success',
        show: true
      });
      
      console.log("=== MEAL SAVING PROCESS COMPLETED SUCCESSFULLY ===");
      
    } catch (error) {
      console.error("=== MEAL SAVING PROCESS FAILED ===");
      console.error("Error details:", error);
      
      const errorMessage = {
        id: generateUniqueId(),
        type: "bot",
        content: `Sorry, there was an error saving your meal: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const generateAnalysisContent = (data) => {
    // Use data.data if present, otherwise fallback to data
    const d = data.data || data;

    const healthBenefits = (d.health_benefits || []).map(benefit => `- ${benefit}`).join('\n');
    const potentialConcerns = (d.potential_concerns || []).map(concern => `- ${concern}`).join('\n');
    const suggestions = (d.suggestions || []).map(suggestion => `- ${suggestion}`).join('\n');
    const healthTags = (d.health_tags || []).join(', ');

    const macros = d.macronutrients || {};
    const calories = Math.round(macros.calories || 0);
    const protein = Math.round(macros.protein || 0);
    const carbs = Math.round(macros.carbs || 0);
    const fats = Math.round(macros.fats || 0);
    const fiber = Math.round(macros.fiber || 0);
    const sugar = Math.round(macros.sugar || 0);
    const sodium = Math.round(macros.sodium || 0);

    const scores = d.scores || {};
    const glycemicIndex = Math.round(scores.glycemic_index || 0);
    const inflammatoryScore = Math.round(scores.inflammatory || 0);
    const heartHealth = Math.round(scores.heart_health || 0);
    const digestiveScore = Math.round(scores.digestive || 0);
    const mealBalance = Math.round(scores.meal_balance || 0);
    const micronutrientBalance = Math.round((d.micronutrient_balance && d.micronutrient_balance.score) || 0);

    return `**Meal Analysis**\n\n**Health Benefits:**\n${healthBenefits}\n\n**Potential Concerns:**\n${potentialConcerns}\n\n**Suggestions for Improvement:**\n${suggestions}\n\n**Health Tags:** ${healthTags}\n\n**Nutrient**|**Amount**\n---|---\nCalories|${calories} kcal\nProtein|${protein}g\nCarbs|${carbs}g\nFats|${fats}g\nFiber|${fiber}g\nSugar|${sugar}g\nSodium|${sodium}mg\n\n**Metric**|**Score**\n---|---\nGlycemic Index|${glycemicIndex}%\nInflammatory Score|${inflammatoryScore}%\nHeart Health|${heartHealth}%\nDigestive Score|${digestiveScore}%\nMeal Balance|${mealBalance}%\nMicronutrient Balance|${micronutrientBalance}%`;
  };

  const RecipeRecommendations = ({ recipes }) => {
    const [openIdx, setOpenIdx] = useState(null);

    if (!recipes || recipes.length === 0) {
      return (
        <div className="recipe-recommendations">
          <p>No recipe recommendations available at this time.</p>
        </div>
      );
    }

    // Helper for steps
    const getPreparationSteps = (name) => {
      if (name === "Tomato & Herb Chicken Pasta") {
        return [
          "Cook pasta according to package instructions until al dente.",
          "Season chicken breasts with salt and pepper, then cook in olive oil until golden and cooked through.",
          "In the same pan, sauté minced garlic until fragrant, then add diced tomatoes.",
          "Cook tomatoes until softened, then add fresh herbs (basil and oregano).",
          "Slice the cooked chicken and combine with the pasta and tomato sauce.",
          "Toss everything together and serve hot with extra herbs for garnish."
        ];
      } else if (name === "Manipuri Eromba") {
        return [
          "Wash and cut all vegetables into uniform pieces.",
          "Boil vegetables until tender but still firm.",
          "In a separate pan, heat oil and add fermented fish (ngari).",
          "Mash the vegetables and mix with the fermented fish.",
          "Add chopped green chilies and fresh herbs.",
          "Serve hot with steamed rice or as a side dish."
        ];
      } else if (name === "Peshawari Chapli Kebab") {
        return [
          "Mix minced meat with finely chopped onions, tomatoes, and fresh coriander.",
          "Add pomegranate seeds and all spices to the mixture.",
          "Add beaten egg and mix well to bind the ingredients.",
          "Shape the mixture into flat, round patties.",
          "Heat oil in a pan and cook the kebabs until golden brown on both sides.",
          "Serve hot with naan bread and chutney."
        ];
      }
      return [];
    };

    return (
      <div className="recipe-recommendations">
        <h3 className="text-xl font-bold mb-3 text-green-400">Recommended Recipes</h3>
        {recipes.map((recipe, index) => {
          const benefits = Array.isArray(recipe.benefits)
            ? recipe.benefits
            : typeof recipe.benefits === 'string'
              ? [recipe.benefits]
              : [];
          const preparationSteps = getPreparationSteps(recipe.name);
          return (
            <div key={index} className="recipe-card mb-4 p-4 border border-gray-600 rounded bg-black/20">
              <h4 className="font-bold text-green-300 mb-2">{recipe.name}</h4>
              <p className="mb-3">{recipe.description}</p>
              <div className="mb-3">
                <span className="font-medium text-green-300">Ingredients:</span>{' '}
                <span>{Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {benefits.map((benefit, i) => (
                  <span key={i} className="px-2 py-1 bg-green-900/50 text-green-300 rounded-full text-sm">{benefit}</span>
                ))}
              </div>
              <div className="recipe-details">
                <button
                  onClick={() => setOpenIdx(index)}
                  className="flex items-center text-green-300 hover:text-green-400 transition-colors w-full justify-start gap-2 font-medium mt-2"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  Preparation Steps
                </button>
                {openIdx === index && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
                    onClick={() => setOpenIdx(null)}
                  >
                    <div
                      className="relative bg-gray-900 rounded-lg p-8 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto border-2 border-green-500"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setOpenIdx(null)}
                        className="absolute top-4 right-4 text-green-500 text-2xl hover:text-green-400 transition-colors"
                      >
                        ×
                      </button>
                      <h4 className="text-green-500 font-bold text-xl mb-4">Preparation Steps</h4>
                      <ol className="space-y-3 text-white">
                        {preparationSteps.map((step, j) => (
                          <li key={j} className="pl-4 border-l-2 border-green-500/50">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div className="flex justify-center mt-4 mb-2">
          <a href="/recipes" className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded">
            Explore More Recipes
          </a>
        </div>
      </div>
    );
  };

  // Add window handler for toggling favorites
  useEffect(() => {
    window.handleToggleFavorite = async (recipeId) => {
      try {
        const recipe = mealAnalysis?.recommended_recipes?.find(r => r.recipe_id === recipeId);
        if (!recipe) return;

        if (isFavorite(recipeId)) {
          await removeFavoriteRecipe(recipeId);
        } else {
          await addFavoriteRecipe(recipe);
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    };
  }, [mealAnalysis, isFavorite, addFavoriteRecipe, removeFavoriteRecipe]);

  // Update handleChatSelect to properly handle recipe recommendations
  const handleChatSelect = (chatId) => {
    setActiveChat(chatId);
    const selectedChat = chatHistory.find(chat => chat._id === chatId);
    if (selectedChat) {
      // Process messages to properly handle recipe recommendations
      const processedMessages = selectedChat.messages.map(message => {
        // If this is a recipe recommendations message, recreate the component
        if (message.isComponent && message.content && message.content.props && message.content.props.recipes) {
          return {
            ...message,
            content: <RecipeRecommendations recipes={message.content.props.recipes} />
          };
        }
        return message;
      });
      
      setMessages(processedMessages);
      
      // If this chat has meal analysis data, restore it
      if (selectedChat.meal_analysis) {
        console.log("Restoring meal analysis from selected chat:", selectedChat.meal_analysis);
        setMealAnalysis(selectedChat.meal_analysis);
        
        // Also update localStorage for persistence
        localStorage.setItem('lastAnalyzedMeal', JSON.stringify(selectedChat.meal_analysis));
        if (selectedChat.meal_analysis.meal_name) {
          localStorage.setItem('lastAnalyzedMealName', selectedChat.meal_analysis.meal_name);
        }
        
        // Check if the chat already has the dashboard and recipe prompts
        const hasDashboardPrompt = selectedChat.messages.some(msg => 
          msg.type === "bot" && msg.content === "Would you like to view this meal in your dashboard?"
        );
        
        const hasRecipePrompt = selectedChat.messages.some(msg => 
          msg.type === "bot" && msg.isRecipePrompt
        );
        
        // If the chat doesn't have these prompts, add them with unique IDs
        let updatedMessages = [...processedMessages];
        let messagesChanged = false;
        
        if (!hasDashboardPrompt) {
          updatedMessages.push({
            id: generateUniqueId(),
            type: "bot",
            content: "Would you like to view this meal in your dashboard?",
            timestamp: new Date().toISOString(),
          });
          messagesChanged = true;
        }
        
        if (!hasRecipePrompt) {
          updatedMessages.push({
            id: generateUniqueId(),
            type: "bot",
            content: "Would you like to see recommended recipes based on this meal?",
            timestamp: new Date().toISOString(),
            isRecipePrompt: true,
          });
          messagesChanged = true;
        }
        
        // Update messages if needed
        if (messagesChanged) {
          setMessages(updatedMessages);
          
          // Save the updated messages to the backend
          saveChatToBackend(chatId, updatedMessages, selectedChat.meal_analysis);
        }
      } else {
        // Clear meal analysis if not present in the selected chat
        setMealAnalysis(null);
      }
    }
  };

  const handleViewInDashboard = () => {
    // Store the date in localStorage to ensure we load the correct day in the dashboard
    localStorage.setItem('selectedDashboardDate', new Date().toISOString().split('T')[0]);
    
    // Navigate to dashboard using direct window location change for more reliable navigation
    window.location.href = '/dashboard';
  };

  const formattedMessages = messages.map(message => ({
    ...message,
    formattedTime: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  // Add logs for state changes
  useEffect(() => {
    console.log("activeChat state changed:", activeChat);
  }, [activeChat]);

  useEffect(() => {
    console.log("mealAnalysis state changed:", mealAnalysis);
  }, [mealAnalysis]);

  // Add cleanup effect for React Router state updates
  useEffect(() => {
    // Cleanup function to handle React Router state updates
    return () => {
      // Clear any pending state updates
      setActiveChat(null);
      setMessages([]);
      setChatHistory([]);
      setMealAnalysis(null);
      setCurrentStep("initial");
      setConversationHistory([]);
      setCurrentQuestion(null);
    };
  }, []); // Empty dependency array to run only on unmount

  // Add cleanup effect for temporary chats
  useEffect(() => {
    // Cleanup temporary chats on unmount
    return () => {
      setChatHistory(prev => prev.filter(chat => !chat._id?.startsWith('temp-')));
    };
  }, []); // Empty dependency array to run only on unmount

  return (
    <div className="log-meal-container">
      <Navbar />
      <div className="glass-background" />
      <div className="chat-layout">
        <div className="chat-history-sidebar">
          <Button
            onClick={handleStartNewChat}
            className="w-full mb-4 bg-primary text-white hover:bg-primary/90"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Start New Chat
          </Button>
          {chatHistory.map(chat => (
            <div
              key={chat._id || chat.id || `temp-${chat.timestamp}-${Math.random().toString(36).substring(2, 9)}`}
              className={`chat-history-item ${activeChat === (chat._id || chat.id) ? 'active' : ''}`}
              onClick={() => handleChatSelect(chat._id || chat.id)}
            >
              <div className="chat-history-item-content">
                <div className="chat-history-item-title">
                  {chat.title}
                  <Trash2 
                    className="inline-block w-4 h-4 ml-2 cursor-pointer text-white float-right" 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const chatId = chat._id || chat.id;
                      console.log(`Deleting chat with ID: ${chatId}`);
                      console.log('Full chat object:', chat);
                      handleDeleteChat(chatId, e);
                    }} 
                  />
                </div>
                <div className="chat-history-item-time">
                  <ClockIcon className="inline-block w-4 h-4 mr-1" />
                  {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(chat.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-main">
          <div className="chat-messages">
            {formattedMessages.map((message, index) => (
              <div
                key={message.id}
                className={`message ${message.type === "bot" ? "bot" : "user"}`}
              >
                <div className="message-content">
                  {message.isLoading || (isAnalyzingMeal && index === formattedMessages.length - 1) ? (
                    <div className="loading-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </div>
                  ) : message.isComponent ? (
                    message.content
                  ) : (
                    <>
                      <div className="markdown-content">
                        {message.content.split('\n').map((line, i) => {
                          if (line.startsWith('**Meal Analysis**')) {
                            return <h2 key={i} className="text-xl font-bold mb-3 text-green-400">Meal Analysis</h2>;
                          } else if (line.startsWith('**') && line.endsWith(':**')) {
                            return <h3 key={i} className="font-bold mt-4 mb-2 text-green-300">{line.replace(/\*\*/g, '')}</h3>;
                          } else if (line.startsWith('**') && line.includes('|')) {
                            return null;
                          } else if (line.startsWith('**Health Tags:**')) {
                            const tags = line.replace('**Health Tags:**', '').trim();
                            return (
                              <div key={i} className="mt-3 mb-2">
                                <h3 className="font-bold mb-1 text-green-300">Health Tags:</h3>
                                <div className="flex flex-wrap gap-2">
                                  {tags.split(', ').map((tag, tagIndex) => (
                                    <span key={tagIndex} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          } else if (line.startsWith('- ')) {
                            return <li key={i} className="ml-5 mb-1">{line.substring(2)}</li>;
                          } else if (line.trim() === '') {
                            return <br key={i} />;
                          } else if (line.includes('|') && !line.startsWith('**')) {
                            return null;
                          } else {
                            return <p key={i}>{line}</p>;
                          }
                        })}
                        
                        {message.content.includes('**Nutrient**|**Amount**') && (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full bg-white/10 border border-gray-600 rounded">
                              <thead>
                                <tr>
                                  <th className="py-2 px-4 border-b border-gray-600 text-left font-medium">Nutrient</th>
                                  <th className="py-2 px-4 border-b border-gray-600 text-left font-medium">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {message.content.split('\n')
                                  .filter(line => line.includes('|') && !line.startsWith('**') && 
                                          !line.includes('---') && 
                                          !line.includes('Metric') && 
                                          !line.includes('Glycemic') && 
                                          !line.includes('Inflammatory') && 
                                          !line.includes('Heart Health') && 
                                          !line.includes('Digestive') && 
                                          !line.includes('Meal Balance'))
                                  .map((row, rowIndex) => (
                                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-black/20' : ''}>
                                      {row.split('|').map((cell, cellIndex) => (
                                        <td key={cellIndex} className="py-2 px-4 border-t border-gray-600">{cell.trim()}</td>
                                      ))}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {message.content.includes('**Metric**|**Score**') && (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full bg-white/10 border border-gray-600 rounded mb-4">
                              <thead>
                                <tr>
                                  <th className="py-2 px-4 border-b border-gray-600 text-left font-medium">Metric</th>
                                  <th className="py-2 px-4 border-b border-gray-600 text-left font-medium">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {message.content.split('\n')
                                  .filter(line => line.includes('|') && 
                                          (line.includes('Glycemic') || 
                                           line.includes('Inflammatory') || 
                                           line.includes('Heart Health') || 
                                           line.includes('Digestive') || 
                                           line.includes('Meal Balance')))
                                  .map((row, rowIndex) => (
                                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-black/20' : ''}>
                                      {row.split('|').map((cell, cellIndex) => (
                                        <td key={cellIndex} className="py-2 px-4 border-t border-gray-600">{cell.trim()}</td>
                                      ))}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      {message.image && (
                        <div className="message-image-container">
                          <img 
                            src={message.image} 
                            alt="Uploaded meal" 
                            className="message-image"
                          />
                        </div>
                      )}
                    </>
                  )}
                  {message.content === "Would you like to view this meal in your dashboard?" && (
                    <div className="mt-2">
                      <Button
                        onClick={handleViewInDashboard}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        View in Dashboard
                      </Button>
                    </div>
                  )}
                </div>
                <div className="message-timestamp">
                  {message.formattedTime}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {currentStep === "initial" && (
            <div className="upload-section">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="upload-button"
              >
                <UploadIcon className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Meal Photo"}
              </Button>
            </div>
          )}

          {(currentStep === "conversation" || currentStep === "complete") && (
            <form onSubmit={handleUserMessage} className="input-form">
              <div className="input-container">
                <Input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="message-input"
                />
                <Button type="submit" className="send-button">
                  <SendIcon className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      {notification.show && (
        <div className={`notification fixed bottom-4 right-4 p-4 rounded-md shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default LogMyMeal;