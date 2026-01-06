/**
 * Payment Integration Generator
 * 
 * Generate payment integration code for Stripe, PayPal,
 * Square, and other payment providers.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'razorpay' | 'lemonsqueezy';
export type PaymentFramework = 'express' | 'nextjs' | 'django' | 'laravel' | 'flutter';

export interface PaymentConfig {
    provider: PaymentProvider;
    framework: PaymentFramework;
    features: {
        oneTime?: boolean;
        subscription?: boolean;
        webhook?: boolean;
        refunds?: boolean;
    };
}

// ============================================================================
// PAYMENT GENERATOR
// ============================================================================

export class PaymentIntegrationGenerator extends EventEmitter {
    private static instance: PaymentIntegrationGenerator;

    private constructor() {
        super();
    }

    static getInstance(): PaymentIntegrationGenerator {
        if (!PaymentIntegrationGenerator.instance) {
            PaymentIntegrationGenerator.instance = new PaymentIntegrationGenerator();
        }
        return PaymentIntegrationGenerator.instance;
    }

    // ========================================================================
    // STRIPE
    // ========================================================================

    /**
     * Generate Stripe integration for Express
     */
    generateStripeExpress(): { routes: string; webhook: string; utils: string } {
        const routes = `import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription', // or 'payment' for one-time
      success_url: successUrl || \`\${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: cancelUrl || \`\${process.env.FRONTEND_URL}/cancel\`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create payment intent (for custom flows)
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', customerId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create customer
router.post('/customers', async (req, res) => {
  try {
    const { email, name } = req.body;
    const customer = await stripe.customers.create({ email, name });
    res.json({ customerId: customer.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get subscription
router.get('/subscriptions/:id', async (req, res) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(req.params.id);
    res.json(subscription);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/subscriptions/:id/cancel', async (req, res) => {
  try {
    const subscription = await stripe.subscriptions.cancel(req.params.id);
    res.json(subscription);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create refund
router.post('/refunds', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
    res.json(refund);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
`;

        const webhook = `import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout completed:', session.id);
      // TODO: Fulfill the order
      break;

    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object as Stripe.Subscription;
      console.log('Subscription created:', subscriptionCreated.id);
      // TODO: Update user subscription status
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      console.log('Subscription updated:', subscriptionUpdated.id);
      // TODO: Handle subscription changes
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      console.log('Subscription cancelled:', subscriptionDeleted.id);
      // TODO: Revoke access
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Payment succeeded:', invoice.id);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log('Payment failed:', failedInvoice.id);
      // TODO: Notify user
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }

  res.json({ received: true });
});

export default router;
`;

        const utils = `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const stripeUtils = {
  // Create a product
  async createProduct(name: string, description?: string) {
    return stripe.products.create({ name, description });
  },

  // Create a price
  async createPrice(productId: string, amount: number, currency = 'usd', recurring?: { interval: 'month' | 'year' }) {
    return stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100),
      currency,
      recurring,
    });
  },

  // Get customer portal URL
  async getCustomerPortalUrl(customerId: string, returnUrl: string) {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  },

  // Check subscription status
  async getSubscriptionStatus(subscriptionId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  },
};
`;

        return { routes, webhook, utils };
    }

    /**
     * Generate Stripe for Next.js
     */
    generateStripeNextJS(): string {
        return `// app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: \`\${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_URL}/pricing\`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// app/api/stripe/webhook/route.ts
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break;
      case 'customer.subscription.deleted':
        // Handle cancelled subscription
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// React Hook for Stripe
'use client';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function useStripeCheckout() {
  const checkout = async (priceId: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const { url } = await res.json();
    window.location.href = url;
  };

  return { checkout };
}
`;
    }

    // ========================================================================
    // PAYPAL
    // ========================================================================

    /**
     * Generate PayPal integration
     */
    generatePayPalExpress(): string {
        return `import express from 'express';
import paypal from '@paypal/checkout-server-sdk';

const router = express.Router();

// PayPal environment
const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!
    );

const client = new paypal.core.PayPalHttpClient(environment);

// Create order
router.post('/orders', async (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toString(),
        },
      }],
    });

    const order = await client.execute(request);
    res.json({ orderId: order.result.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Capture order
router.post('/orders/:orderId/capture', async (req, res) => {
  try {
    const { orderId } = req.params;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    res.json(capture.result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
`;
    }

    // ========================================================================
    // FLUTTER PAYMENTS
    // ========================================================================

    /**
     * Generate Flutter Stripe integration
     */
    generateFlutterStripe(): string {
        return `import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class StripeService {
  static const String _baseUrl = 'YOUR_API_URL';

  static Future<void> initialize() async {
    Stripe.publishableKey = 'YOUR_PUBLISHABLE_KEY';
    await Stripe.instance.applySettings();
  }

  // Create payment intent and process payment
  static Future<bool> processPayment({
    required int amount,
    required String currency,
  }) async {
    try {
      // 1. Create payment intent on server
      final response = await http.post(
        Uri.parse('\$_baseUrl/create-payment-intent'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'amount': amount,
          'currency': currency,
        }),
      );

      final data = jsonDecode(response.body);
      final clientSecret = data['clientSecret'];

      // 2. Initialize payment sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Your App Name',
          style: ThemeMode.system,
        ),
      );

      // 3. Present payment sheet
      await Stripe.instance.presentPaymentSheet();

      return true;
    } catch (e) {
      print('Payment failed: \$e');
      return false;
    }
  }

  // Create subscription checkout
  static Future<String?> createSubscription(String priceId) async {
    try {
      final response = await http.post(
        Uri.parse('\$_baseUrl/create-checkout-session'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'priceId': priceId}),
      );

      final data = jsonDecode(response.body);
      return data['url'];
    } catch (e) {
      print('Subscription creation failed: \$e');
      return null;
    }
  }
}

// Usage Widget
class PaymentButton extends StatelessWidget {
  final int amount;
  final String currency;
  final VoidCallback onSuccess;
  final VoidCallback onError;

  const PaymentButton({
    super.key,
    required this.amount,
    this.currency = 'usd',
    required this.onSuccess,
    required this.onError,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () async {
        final success = await StripeService.processPayment(
          amount: amount,
          currency: currency,
        );
        if (success) {
          onSuccess();
        } else {
          onError();
        }
      },
      child: Text('Pay \$\${(amount / 100).toStringAsFixed(2)}'),
    );
  }
}
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Generate env template
     */
    generateEnvTemplate(provider: PaymentProvider): string {
        switch (provider) {
            case 'stripe':
                return `# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
`;
            case 'paypal':
                return `# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
`;
            default:
                return '';
        }
    }

    /**
     * Generate pricing component
     */
    generatePricingComponent(): string {
        return `import { useState } from 'react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  priceId: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9,
    interval: 'month',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    priceId: 'price_basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    features: ['Everything in Basic', 'Feature 4', 'Feature 5', 'Priority Support'],
    priceId: 'price_pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Support', 'SLA'],
    priceId: 'price_enterprise',
  },
];

export function PricingTable() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="pricing-grid">
      {plans.map((plan) => (
        <div key={plan.id} className={\`pricing-card \${plan.popular ? 'popular' : ''}\`}>
          {plan.popular && <span className="badge">Most Popular</span>}
          <h3>{plan.name}</h3>
          <div className="price">
            <span className="amount">\${plan.price}</span>
            <span className="interval">/{plan.interval}</span>
          </div>
          <ul>
            {plan.features.map((feature) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe(plan.priceId)}
            disabled={loading === plan.priceId}
          >
            {loading === plan.priceId ? 'Loading...' : 'Subscribe'}
          </button>
        </div>
      ))}
    </div>
  );
}
`;
    }
}

// Export singleton
export const paymentIntegrationGenerator = PaymentIntegrationGenerator.getInstance();
