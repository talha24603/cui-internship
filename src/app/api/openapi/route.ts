import { NextResponse } from "next/server";

export async function GET() {
  const openapi = {
    openapi: "3.0.3",
    info: {
      title: "CUI Internship API",
      version: "1.3.0",
      description: "OpenAPI specification for CUI Internship API - Auth, Admin, Faculty, and Student endpoints. All protected routes use middleware-based authentication with Bearer tokens.",
    },
    servers: [
      { url: "https://cui-internship-git-dev-talhas-projects-59c8907e.vercel.app", description: "Default" },
    ],
    externalDocs: {
      description: "Authentication Flow",
      url: "#authentication",
    },
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
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
          tags: ["Authentication"],
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
                          id: { type: "string", description: "User ID" },
                          name: { type: "string", description: "User's full name" },
                          email: { type: "string", format: "email", description: "User's email address" },
                          role: { type: "string", enum: ["STUDENT", "FACULTY", "SITE_SUPERVISOR", "ADMIN"], description: "User's role in the system" },
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
          tags: ["Authentication"],
          summary: "Get a new access token using refresh token cookie",
          responses: {
            "200": {
              description: "New access token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { 
                      accessToken: { type: "string" },
                      message: { type: "string" }
                    },
                  },
                },
              },
            },
            "401": { description: "Missing or invalid refresh token" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Logout current session",
          description: "Revokes the current refresh token and clears session cookie",
          responses: {
            "200": {
              description: "Logged out successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { 
                      message: { type: "string" }
                    },
                  },
                },
              },
            },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/auth/logout-all": {
        post: {
          tags: ["Authentication"],
          summary: "Logout from all devices",
          description: "Revokes all refresh tokens for the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Logged out from all devices successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { 
                      message: { type: "string" },
                      revokedCount: { type: "integer" }
                    },
                  },
                },
              },
            },
            "401": { description: "User not authenticated" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/auth/sessions": {
        get: {
          tags: ["Authentication"],
          summary: "Get active sessions",
          description: "Retrieve all active sessions for the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Active sessions retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      sessions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            expiresAt: { type: "string", format: "date-time" },
                            isCurrent: { type: "boolean" },
                            tokenPreview: { type: "string" }
                          }
                        }
                      },
                      totalActive: { type: "integer" }
                    },
                  },
                },
              },
            },
            "401": { description: "User not authenticated" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/auth/verify-email": {
        post: {
          tags: ["Authentication"],
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
          tags: ["Authentication"],
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
          tags: ["Authentication"],
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
          tags: ["Authentication"],
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
          tags: ["Authentication"],
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
          tags: ["Authentication"],
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
          tags: ["Admin"],
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
          tags: ["Admin"],
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
          tags: ["Faculty"],
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
          tags: ["Faculty"],
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
          tags: ["Faculty"],
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
      "/api/student/create-internship": {
        post: {
          tags: ["Student"],
          summary: "Create a new internship request (Student only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["type"],
                  properties: {
                    type: { 
                      type: "string", 
                      enum: ["ONSITE", "REMOTE", "FIVERR"],
                      description: "Type of internship"
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Internship created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      internship: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          studentId: { type: "string" },
                          type: { type: "string", enum: ["ONSITE", "REMOTE", "FIVERR"] },
                          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"] },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid or missing internship type" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only students can create internships" },
            "409": { description: "You already have an active internship request" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/student/request-to-add-company": {
        post: {
          tags: ["Student"],
          summary: "Request to add a new company (Student only)",
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
                    justification: { type: "string", description: "Why this company should be added" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Company request created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      companyRequest: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          studentId: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          phone: { type: "string" },
                          address: { type: "string" },
                          website: { type: "string" },
                          industry: { type: "string" },
                          description: { type: "string" },
                          justification: { type: "string" },
                          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields or invalid email format" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only students can request to add companies" },
            "409": { description: "Company with this email already exists or already requested" },
            "500": { description: "Internal server error" },
          },
        },
        get: {
          tags: ["Student"],
          summary: "Get student's own company requests (Student only)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Company requests retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      companyRequests: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            studentId: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            phone: { type: "string" },
                            address: { type: "string" },
                            website: { type: "string" },
                            industry: { type: "string" },
                            description: { type: "string" },
                            justification: { type: "string" },
                            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                            createdAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Authorization header missing or invalid token" },
            "403": { description: "Only students can access their company requests" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/student/appex-a": {
        get: {
          tags: ["Student"],
          summary: "Get student's AppEx-A (Internship Approval) details",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "AppEx-A retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      internship: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          type: { type: "string", enum: ["ONSITE", "REMOTE", "FIVERR"] },
                          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"] },
                          student: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string" },
                              regNo: { type: "string" }
                            }
                          },
                          appexA: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              organization: { type: "string" },
                              address: { type: "string" },
                              industrySector: { type: "string" },
                              contactName: { type: "string" },
                              contactDesignation: { type: "string" },
                              contactPhone: { type: "string" },
                              contactEmail: { type: "string" },
                              internshipField: { type: "string" },
                              internshipLocation: { type: "string" },
                              startDate: { type: "string", format: "date-time" },
                              endDate: { type: "string", format: "date-time" },
                              workingDays: { type: "string" },
                              workingHours: { type: "string" },
                              status: { type: "string", enum: ["pending", "approved", "rejected"] }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only students can access AppEx-A information" },
            "404": { description: "No active internship found" },
            "500": { description: "Internal server error" }
          }
        },
        post: {
          tags: ["Student"],
          summary: "Submit AppEx-A (Internship Approval) form",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "organization", "address", "industrySector", "contactName",
                    "contactDesignation", "contactPhone", "contactEmail",
                    "internshipField", "internshipLocation", "startDate", "endDate",
                    "workingDays", "workingHours"
                  ],
                  properties: {
                    organization: { type: "string", description: "Organization name" },
                    address: { type: "string", description: "Organization address" },
                    industrySector: { type: "string", description: "Industry sector" },
                    contactName: { type: "string", description: "Contact person name" },
                    contactDesignation: { type: "string", description: "Contact person designation" },
                    contactPhone: { type: "string", description: "Contact phone number" },
                    contactEmail: { type: "string", format: "email", description: "Contact email" },
                    internshipField: { type: "string", description: "Field of internship" },
                    internshipLocation: { type: "string", description: "Internship location" },
                    startDate: { type: "string", format: "date", description: "Internship start date" },
                    endDate: { type: "string", format: "date", description: "Internship end date" },
                    workingDays: { type: "string", description: "Working days per week" },
                    workingHours: { type: "string", description: "Working hours per day" }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "AppEx-A submitted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      appexA: { type: "object" }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid date format" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only students can submit AppEx-A" },
            "404": { description: "No pending internship found" },
            "409": { description: "AppEx-A already exists for this internship" },
            "500": { description: "Internal server error" }
          }
        },
        put: {
          tags: ["Student"],
          summary: "Update AppEx-A (Internship Approval) form",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    organization: { type: "string" },
                    address: { type: "string" },
                    industrySector: { type: "string" },
                    contactName: { type: "string" },
                    contactDesignation: { type: "string" },
                    contactPhone: { type: "string" },
                    contactEmail: { type: "string", format: "email" },
                    internshipField: { type: "string" },
                    internshipLocation: { type: "string" },
                    startDate: { type: "string", format: "date" },
                    endDate: { type: "string", format: "date" },
                    workingDays: { type: "string" },
                    workingHours: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "AppEx-A updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      appexA: { type: "object" }
                    }
                  }
                }
              }
            },
            "400": { description: "Invalid date format or dates" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only students can update AppEx-A or form already processed" },
            "404": { description: "No pending internship or AppEx-A not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/faculty/appex-a-approval": {
        get: {
          tags: ["Faculty"],
          summary: "Get all AppEx-A submissions for approval (Faculty/Admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["pending", "approved", "rejected", "all"] },
              description: "Filter by approval status"
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1 },
              description: "Page number for pagination"
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100 },
              description: "Number of items per page"
            }
          ],
          responses: {
            "200": {
              description: "AppEx-A submissions retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: { type: "array", items: { type: "object" } },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          pages: { type: "integer" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only faculty and admin can access AppEx-A approvals" },
            "500": { description: "Internal server error" }
          }
        },
        patch: {
          tags: ["Faculty"],
          summary: "Approve or reject AppEx-A submission (Faculty/Admin only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["appexAId", "status"],
                  properties: {
                    appexAId: { type: "string", description: "AppEx-A submission ID" },
                    status: { type: "string", enum: ["approved", "rejected"], description: "Approval status" },
                    comments: { type: "string", description: "Optional comments for approval/rejection" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "AppEx-A processed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      appexA: { type: "object" },
                      internship: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          student: { type: "object" },
                          status: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid status" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only faculty and admin can approve/reject AppEx-A" },
            "404": { description: "AppEx-A submission not found" },
            "409": { description: "AppEx-A has already been processed" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/faculty/appex-a-approval/{id}": {
        get: {
          tags: ["Faculty"],
          summary: "Get specific AppEx-A submission details (Faculty/Admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "AppEx-A submission ID"
            }
          ],
          responses: {
            "200": {
              description: "AppEx-A details retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      appexA: { type: "object" }
                    }
                  }
                }
              }
            },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only faculty and admin can access AppEx-A details" },
            "404": { description: "AppEx-A submission not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/cron/weekly-reminders": {
        get: {
          tags: ["Cron"],
          summary: "Process weekly reminders for internships (System endpoint)",
          description: "Automated endpoint that sends weekly log reminders to students and mid-report notifications to supervisors. Typically called by cron jobs or scheduled tasks.",
          responses: {
            "200": {
              description: "Weekly reminders processed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      remindersSent: { type: "integer", description: "Number of weekly log reminders sent" },
                      midReportNotifications: { type: "integer", description: "Number of mid-report notifications sent" },
                      totalInternships: { type: "integer", description: "Total number of approved internships processed" }
                    }
                  }
                }
              }
            },
            "500": {
              description: "Failed to process weekly reminders",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      error: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/cron/cleanup-tokens": {
        get: {
          tags: ["Cron"],
          summary: "Clean up expired and revoked refresh tokens (System endpoint)",
          description: "Automated endpoint that removes expired and revoked refresh tokens from the database. Typically called by cron jobs or scheduled tasks.",
          responses: {
            "200": {
              description: "Token cleanup completed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      deletedCount: { type: "integer", description: "Number of tokens deleted" },
                      timestamp: { type: "string", format: "date-time", description: "Cleanup execution timestamp" }
                    }
                  }
                }
              }
            },
            "500": {
              description: "Failed to process token cleanup",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      error: { type: "string" },
                      timestamp: { type: "string", format: "date-time", description: "Cleanup execution timestamp" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/admin/review-company": {
        post: {
          tags: ["Admin"],
          summary: "Review company request - approve or reject (Admin only)",
          description: "Allows admins to approve or reject company requests submitted by students. When approved, automatically creates a Company record.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["requestId", "action"],
                  properties: {
                    requestId: { type: "string", description: "Company request ID to review" },
                    action: { 
                      type: "string", 
                      enum: ["APPROVE", "REJECT"],
                      description: "Action to take on the company request"
                    },
                    notes: { type: "string", description: "Optional admin notes for the review decision" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Company request reviewed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      request: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          status: { type: "string", enum: ["APPROVED", "REJECTED"] },
                          notes: { type: "string" },
                          reviewedAt: { type: "string", format: "date-time" },
                          requestedBy: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              regNo: { type: "string" }
                            }
                          },
                          reviewedBy: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" }
                            }
                          }
                        }
                      },
                      company: {
                        type: "object",
                        nullable: true,
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" }
                        },
                        description: "Company record created when approved, null when rejected"
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid action" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Company request not found" },
            "409": { description: "Company request has already been reviewed" },
            "500": { description: "Internal server error" }
          }
        },
        get: {
          tags: ["Admin"],
          summary: "Get company requests for review (Admin only)",
          description: "Retrieve company requests with filtering, search, and pagination. Shows statistics and allows filtering by status.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
              description: "Page number for pagination"
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
              description: "Number of items per page"
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
              description: "Filter by request status"
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Search in company name, email, or industry"
            }
          ],
          responses: {
            "200": {
              description: "Company requests retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      requests: {
                        type: "array",
                        items: {
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
                            reason: { type: "string" },
                            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                            notes: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            reviewedAt: { type: "string", format: "date-time" },
                            requestedBy: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" },
                                regNo: { type: "string" }
                              }
                            },
                            reviewedBy: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" }
                              }
                            }
                          }
                        }
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          pages: { type: "integer" }
                        }
                      },
                      statistics: {
                        type: "object",
                        properties: {
                          PENDING: { type: "integer" },
                          APPROVED: { type: "integer" },
                          REJECTED: { type: "integer" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "500": { description: "Internal server error" }
          }
        }
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /api/auth/login. Middleware automatically validates tokens for protected routes and passes user info via headers (x-user-id, x-user-role, x-user-name, x-user-email).",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication information is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: "Access forbidden - insufficient permissions",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Admin",
        description: "Administrative functions - requires ADMIN role",
      },
      {
        name: "Faculty",
        description: "Faculty-specific functions - requires FACULTY role",
      },
      {
        name: "Student",
        description: "Student-specific functions - requires STUDENT role",
      },
      {
        name: "Cron",
        description: "Automated system endpoints for scheduled tasks and reminders",
      },
    ],
  } as const;

  return NextResponse.json(openapi);
}


