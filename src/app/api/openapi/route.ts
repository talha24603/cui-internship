import { NextResponse } from "next/server";

export async function GET() {
  const openapi = {
    openapi: "3.0.3",
    info: {
      title: "CUI Internship API",
      version: "1.0.0",
      description: "OpenAPI specification for CUI Internship API - Auth, Admin, and Faculty endpoints",
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
                      accessToken: { type: "string", description: "JWT token containing sub, role, name, and email" },
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
      "/api/auth/forgot-password": {
        post: {
          summary: "Request password reset email",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Reset email sent (or not sent to prevent enumeration)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Email is required" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/auth/reset-password": {
        post: {
          summary: "Reset password using reset token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token", "password"],
                  properties: {
                    token: { type: "string" },
                    password: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Password reset successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid token, missing fields, or password too short" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/auth/send-verification-email": {
        post: {
          summary: "Send verification email to user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Verification email sent successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Email required or already verified" },
            "404": { description: "User not found" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/auth/generate-passowrd": {
        get: {
          summary: "Generate a random password",
          responses: {
            "200": {
              description: "Generated password",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      password: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/admin/create-account": {
        post: {
          summary: "Create a new user account (Admin only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "name", "password", "role"],
                  properties: {
                    email: { type: "string", format: "email" },
                    name: { type: "string" },
                    password: { type: "string" },
                    role: { type: "string", enum: ["ADMIN", "USER", "FACULTY"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "User created successfully",
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
                          email: { type: "string", format: "email" },
                          name: { type: "string" },
                          role: { type: "string" },
                        },
                      },
                      password: { type: "string", description: "Temporary - plain password for admin" },
                      createdBy: { type: "string", description: "Admin user ID who created this account" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields or invalid role" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required or unauthorized access" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/admin/add-company": {
        post: {
          summary: "Add a new company (Admin only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email"],
                  properties: {
                    name: { type: "string", description: "Company name" },
                    email: { type: "string", format: "email", description: "Company email address" },
                    phone: { type: "string", description: "Company phone number" },
                    address: { type: "string", description: "Company address" },
                    website: { type: "string", format: "uri", description: "Company website URL" },
                    industry: { type: "string", description: "Company industry" },
                    description: { type: "string", description: "Company description" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Company added successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      company: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          phone: { type: "string" },
                          address: { type: "string" },
                          website: { type: "string" },
                          industry: { type: "string" },
                          description: { type: "string" },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                      createdBy: { type: "string", description: "Admin user ID who created this company" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields or invalid email format" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "409": { description: "Company with this email already exists" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/faculty": {
        get: {
          summary: "Get all faculty profiles (public)",
          responses: {
            "200": {
              description: "Faculty profiles retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            avatarUrl: { type: "string", format: "uri" },
                            expertise: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/faculty/profile": {
        get: {
          summary: "Get faculty profile (Faculty only)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Faculty profile retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      profile: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          userId: { type: "string" },
                          department: { type: "string" },
                          designation: { type: "string" },
                          phone: { type: "string" },
                          office: { type: "string" },
                          bio: { type: "string" },
                          avatarUrl: { type: "string", format: "uri" },
                          qualifications: { type: "string" },
                          expertise: { type: "string" },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" },
                          user: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              role: { type: "string" },
                              verified: { type: "boolean" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Faculty access required" },
            "404": { description: "Faculty profile not found" },
            "500": { description: "Internal server error" },
          },
        },
        post: {
          summary: "Create or update faculty profile (Faculty only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["department", "designation"],
                  properties: {
                    department: { type: "string", description: "Faculty department" },
                    designation: { type: "string", description: "Faculty designation/position" },
                    phone: { type: "string", description: "Faculty phone number" },
                    office: { type: "string", description: "Faculty office location" },
                    bio: { type: "string", description: "Faculty biography" },
                    avatarUrl: { type: "string", format: "uri", description: "Faculty avatar image URL" },
                    qualifications: { type: "string", description: "Faculty qualifications" },
                    expertise: { type: "string", description: "Faculty areas of expertise" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Faculty profile updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      profile: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          userId: { type: "string" },
                          department: { type: "string" },
                          designation: { type: "string" },
                          phone: { type: "string" },
                          office: { type: "string" },
                          bio: { type: "string" },
                          avatarUrl: { type: "string", format: "uri" },
                          qualifications: { type: "string" },
                          expertise: { type: "string" },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" },
                          user: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              role: { type: "string" },
                              verified: { type: "boolean" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields (department, designation)" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Faculty access required" },
            "404": { description: "User not found" },
            "409": { description: "Faculty profile already exists for this user" },
            "500": { description: "Internal server error" },
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


