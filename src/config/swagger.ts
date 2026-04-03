import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SubSense API - Subscription Intelligence Platform',
      version: '1.0.0',
      description: `
## Overview
SubSense helps you track, detect, and optimize your recurring subscription payments.

## Features
- **Subscription Management**: Full CRUD operations for managing subscriptions
- **Smart Detection**: Automatically detect subscriptions from SMS/Emails
- **Reminders**: Get notified before renewal dates
- **Analytics**: Track spending patterns and identify unused subscriptions

## Authentication
All protected endpoints require a Bearer token in the Authorization header.
Access tokens expire after 15 minutes. Use the refresh token endpoint to get a new access token.

## Rate Limiting
- 100 requests per 15 minutes per IP address
      `,
      contact: {
        name: 'API Support',
        email: 'support@subsense.io',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login or /api/auth/register',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 8, example: 'password123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
        CreateSubscriptionRequest: {
          type: 'object',
          required: ['name', 'amount', 'billingCycle', 'nextBillingDate'],
          properties: {
            name: { type: 'string', example: 'Netflix' },
            amount: { type: 'integer', example: 499 },
            currency: { type: 'string', default: 'INR', example: 'INR' },
            billingCycle: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
              example: 'monthly',
            },
            intervalCount: { type: 'integer', default: 1, example: 1 },
            nextBillingDate: { type: 'string', format: 'date-time', example: '2026-05-01T00:00:00.000Z' },
            category: { type: 'string', example: 'Entertainment' },
            description: { type: 'string', example: 'Premium plan' },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            amount: { type: 'integer' },
            currency: { type: 'string' },
            billingCycle: { type: 'string' },
            intervalCount: { type: 'integer' },
            nextBillingDate: { type: 'string', format: 'date-time' },
            lastBillingDate: { type: 'string', format: 'date-time', nullable: true },
            category: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['active', 'paused', 'cancelled', 'expired'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        DetectSmsRequest: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', example: 'Your Netflix subscription of ₹499 has been charged' },
          },
        },
        DetectionResponse: {
          type: 'object',
          properties: {
            detectionLog: { type: 'object' },
            parsed: {
              type: 'object',
              properties: {
                name: { type: 'string', nullable: true },
                amount: { type: 'number', nullable: true },
                currency: { type: 'string', nullable: true },
                billingCycle: { type: 'string', nullable: true },
                confidence: { type: 'number' },
              },
            },
            suggestedAction: { type: 'string', enum: ['confirm', 'review'] },
          },
        },
        AnalyticsMonthlySpend: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'string', example: 'Apr 2026' },
              total: { type: 'integer' },
              currency: { type: 'string' },
            },
          },
        },
        AnalyticsCategoryBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              total: { type: 'integer' },
              count: { type: 'integer' },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check endpoint',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '409': {
              description: 'Email already registered',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Login user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          summary: 'Refresh access token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'New access token',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Invalid or expired refresh token',
            },
          },
        },
      },
      '/api/auth/me': {
        get: {
          summary: 'Get current user',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Current user info',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
            },
          },
        },
      },
      '/api/subscriptions': {
        get: {
          summary: 'List all subscriptions',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['active', 'paused', 'cancelled', 'expired'] },
            },
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'List of subscriptions',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Subscription' },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a new subscription',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateSubscriptionRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Subscription created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Subscription' },
                },
              },
            },
            '400': {
              description: 'Validation error',
            },
          },
        },
      },
      '/api/subscriptions/{id}': {
        get: {
          summary: 'Get subscription by ID',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Subscription details',
            },
            '404': {
              description: 'Subscription not found',
            },
          },
        },
        patch: {
          summary: 'Update subscription',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Subscription updated',
            },
            '404': {
              description: 'Subscription not found',
            },
          },
        },
        delete: {
          summary: 'Delete subscription',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '204': {
              description: 'Subscription deleted',
            },
          },
        },
      },
      '/api/subscriptions/{id}/pause': {
        post: {
          summary: 'Pause a subscription',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Subscription paused',
            },
          },
        },
      },
      '/api/subscriptions/{id}/resume': {
        post: {
          summary: 'Resume a paused subscription',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Subscription resumed',
            },
          },
        },
      },
      '/api/subscriptions/upcoming': {
        get: {
          summary: 'Get upcoming renewals',
          tags: ['Subscriptions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'days',
              in: 'query',
              schema: { type: 'integer', default: 7 },
            },
          ],
          responses: {
            '200': {
              description: 'Upcoming renewals',
            },
          },
        },
      },
      '/api/detect/sms': {
        post: {
          summary: 'Detect subscription from SMS',
          tags: ['Detection'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DetectSmsRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Detection result',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DetectionResponse' },
                },
              },
            },
          },
        },
      },
      '/api/detect/confirm': {
        post: {
          summary: 'Confirm or reject detection',
          tags: ['Detection'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['detectionLogId', 'confirmed'],
                  properties: {
                    detectionLogId: { type: 'string', format: 'uuid' },
                    confirmed: { type: 'boolean' },
                    name: { type: 'string' },
                    amount: { type: 'integer' },
                    billingCycle: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Confirmation result',
            },
          },
        },
      },
      '/api/analytics/monthly-spend': {
        get: {
          summary: 'Get monthly spend data',
          tags: ['Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'months',
              in: 'query',
              schema: { type: 'integer', default: 6 },
            },
          ],
          responses: {
            '200': {
              description: 'Monthly spend data',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AnalyticsMonthlySpend' },
                },
              },
            },
          },
        },
      },
      '/api/analytics/category-breakdown': {
        get: {
          summary: 'Get spending by category',
          tags: ['Analytics'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Category breakdown',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AnalyticsCategoryBreakdown' },
                },
              },
            },
          },
        },
      },
      '/api/analytics/total-monthly-spend': {
        get: {
          summary: 'Get total monthly spend',
          tags: ['Analytics'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Total monthly spend',
            },
          },
        },
      },
      '/api/analytics/unused-subscriptions': {
        get: {
          summary: 'Get unused subscriptions',
          tags: ['Analytics'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'days',
              in: 'query',
              schema: { type: 'integer', default: 30 },
            },
          ],
          responses: {
            '200': {
              description: 'Unused subscriptions',
            },
          },
        },
      },
    },
  },
  apis: ['./src/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);