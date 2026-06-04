import requests
from django.conf import settings
from datetime import datetime


def get_weather_forecast():
    api_key = settings.OPENWEATHER_API_KEY
    lat = settings.DEFAULT_WEATHER_LAT
    lon = settings.DEFAULT_WEATHER_LON

    if not api_key:
        return _mock_forecast()

    try:
        url = 'https://api.openweathermap.org/data/2.5/onecall'
        params = {
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'metric',
            'exclude': 'minutely,alerts',
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        raw = resp.json()
        return _parse_onecall(raw)
    except Exception:
        return _mock_forecast()


def _parse_onecall(raw):
    def weather_entry(item):
        w = item.get('weather', [{}])[0]
        return {
            'temperature': item.get('temp', item.get('temp', {}).get('day') if isinstance(item.get('temp'), dict) else item.get('temp')),
            'condition': w.get('description', ''),
            'icon': f"https://openweathermap.org/img/wn/{w.get('icon', '01d')}@2x.png",
            'timestamp': datetime.utcfromtimestamp(item['dt']).isoformat(),
            'humidity': item.get('humidity', 0),
            'wind_speed': item.get('wind_speed', 0),
            'precipitation': item.get('pop', 0) * 100,
        }

    current = raw.get('current', {})
    cw = current.get('weather', [{}])[0]

    return {
        'location': settings.DEFAULT_WEATHER_CITY,
        'timezone': raw.get('timezone', 'UTC'),
        'current': {
            'temperature': current.get('temp', 20),
            'condition': cw.get('description', ''),
            'icon': f"https://openweathermap.org/img/wn/{cw.get('icon', '01d')}@2x.png",
            'timestamp': datetime.utcfromtimestamp(current.get('dt', 0)).isoformat(),
            'humidity': current.get('humidity', 0),
            'wind_speed': current.get('wind_speed', 0),
            'precipitation': 0,
        },
        'hourly': [weather_entry(h) for h in raw.get('hourly', [])[:72]],
        'daily': [weather_entry(d) for d in raw.get('daily', [])[:7]],
    }


def _mock_forecast():
    """Returns plausible Cape Town mock data when no API key is set."""
    now = datetime.utcnow()
    hourly = []
    for i in range(72):
        ts = now.replace(minute=0, second=0, microsecond=0)
        from datetime import timedelta
        ts = ts + timedelta(hours=i)
        hourly.append({
            'temperature': 18 + (i % 12),
            'condition': 'partly cloudy',
            'icon': 'https://openweathermap.org/img/wn/02d@2x.png',
            'timestamp': ts.isoformat(),
            'humidity': 65,
            'wind_speed': 12,
            'precipitation': 10,
        })

    from datetime import timedelta
    daily = []
    for i in range(7):
        ts = now + timedelta(days=i)
        daily.append({
            'temperature': 20 + (i % 5),
            'condition': 'sunny',
            'icon': 'https://openweathermap.org/img/wn/01d@2x.png',
            'timestamp': ts.isoformat(),
            'humidity': 60,
            'wind_speed': 10,
            'precipitation': 5,
        })

    return {
        'location': settings.DEFAULT_WEATHER_CITY,
        'timezone': 'Africa/Nairobi',
        'current': {
            'temperature': 22,
            'condition': 'clear sky',
            'icon': 'https://openweathermap.org/img/wn/01d@2x.png',
            'timestamp': now.isoformat(),
            'humidity': 65,
            'wind_speed': 14,
            'precipitation': 0,
        },
        'hourly': hourly,
        'daily': daily,
    }
