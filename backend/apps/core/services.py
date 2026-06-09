from datetime import datetime, timedelta

import requests
from django.conf import settings

# WMO Weather Interpretation Codes → (description, icon filename)
WMO_CODES = {
    0:  ('Clear sky',               '01d'),
    1:  ('Mainly clear',            '01d'),
    2:  ('Partly cloudy',           '02d'),
    3:  ('Overcast',                '04d'),
    45: ('Foggy',                   '50d'),
    48: ('Rime fog',                '50d'),
    51: ('Light drizzle',           '09d'),
    53: ('Moderate drizzle',        '09d'),
    55: ('Dense drizzle',           '09d'),
    61: ('Slight rain',             '10d'),
    63: ('Moderate rain',           '10d'),
    65: ('Heavy rain',              '10d'),
    71: ('Slight snowfall',         '13d'),
    73: ('Moderate snowfall',       '13d'),
    75: ('Heavy snowfall',          '13d'),
    77: ('Snow grains',             '13d'),
    80: ('Slight showers',          '09d'),
    81: ('Moderate showers',        '09d'),
    82: ('Violent showers',         '09d'),
    85: ('Slight snow showers',     '13d'),
    86: ('Heavy snow showers',      '13d'),
    95: ('Thunderstorm',            '11d'),
    96: ('Thunderstorm with hail',  '11d'),
    99: ('Thunderstorm heavy hail', '11d'),
}

ICON_BASE = 'https://openweathermap.org/img/wn/{}@2x.png'


def _decode_wmo(code: int, hour: int = 12) -> tuple[str, str]:
    desc, icon_name = WMO_CODES.get(code, ('Unknown', '01d'))
    suffix = 'd' if 6 <= hour < 20 else 'n'
    icon = ICON_BASE.format(icon_name.replace('d', suffix))
    return desc, icon


def get_weather_forecast() -> dict:
    lat = settings.DEFAULT_WEATHER_LAT
    lon = settings.DEFAULT_WEATHER_LON

    try:
        resp = requests.get(
            'https://api.open-meteo.com/v1/forecast',
            params={
                'latitude': lat,
                'longitude': lon,
                'hourly': ','.join([
                    'temperature_2m',
                    'relativehumidity_2m',
                    'precipitation_probability',
                    'weathercode',
                    'windspeed_10m',
                ]),
                'daily': ','.join([
                    'weathercode',
                    'temperature_2m_max',
                    'temperature_2m_min',
                    'precipitation_sum',
                    'windspeed_10m_max',
                ]),
                'current_weather': 'true',
                'timezone': 'auto',
                'forecast_days': 7,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return _parse_open_meteo(resp.json())
    except Exception:
        return _mock_forecast()


def _parse_open_meteo(raw: dict) -> dict:
    hourly   = raw.get('hourly', {})
    daily    = raw.get('daily', {})
    current  = raw.get('current_weather', {})
    timezone = raw.get('timezone', 'Africa/Nairobi')

    times_h = hourly.get('time', [])
    temps_h = hourly.get('temperature_2m', [])
    hum_h   = hourly.get('relativehumidity_2m', [])
    prec_h  = hourly.get('precipitation_probability', [])
    code_h  = hourly.get('weathercode', [])
    wind_h  = hourly.get('windspeed_10m', [])

    hourly_out = []
    for i, ts in enumerate(times_h[:72]):
        hour = int(ts[11:13]) if len(ts) >= 13 else 12
        code = code_h[i] if i < len(code_h) else 0
        desc, icon = _decode_wmo(code, hour)
        hourly_out.append({
            'temperature': temps_h[i] if i < len(temps_h) else 20,
            'condition':   desc,
            'icon':        icon,
            'timestamp':   ts,
            'humidity':    hum_h[i] if i < len(hum_h) else 65,
            'wind_speed':  wind_h[i] if i < len(wind_h) else 0,
            'precipitation': prec_h[i] if i < len(prec_h) else 0,
        })

    times_d    = daily.get('time', [])
    tmax       = daily.get('temperature_2m_max', [])
    tmin       = daily.get('temperature_2m_min', [])
    prec_d     = daily.get('precipitation_sum', [])
    code_d     = daily.get('weathercode', [])
    wind_d     = daily.get('windspeed_10m_max', [])

    daily_out = []
    for i, ts in enumerate(times_d):
        code = code_d[i] if i < len(code_d) else 0
        desc, icon = _decode_wmo(code, 12)
        t_max = tmax[i] if i < len(tmax) else 25
        t_min = tmin[i] if i < len(tmin) else 15
        daily_out.append({
            'temperature': round((t_max + t_min) / 2, 1),
            'temp_max':    t_max,
            'temp_min':    t_min,
            'condition':   desc,
            'icon':        icon,
            'timestamp':   ts,
            'humidity':    65,
            'wind_speed':  wind_d[i] if i < len(wind_d) else 0,
            'precipitation': prec_d[i] if i < len(prec_d) else 0,
        })

    curr_code = int(current.get('weathercode', 0))
    curr_hour = int(str(current.get('time', '12:00'))[-5:-3]) if current.get('time') else 12
    curr_desc, curr_icon = _decode_wmo(curr_code, curr_hour)

    return {
        'location': settings.DEFAULT_WEATHER_CITY,
        'timezone': timezone,
        'source': 'open-meteo',
        'current': {
            'temperature': current.get('temperature', 20),
            'condition':   curr_desc,
            'icon':        curr_icon,
            'timestamp':   current.get('time', datetime.utcnow().isoformat()),
            'humidity':    hum_h[0] if hum_h else 65,
            'wind_speed':  current.get('windspeed', 0),
            'precipitation': 0,
        },
        'hourly': hourly_out,
        'daily':  daily_out,
    }


def _mock_forecast() -> dict:
    now = datetime.utcnow()
    hourly = [
        {
            'temperature': 18 + (i % 12),
            'condition':   'Partly cloudy',
            'icon':        ICON_BASE.format('02d'),
            'timestamp':   (now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=i)).isoformat(),
            'humidity':    65,
            'wind_speed':  12,
            'precipitation': 10,
        }
        for i in range(72)
    ]
    daily = [
        {
            'temperature': 22 + (i % 4),
            'temp_max':    25 + (i % 4),
            'temp_min':    16 + (i % 3),
            'condition':   'Sunny',
            'icon':        ICON_BASE.format('01d'),
            'timestamp':   (now + timedelta(days=i)).strftime('%Y-%m-%d'),
            'humidity':    60,
            'wind_speed':  10,
            'precipitation': 2,
        }
        for i in range(7)
    ]
    return {
        'location': settings.DEFAULT_WEATHER_CITY,
        'timezone': 'Africa/Nairobi',
        'source':   'mock',
        'current': {
            'temperature': 22,
            'condition':   'Clear sky',
            'icon':        ICON_BASE.format('01d'),
            'timestamp':   now.isoformat(),
            'humidity':    65,
            'wind_speed':  14,
            'precipitation': 0,
        },
        'hourly': hourly,
        'daily':  daily,
    }
