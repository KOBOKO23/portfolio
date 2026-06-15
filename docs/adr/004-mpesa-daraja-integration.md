# ADR 004 — M-Pesa Daraja for Kenyan Mobile Payments

**Status:** Accepted  
**Date:** 2026-06-15  
**Author:** Philip Oduya

---

## Context

The portfolio includes a book pre-order feature with payment capability. The primary target market is Kenya, where mobile money via M-Pesa holds dominant market share — [approximately 87% of Kenya's adult population](https://www.safaricom.co.ke/about/media-centre/publications) uses M-Pesa for payments.

Card payments (Stripe) cover international buyers, but excluding mobile money would make the product inaccessible to the majority of the intended Kenyan audience.

## Decision

Integrate **Safaricom M-Pesa STK Push** via the Daraja API alongside Stripe for card payments.

The two payment methods are independent: a buyer chooses one or the other on the pre-order page.

## M-Pesa STK Push flow

1. The customer enters their phone number and amount.
2. The backend calls `POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest` with the customer's phone, amount, and a callback URL.
3. Safaricom sends a push notification to the customer's phone requesting PIN confirmation.
4. The customer enters their M-Pesa PIN on their device.
5. Safaricom calls back `POST /api/payments/mpesa/callback/` with the transaction result.
6. The frontend polls `GET /api/payments/orders/<uuid>/` every 5 seconds to detect the status change.

## Why STK Push over PayBill / BuyGoods

| Approach | UX | Backend complexity |
|----------|----|--------------------|
| STK Push (Lipa Na M-Pesa Online) | Customer enters phone number; PIN prompt arrives automatically | Medium — requires Daraja API key + HTTPS callback |
| PayBill + manual confirmation | Customer manually sends money to a shortcode, enters account reference | High — no real-time confirmation; operator confirms manually |
| BuyGoods (Till number) | Same as PayBill | High — same issues |

STK Push is the only Daraja API that provides real-time, programmatic confirmation of payment.

## Why not a third-party aggregator

Alternatives considered:

| Provider | Pros | Cons |
|----------|------|------|
| **Pesapal** | Covers M-Pesa + cards in one SDK | 2–3% per transaction fee on top of M-Pesa charges; requires business registration |
| **Flutterwave** | Wide African coverage | Additional 1.4% fee; not focused on Kenya specifically |
| **Direct Daraja** | Free (Safaricom charges apply only to the customer); full control | Requires Safaricom developer account |

For a personal portfolio, the direct Daraja integration avoids aggregator fees and gives full visibility into the transaction lifecycle.

## Consequences

**Positive:**
- Zero aggregator fees
- Real-time payment confirmation via callback + polling
- Full transaction data in the admin dashboard

**Negative / Trade-offs:**
- Requires a Safaricom developer account and a registered M-Pesa business shortcode for production
- HTTPS callback URL required — must be publicly accessible (Render's URL satisfies this)
- Sandbox uses a shared test shortcode; behaviour differs slightly from production
- Daraja sandbox can be unreliable during Safaricom maintenance windows

## Environment variables required

```
DARAJA_CONSUMER_KEY=...
DARAJA_CONSUMER_SECRET=...
DARAJA_ENV=production          # or sandbox
DARAJA_SHORTCODE=174379        # your business shortcode
DARAJA_PASSKEY=...             # from Daraja dashboard
DARAJA_CALLBACK_URL=https://api.koboko.dev/api/payments/mpesa/callback/
```
