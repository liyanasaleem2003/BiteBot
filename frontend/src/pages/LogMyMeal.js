import React, { useState, useRef, useEffect } from "react";
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
  const [messages, setMessages] = useState([
    {
      id: "bot-1",
      type: "bot",
      content: "Hi! I'm here to help you log your meal. Would you like to upload a picture of your meal?",
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
  const fileInputRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzingMeal, setIsAnalyzingMeal] = useState(false);
  const [lastUploadedImageUrl, setLastUploadedImageUrl] = useState(null);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }
        
        const data = await response.json();
        setChatHistory(data.data);
        
        // Check if we're starting a new chat or continuing an existing one
        const urlParams = new URLSearchParams(window.location.search);
        const chatId = urlParams.get('chatId');
        
        if (chatId && data.data.length > 0) {
          // Find the specific chat if chatId is provided
          const selectedChat = data.data.find(chat => chat._id === chatId);
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
      } catch (error) {
        console.error('Error loading chat history:', error);
        // If there's an error, still start a new chat
        handleStartNewChat();
      }
    };
    
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update the message ID generation to include a random component
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Update where we create new messages
  const handleStartNewChat = () => {
    const now = new Date();
    
    // Clear any previous state
    setActiveChat(null);
    setConversationHistory([]);
    setCurrentQuestion(null);
    setCurrentStep("initial");
    
    // Check if there's a previously analyzed meal name to restore
    const lastMealName = localStorage.getItem('lastAnalyzedMealName');
    const lastAnalyzedMeal = localStorage.getItem('lastAnalyzedMeal');
    
    if (lastAnalyzedMeal && lastMealName) {
      try {
        // Restore the meal analysis data
        const mealData = JSON.parse(lastAnalyzedMeal);
        setMealAnalysis(mealData);
        console.log(`Restored previous meal analysis for: ${lastMealName}`);
      } catch (error) {
        console.error('Error restoring meal analysis:', error);
        setMealAnalysis(null);
      }
    } else {
      setMealAnalysis(null);
    }
    
    // Set initial welcome message with unique ID
    setMessages([{
      id: generateUniqueId(),
      type: "bot",
      content: "Hi! I'm here to help you log your meal. Would you like to upload a picture of your meal?",
      timestamp: now,
    }]);

    // Add a new chat entry with timestamp
    setChatHistory(prev => [{
      _id: `temp-${Date.now()}`, // Temporary ID for new chat
      title: "New Meal Analysis",
      messages: [{
        id: generateUniqueId(),
        type: "bot",
        content: "Hi! I'm here to help you log your meal. Would you like to upload a picture of your meal?",
        timestamp: now,
      }],
      meal_analysis: null,
      timestamp: now,
      created_at: now,
      updated_at: now
    }, ...prev]);
    
    console.log('New chat started');
  };

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
      
      // Send a request to delete the chat from the backend
      const response = await fetch(`${API_BASE_URL}/api/chat/history/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete chat' }));
        throw new Error(errorData.detail || 'Failed to delete chat from the backend');
      }

      // Remove chat from local state
      setChatHistory(prev => {
        console.log(`Removing chat ${chatId} from state`);
        return prev.filter(chat => chat._id !== chatId);
      });
      
      // If the deleted chat was the active chat, reset the active chat and start a new chat
      if (activeChat === chatId) {
        setActiveChat(null);
        handleStartNewChat();
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
  const saveChatToBackend = async (chatId, updatedMessages, updatedMealAnalysis) => {
    try {
      // Skip saving for temporary chats
      if (chatId && chatId.startsWith('temp-')) {
        console.log('Skipping backend save for temporary chat');
        
        // Update local state
        setChatHistory(prev => {
          return prev.map(chat => {
            if (chat._id === chatId) {
              return {
                ...chat,
                messages: updatedMessages,
                meal_analysis: updatedMealAnalysis || chat.meal_analysis,
                updated_at: new Date()
              };
            }
            return chat;
          });
        });
        
        return;
      }
      
      console.log(`Saving chat with ID: ${chatId} to backend`);
      console.log('Updated messages:', updatedMessages);
      console.log('Updated meal analysis:', updatedMealAnalysis);
      
      // If no chatId, create a new chat
      if (!chatId) {
        console.log('Creating new chat in backend');
        const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: updatedMealAnalysis?.meal_name || "New Meal Analysis",
            messages: updatedMessages,
            meal_analysis: updatedMealAnalysis
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create chat');
        }
        
        const data = await response.json();
        
        // Update local state with the new chat
        setChatHistory(prev => [data.data, ...prev]);
        setActiveChat(data.data._id);
        
        return data.data._id;
      } else {
        // Update existing chat
        console.log(`Updating existing chat: ${chatId}`);
        const response = await fetch(`${API_BASE_URL}/api/chat/history/${chatId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: updatedMealAnalysis?.meal_name || "Meal Analysis",
            messages: updatedMessages,
            meal_analysis: updatedMealAnalysis
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update chat');
        }
        
        // Update local state
        setChatHistory(prev => {
          return prev.map(chat => {
            if (chat._id === chatId) {
              return {
                ...chat,
                title: updatedMealAnalysis?.meal_name || chat.title,
                messages: updatedMessages,
                meal_analysis: updatedMealAnalysis || chat.meal_analysis,
                updated_at: new Date()
              };
            }
            return chat;
          });
        });
        
        return chatId;
      }
    } catch (error) {
      console.error('Error saving chat to backend:', error);
      return null;
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
      formData.append('image', file);
      
      // Clear the previous image
      setLastUploadedImageUrl(null);
      
      // Show loading state
      const newBotMessage = {
        id: generateUniqueId(),
        type: "bot",
        content: "Analyzing your image...",
        timestamp: new Date().toISOString(),
        isLoading: true,
      };
      
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
      
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
      
      // Use the data from uploadResponse instead of making a duplicate call
      const analysisData = uploadData.data;
      
      // Update the loading message with the results
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
        
        if (loadingIndex !== -1) {
          updatedMessages[loadingIndex] = {
            ...updatedMessages[loadingIndex],
            content: "I've analyzed your meal image! Here's what I can detect:",
            isLoading: false,
          };
        }
        
        // Add another message with the detected ingredients
        updatedMessages.push({
          id: generateUniqueId(),
          type: "bot",
          content: `I can see the following ingredients: ${
            analysisData.detected_ingredients?.map(
              item => `${item.name} (${item.portion})`
            ).join(", ") || "No ingredients detected"
          }`,
          timestamp: new Date().toISOString(),
        });
        
        // Add clarifying questions
        if (analysisData.clarifying_questions && analysisData.clarifying_questions.length > 0) {
          analysisData.clarifying_questions.forEach(question => {
            updatedMessages.push({
              id: generateUniqueId(),
              type: "bot",
              content: question.question,
              timestamp: new Date().toISOString(),
              isQuestion: true,
              category: question.category,
              validation: question.validation_rules
            });
          });
        }
        
        return updatedMessages;
      });
      
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

  // Update handleUserMessage to use unique IDs
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

    // Check if the last message was a recipe prompt
    const lastMessage = messages[messages.length - 1];
    const isRecipePrompt = lastMessage && 
      lastMessage.type === "bot" && 
      lastMessage.content.includes("Would you like to see recommended recipes based on this meal?");
    
    // Check if the last message was a dashboard prompt
    const isDashboardPrompt = lastMessage && 
      lastMessage.type === "bot" && 
      lastMessage.content.includes("Would you like to view this meal in your dashboard?");

    // If responding to recipe prompt
    if (isRecipePrompt) {
      const positiveResponses = ["yes", "yeah", "sure", "ok", "okay", "yep", "y", "please", "definitely", "absolutely"];
      const isPositiveResponse = positiveResponses.some(response => 
        message.toLowerCase().includes(response)
      );

      if (isPositiveResponse) {
        // Show loading indicator
        const loadingMessage = {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: "Searching for recipes that match your meal...",
          isLoading: true,
          timestamp: new Date().toISOString(),
        };
        
        const messagesWithLoading = [...updatedMessages, loadingMessage];
        setMessages(messagesWithLoading);

        try {
          // Get recipe recommendations
          const response = await fetch(`${API_BASE_URL}/api/nutrition/recipe-recommendations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              meal_analysis: mealAnalysis
            })
          });

          if (!response.ok) {
            throw new Error('Failed to get recipe recommendations');
          }

          const data = await response.json();
          console.log("Recipe recommendations:", data);

          // Remove loading indicator
          const updatedMessagesWithoutLoading = messagesWithLoading.filter(msg => !msg.isLoading);
          
          // Add bot response with recipe recommendations
          const recipeMessage = {
            id: `bot-${Date.now()}`,
            type: "bot",
            content: generateRecipeRecommendations(data.recipes),
            timestamp: new Date().toISOString(),
            isHtml: true,
          };
          
          const finalMessages = [...updatedMessagesWithoutLoading, recipeMessage];
          setMessages(finalMessages);
          
          // Save the updated chat with recipes to the backend
          await saveChatToBackend(activeChat, finalMessages, mealAnalysis);
          
        } catch (error) {
          console.error("Error getting recipe recommendations:", error);
          
          // Remove loading indicator and show error
          const updatedMessagesWithoutLoading = updatedMessages.filter(msg => !msg.isLoading);
          
          // Add error message
          const errorMessage = {
            id: `bot-${Date.now()}`,
            type: "bot",
            content: "Sorry, I encountered an error while getting recipe recommendations. Please try again later.",
            timestamp: new Date().toISOString(),
          };
          
          const finalMessages = [...updatedMessagesWithoutLoading, errorMessage];
          setMessages(finalMessages);
          
          // Save the updated chat with error message to the backend
          await saveChatToBackend(activeChat, finalMessages, mealAnalysis);
        }
      }
    }
    
    // If responding to dashboard prompt
    else if (isDashboardPrompt) {
      const positiveResponses = ["yes", "yeah", "sure", "ok", "okay", "yep", "y", "please", "definitely", "absolutely"];
      const isPositiveResponse = positiveResponses.some(response => 
        message.toLowerCase().includes(response)
      );

      if (isPositiveResponse) {
        // Call the handleViewInDashboard function
        handleViewInDashboard();
      }
    }
    
    // For other types of messages, process normally
    else {
      // Update chat history in database
      if (activeChat) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/chat/history/${activeChat}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, {
                id: `user-${Date.now()}`,
                type: "user",
                content: message,
                timestamp: new Date().toISOString(),
              }],
              meal_analysis: mealAnalysis
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update chat history');
          }
        } catch (error) {
          console.error('Error updating chat history:', error);
        }
      }

      // Update chat history state
      if (activeChat) {
        setChatHistory(prev => prev.map(chat => 
          chat._id === activeChat 
            ? { ...chat, messages: [...chat.messages, { id: `user-${Date.now()}`, type: "user", content: message, timestamp: new Date().toISOString() }] }
            : chat
        ));
      }

      // Add user response to conversation history
      setConversationHistory(prev => [...prev, {
        role: "user",
        content: message
      }]);

      try {
        if (currentQuestion) {
          // Validate user response
          if (!validateUserResponse(currentQuestion.question, message)) {
            setMessages(prev => [...prev, {
              id: `bot-${Date.now()}`,
              type: "bot",
              content: "I need more specific information. Could you please provide the amount and unit? For example, '2 tablespoons olive oil' or '1 cup rice'.",
              timestamp: new Date().toISOString(),
            }]);
            return;
          }

          // Add bot's question to conversation history
          setConversationHistory(prev => [...prev, {
            role: "assistant",
            content: currentQuestion.question
          }]);

          // Handle sub-questions if they exist
          if (currentQuestion.sub_questions) {
            const currentIndex = mealAnalysis.clarifying_questions.findIndex(
              q => q.question === currentQuestion.question
            );

            if (currentIndex < mealAnalysis.clarifying_questions.length) {
              const currentQuestionObj = mealAnalysis.clarifying_questions[currentIndex];
              const subQuestionIndex = currentQuestionObj.sub_questions.findIndex(
                sq => sq === currentQuestion.current_sub_question
              );

              if (subQuestionIndex < currentQuestionObj.sub_questions.length - 1) {
                // Move to next sub-question
                const nextSubQuestion = currentQuestionObj.sub_questions[subQuestionIndex + 1];
                setCurrentQuestion({
                  ...currentQuestionObj,
                  current_sub_question: nextSubQuestion
                });
                setMessages(prev => [...prev, {
                  id: `bot-${Date.now()}`,
                  type: "bot",
                  content: nextSubQuestion,
                  timestamp: new Date().toISOString(),
                }]);
              } else {
                // Move to next main question
                if (currentIndex < mealAnalysis.clarifying_questions.length - 1) {
                  const nextQuestion = mealAnalysis.clarifying_questions[currentIndex + 1];
                  setCurrentQuestion(nextQuestion);
                  setMessages(prev => [...prev, {
                    id: `bot-${Date.now()}`,
                    type: "bot",
                    content: nextQuestion.question,
                    timestamp: new Date().toISOString(),
                  }]);
                } else {
                  // Get final analysis
                  await getFinalAnalysis();
                }
              }
            }
          } else {
            // Handle regular questions
            const currentIndex = mealAnalysis.clarifying_questions.findIndex(
              q => q.question === currentQuestion.question
            );

            if (currentIndex < mealAnalysis.clarifying_questions.length - 1) {
              // Move to next question
              const nextQuestion = mealAnalysis.clarifying_questions[currentIndex + 1];
              setCurrentQuestion(nextQuestion);
              setMessages(prev => [...prev, {
                id: `bot-${Date.now()}`,
                type: "bot",
                content: nextQuestion.question,
                timestamp: new Date().toISOString(),
              }]);
            } else {
              // Get final analysis
              await getFinalAnalysis();
            }
          }
        }
      } catch (error) {
        console.error("Error handling user message:", error);
        console.error("Error details:", error.stack);
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: `Sorry, I encountered an error while processing your response: ${error.message}. Please try again.`,
          timestamp: new Date().toISOString(),
        }]);
      }
    }
  };

  const getFinalAnalysis = async () => {
    try {
      setIsAnalyzingMeal(true);
      setIsAnalyzing(true);
      setError(null);
      
      // Add loading message
      const loadingMessage = {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: "Analyzing your meal...",
        isLoading: true,
        timestamp: new Date().toISOString(),
      };
      
      // Add the loading message to the messages array
      const updatedMessages = [...messages, loadingMessage];
      setMessages(updatedMessages);
      
      // Prepare conversation history
      const conversationHistory = [
        ...messages.map(msg => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content
        }))
      ];
      
      console.log("Sending analysis request with conversation history:", conversationHistory);
      
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
        console.error("Analysis error response:", errorData);
        throw new Error(errorData.detail || `Failed to analyze meal: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Received analysis response:", data);
      
      // Call handleAnalysisDone with the analysis data
      await handleAnalysisDone(data);
      
      setIsAnalyzing(false);
      setIsAnalyzingMeal(false);
    } catch (error) {
      console.error("Error in getFinalAnalysis:", error);
      setError(error.message || "Failed to analyze meal. Please try again.");
      setIsAnalyzing(false);
      setIsAnalyzingMeal(false);
    }
  };

  // Update handleAnalysisDone to use unique IDs
  const handleAnalysisDone = async (data) => {
    try {
      console.log("Handling analysis done with data:", data);
      
      // Set the analysis results in state
      setMealAnalysis(data);
      
      // Save to localStorage for persistence
      localStorage.setItem('lastAnalyzedMeal', JSON.stringify(data));
      if (data.meal_name) {
        localStorage.setItem('lastAnalyzedMealName', data.meal_name);
      }
      
      // Get the uploaded image URL if available
      const imageUrl = lastUploadedImageUrl || '';

      // Format current date properly 
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const formattedTimestamp = today.toISOString(); // ISO format timestamp
      
      // Prepare meal data for saving to the database
      const mealData = {
        meal_name: data.meal_name,
        date: formattedDate,
        timestamp: formattedTimestamp,
        image_url: imageUrl,
        ingredients: data.ingredients || [],
        cooking_method: data.cooking_method || '',
        serving_size: data.serving_size || '',
        macronutrients: {
          calories: data.macronutrients?.calories || 0,
          protein: data.macronutrients?.protein || 0,
          carbs: data.macronutrients?.carbs || 0,
          fats: data.macronutrients?.fats || 0,
          fiber: data.macronutrients?.fiber || 0,
          sugar: data.macronutrients?.sugar || 0,
          sodium: data.macronutrients?.sodium || 0
        },
        scores: {
          glycemic_index: data.scores?.glycemic_index || 0,
          inflammatory: data.scores?.inflammatory || 0,
          heart_health: data.scores?.heart_health || 0,
          digestive: data.scores?.digestive || 0,
          meal_balance: data.scores?.meal_balance || 0
        },
        health_tags: data.health_tags || [],
        health_benefits: data.health_benefits || [],
        potential_concerns: data.potential_concerns || [],
        suggestions: data.suggestions || [],
        recommended_recipes: data.recommended_recipes || [],
        micronutrient_balance: data.micronutrient_balance || {
          score: 0,
          priority_nutrients: []
        }
      };
      
      console.log("Saving meal with data:", mealData);

      // Save the meal to the database
      const mealResponse = await fetch(`${API_BASE_URL}/api/nutrition/meals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mealData)
      });

      if (!mealResponse.ok) {
        const errorData = await mealResponse.json();
        console.error('Failed to save meal:', errorData);
        console.error('Error details:', errorData.detail);
        throw new Error(`Failed to save meal to database: ${JSON.stringify(errorData.detail)}`);
      }

      const savedMeal = await mealResponse.json();
      console.log("Meal saved successfully:", savedMeal);

      // Generate unique IDs for each message using a more unique format
      const timestamp = Date.now();
      const analysisMessageId = `analysis-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      const dashboardPromptId = `dashboard-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      const recipePromptId = `recipe-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

      // Add the analysis message to the chat with unique ID
      const analysisMessage = {
        id: analysisMessageId,
        type: "bot",
        content: `${generateAnalysisContent(data)}`,
        timestamp: new Date().toISOString(),
        isAnalysis: true,
      };
      
      // Add the dashboard prompt message with unique ID
      const dashboardPromptMessage = {
        id: dashboardPromptId,
        type: "bot",
        content: "Would you like to view this meal in your dashboard?",
        timestamp: new Date().toISOString(),
      };
      
      // Add the recipe prompt message with unique ID
      const recipePromptMessage = {
        id: recipePromptId,
        type: "bot",
        content: "Would you like to see recommended recipes based on this meal?",
        timestamp: new Date().toISOString(),
        isRecipePrompt: true,
      };
      
      // Update messages state with all new messages
      const updatedMessages = [...messages, analysisMessage, dashboardPromptMessage, recipePromptMessage];
      setMessages(updatedMessages);
      
      // Save the chat with the meal analysis to the backend
      await saveChatToBackend(activeChat, updatedMessages, data);
      
    } catch (error) {
      console.error("Error handling analysis done:", error);
      // Add error message to chat with more specific error information
      const errorMessage = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "bot",
        content: `Sorry, there was an error saving your meal: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const generateAnalysisContent = (data) => {
    // Format health benefits, concerns, and suggestions
    const healthBenefits = (data.health_benefits || []).map(benefit => `- ${benefit}`).join('\n');
    const potentialConcerns = (data.potential_concerns || []).map(concern => `- ${concern}`).join('\n');
    const suggestions = (data.suggestions || []).map(suggestion => `- ${suggestion}`).join('\n');
    
    // Format health tags
    const healthTags = (data.health_tags || []).join(', ');
    
    // Check if macronutrients is nested inside data.data
    const macros = data.macronutrients || (data.data && data.data.macronutrients) || {};
    
    // Get macronutrients with fallbacks to prevent NaN
    const calories = Math.round(macros.calories || 0);
    const protein = Math.round(macros.protein || 0);
    const carbs = Math.round(macros.carbs || 0);
    const fats = Math.round(macros.fats || 0);
    const fiber = Math.round(macros.fiber || 0);
    const sugar = Math.round(macros.sugar || 0);
    const sodium = Math.round(macros.sodium || 0);
    
    // Get scores with proper fallback handling
    const scores = data.scores || data.health_scores || {};
    
    // Get scores with fallbacks and ensure they're percentages
    const glycemicIndex = Math.round(scores.glycemic_index || 0);
    const inflammatoryScore = Math.round(scores.inflammatory || 0);
    const heartHealth = Math.round(scores.heart_health || 0);
    const digestiveScore = Math.round(scores.digestive || 0);
    const mealBalance = Math.round(scores.meal_balance || 0);
    
    // Get micronutrient balance score from either scores or micronutrient_balance
    const micronutrientBalance = Math.round(
      scores.micronutrient_balance || 
      (data.micronutrient_balance && data.micronutrient_balance.score) || 
      0
    );
    
    return `**Meal Analysis**

**Health Benefits:**
${healthBenefits}

**Potential Concerns:**
${potentialConcerns}

**Suggestions for Improvement:**
${suggestions}

**Health Tags:** ${healthTags}

**Nutrient**|**Amount**
---|---
Calories|${calories} kcal
Protein|${protein}g
Carbs|${carbs}g
Fats|${fats}g
Fiber|${fiber}g
Sugar|${sugar}g
Sodium|${sodium}mg

**Metric**|**Score**
---|---
Glycemic Index|${glycemicIndex}%
Inflammatory Score|${inflammatoryScore}%
Heart Health|${heartHealth}%
Digestive Score|${digestiveScore}%
Meal Balance|${mealBalance}%
Micronutrient Balance|${micronutrientBalance}%`;
  };

  const generateRecipeRecommendations = (recipes) => {
    if (!recipes || recipes.length === 0) {
      return "Sorry, I don't have any recipe recommendations for this meal at the moment.";
    }

    let content = `<div class="recipe-recommendations">
      <h3 class="text-xl font-bold mb-3 text-green-400">Recommended Recipes</h3>`;
    
    recipes.forEach(recipe => {
      const isCurrentlyFavorite = isFavorite(recipe.recipe_id);
      content += `
        <div class="recipe-card mb-4 p-3 border border-gray-600 rounded bg-black/20 relative">
          <button 
            class="favorite-button absolute top-2 right-2 bg-transparent border-none cursor-pointer z-10"
            onclick="window.handleToggleFavorite('${recipe.recipe_id}')"
            title="${isCurrentlyFavorite ? "Remove from saved recipes" : "Add to saved recipes"}"
          >
            <svg class="heart ${isCurrentlyFavorite ? "filled" : ""}" width="30" height="30" viewBox="0 0 24 24" fill="${isCurrentlyFavorite ? "#ff3b30" : "transparent"}" stroke="${isCurrentlyFavorite ? "#ff3b30" : "white"}" stroke-width="1.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <h4 class="font-bold text-green-300">${recipe.name}</h4>
          <p class="mb-2">${recipe.description}</p>
          <div class="mb-2">
            <span class="font-medium text-green-300">Ingredients:</span> 
            ${recipe.ingredients.join(', ')}
          </div>
          <div class="mb-2">
            <span class="font-medium text-green-300">Benefits:</span> 
            ${recipe.benefits}
          </div>
        </div>`;
    });
    
    // Add Browse More Recipes button
    content += `
      <div class="flex justify-center mt-4 mb-2">
        <a href="/recipes" class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded">
          Browse More Recipes
        </a>
      </div>
    </div>`;
    
    return content;
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

  // Update handleChatSelect to use unique IDs for new messages
  const handleChatSelect = (chatId) => {
    setActiveChat(chatId);
    const selectedChat = chatHistory.find(chat => chat._id === chatId);
    if (selectedChat) {
      setMessages(selectedChat.messages);
      
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
        let updatedMessages = [...selectedChat.messages];
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
              key={chat._id || `temp-${chat.timestamp}-${Math.random().toString(36).substring(2, 9)}`}
              className={`chat-history-item ${activeChat === chat._id ? 'active' : ''}`}
              onClick={() => handleChatSelect(chat._id)}
            >
              <div className="chat-history-item-content">
                <div className="chat-history-item-title">
                  {chat.title}
                  <Trash2 
                    className="inline-block w-4 h-4 ml-2 cursor-pointer text-white float-right" 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      console.log(`Deleting chat with ID: ${chat._id}`);
                      handleDeleteChat(chat._id, e);
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
                  ) : message.isHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: message.content }} />
                  ) : (
                    <>
                      <div className="markdown-content">
                        {message.content.split('\n').map((line, i) => {
                          if (line.startsWith('**Meal Analysis**')) {
                            // Main title
                            return <h2 key={i} className="text-xl font-bold mb-3 text-green-400">Meal Analysis</h2>;
                          } else if (line.startsWith('**') && line.endsWith(':**')) {
                            // Section headers
                            return <h3 key={i} className="font-bold mt-4 mb-2 text-green-300">{line.replace(/\*\*/g, '')}</h3>;
                          } else if (line.startsWith('**') && line.includes('|')) {
                            // Table headers - don't process these individually, handle tables as a group
                            return null;
                          } else if (line.startsWith('**Health Tags:**')) {
                            // Health tags line
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
                            // List items
                            return <li key={i} className="ml-5 mb-1">{line.substring(2)}</li>;
                          } else if (line.trim() === '') {
                            // Empty lines
                            return <br key={i} />;
                          } else if (line.includes('|') && !line.startsWith('**')) {
                            // Table rows - don't process these individually, handle tables as a group
                            return null;
                          } else {
                            // Regular text
                            return <p key={i}>{line}</p>;
                          }
                        })}
                        
                        {/* Process nutrient table */}
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
                        
                        {/* Process metrics table */}
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