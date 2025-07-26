import React, { useState, useEffect } from 'react';
import { Home, MapPin, DollarSign, School, Clock, Star, Bed, Car } from 'lucide-react';
import Papa from 'papaparse';

const PropertyRecommendationSystem = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [preferences, setPreferences] = useState({
    budget_max: 1000000,
    budget_min: 200000,
    city: '',
    min_bedrooms: 1,
    max_commute_time: 60,
    min_school_rating: 1,
    size_preference: 'any',
    must_have_pool: false,
    min_garage_spaces: 0
  });

  // Load property data
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const csvData = await // API mode enabled - using backend FastAPI, { encoding: 'utf8' });
        
        Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            // setProperties skipped for API mode
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading properties:', error);
        setLoading(false);
      }
    };

    // loadProperties(); // Deprecated in API mode
  }, []);

  // Enhanced ML Model Simulation (replaces missing .pkl file)
  const calculatePropertyScore = (property, userPrefs) => {
    let score = 0;
    let weights = {
      budget: 0.25,
      bedrooms: 0.15,
      commute: 0.20,
      school: 0.15,
      size: 0.10,
      amenities: 0.15
    };

    // Budget scoring (higher score for better value)
    const priceRatio = property.price / userPrefs.budget_max;
    if (property.price <= userPrefs.budget_max && property.price >= userPrefs.budget_min) {
      score += weights.budget * (1 - Math.min(priceRatio, 1)) * 100;
    }

    // Bedroom scoring
    if (property.bedrooms >= userPrefs.min_bedrooms) {
      const bedroomBonus = Math.min((property.bedrooms - userPrefs.min_bedrooms) * 10, 30);
      score += weights.bedrooms * (80 + bedroomBonus);
    }

    // Commute time scoring (lower is better)
    if (property.commute_time_min <= userPrefs.max_commute_time) {
      const commuteScore = Math.max(0, 100 - (property.commute_time_min / userPrefs.max_commute_time) * 100);
      score += weights.commute * commuteScore;
    }

    // School rating scoring
    if (property.school_rating >= userPrefs.min_school_rating) {
      score += weights.school * (property.school_rating / 10) * 100;
    }

    // Size scoring
    const avgSize = 2000; // approximate average
    const sizeScore = Math.min((property.size_sqft / avgSize) * 50, 100);
    score += weights.size * sizeScore;

    // Amenities scoring
    let amenityScore = 50; // base score
    if (property.has_pool) amenityScore += 20;
    if (property.garage_spaces >= userPrefs.min_garage_spaces) amenityScore += 15;
    if (property.year_built > 2000) amenityScore += 15;
    score += weights.amenities * Math.min(amenityScore, 100);

    return Math.min(Math.round(score), 100);
  };

  // AI-powered explanation generation
  const generateExplanation = (property, score, userPrefs) => {
    const reasons = [];
    
    if (property.price <= userPrefs.budget_max * 0.9) {
      reasons.push(`Excellent value at $${property.price.toLocaleString()}, well within your budget`);
    }
    
    if (property.bedrooms > userPrefs.min_bedrooms) {
      reasons.push(`${property.bedrooms} bedrooms exceed your minimum requirement`);
    }
    
    if (property.commute_time_min <= userPrefs.max_commute_time * 0.8) {
      reasons.push(`Short ${property.commute_time_min}-minute commute saves you time daily`);
    }
    
    if (property.school_rating >= 8) {
      reasons.push(`Outstanding school rating of ${property.school_rating}/10 for families`);
    }
    
    if (property.has_pool && userPrefs.must_have_pool) {
      reasons.push(`Features desired swimming pool`);
    }
    
    if (property.year_built > 2010) {
      reasons.push(`Modern construction (${property.year_built}) with updated features`);
    }

    // Add description-based insights
    const desc = property.description?.toLowerCase() || '';
    if (desc.includes('luxury')) reasons.push('Luxury finishes and high-end amenities');
    if (desc.includes('garden') || desc.includes('yard')) reasons.push('Beautiful outdoor space');
    if (desc.includes('smart home')) reasons.push('Smart home technology integration');

    return reasons.slice(0, 3).join('. ') || 'Meets your basic requirements with good overall value.';
  };

  // Property filtering and scoring
  const findRecommendations = () => {
    setIsSearching(true);
    
    setTimeout(() => {
      let filtered = properties.filter(property => {
        return (
          property.price >= preferences.budget_min &&
          property.price <= preferences.budget_max &&
          property.bedrooms >= preferences.min_bedrooms &&
          property.commute_time_min <= preferences.max_commute_time &&
          property.school_rating >= preferences.min_school_rating &&
          (preferences.city === '' || property.city === preferences.city) &&
          (!preferences.must_have_pool || property.has_pool) &&
          property.garage_spaces >= preferences.min_garage_spaces
        );
      });

      // Score and rank properties
      const scored = filtered.map(property => ({
        ...property,
        score: calculatePropertyScore(property, preferences),
        explanation: generateExplanation(property, calculatePropertyScore(property, preferences), preferences)
      }));

      // Sort by score and take top 3
      const topRecommendations = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setRecommendations(topRecommendations);
      setIsSearching(false);
    }, 1500); // Simulate AI processing time
  };

  
  const fetchRecommendations = async () => {
    setIsSearching(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_preferences: preferences,
          max_results: 3
        })
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    }
    setIsSearching(false);
  };


const cities = [...new Set(properties.map(p => p.city))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Home className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Property Finder</h1>
          </div>
          <p className="text-gray-600 mt-2">Find your perfect home with AI-powered recommendations</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Preferences Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Your Preferences
              </h2>

              <div className="space-y-6">
                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Budget Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={preferences.budget_min}
                      onChange={(e) => setPreferences({...preferences, budget_min: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={preferences.budget_max}
                      onChange={(e) => setPreferences({...preferences, budget_max: parseInt(e.target.value) || 1000000})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Preferred City
                  </label>
                  <select
                    value={preferences.city}
                    onChange={(e) => setPreferences({...preferences, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Any City</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Bed className="inline h-4 w-4 mr-1" />
                    Minimum Bedrooms: {preferences.min_bedrooms}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={preferences.min_bedrooms}
                    onChange={(e) => setPreferences({...preferences, min_bedrooms: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* Commute */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Max Commute: {preferences.max_commute_time} min
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={preferences.max_commute_time}
                    onChange={(e) => setPreferences({...preferences, max_commute_time: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* School Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <School className="inline h-4 w-4 mr-1" />
                    Min School Rating: {preferences.min_school_rating}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={preferences.min_school_rating}
                    onChange={(e) => setPreferences({...preferences, min_school_rating: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Must-Have Features</label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.must_have_pool}
                      onChange={(e) => setPreferences({...preferences, must_have_pool: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm">Swimming Pool</span>
                  </label>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      <Car className="inline h-4 w-4 mr-1" />
                      Min Garage Spaces: {preferences.min_garage_spaces}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={preferences.min_garage_spaces}
                      onChange={(e) => setPreferences({...preferences, min_garage_spaces: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={findRecommendations}
                  disabled={isSearching}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {isSearching ? 'AI Analyzing Properties...' : 'Find My Perfect Home'}
                </button>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-2">
            {isSearching ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">AI Analyzing Properties</h3>
                <p className="text-gray-600">Our intelligent agents are evaluating {properties.length} properties against your preferences...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Top Recommendations</h2>
                
                {recommendations.map((property, index) => (
                  <div key={property.address} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{property.address}</h3>
                          <p className="text-gray-600 flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${property.price?.toLocaleString()}
                          </div>
                          <div className="flex items-center justify-end mt-1">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">Match Score: {property.score}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Bed className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                          <div className="text-sm font-medium">{property.bedrooms} Beds</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Home className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                          <div className="text-sm font-medium">{property.size_sqft?.toLocaleString()} sq ft</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                          <div className="text-sm font-medium">{property.commute_time_min} min</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <School className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                          <div className="text-sm font-medium">{property.school_rating}/10</div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">Why This Property Matches You:</h4>
                        <p className="text-blue-800 text-sm">{property.explanation}</p>
                      </div>

                      <p className="text-gray-700 text-sm leading-relaxed">{property.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {property.has_pool && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Pool
                          </span>
                        )}
                        {property.garage_spaces > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {property.garage_spaces} Car Garage
                          </span>
                        )}
                        {property.year_built > 2010 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Modern Build
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Home className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Find Your Dream Home?</h3>
                <p className="text-gray-600">Set your preferences and click "Find My Perfect Home" to get AI-powered recommendations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyRecommendationSystem;