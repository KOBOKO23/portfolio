import { useState } from 'react';
import { Cloud, Wind, Droplets, Eye, Gauge, CloudRain, CloudSnow, Sun, CloudSun, CloudDrizzle, Zap, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// Types
interface ForecastData {
  time: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  precipitation: number;
  condition: string;
  cloudCover: number;
}

// Weather condition icons mapping
const weatherIcons: Record<string, typeof Cloud> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  overcast: Cloud,
  rain: CloudRain,
  drizzle: CloudDrizzle,
  snow: CloudSnow,
  thunderstorm: Zap,
};

// Generate mock forecast data (In production, fetch from API)
const generateForecastData = (): ForecastData[] => {
  const forecasts: ForecastData[] = [];
  const conditions = ['clear', 'partly-cloudy', 'cloudy', 'rain', 'drizzle', 'overcast'];
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  
  // Generate 72 hours of 3-hourly forecasts (24 data points)
  for (let i = 0; i < 24; i++) {
    const forecastTime = new Date();
    forecastTime.setHours(forecastTime.getHours() + (i * 3));
    
    // Simulate realistic weather variations
    const baseTemp = 24 + Math.sin((i / 24) * Math.PI * 2) * 8;
    const humidity = 55 + Math.sin((i / 12) * Math.PI) * 25;
    
    forecasts.push({
      time: forecastTime,
      temperature: Math.round(baseTemp + (Math.random() - 0.5) * 4),
      feelsLike: Math.round(baseTemp + (Math.random() - 0.5) * 6),
      humidity: Math.round(humidity + (Math.random() - 0.5) * 10),
      windSpeed: Math.round(5 + Math.random() * 15),
      windDirection: directions[Math.floor(Math.random() * directions.length)],
      pressure: Math.round(1010 + (Math.random() - 0.5) * 20),
      visibility: Math.round(8 + Math.random() * 7),
      precipitation: Math.round(Math.random() * 5),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      cloudCover: Math.round(20 + Math.random() * 60),
    });
  }
  
  return forecasts;
};

export function WeatherForecast72Hr() {
  const [forecastData] = useState<ForecastData[]>(generateForecastData());
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentForecast = forecastData[currentIndex];
  const WeatherIcon = weatherIcons[currentForecast.condition] || Cloud;
  
  // Navigation handlers
  const goToNext = () => {
    setCurrentIndex((prev) => (prev < forecastData.length - 1 ? prev + 1 : prev));
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };
  
  const jumpToTime = (index: number) => {
    setCurrentIndex(index);
  };
  
  // Format time helpers
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatFullDateTime = (date: Date) => {
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Calculate hours from now
  const hoursFromNow = currentIndex * 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] text-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#d4a574]/10 px-4 py-2 rounded-full mb-6">
            <Cloud className="w-4 h-4 text-[#d4a574]" />
            <span className="text-sm uppercase tracking-[0.2em] text-[#d4a574]">
              Numerical Weather Prediction
            </span>
          </div>
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            72-Hour Forecast Model
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Advanced atmospheric modeling for Nairobi, Kenya with 3-hourly temporal resolution
          </p>
        </div>

        {/* Current Forecast Display */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-12 mb-8">
          
          {/* Time Info */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[#d4a574]" />
                <span className="text-sm uppercase tracking-wider text-white/60">
                  Forecast Time
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                {formatFullDateTime(currentForecast.time)}
              </h2>
              <p className="text-white/60">
                {hoursFromNow === 0 ? 'Current conditions' : `+${hoursFromNow} hours from now`}
              </p>
            </div>
            
            <div className="mt-4 lg:mt-0 flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-white/60 mb-1">Forecast Step</div>
                <div className="text-2xl font-bold">{currentIndex + 1} / {forecastData.length}</div>
              </div>
            </div>
          </div>

          {/* Main Weather Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Temperature & Condition */}
            <div className="flex items-center gap-6">
              <div className="bg-[#d4a574]/10 p-6 rounded-2xl">
                <WeatherIcon className="w-20 h-20 text-[#d4a574]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-7xl lg:text-8xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                  {currentForecast.temperature}°
                </div>
                <div className="text-xl text-white/70">
                  Feels like {currentForecast.feelsLike}°C
                </div>
                <div className="text-lg text-white/50 capitalize mt-2">
                  {currentForecast.condition.replace('-', ' ')}
                </div>
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Humidity */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-[#d4a574]" />
                  <span className="text-sm text-white/60 uppercase tracking-wider">Humidity</span>
                </div>
                <div className="text-3xl font-bold">{currentForecast.humidity}%</div>
              </div>

              {/* Wind Speed */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-4 h-4 text-[#d4a574]" />
                  <span className="text-sm text-white/60 uppercase tracking-wider">Wind</span>
                </div>
                <div className="text-3xl font-bold">{currentForecast.windSpeed}</div>
                <div className="text-sm text-white/60">km/h {currentForecast.windDirection}</div>
              </div>

              {/* Pressure */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-[#d4a574]" />
                  <span className="text-sm text-white/60 uppercase tracking-wider">Pressure</span>
                </div>
                <div className="text-3xl font-bold">{currentForecast.pressure}</div>
                <div className="text-sm text-white/60">hPa</div>
              </div>

              {/* Visibility */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-[#d4a574]" />
                  <span className="text-sm text-white/60 uppercase tracking-wider">Visibility</span>
                </div>
                <div className="text-3xl font-bold">{currentForecast.visibility}</div>
                <div className="text-sm text-white/60">km</div>
              </div>
              
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div>
              <div className="text-sm text-white/60 mb-1">Precipitation</div>
              <div className="text-2xl font-bold">{currentForecast.precipitation} mm</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Cloud Cover</div>
              <div className="text-2xl font-bold">{currentForecast.cloudCover}%</div>
            </div>
          </div>
        </div>

        {/* Time Navigation Controls */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Time Navigation</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-white/10 transition-all"
                aria-label="Previous 3 hours"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex === forecastData.length - 1}
                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-white/10 transition-all"
                aria-label="Next 3 hours"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Jump Buttons (Every 12 hours) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {[0, 4, 8, 12, 16, 20, 24].map((step) => {
              if (step >= forecastData.length) return null;
              const forecast = forecastData[step];
              const isActive = currentIndex === step;
              const hours = step * 3;
              
              return (
                <button
                  key={step}
                  onClick={() => jumpToTime(step)}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-[#d4a574] border-[#d4a574] text-black' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs mb-1 font-bold">
                    {hours === 0 ? 'Now' : `+${hours}h`}
                  </div>
                  <div className={`text-xs ${isActive ? 'opacity-80' : 'text-white/60'}`}>
                    {formatDate(forecast.time)}
                  </div>
                  <div className={`text-xs ${isActive ? 'opacity-80' : 'text-white/60'}`}>
                    {formatTime(forecast.time)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Timeline Slider */}
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {forecastData.map((forecast, index) => {
                const isActive = currentIndex === index;
                const ForecastIcon = weatherIcons[forecast.condition] || Cloud;
                
                return (
                  <button
                    key={index}
                    onClick={() => jumpToTime(index)}
                    className={`flex-shrink-0 p-3 rounded-lg border transition-all min-w-[100px] ${
                      isActive 
                        ? 'bg-[#d4a574]/20 border-[#d4a574]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs text-white/60 mb-1">
                      {formatTime(forecast.time)}
                    </div>
                    <ForecastIcon className={`w-6 h-6 mx-auto mb-1 ${isActive ? 'text-[#d4a574]' : 'text-white/70'}`} />
                    <div className="text-lg font-bold">{forecast.temperature}°</div>
                    <div className="text-xs text-white/60">{forecast.windSpeed} km/h</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Temperature Trend Chart (Visual) */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-6">72-Hour Temperature Trend</h3>
          <div className="relative h-48 flex items-end justify-between gap-1">
            {forecastData.map((forecast, index) => {
              const maxTemp = Math.max(...forecastData.map(f => f.temperature));
              const minTemp = Math.min(...forecastData.map(f => f.temperature));
              const height = ((forecast.temperature - minTemp) / (maxTemp - minTemp)) * 100;
              const isActive = currentIndex === index;
              
              return (
                <button
                  key={index}
                  onClick={() => jumpToTime(index)}
                  className={`flex-1 relative group transition-all ${
                    isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${formatTime(forecast.time)}: ${forecast.temperature}°C`}
                >
                  <div className={`absolute inset-0 rounded-t transition-all ${
                    isActive ? 'bg-[#d4a574]' : 'bg-white/20'
                  }`} />
                  
                  {/* Temperature label on hover or active */}
                  {isActive && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#d4a574] text-black px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                      {forecast.temperature}°C
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-4 text-xs text-white/60">
            <span>Now</span>
            <span>+24h</span>
            <span>+48h</span>
            <span>+72h</span>
          </div>
        </div>

        {/* Model Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/50">
            Data from WRF-ARW Model | Updated: {new Date().toLocaleString()} | 
            Location: Nairobi (-1.2921°, 36.8219°)
          </p>
        </div>

      </div>
    </div>
  );
}
