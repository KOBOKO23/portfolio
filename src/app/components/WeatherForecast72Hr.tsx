import { useState, useEffect } from 'react';
import {
  Cloud, Wind, Droplets, Eye, Gauge, CloudRain,
  CloudSnow, Sun, CloudSun, CloudDrizzle, Zap,
  ChevronLeft, ChevronRight, Calendar, RefreshCw,
} from 'lucide-react';

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
  wmoCode: number;
}

// WMO weather interpretation code → internal condition key
function wmoToCondition(code: number): string {
  if (code <= 1) return 'clear';
  if (code === 2) return 'partly-cloudy';
  if (code === 3) return 'overcast';
  if (code >= 45 && code <= 48) return 'cloudy';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 95) return 'thunderstorm';
  return 'partly-cloudy';
}

function wmoToLabel(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 63) return 'Rain';
  if (code === 65) return 'Heavy Rain';
  if (code >= 71 && code <= 75) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code === 95) return 'Thunderstorm';
  if (code >= 96) return 'Thunderstorm + Hail';
  return 'Mixed';
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

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

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation: number[];
  weathercode: number[];
  windspeed_10m: number[];
  winddirection_10m: number[];
  relativehumidity_2m: number[];
  cloudcover: number[];
  pressure_msl: number[];
  visibility: (number | null)[];
}

// ── Open-Meteo ECMWF IFS fetch ───────────────────────────────────────────────
const LAT = 1.2921;  // Nairobi
const LON = 36.8219;

async function fetchECMWF(): Promise<ForecastData[]> {
  const params = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LON),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation',
      'weathercode',
      'windspeed_10m',
      'winddirection_10m',
      'relativehumidity_2m',
      'cloudcover',
      'pressure_msl',
      'visibility',
    ].join(','),
    forecast_days: '3',
    timezone: 'Africa/Nairobi',
    models: 'ecmwf_ifs025',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const json = (await res.json()) as { hourly: OpenMeteoHourly };
  const h = json.hourly;

  // Take every 3rd hour → 24 data points for 72 hours
  const points: ForecastData[] = [];
  for (let i = 0; i < h.time.length; i += 3) {
    const t = h.time[i] ?? '';
    const wmo = h.weathercode[i] ?? 0;
    points.push({
      time: new Date(t),
      temperature: Math.round(h.temperature_2m[i] ?? 0),
      feelsLike: Math.round(h.apparent_temperature[i] ?? 0),
      humidity: Math.round(h.relativehumidity_2m[i] ?? 0),
      windSpeed: Math.round(h.windspeed_10m[i] ?? 0),
      windDirection: degToCompass(h.winddirection_10m[i] ?? 0),
      pressure: Math.round(h.pressure_msl[i] ?? 1013),
      visibility: Math.round(((h.visibility[i] ?? null) ?? 10000) / 1000),
      precipitation: Math.round((h.precipitation[i] ?? 0) * 10) / 10,
      condition: wmoToCondition(wmo),
      cloudCover: Math.round(h.cloudcover[i] ?? 0),
      wmoCode: wmo,
    });
  }
  return points;
}

export function WeatherForecast72Hr() {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchECMWF();
      setForecastData(data);
      setLastUpdated(new Date());
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const goToNext = () => setCurrentIndex((p) => Math.min(p + 1, forecastData.length - 1));
  const goToPrevious = () => setCurrentIndex((p) => Math.max(p - 1, 0));

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatFullDateTime = (d: Date) =>
    d.toLocaleString('en-KE', {
      weekday: 'long', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#d4a574] mx-auto mb-4 animate-spin" />
          <p className="text-xl text-white/70">Fetching ECMWF IFS forecast for Nairobi…</p>
          <p className="text-sm text-white/40 mt-2">Powered by Open-Meteo · ECMWF IFS 0.25°</p>
        </div>
      </div>
    );
  }

  if (error || forecastData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Cloud className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-xl text-white/70 mb-4">{error ?? 'No forecast data available'}</p>
          <button
            onClick={load}
            className="px-6 py-3 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const current = forecastData[currentIndex];
  const WeatherIcon = weatherIcons[current.condition] ?? Cloud;
  const hoursFromNow = currentIndex * 3;

  const maxTemp = Math.max(...forecastData.map((f) => f.temperature));
  const minTemp = Math.min(...forecastData.map((f) => f.temperature));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] text-white py-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#d4a574]/10 px-4 py-2 mb-6">
            <Cloud className="w-4 h-4 text-[#d4a574]" />
            <span className="text-sm uppercase tracking-[0.2em] text-[#d4a574]">
              ECMWF IFS 0.25° · Numerical Weather Prediction
            </span>
          </div>
          <h1
            className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            72-Hour Forecast
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-4">
            Live ECMWF atmospheric model · Nairobi, Kenya (1.29°N 36.82°E)
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-white/40">
            {lastUpdated && <span>Updated: {lastUpdated.toLocaleTimeString('en-KE')}</span>}
            <button
              onClick={load}
              className="flex items-center gap-1 hover:text-[#d4a574] transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Current Forecast Display */}
        <div className="bg-white/5 border border-white/10 p-8 lg:p-12 mb-8">

          {/* Time Info */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[#d4a574]" />
                <span className="text-sm uppercase tracking-wider text-white/60">Forecast Time</span>
              </div>
              <h2 className="text-3xl lg:text-4xl mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                {formatFullDateTime(current.time)}
              </h2>
              <p className="text-white/60">
                {hoursFromNow === 0 ? 'Current conditions' : `+${hoursFromNow} hours from now`}
              </p>
            </div>
            <div className="mt-4 lg:mt-0 text-right">
              <div className="text-sm text-white/60 mb-1">Step</div>
              <div className="text-2xl font-bold">{currentIndex + 1} / {forecastData.length}</div>
            </div>
          </div>

          {/* Main Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="bg-[#d4a574]/10 p-6">
                <WeatherIcon className="w-20 h-20 text-[#d4a574]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-7xl lg:text-8xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                  {current.temperature}°
                </div>
                <div className="text-xl text-white/70">Feels like {current.feelsLike}°C</div>
                <div className="text-lg text-white/50 mt-2">{wmoToLabel(current.wmoCode)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Droplets, label: 'Humidity', value: `${current.humidity}%`, sub: '' },
                { icon: Wind, label: 'Wind', value: `${current.windSpeed}`, sub: `km/h ${current.windDirection}` },
                { icon: Gauge, label: 'Pressure', value: `${current.pressure}`, sub: 'hPa' },
                { icon: Eye, label: 'Visibility', value: `${current.visibility}`, sub: 'km' },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="bg-white/5 p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-[#d4a574]" />
                    <span className="text-sm text-white/60 uppercase tracking-wider">{label}</span>
                  </div>
                  <div className="text-3xl font-bold">{value}</div>
                  {sub && <div className="text-sm text-white/60">{sub}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div>
              <div className="text-sm text-white/60 mb-1">Precipitation</div>
              <div className="text-2xl font-bold">{current.precipitation} mm</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Cloud Cover</div>
              <div className="text-2xl font-bold">{current.cloudCover}%</div>
            </div>
          </div>
        </div>

        {/* Timeline Navigation */}
        <div className="bg-white/5 border border-white/10 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Time Navigation</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 transition-all"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex === forecastData.length - 1}
                className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 transition-all"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Day-jump buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {[0, 4, 8, 12, 16, 20, 23].map((step) => {
              if (step >= forecastData.length) return null;
              const f = forecastData[step];
              const active = currentIndex === step;
              return (
                <button
                  key={step}
                  onClick={() => setCurrentIndex(step)}
                  className={`p-3 border transition-all ${
                    active
                      ? 'bg-[#d4a574] border-[#d4a574] text-black'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs mb-1 font-bold">
                    {step === 0 ? 'Now' : `+${step * 3}h`}
                  </div>
                  <div className={`text-xs ${active ? 'opacity-80' : 'text-white/60'}`}>
                    {formatDate(f.time)}
                  </div>
                  <div className={`text-xs ${active ? 'opacity-80' : 'text-white/60'}`}>
                    {formatTime(f.time)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scrollable hourly strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {forecastData.map((f, idx) => {
              const active = currentIndex === idx;
              const FIcon = weatherIcons[f.condition] ?? Cloud;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 p-3 border transition-all min-w-[88px] ${
                    active
                      ? 'bg-[#d4a574]/20 border-[#d4a574]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs text-white/60 mb-1">{formatTime(f.time)}</div>
                  <FIcon className={`w-6 h-6 mx-auto mb-1 ${active ? 'text-[#d4a574]' : 'text-white/70'}`} />
                  <div className="text-lg font-bold">{f.temperature}°</div>
                  <div className="text-xs text-white/60">{f.windSpeed} km/h</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Temperature trend bars */}
        <div className="bg-white/5 border border-white/10 p-6">
          <h3 className="text-xl font-bold mb-6">72-Hour Temperature Trend</h3>
          <div className="relative h-48 flex items-end justify-between gap-1">
            {forecastData.map((f, idx) => {
              const height = maxTemp === minTemp
                ? 50
                : ((f.temperature - minTemp) / (maxTemp - minTemp)) * 85 + 10;
              const active = currentIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-1 relative group transition-all ${active ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                  style={{ height: `${height}%` }}
                  title={`${formatTime(f.time)}: ${f.temperature}°C`}
                >
                  <div className={`absolute inset-0 rounded-t transition-all ${active ? 'bg-[#d4a574]' : 'bg-white/20'}`} />
                  {active && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#d4a574] text-black px-2 py-1 text-xs font-bold whitespace-nowrap">
                      {f.temperature}°C
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-xs text-white/60">
            <span>Now</span>
            <span>+24h</span>
            <span>+48h</span>
            <span>+72h</span>
          </div>
        </div>

        {/* Source attribution */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/40">
            ECMWF IFS 0.25° via{' '}
            <a
              href="https://open-meteo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4a574] hover:underline"
            >
              Open-Meteo
            </a>
            {' '}· Nairobi, Kenya (1.2921°N, 36.8219°E) · {lastUpdated?.toLocaleString('en-KE')}
          </p>
        </div>

      </div>
    </div>
  );
}
