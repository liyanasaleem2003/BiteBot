import React, { useState, useRef } from "react";
import "./LogMyMeal.css";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button-ui";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ImageIcon, SendIcon, UploadIcon } from "lucide-react";
import { API_BASE_URL } from '../config';
import Navbar from "../components/ui/Navbar";

const LogMyMeal = () => {
  const [messages, setMessages] = useState([
    {
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
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Create a URL for the image preview
      const imageUrl = URL.createObjectURL(file);

      // Add message about uploading with image preview and loading indicator
      setMessages(prev => [...prev, {
        type: "user",
        content: "Uploading image...",
        image: imageUrl,
        timestamp: new Date(),
      }, {
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

      // Remove loading message and add bot response with detected ingredients
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isLoading);
        return [...filteredMessages, {
          type: "bot",
          content: `I can see several ingredients in your meal! I've detected: ${data.data.detected_ingredients.join(', ')}.`,
          timestamp: new Date(),
        }];
      });

      // Start the conversation flow with clarifying questions
      if (data.data.clarifying_questions && data.data.clarifying_questions.length > 0) {
        setCurrentQuestion(data.data.clarifying_questions[0]);
        setMessages(prev => [...prev, {
          type: "bot",
          content: data.data.clarifying_questions[0].question,
          timestamp: new Date(),
        }]);
      }

      setCurrentStep("conversation");
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isLoading);
        return [...filteredMessages, {
          type: "bot",
          content: "Sorry, I couldn't process your image. Please try again.",
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUserMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const message = inputMessage;
    setInputMessage(""); // Clear input after sending

    // Add user message to chat
    setMessages(prev => [...prev, {
      type: "user",
      content: message,
      timestamp: new Date(),
    }]);

    // Add user response to conversation history
    setConversationHistory(prev => [...prev, {
      role: "user",
      content: message
    }]);

    try {
      if (currentQuestion) {
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
                  type: "bot",
                  content: nextQuestion.question,
                  timestamp: new Date(),
                }]);
              } else {
                // Get final analysis
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

                // Add final analysis message
                setMessages(prev => [...prev, {
                  type: "bot",
                  content: `Based on our conversation, here's the complete analysis of your meal:

Meal Name: ${analysisData.data.meal_name || "Analyzed Meal"}

Nutritional Information:
- Calories: ${analysisData.data.macronutrients?.calories || 0} kcal
- Protein: ${analysisData.data.macronutrients?.protein || 0}g
- Carbs: ${analysisData.data.macronutrients?.carbs || 0}g
- Fats: ${analysisData.data.macronutrients?.fats || 0}g
- Fiber: ${analysisData.data.macronutrients?.fiber || 0}g
- Sugar: ${analysisData.data.macronutrients?.sugar || 0}g
- Sodium: ${analysisData.data.macronutrients?.sodium || 0}mg

Health Scores:
- Glycemic Index: ${analysisData.data.scores?.glycemic_index || 0}
- Inflammatory Score: ${analysisData.data.scores?.inflammatory || 0}
- Heart Health: ${analysisData.data.scores?.heart_health || 0}
- Digestive Score: ${analysisData.data.scores?.digestive || 0}
- Meal Balance: ${analysisData.data.scores?.meal_balance || 0}

Health Tags: ${(analysisData.data.health_tags || []).join(', ')}
Suggestions: ${(analysisData.data.suggestions || []).join(', ')}
Recommended Recipes: ${(analysisData.data.recommended_recipes || []).join(', ')}`,
                  timestamp: new Date(),
                }]);

                // Add dashboard button message
                setMessages(prev => [...prev, {
                  type: "bot",
                  content: "Would you like to view this meal in your dashboard?",
                  timestamp: new Date(),
                }]);

                setCurrentStep("complete");
              }
            }
          }
        } else {
          // Handle regular questions with options
          const currentIndex = mealAnalysis.clarifying_questions.findIndex(
            q => q.question === currentQuestion.question
          );

          if (currentIndex < mealAnalysis.clarifying_questions.length - 1) {
            // Move to next question
            const nextQuestion = mealAnalysis.clarifying_questions[currentIndex + 1];
            setCurrentQuestion(nextQuestion);
            setMessages(prev => [...prev, {
              type: "bot",
              content: nextQuestion.question,
              timestamp: new Date(),
            }]);
          } else {
            // Get final analysis
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

            // Add final analysis message
            setMessages(prev => [...prev, {
              type: "bot",
              content: `Based on our conversation, here's the complete analysis of your meal:

Meal Name: ${analysisData.data.meal_name || "Analyzed Meal"}

Nutritional Information:
- Calories: ${analysisData.data.macronutrients?.calories || 0} kcal
- Protein: ${analysisData.data.macronutrients?.protein || 0}g
- Carbs: ${analysisData.data.macronutrients?.carbs || 0}g
- Fats: ${analysisData.data.macronutrients?.fats || 0}g
- Fiber: ${analysisData.data.macronutrients?.fiber || 0}g
- Sugar: ${analysisData.data.macronutrients?.sugar || 0}g
- Sodium: ${analysisData.data.macronutrients?.sodium || 0}mg

Health Scores:
- Glycemic Index: ${analysisData.data.scores?.glycemic_index || 0}
- Inflammatory Score: ${analysisData.data.scores?.inflammatory || 0}
- Heart Health: ${analysisData.data.scores?.heart_health || 0}
- Digestive Score: ${analysisData.data.scores?.digestive || 0}
- Meal Balance: ${analysisData.data.scores?.meal_balance || 0}

Health Tags: ${(analysisData.data.health_tags || []).join(', ')}
Suggestions: ${(analysisData.data.suggestions || []).join(', ')}
Recommended Recipes: ${(analysisData.data.recommended_recipes || []).join(', ')}`,
              timestamp: new Date(),
            }]);

            // Add dashboard button message
            setMessages(prev => [...prev, {
              type: "bot",
              content: "Would you like to view this meal in your dashboard?",
              timestamp: new Date(),
            }]);

            setCurrentStep("complete");
          }
        }
      }
    } catch (error) {
      console.error("Error handling user message:", error);
      console.error("Error details:", error.stack);
      setMessages(prev => [...prev, {
        type: "bot",
        content: `Sorry, I encountered an error while processing your response: ${error.message}. Please try again.`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleViewInDashboard = () => {
    console.log("Current mealAnalysis:", mealAnalysis);
    
    // Format the meal data to match the dashboard's expected structure
    const mealData = {
      id: `meal${Date.now()}`,
      name: mealAnalysis.meal_name || "Analyzed Meal",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: mealAnalysis.image_url || "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&dpr=2&q=80",
      tags: mealAnalysis.health_tags || [],
      macros: {
        calories: mealAnalysis.macronutrients?.calories || 0,
        protein: mealAnalysis.macronutrients?.protein || 0,
        carbs: mealAnalysis.macronutrients?.carbs || 0,
        fats: mealAnalysis.macronutrients?.fats || 0,
        fiber: mealAnalysis.macronutrients?.fiber || 0,
        sugar: mealAnalysis.macronutrients?.sugar || 0,
        sodium: mealAnalysis.macronutrients?.sodium || 0
      },
      healthScores: {
        glycemic: mealAnalysis.scores?.glycemic_index || 0,
        inflammatory: mealAnalysis.scores?.inflammatory || 0,
        heart: mealAnalysis.scores?.heart_health || 0,
        digestive: mealAnalysis.scores?.digestive || 0,
        balance: mealAnalysis.scores?.meal_balance || 0
      }
    };

    console.log("Formatted meal data:", mealData);
    
    // Save the formatted meal data to localStorage
    localStorage.setItem('lastAnalyzedMeal', JSON.stringify(mealData));
    console.log("Saved meal data to localStorage");
    
    window.location.href = '/dashboard';
  };

  return (
    <div className="log-meal-container">
      <Navbar />
      <div className="glass-background" />
      <Card className="chat-card">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
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
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
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
      </Card>
    </div>
  );
};

export default LogMyMeal; 