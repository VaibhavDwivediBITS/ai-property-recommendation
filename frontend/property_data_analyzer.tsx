import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const PropertyDataAnalyzer = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await window.fs.readFile('enhanced_property_data_with_rich_descriptions.csv', { encoding: 'utf8' });
        
        Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const properties = results.data;
            setData(properties);
            
            // Calculate statistics
            const cities = [...new Set(properties.map(p => p.city))];
            const priceRange = {
              min: Math.min(...properties.map(p => p.price)),
              max: Math.max(...properties.map(p => p.price)),
              avg: Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length)
            };
            
            const bedroomRange = {
              min: Math.min(...properties.map(p => p.bedrooms)),
              max: Math.max(...properties.map(p => p.bedrooms))
            };
            
            const schoolRatings = {
              min: Math.min(...properties.map(p => p.school_rating)),
              max: Math.max(...properties.map(p => p.school_rating)),
              avg: Math.round(properties.reduce((sum, p) => sum + p.school_rating, 0) / properties.length * 10) / 10
            };
            
            setStats({
              totalProperties: properties.length,
              cities,
              priceRange,
              bedroomRange,
              schoolRatings,
              yearRange: {
                min: Math.min(...properties.map(p => p.year_built)),
                max: Math.max(...properties.map(p => p.year_built))
              }
            });
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading property data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Property Data Analysis</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-blue-800 mb-2">Dataset Overview</h3>
          <p className="text-gray-700">Total Properties: <span className="font-bold">{stats.totalProperties}</span></p>
          <p className="text-gray-700">Cities: <span className="font-bold">{stats.cities?.length}</span></p>
          <div className="text-sm text-gray-600 mt-2">
            {stats.cities?.join(', ')}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-green-800 mb-2">Price Range</h3>
          <p className="text-gray-700">Min: <span className="font-bold">${stats.priceRange?.min?.toLocaleString()}</span></p>
          <p className="text-gray-700">Max: <span className="font-bold">${stats.priceRange?.max?.toLocaleString()}</span></p>
          <p className="text-gray-700">Avg: <span className="font-bold">${stats.priceRange?.avg?.toLocaleString()}</span></p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-purple-800 mb-2">Property Features</h3>
          <p className="text-gray-700">Bedrooms: <span className="font-bold">{stats.bedroomRange?.min}-{stats.bedroomRange?.max}</span></p>
          <p className="text-gray-700">School Rating: <span className="font-bold">{stats.schoolRatings?.min}-{stats.schoolRatings?.max}</span></p>
          <p className="text-gray-700">Avg Rating: <span className="font-bold">{stats.schoolRatings?.avg}</span></p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">Sample Properties</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">Address</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">City</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Price</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Beds</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">School</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Commute</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((property, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2 text-sm">{property.address}</td>
                  <td className="px-4 py-2 text-sm">{property.city}</td>
                  <td className="px-4 py-2 text-sm">${property.price?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">{property.bedrooms}</td>
                  <td className="px-4 py-2 text-sm">{property.school_rating}/10</td>
                  <td className="px-4 py-2 text-sm">{property.commute_time_min}min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <h3 className="font-semibold text-yellow-800 mb-2">Key Insights for ML Model</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Properties span 5 major cities with diverse price ranges</li>
          <li>• School ratings vary from 1-10, averaging {stats.schoolRatings?.avg}</li>
          <li>• Commute times range significantly, important for scoring</li>
          <li>• Rich descriptions available for AI-powered explanations</li>
          <li>• Features: price, beds, size, school, commute, amenities (pool, garage)</li>
        </ul>
      </div>
    </div>
  );
};

export default PropertyDataAnalyzer;