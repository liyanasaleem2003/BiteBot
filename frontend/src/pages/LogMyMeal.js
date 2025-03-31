import React, { useState, useRef, useEffect } from "react";
import "./LogMyMeal.css";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button-ui";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ImageIcon, SendIcon, UploadIcon, ClockIcon, PlusIcon, Trash2 } from "lucide-react";
import { API_BASE_URL } from '../config';
import Navbar from "../components/ui/Navbar";

const LogMyMeal = () => {
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

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/history`, {
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

  const handleStartNewChat = () => {
    const now = new Date();
    
    // Clear any previous state
    setActiveChat(null);
    setMealAnalysis(null);
    setConversationHistory([]);
    setCurrentQuestion(null);
    setCurrentStep("initial");
    
    // Set initial welcome message
    setMessages([{
      id: `bot-${Date.now()}`,
      type: "bot",
      content: "Hi! I'm here to help you log your meal. Would you like to upload a picture of your meal?",
      timestamp: now,
    }]);

    // Add a new chat entry with timestamp
    setChatHistory(prev => [{
      _id: `temp-${Date.now()}`, // Temporary ID for new chat
      title: "New Meal Analysis",
      messages: [{
        id: `bot-${Date.now()}`,
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
      const response = await fetch(`${API_BASE_URL}/chat/history/${chatId}`, {
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
      setChatHistory(prevChats => {
        console.log(`Removing chat ${chatId} from state`);
        return prevChats.filter(chat => chat._id !== chatId);
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Create a URL for the image preview and store it in a variable to revoke later
      const imageUrl = URL.createObjectURL(file);
      
      // Store the blob URL in component state to prevent it from being garbage collected
      const newMessageId = Date.now() + Math.random().toString(36).substring(2, 9);
      
      // Add message about uploading with image preview and loading indicator
      setMessages(prev => [...prev, {
        id: `user-${newMessageId}`,
        type: "user",
        content: "Uploading image...",
        image: imageUrl,
        timestamp: new Date(),
        blobUrl: imageUrl // Store the blob URL to revoke later
      }, {
        id: `bot-${newMessageId}`,
        type: "bot",
        content: "Processing your image...",
        isLoading: true,
        timestamp: new Date(),
      }]);

      // Make API call to analyze meal
      const response = await fetch(`${API_BASE_URL}/nutrition/analyze-meal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze meal');
      }

      const data = await response.json();
      setMealAnalysis(data.data);

      // Create a new chat history entry
      const newChatResponse = await fetch(`${API_BASE_URL}/chat/history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "New Meal Analysis", // Start with a temporary title
          image_url: data.data.image_url,
          messages: messages,
          meal_analysis: data.data
        }),
      });

      if (!newChatResponse.ok) {
        throw new Error('Failed to create chat history');
      }

      const newChat = await newChatResponse.json();
      setChatHistory(prev => [newChat.data, ...prev]);
      setActiveChat(newChat.data._id);

      // Remove loading message and add bot response with detected ingredients
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isLoading);
        return [...filteredMessages, {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: `I can see several ingredients in your meal! I've detected: ${data.data.detected_ingredients.map(ing => ing.name).join(', ')}. Let me ask you a few questions to better understand your meal.`,
          timestamp: new Date(),
        }];
      });

      // Start the conversation flow with clarifying questions
      if (data.data.clarifying_questions && data.data.clarifying_questions.length > 0) {
        setCurrentQuestion(data.data.clarifying_questions[0]);
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: data.data.clarifying_questions[0].question,  // Render only the question text
          timestamp: new Date(),
        }]);
      }

      setCurrentStep("conversation");
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
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

  const handleUserMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const message = inputMessage;
    setInputMessage(""); // Clear input after sending

    // Add user message to chat
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: "user",
      content: message,
      timestamp: new Date(),
    }]);

    // Update chat history in database
    if (activeChat) {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/history/${activeChat}`, {
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
              timestamp: new Date(),
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
          ? { ...chat, messages: [...chat.messages, { id: `user-${Date.now()}`, type: "user", content: message, timestamp: new Date() }] }
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
            timestamp: new Date(),
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
                timestamp: new Date(),
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
                  timestamp: new Date(),
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
              timestamp: new Date(),
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
        timestamp: new Date(),
      }]);
    }
  };

  const getFinalAnalysis = async () => {
    try {
      console.log("Sending conversation history:", conversationHistory);
      console.log("Sending user profile:", JSON.parse(localStorage.getItem('userProfile') || '{}'));
      
      const analysisResponse = await fetch(`${API_BASE_URL}/nutrition/analyze-details`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_history: conversationHistory,
          user_profile: JSON.parse(localStorage.getItem('userProfile') || '{}')
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        console.error("Analysis response error:", errorData);
        throw new Error(errorData.detail || 'Failed to analyze meal details');
      }

      const analysisData = await analysisResponse.json();
      console.log("Analysis response:", analysisData);
      
      // Update meal analysis state
      setMealAnalysis(prev => ({
        ...prev,
        ...analysisData.data,
        calories: analysisData.data.macronutrients?.calories || 0,
        protein: analysisData.data.macronutrients?.protein || 0,
        carbs: analysisData.data.macronutrients?.carbs || 0,
        fats: analysisData.data.macronutrients?.fats || 0,
        fiber: analysisData.data.macronutrients?.fiber || 0,
        sugar: analysisData.data.macronutrients?.sugar || 0,
        sodium: analysisData.data.macronutrients?.sodium || 0,
        scores: {
          glycemic: analysisData.data.scores?.glycemic_index || 0,
          inflammatory: analysisData.data.scores?.inflammatory || 0,
          heart: analysisData.data.scores?.heart_health || 0,
          digestive: analysisData.data.scores?.digestive || 0,
          balance: analysisData.data.scores?.meal_balance || 0
        },
        health_tags: analysisData.data.health_tags || [],
        suggestions: analysisData.data.suggestions || [],
        recommended_recipes: analysisData.data.recommended_recipes || []
      }));

      // Create a final analysis message with a prominent meal name
      const mealName = analysisData.data.meal_name || "Analyzed Meal";
      console.log(`Creating final analysis message with meal name: ${mealName}`);
      
      const finalAnalysisMessage = {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: `## ${mealName}\n\n${generateAnalysisContent(analysisData.data)}`,
        timestamp: new Date(),
        isAnalysis: true,
      };

      // Add final analysis message to messages
      setMessages(prev => [...prev, finalAnalysisMessage]);

      // Add dashboard button message
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: "Would you like to view this meal in your dashboard?",
        timestamp: new Date(),
      }]);

      // Update chat history in database with meal name and analysis
      if (activeChat) {
        try {
          const updatedMessages = [...messages, finalAnalysisMessage, {
            id: `bot-${Date.now()}`,
            type: "bot",
            content: "Would you like to view this meal in your dashboard?",
            timestamp: new Date(),
          }];

          // Make sure we have a meal name
          const mealName = analysisData.data.meal_name || "Analyzed Meal";
          
          console.log(`Updating chat history with meal name: ${mealName}`);
          
          const response = await fetch(`${API_BASE_URL}/chat/history/${activeChat}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: mealName,
              messages: updatedMessages,
              meal_analysis: analysisData.data
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update chat history');
          }
          
          // Also update the local chat history title
          setChatHistory(prev => prev.map(chat => 
            chat._id === activeChat 
              ? { ...chat, title: mealName }
              : chat
          ));
        } catch (error) {
          console.error('Error updating chat history:', error);
        }
      }

      // Update chat history with final analysis
      if (activeChat) {
        setChatHistory(prev => prev.map(chat => 
          chat._id === activeChat 
            ? { 
                ...chat, 
                title: analysisData.data.meal_name || "Analyzed Meal",
                messages: [...chat.messages, {
                  id: `bot-${Date.now()}`,
                  type: "bot",
                  content: generateAnalysisContent(analysisData.data),
                  timestamp: new Date()
                }, {
                  id: `bot-${Date.now()}`,
                  type: "bot",
                  content: "Would you like to view this meal in your dashboard?",
                  timestamp: new Date()
                }]
              }
            : chat
        ));
      }

      setCurrentStep("complete");
    } catch (error) {
      console.error("Error getting final analysis:", error);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: "Sorry, I encountered an error while analyzing your meal. Please try again.",
        timestamp: new Date(),
      }]);
    }
  };

  const generateAnalysisContent = (data) => {
    return `**Nutritional Information:**
- Calories: ${data.macronutrients?.calories || 0} kcal
- Protein: ${data.macronutrients?.protein || 0}g
- Carbs: ${data.macronutrients?.carbs || 0}g
- Fats: ${data.macronutrients?.fats || 0}g
- Fiber: ${data.macronutrients?.fiber || 0}g
- Sugar: ${data.macronutrients?.sugar || 0}g
- Sodium: ${data.macronutrients?.sodium || 0}mg

**Health Scores:**
- Glycemic Index: ${data.scores?.glycemic_index || 0}
- Inflammatory Score: ${data.scores?.inflammatory || 0}
- Heart Health: ${data.scores?.heart_health || 0}
- Digestive Score: ${data.scores?.digestive || 0}
- Meal Balance: ${data.scores?.meal_balance || 0}

**Health Tags:** ${(data.health_tags || []).join(', ')}

**Health Benefits:**
${(data.health_benefits || []).map(benefit => `- ${benefit}`).join('\n')}

**Potential Concerns:**
${(data.potential_concerns || []).map(concern => `- ${concern}`).join('\n')}

**Suggestions for Improvement:**
${(data.suggestions || []).map(suggestion => `- ${suggestion}`).join('\n')}

**Recommended Recipes:**
${(data.recommended_recipes || []).map(recipe => `- ${recipe}`).join('\n')}`;
  };

  const handleViewInDashboard = async () => {
    console.log("Current mealAnalysis:", mealAnalysis);
    
    // Format the meal data to match the backend's expected structure
    const mealData = {
      meal_name: mealAnalysis.meal_name || "Analyzed Meal",
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      timestamp: new Date().toISOString(),
      image_url: mealAnalysis.image_url || "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80",
      health_tags: mealAnalysis.health_tags || [],
      ingredients: mealAnalysis.ingredients || [],
      cooking_method: mealAnalysis.cooking_method || "",
      serving_size: mealAnalysis.serving_size || "",
      macronutrients: {
        calories: mealAnalysis.macronutrients?.calories || 0,
        protein: mealAnalysis.macronutrients?.protein || 0,
        carbs: mealAnalysis.macronutrients?.carbs || 0,
        fats: mealAnalysis.macronutrients?.fats || 0,
        fiber: mealAnalysis.macronutrients?.fiber || 0,
        sugar: mealAnalysis.macronutrients?.sugar || 0,
        sodium: mealAnalysis.macronutrients?.sodium || 0
      },
      scores: {
        glycemic_index: mealAnalysis.scores?.glycemic_index || 0,
        inflammatory: mealAnalysis.scores?.inflammatory || 0,
        heart_health: mealAnalysis.scores?.heart_health || 0,
        digestive: mealAnalysis.scores?.digestive || 0,
        meal_balance: mealAnalysis.scores?.meal_balance || 0
      },
      micronutrient_balance: {
        score: mealAnalysis.micronutrient_balance?.score || 0,
        priority_nutrients: mealAnalysis.micronutrient_balance?.priority_nutrients || []
      },
      suggestions: mealAnalysis.suggestions || [],
      recommended_recipes: mealAnalysis.recommended_recipes || [],
      health_benefits: mealAnalysis.health_benefits || [],
      potential_concerns: mealAnalysis.potential_concerns || []
    };

    console.log("Formatted meal data to be sent to backend:", mealData);
    
    try {
      // Save the meal data to the database
      const response = await fetch(`${API_BASE_URL}/nutrition/meals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error saving meal:", errorData);
        throw new Error(errorData.detail || 'Failed to save meal');
      }

      const savedMeal = await response.json();
      console.log("Meal saved successfully:", savedMeal);
      
      // Save the formatted meal data to localStorage as a backup
      localStorage.setItem('lastAnalyzedMeal', JSON.stringify(savedMeal));
      console.log("Saved meal data to localStorage:", savedMeal);
      
      // Redirect to dashboard with a query parameter to force refresh
      window.location.href = '/dashboard?refresh=' + new Date().getTime();
    } catch (error) {
      console.error("Error in handleViewInDashboard:", error);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: `Sorry, I encountered an error while saving your meal: ${error.message}. Please try again.`,
        timestamp: new Date()
      }]);
    }
  };

  const handleChatSelect = (chatId) => {
    setActiveChat(chatId);
    const selectedChat = chatHistory.find(chat => chat._id === chatId);
    if (selectedChat) {
      setMessages(selectedChat.messages);
    }
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
                  {message.isLoading ? (
                    <div className="loading-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </div>
                  ) : (
                    <>
                      <p>{message.content}</p>
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
                  {message.type === "bot" && 
                   message.content === "Would you like to view this meal in your dashboard?" && (
                    <Button
                      onClick={handleViewInDashboard}
                      className="mt-4 bg-primary text-white hover:bg-primary/90"
                    >
                      View in Dashboard
                    </Button>
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