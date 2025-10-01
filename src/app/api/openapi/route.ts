import { NextResponse } from "next/server";

export async function GET() {
  const openapi = {
    openapi: "3.0.3",
    info: {
      title: "CUI Internship API",
      version: "1.0.0",
      description: "OpenAPI specification for auth endpoints",
    },
    servers: [
      { url: process.env.APP_URL || "https://cui-internship-git-dev-talhas-projects-59c8907e.vercel.app", description: "Default" },
    ],
    paths: {
      "/api/auth/register": {
        post: {
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password","regNo"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                    regNo: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "User created (email sent or failed)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      user: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          regNo: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error or existing user" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Login a user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              headers: {
                "Set-Cookie": {
                  schema: { type: "string" },
                  description: "Sets httpOnly refreshToken cookie",
                },
              },
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      user: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                        },
                      },
                      accessToken: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid credentials or missing fields" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/auth/refresh-token": {
        get: {
          summary: "Get a new access token using refresh token cookie",
          responses: {
            "200": {
              description: "New access token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { accessToken: { type: "string" } },
                  },
                },
              },
            },
            "401": { description: "Missing or invalid refresh token" },
          },
        },
      },
      "/api/auth/verify-email": {
        post: {
          summary: "Verify email using token (JSON body)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token"],
                  properties: { token: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Email verified successfully" },
            "400": { description: "Invalid or expired token / missing" },
          },
        },
      },
      "/api/auth/verify-email-link": {
        get: {
          summary: "Verify email using link (HTML response)",
          parameters: [
            {
              name: "token",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Verification HTML success page", content: { "text/html": {} } },
            "400": { description: "Verification HTML error page", content: { "text/html": {} } },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  } as const;

  return NextResponse.json(openapi);
}


