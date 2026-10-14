# Integrations

Integrations are API integrations with external services.
They might package a bunch of API calls, or just one.

## Purpose

Integrations handle communication with external services like:
- Payment processors
- Email services
- Government APIs
- Third-party data providers

## Structure

Each integration should be a self-contained class that:
- Handles authentication with the external service
- Provides methods for specific API calls
- Includes proper error handling
- Logs requests and responses appropriately
- Uses environment variables for configuration

## Example Structure

```typescript
// api/src/integrations/payment-service.ts
export class PaymentService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.PAYMENT_SERVICE_API_KEY!
    this.baseUrl = process.env.PAYMENT_SERVICE_BASE_URL!
  }

  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        throw new Error(`Payment service error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('Payment service integration error:', error)
      throw error
    }
  }
}
```

## Conventions

- Use environment variables for sensitive configuration
- Include proper TypeScript types for requests/responses
- Handle HTTP errors gracefully
- Log integration errors appropriately
- Use descriptive method names that match the external API
- Include retry logic for transient failures when appropriate
