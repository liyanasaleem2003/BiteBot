import React, { useState } from 'react';
import Navbar from "../components/ui/Navbar";
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import "./EatWellGuide.css";

export default function EatWellGuide() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('fruits-veg');
  const [activeMealTab, setActiveMealTab] = useState('breakfast');

  const foodSections = [
    {
      id: 'fruits-veg',
      name: 'Fruits & Vegetables',
      value: 35,
      color: '#7BC67B',
      glowColor: 'rgba(123, 198, 123, 0.3)',
      description: 'Aim for a variety of colors and types',
      content: {
        overview: 'Fruits and vegetables should make up over a third of your daily diet.',
        recommendations: [
          'Aim for at least 5 portions of a variety of fruits and vegetables every day',
          'Choose fresh, frozen, dried, or canned options',
          'Include vegetables in curries, soups, and stews',
          'Try to incorporate seasonal South Asian vegetables like bitter gourd, okra, and bottle gourd'
        ],
        swaps: [
          'Instead of: Fruit juice or smoothies',
          'Enjoy: Whole fruits with skin when possible',
          'Instead of: Always using the same vegetables',
          'Enjoy: A rainbow of different colored vegetables for varied nutrients'
        ]
      }
    },
    {
      id: 'starchy-carbs',
      name: 'Starchy Carbohydrates',
      value: 37,
      color: '#F9C74F',
      glowColor: 'rgba(249, 199, 79, 0.3)',
      description: 'Choose wholegrain varieties',
      content: {
        overview: 'Starchy foods should make up just over a third of your diet.',
        recommendations: [
          'Choose higher-fiber, wholegrain varieties like brown rice, whole wheat atta, and millets',
          'Include a starchy food with each main meal',
          'Try traditional South Asian whole grains like bajra, jowar, and ragi'
        ],
        swaps: [
          'Instead of: White rice',
          'Enjoy: Brown rice, quinoa or mixed grain rice',
          'Instead of: White flour chapattis',
          'Enjoy: Chapattis made with whole wheat atta or mixed grain flour',
          'Instead of: Regular naan',
          'Enjoy: Whole wheat naan or roti in smaller portions'
        ]
      }
    },
    {
      id: 'proteins',
      name: 'Proteins',
      value: 15,
      color: '#F08C8C',
      glowColor: 'rgba(240, 140, 140, 0.3)',
      description: 'Include plant-based options',
      content: {
        overview: 'Protein foods are essential for body repair and growth.',
        recommendations: [
          'Eat more beans and pulses as they are naturally low in fat and high in fiber',
          'Aim for at least two portions of fish a week, including one oily fish',
          'Limit red and processed meat to no more than 70g per day',
          'Try plant-based proteins like tofu, tempeh, and soya chunks'
        ],
        swaps: [
          'Instead of: Regular meat curries daily',
          'Enjoy: Daal, rajma, chole and other legume-based dishes',
          'Instead of: Fried fish',
          'Enjoy: Baked or grilled fish with spices',
          'Instead of: Processed meats like sausages',
          'Enjoy: Lean cuts of meat in smaller portions'
        ]
      }
    },
    {
      id: 'dairy',
      name: 'Dairy & Alternatives',
      value: 10,
      color: '#90CAF9',
      glowColor: 'rgba(144, 202, 249, 0.3)',
      description: 'Choose lower-fat options',
      content: {
        overview: 'Dairy and alternatives provide calcium for bone health.',
        recommendations: [
          'Choose lower fat and lower sugar options',
          'Include milk, cheese, yogurt, and paneer in moderation',
          'Consider fortified dairy alternatives if you don\'t consume dairy'
        ],
        swaps: [
          'Instead of: Full-fat milk',
          'Enjoy: Semi-skimmed or skimmed milk',
          'Instead of: Regular paneer',
          'Enjoy: Low-fat paneer',
          'Instead of: Cream in curries',
          'Enjoy: Low-fat yogurt or skimmed milk'
        ]
      }
    },
    {
      id: 'oils',
      name: 'Oils & Spreads',
      value: 3,
      color: '#FFB74D',
      glowColor: 'rgba(255, 183, 77, 0.3)',
      description: 'Use in small amounts',
      content: {
        overview: 'Unsaturated oils should be used in small amounts.',
        recommendations: [
          'Choose unsaturated oils like olive, rapeseed, or sunflower oil',
          'Use just a small amount when cooking',
          'Limit ghee and butter for occasional use only'
        ],
        swaps: [
          'Instead of: Ghee or butter for everyday cooking',
          'Enjoy: Rapeseed, olive or sunflower oil in small amounts',
          'Instead of: Deep frying',
          'Enjoy: Grilling, baking, steaming or air-frying',
          'Instead of: Store-bought fried snacks',
          'Enjoy: Homemade baked versions with minimal oil'
        ]
      }
    }
  ];

  // Meal suggestions data
  const mealSuggestions = {
    breakfast: {
      title: "Breakfast ideas",
      items: [
        "Scrambled eggs with one wholemeal chapati and a portion of mixed fruit.",
        "Porridge with half a banana, cinnamon, mixed nuts, with a sprinkle of crushed cardamom, served with chai with skimmed milk and sweetener.",
        "Spiced tofu scramble with mixed fruit on the side."
      ]
    },
    lunch: {
      title: "Lunch ideas",
      items: [
        "Halibut with boiled cassava and mixed leafy greens.",
        "Fish tikka with one small wholemeal (homemade) pitta bread, and a fruit bowl.",
        "Grilled spiced cutlets of lamb and a chickpea salad."
      ]
    },
    dinner: {
      title: "Dinner ideas",
      items: [
        "Oven-baked tandoori chicken with boiled sweet potato and a leafy green salad.",
        "Mung dhal with spinach, grilled salmon and one wholemeal chapati.",
        "Mutter paneer with tofu in place of paneer, with a serving of wild or brown rice and a mixed salad."
      ]
    },
    snacks: {
      title: "Snack ideas",
      items: [
        "Oatcakes or rye-based crackers with tomato salsa or cottage cheese",
        "Homemade vegetable samosa baked in the oven",
        "Palmful of dried fruit e.g., Medjool dates."
      ]
    }
  };

  // Find the active section data
  const getActiveSectionData = () => {
    return foodSections.find(section => section.id === activeTab) || foodSections[0];
  };

  // Helper function to get active meal data
  const getActiveMealData = () => {
    return mealSuggestions[activeMealTab];
  };

  return (
    <div className="eatwell-container">
      <Navbar />
      <div className="eatwell-content">
        <div className="eatwell-title-section">
          <h1 className="eatwell-title">The NHS South Asian EatWell Guide</h1>
        </div>

        <div className="guide-container">
          <div className="guide-left-column">
            <div className="pie-chart-section">
              <h2 className="pie-chart-title">A Balanced Day's Worth of Eating</h2>
              
              <div className="pie-chart-note">
                These are general % recommendations, the exact proportions may vary day-to-day while still maintaining overall balance
              </div>
              
              <PieChart width={500} height={500}>
                <Pie
                  data={foodSections}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={({ index }) => 
                    activeIndex === index || foodSections[index].id === activeTab ? 185 : 170
                  }
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(_, index) => setActiveTab(foodSections[index].id)}
                >
                  {foodSections.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        filter: activeIndex === index || entry.id === activeTab
                          ? `drop-shadow(0 0 12px ${entry.glowColor})` 
                          : 'none',
                        opacity: activeIndex === null || activeIndex === index || entry.id === activeTab ? 1 : 0.7,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="pie-tooltip">
                          <h3>{data.name}</h3>
                          <p>{data.value}%</p>
                          <p className="text-sm text-zinc-400">{data.description}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </div>
            
            {/* Meal inspiration section with tabs */}
            <div className="meal-inspiration-section">
              <div className="meal-inspiration-title-section">
                <h2>Healthier menu inspiration</h2>
              </div>
              
              <div className="meal-tabs-container">
                <div className="meal-tabs-header">
                  <button 
                    className={`meal-tab-button ${activeMealTab === 'breakfast' ? 'active' : ''}`}
                    onClick={() => setActiveMealTab('breakfast')}
                  >
                    Breakfast
                  </button>
                  <button 
                    className={`meal-tab-button ${activeMealTab === 'lunch' ? 'active' : ''}`}
                    onClick={() => setActiveMealTab('lunch')}
                  >
                    Lunch
                  </button>
                  <button 
                    className={`meal-tab-button ${activeMealTab === 'dinner' ? 'active' : ''}`}
                    onClick={() => setActiveMealTab('dinner')}
                  >
                    Dinner
                  </button>
                  <button 
                    className={`meal-tab-button ${activeMealTab === 'snacks' ? 'active' : ''}`}
                    onClick={() => setActiveMealTab('snacks')}
                  >
                    Snacks
                  </button>
                </div>
                
                <div className="meal-tab-content">
                  <h3>{getActiveMealData().title}</h3>
                  <ul>
                    {getActiveMealData().items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs-container">
            <div className="tabs-header">
              {foodSections.map(section => (
                <button
                  key={section.id}
                  className={`tab-button ${activeTab === section.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(section.id)}
                  style={{
                    borderColor: activeTab === section.id ? section.color : 'rgb(63, 63, 70)',
                    color: activeTab === section.id ? section.color : 'white'
                  }}
                >
                  {section.name}
                </button>
              ))}
            </div>

            <div className="tab-content">
              <div className="section-content">
                <h3 style={{ color: getActiveSectionData().color }}>
                  {getActiveSectionData().name} ({getActiveSectionData().value}%)
                </h3>
                <p>{getActiveSectionData().content.overview}</p>
                
                <h4>Recommendations</h4>
                <ul className="recommendations-list">
                  {getActiveSectionData().content.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
                
                <h4>Healthy Swaps</h4>
                <div className="swaps-list">
                  {getActiveSectionData().content.swaps.map((swap, index) => {
                    if (index % 2 === 0) {
                      return (
                        <div key={index} className="swap-item">
                          <p className="swap-instead">{swap}</p>
                          {index + 1 < getActiveSectionData().content.swaps.length && (
                            <p className="swap-enjoy">{getActiveSectionData().content.swaps[index + 1]}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
