"""
Safaricom Daraja M-Pesa helper — STK Push (Lipa Na M-Pesa Online).

Docs: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
"""
import base64
import logging
import os
from datetime import datetime

import requests

logger = logging.getLogger(__name__)

DARAJA_BASE = os.getenv('DARAJA_ENV', 'sandbox')
if DARAJA_BASE == 'production':
    BASE_URL = 'https://api.safaricom.co.ke'
else:
    BASE_URL = 'https://sandbox.safaricom.co.ke'


def _get_access_token() -> str:
    consumer_key = os.getenv('DARAJA_CONSUMER_KEY', '')
    consumer_secret = os.getenv('DARAJA_CONSUMER_SECRET', '')
    credentials = base64.b64encode(f'{consumer_key}:{consumer_secret}'.encode()).decode()
    url = f'{BASE_URL}/oauth/v1/generate?grant_type=client_credentials'
    response = requests.get(url, headers={'Authorization': f'Basic {credentials}'}, timeout=10)
    response.raise_for_status()
    return response.json()['access_token']


def _get_password_and_timestamp(shortcode: str, passkey: str):
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    raw = f'{shortcode}{passkey}{timestamp}'
    password = base64.b64encode(raw.encode()).decode()
    return password, timestamp


def stk_push(phone: str, amount: int, account_ref: str, description: str, callback_url: str) -> dict:
    """
    Initiate an STK Push to the customer's phone.

    phone: E.164 without '+', e.g. '254712345678'
    amount: integer KES
    Returns Daraja API response dict.
    """
    shortcode = os.getenv('DARAJA_SHORTCODE', '174379')
    passkey = os.getenv('DARAJA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')
    password, timestamp = _get_password_and_timestamp(shortcode, passkey)

    payload = {
        'BusinessShortCode': shortcode,
        'Password': password,
        'Timestamp': timestamp,
        'TransactionType': 'CustomerPayBillOnline',
        'Amount': amount,
        'PartyA': phone,
        'PartyB': shortcode,
        'PhoneNumber': phone,
        'CallBackURL': callback_url,
        'AccountReference': account_ref[:12],
        'TransactionDesc': description[:13],
    }

    token = _get_access_token()
    url = f'{BASE_URL}/mpesa/stkpush/v1/processrequest'
    response = requests.post(
        url,
        json=payload,
        headers={'Authorization': f'Bearer {token}'},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()
