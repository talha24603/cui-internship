import { NextResponse } from "next/server";

export async function GET() {
  const openapi = {
    openapi: "3.0.3",
    info: {
      title: "CUI Internship API",
      version: "1.10.0",
      description: "OpenAPI specification for CUI Internship API - Auth, Admin, Faculty, Student, Site Supervisor, and Dropdown endpoints. All protected routes use middleware-based authentication with Bearer tokens.",
    },
    servers: [
      { url: "https://cui-internship-system.vercel.app", description: "Production" },
      { url: "https://cui-internship-git-dev-talhas-projects-59c8907e.vercel.app", description: "Development" },
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
                    role: { type: "string", enum: ["ADMIN", "USER", "FACULTY", "SITE_SUPERVISOR"] },
                    companyId: { type: "string", description: "Company ID to assign site supervisor to (required for SITE_SUPERVISOR role)" },
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
            "400": { description: "Missing required fields, invalid role, or company not found for site supervisor" },
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
      "/api/admin/assign-supervisor": {
        post: {
          tags: ["Admin"],
          summary: "Assign site supervisor to company (Admin only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["siteSupervisorId", "companyId"],
                  properties: {
                    siteSupervisorId: { type: "string", description: "Site supervisor user ID" },
                    companyId: { type: "string", description: "Company ID to assign supervisor to" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Site supervisor assigned to company successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      supervisor: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          company: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              industry: { type: "string" },
                            },
                          },
                        },
                      },
                      assignedBy: { type: "string", description: "Admin user ID who made the assignment" },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing required fields, site supervisor not found, or user is not a site supervisor" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Site supervisor or company not found" },
            "409": { description: "Site supervisor is already assigned to another company" },
            "500": { description: "Internal server error" },
          },
        },
        get: {
          tags: ["Admin"],
          summary: "Get site supervisors with filtering options (Admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "companyId",
              in: "query",
              schema: { type: "string" },
              description: "Filter by specific company ID",
            },
            {
              name: "unassigned",
              in: "query",
              schema: { type: "boolean" },
              description: "Get only unassigned site supervisors",
            },
          ],
          responses: {
            "200": {
              description: "Site supervisors retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      supervisors: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            verified: { type: "boolean" },
                            createdAt: { type: "string", format: "date-time" },
                            company: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" },
                                industry: { type: "string" },
                              },
                            },
                            siteInternships: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  status: { type: "string" },
                                  student: {
                                    type: "object",
                                    properties: {
                                      id: { type: "string" },
                                      name: { type: "string" },
                                      regNo: { type: "string" },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/admin/company-supervisors": {
        get: {
          tags: ["Admin"],
          summary: "Get site supervisors for a specific company (Admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "companyId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Company ID to get supervisors for",
            },
          ],
          responses: {
            "200": {
              description: "Company supervisors retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
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
                          supervisors: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" },
                                verified: { type: "boolean" },
                                createdAt: { type: "string", format: "date-time" },
                                siteInternships: {
                                  type: "array",
                                  items: {
                                    type: "object",
                                    properties: {
                                      id: { type: "string" },
                                      status: { type: "string" },
                                      student: {
                                        type: "object",
                                        properties: {
                                          id: { type: "string" },
                                          name: { type: "string" },
                                          regNo: { type: "string" },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          supervisorCount: { type: "integer" },
                        },
                      },
                      totalSupervisors: { type: "integer" },
                    },
                  },
                },
              },
            },
            "400": { description: "Company ID is required" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Company not found" },
            "500": { description: "Internal server error" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Get all companies with their supervisor counts (Admin only)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Companies with supervisors retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      companies: {
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
                            createdAt: { type: "string", format: "date-time" },
                            supervisorCount: { type: "integer" },
                            supervisors: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  email: { type: "string", format: "email" },
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
              },
            },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
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
        patch: {
          tags: ["Faculty"],
          summary: "Update faculty profile partially (Faculty only)",
          description: "Partially update faculty profile fields. Only provided fields will be updated. Profile must exist (use POST to create).",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    department: { type: "string", description: "Faculty department (optional)" },
                    designation: { type: "string", description: "Faculty designation/position (optional)" },
                    phone: { type: "string", description: "Faculty phone number (optional)" },
                    office: { type: "string", description: "Faculty office location (optional)" },
                    bio: { type: "string", description: "Faculty biography (optional)" },
                    avatarUrl: { type: "string", format: "uri", description: "Faculty avatar image URL (optional)" },
                    qualifications: { type: "string", description: "Faculty qualifications (optional)" },
                    expertise: { type: "string", description: "Faculty areas of expertise (optional)" },
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
                          phone: { type: "string", nullable: true },
                          office: { type: "string", nullable: true },
                          bio: { type: "string", nullable: true },
                          avatarUrl: { type: "string", format: "uri", nullable: true },
                          qualifications: { type: "string", nullable: true },
                          expertise: { type: "string", nullable: true },
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
            "400": { description: "At least one field must be provided for update" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Faculty access required" },
            "404": { description: "Faculty profile not found. Use POST to create a new profile" },
            "500": { description: "Internal server error" },
          },
        },
      },
      "/api/faculty/internships": {
        get: {
          tags: ["Faculty"],
          summary: "Get internships connected to a faculty supervisor",
          description:
            "Returns internships where the authenticated faculty user is assigned as faculty supervisor. Admins can optionally provide facultyId to fetch for a specific faculty; otherwise returns internships connected to any faculty.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["all", "pending", "approved", "completed", "rejected"],
                default: "all",
              },
              description:
                "Optional status filter (case-insensitive). Use 'all' to disable filtering.",
            },
            {
              name: "facultyId",
              in: "query",
              required: false,
              schema: { type: "string" },
              description:
                "Admin-only: filter internships for a specific faculty user ID. Ignored for FACULTY role.",
            },
          ],
          responses: {
            "200": {
              description: "Faculty internships retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            studentId: { type: "string" },
                            facultyId: { type: "string", nullable: true },
                            siteId: { type: "string", nullable: true },
                            type: {
                              type: "string",
                              enum: ["ONSITE", "REMOTE", "FIVERR"],
                            },
                            startDate: {
                              type: "string",
                              format: "date-time",
                              nullable: true,
                            },
                            endDate: {
                              type: "string",
                              format: "date-time",
                              nullable: true,
                            },
                            status: {
                              type: "string",
                              enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
                            },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                            student: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string", nullable: true },
                                email: { type: "string", format: "email" },
                                regNo: { type: "string", nullable: true },
                              },
                            },
                            faculty: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string", nullable: true },
                                email: { type: "string", format: "email" },
                              },
                            },
                            site: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string", nullable: true },
                                email: { type: "string", format: "email" },
                                company: {
                                  type: "object",
                                  nullable: true,
                                  properties: {
                                    id: { type: "string" },
                                    name: { type: "string" },
                                    industry: { type: "string", nullable: true },
                                  },
                                },
                              },
                            },
                            finalResult: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                internshipId: { type: "string" },
                                facultyMarks: { type: "integer" },
                                siteMarks: { type: "integer", nullable: true },
                                officeMarks: { type: "integer" },
                                presentationMarks: { type: "integer", nullable: true },
                                totalMarks: { type: "integer" },
                                status: { type: "string" },
                                hodSignatureUrl: { type: "string", nullable: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid status filter" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Only faculty and admin can access faculty internships" },
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
                    siteId: { 
                      type: "string", 
                      description: "Site supervisor user ID (optional)" 
                    },
                    facultyId: { 
                      type: "string", 
                      description: "Faculty supervisor user ID (optional)" 
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
                          facultyId: { type: "string", nullable: true },
                          siteId: { type: "string", nullable: true },
                          student: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              regNo: { type: "string" },
                            },
                          },
                          faculty: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                            },
                          },
                          site: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              company: {
                                type: "object",
                                nullable: true,
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  industry: { type: "string" },
                                },
                              },
                            },
                          },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid or missing internship type, site supervisor not found, user is not a site supervisor, site supervisor not assigned to company, faculty member not found, or user is not a faculty member" },
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
                              internshipLocation: { type: "string" },
                              internshipNature: { type: "string" },
                              mode: { type: "string" },
                              numberOfInternship: { type: "string" },
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
                    "internshipLocation", "internshipNature", "mode", "numberOfInternship",
                    "startDate", "endDate", "workingDays", "workingHours"
                  ],
                  properties: {
                    organization: { type: "string", description: "Organization name" },
                    address: { type: "string", description: "Organization address" },
                    industrySector: { type: "string", description: "Industry sector" },
                    contactName: { type: "string", description: "Contact person name" },
                    contactDesignation: { type: "string", description: "Contact person designation" },
                    contactPhone: { type: "string", description: "Contact phone number" },
                    contactEmail: { type: "string", format: "email", description: "Contact email" },
                    internshipLocation: { type: "string", description: "Internship location" },
                    internshipNature: { type: "string", description: "Nature of internship" },
                    mode: { type: "string", description: "Internship mode" },
                    numberOfInternship: { type: "string", description: "Number of internships" },
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
                    internshipLocation: { type: "string" },
                    internshipNature: { type: "string" },
                    mode: { type: "string" },
                    numberOfInternship: { type: "string" },
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
      "/api/student/appex-b": {
        post: {
          tags: ["Student"],
          summary: "Create or update AppEx B (Internship Assignment) form",
          description: "Upserts AppEx B form data. Creates if it doesn't exist, updates if it does.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "name",
                    "degreeProgram",
                    "email",
                    "semester",
                    "contactNo",
                    "preferredField",
                    "agreementAccepted"
                  ],
                  properties: {
                    name: { type: "string", description: "Student name" },
                    degreeProgram: { type: "string", description: "Degree program" },
                    email: { type: "string", format: "email", description: "Student email" },
                    semester: { type: "string", description: "Semester" },
                    contactNo: { type: "string", description: "Contact number" },
                    preferredField: { type: "string", description: "Preferred field of internship" },
                    agreementAccepted: { type: "boolean", description: "Whether agreement is accepted" },
                    facultyId: { type: "string", description: "Optional: Faculty supervisor user ID (must have role FACULTY)" },
                    siteId: { type: "string", description: "Optional: Site supervisor user ID (must have role SITE_SUPERVISOR)" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "AppEx B saved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      internshipAssignment: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          studentId: { type: "string" },
                          name: { type: "string" },
                          degreeProgram: { type: "string" },
                          email: { type: "string", format: "email" },
                          semester: { type: "string" },
                          contactNo: { type: "string" },
                          preferredField: { type: "string" },
                          agreementAccepted: { type: "boolean" },
                          adminApprovalStatus: {
                            type: "string",
                            enum: ["PENDING", "APPROVED", "REJECTED"],
                            description: "Admin approval status for AppEx B"
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields, invalid email format, agreementAccepted is not boolean, or invalid supervisor IDs (facultyId must reference FACULTY role, siteId must reference SITE_SUPERVISOR role)" },
            "401": { description: "User information not found or invalid token" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/student/appex-b-verification": {
        get: {
          tags: ["Student"],
          summary: "Get student's AppEx B assignment for verification",
          description: "Retrieve the authenticated student's AppEx B assignment with current verification status from both faculty and student.",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "AppEx B assignment retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          degreeProgram: { type: "string" },
                          email: { type: "string", format: "email" },
                          semester: { type: "string" },
                          contactNo: { type: "string" },
                          preferredField: { type: "string" },
                          companyName: { type: "string", nullable: true },
                          internshipRole: { type: "string", nullable: true },
                          facultySupervisorNameDesig: { type: "string", nullable: true },
                          siteSupervisorNameDesig: { type: "string", nullable: true },
                          durationWeeks: { type: "integer", nullable: true },
                          startDate: { type: "string", format: "date-time", nullable: true },
                          endDate: { type: "string", format: "date-time", nullable: true },
                          agreementAccepted: { type: "boolean", nullable: true },
                          status: { 
                            type: "string", 
                            enum: ["PENDING_VERIFICATION", "FACULTY_VERIFIED", "STUDENT_VERIFIED", "BOTH_VERIFIED", "CHANGES_REQUESTED"]
                          },
                          facultyVerified: { type: "boolean", nullable: true },
                          facultyVerifiedAt: { type: "string", format: "date-time", nullable: true },
                          facultyVerificationComments: { type: "string", nullable: true },
                          studentVerified: { type: "boolean", nullable: true },
                          studentVerifiedAt: { type: "string", format: "date-time", nullable: true },
                          studentVerificationComments: { type: "string", nullable: true },
                          faculty: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" }
                            }
                          },
                          site: {
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
                    }
                  }
                }
              }
            },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only students can access their AppEx B verification" },
            "404": { description: "AppEx B assignment not found" },
            "500": { description: "Internal server error" }
          }
        },
        patch: {
          tags: ["Student"],
          summary: "Verify student's AppEx B assignment (approve or request changes)",
          description: "Student can verify their own AppEx B assignment by either approving it or requesting changes. This action updates the student verification status and recalculates the overall assignment status. When both faculty and student approve (status becomes BOTH_VERIFIED), the faculty and site supervisors from AppEx B are automatically linked to the student's internship.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["action"],
                  properties: {
                    action: { 
                      type: "string", 
                      enum: ["approve", "request_changes"], 
                      description: "Verification action: 'approve' to approve, 'request_changes' to request modifications" 
                    },
                    comments: { type: "string", description: "Optional comments for the verification" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "AppEx B verified successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          studentVerified: { type: "boolean" },
                          studentVerifiedAt: { type: "string", format: "date-time" },
                          studentVerificationComments: { type: "string", nullable: true },
                          status: { 
                            type: "string", 
                            enum: ["PENDING_VERIFICATION", "FACULTY_VERIFIED", "STUDENT_VERIFIED", "BOTH_VERIFIED", "CHANGES_REQUESTED"]
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid action" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only students can verify their AppEx B" },
            "404": { description: "AppEx B assignment not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/student/appex-c": {
        post: {
          tags: ["Student"],
          summary: "Create or update AppEx C (Internship Proposal) form",
          description: "Upserts AppEx C data for the authenticated student.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "organizationOverview",
                    "roleDescription",
                    "keyActivities",
                    "toolsTechnologies",
                    "expectedDeliverables"
                  ],
                  properties: {
                    organizationOverview: { type: "string", description: "Overview of the host organization" },
                    roleDescription: { type: "string", description: "Description of the internship role" },
                    keyActivities: { type: "string", description: "Planned key activities" },
                    toolsTechnologies: { type: "string", description: "Tools or technologies to be used" },
                    expectedDeliverables: { type: "string", description: "Expected outcomes or deliverables" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "AppEx C saved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      internshipProposal: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          studentId: { type: "string" },
                          organizationOverview: { type: "string" },
                          roleDescription: { type: "string" },
                          keyActivities: { type: "string" },
                          toolsTechnologies: { type: "string" },
                          expectedDeliverables: { type: "string" },
                          submittedDate: { type: "string", format: "date-time" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid payload" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only students can submit AppEx C" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/student/weekly-logs": {
        get: {
          tags: ["Student"],
          summary: "Get all weekly logs for student's internship",
          description: "Retrieves all weekly logs for the authenticated student's approved internship, including weekly log status information.",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Weekly logs retrieved successfully",
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
                          startDate: { type: "string", format: "date-time" },
                          endDate: { type: "string", format: "date-time" },
                          status: { type: "string", enum: ["APPROVED", "COMPLETED"] }
                        }
                      },
                      weeklyLogs: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            internshipId: { type: "string" },
                            weekNo: { type: "integer" },
                            activitiesDone: { type: "string" },
                            skillsLearned: { type: "string" },
                            challenges: { type: "string" },
                            submittedAt: { type: "string", format: "date-time" }
                          }
                        }
                      },
                      weeklyLogStatus: {
                        type: "object",
                        nullable: true,
                        properties: {
                          totalWeeks: { type: "integer" },
                          currentWeek: { type: "integer" },
                          submittedWeeks: { type: "array", items: { type: "integer" } },
                          pendingWeeks: { type: "array", items: { type: "integer" } },
                          hasStarted: { type: "boolean" },
                          hasEnded: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              description: "User information not found or invalid token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "User information not found" }
                    }
                  }
                }
              }
            },
            "403": {
              description: "Only students can access their weekly logs",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "Only students can access their weekly logs" }
                    }
                  }
                }
              }
            },
            "404": {
              description: "No approved internship found for this student",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "No approved internship found for this student" }
                    }
                  }
                }
              }
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "Internal Server Error" }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ["Student"],
          summary: "Submit a weekly log",
          description: "Submit a weekly log for the authenticated student's approved internship. Validates week number, internship dates, and prevents duplicate submissions.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["weekNo", "activitiesDone", "skillsLearned", "challenges"],
                  properties: {
                    weekNo: { type: "integer", description: "Week number (must be positive integer)", minimum: 1 },
                    activitiesDone: { type: "string", description: "Activities completed during the week" },
                    skillsLearned: { type: "string", description: "Skills learned during the week" },
                    challenges: { type: "string", description: "Challenges faced during the week" }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Weekly log submitted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      weeklyLog: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          internshipId: { type: "string" },
                          weekNo: { type: "integer" },
                          activitiesDone: { type: "string" },
                          skillsLearned: { type: "string" },
                          challenges: { type: "string" },
                          submittedAt: { type: "string", format: "date-time" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": {
              description: "Bad request - Missing required fields, invalid week number, internship dates not set, internship not started, or week number out of range",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        example: "Missing required fields: weekNo, activitiesDone, skillsLearned, challenges"
                      },
                      totalWeeks: {
                        type: "integer",
                        description: "Total weeks in internship (only present when week number is out of range)",
                        example: 12
                      }
                    }
                  },
                  examples: {
                    missingFields: {
                      value: {
                        error: "Missing required fields: weekNo, activitiesDone, skillsLearned, challenges"
                      }
                    },
                    invalidWeekNo: {
                      value: {
                        error: "Week number must be a positive integer"
                      }
                    },
                    datesNotSet: {
                      value: {
                        error: "Internship dates are not set. Please ensure your Annex A has been approved."
                      }
                    },
                    notStarted: {
                      value: {
                        error: "Internship has not started yet"
                      }
                    },
                    weekOutOfRange: {
                      value: {
                        error: "Week number must be between 1 and 12",
                        totalWeeks: 12
                      }
                    }
                  }
                }
              }
            },
            "401": {
              description: "User information not found or invalid token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "User information not found" }
                    }
                  }
                }
              }
            },
            "403": {
              description: "Only students can submit weekly logs",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "Only students can submit weekly logs" }
                    }
                  }
                }
              }
            },
            "404": {
              description: "No approved internship found for this student",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "No approved internship found for this student" }
                    }
                  }
                }
              }
            },
            "409": {
              description: "Weekly log for this week already exists",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "Weekly log for week 1 already exists" }
                    }
                  }
                }
              }
            },
            "500": {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string", example: "Internal Server Error" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/site/evaluations": {
        post: {
          tags: ["Site Supervisor"],
          summary: "Submit site supervisor evaluation (mid or final)",
          description: "Site supervisor submits a mid or final evaluation for a student's internship. Only the assigned site supervisor for the internship can submit this form and only once per type.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["internshipId", "type", "criteria", "totalMarks"],
                  properties: {
                    internshipId: {
                      type: "string",
                      description: "Internship ID being evaluated"
                    },
                    type: {
                      type: "string",
                      enum: ["site_mid", "site_final"],
                      description: "Evaluation type: mid or final (site supervisor)"
                    },
                    criteria: {
                      type: "object",
                      description: "Per-criterion ratings given by the site supervisor",
                      properties: {
                        punctualityAttendance: { type: "integer", minimum: 1, maximum: 4 },
                        linkTheoryToPractice: { type: "integer", minimum: 1, maximum: 4 },
                        criticalThinking: { type: "integer", minimum: 1, maximum: 4 },
                        technicalKnowledge: { type: "integer", minimum: 1, maximum: 4 },
                        creativity: { type: "integer", minimum: 1, maximum: 4 },
                        adaptability: { type: "integer", minimum: 1, maximum: 4 },
                        timeManagement: { type: "integer", minimum: 1, maximum: 4 },
                        professionalBehavior: { type: "integer", minimum: 1, maximum: 4 },
                        assignmentsPerformance: { type: "integer", minimum: 1, maximum: 4 },
                        communicationSkills: { type: "integer", minimum: 1, maximum: 4 }
                      }
                    },
                    totalMarks: {
                      type: "number",
                      description: "Total marks computed by the site supervisor based on the criteria"
                    },
                    comments: {
                      type: "string",
                      nullable: true,
                      description: "Optional overall comments from the site supervisor"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Evaluation submitted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      evaluation: {
                        type: "object",
                        description: "Created evaluation record"
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing or invalid fields in request body" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only site supervisors assigned to the internship can submit this evaluation" },
            "404": { description: "Internship not found or not eligible for evaluation" },
            "409": { description: "Evaluation of this type already exists for this internship and site supervisor" },
            "500": { description: "Internal server error" }
          }
        },
        get: {
          tags: ["Evaluation"],
          summary: "Get evaluations for an internship",
          description: "Retrieve evaluations for a specific internship. Accessible to the student, assigned faculty supervisor, assigned site supervisor, and admins. Can optionally be filtered by evaluation type.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "internshipId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Internship ID to retrieve evaluations for"
            },
            {
              name: "type",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["site_mid", "site_final"] },
              description: "Optional filter to get only mid or final site evaluations"
            }
          ],
          responses: {
            "200": {
              description: "Evaluations retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      evaluations: {
                        type: "array",
                        items: {
                          type: "object",
                          description: "Evaluation record for the internship"
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing internshipId or invalid type parameter" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "User is not allowed to view evaluations for this internship" },
            "404": { description: "Internship not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/student/company-request-status": {
        get: {
          tags: ["Student"],
          summary: "Get all company requests for the authenticated student",
          description: "Returns all company requests submitted by the student with status information",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "includeStats",
              in: "query",
              schema: { type: "boolean" },
              description: "Include statistics about request statuses"
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
                            phone: { type: "string", nullable: true },
                            address: { type: "string", nullable: true },
                            website: { type: "string", nullable: true },
                            industry: { type: "string" },
                            description: { type: "string", nullable: true },
                            reason: { type: "string", nullable: true },
                            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                            notes: { type: "string", nullable: true },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                            reviewedAt: { type: "string", format: "date-time", nullable: true },
                            reviewedBy: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" }
                              }
                            },
                            statusInfo: {
                              type: "object",
                              properties: {
                                currentStatus: { type: "string" },
                                isPending: { type: "boolean" },
                                isApproved: { type: "boolean" },
                                isRejected: { type: "boolean" },
                                submittedAt: { type: "string", format: "date-time" },
                                lastUpdatedAt: { type: "string", format: "date-time" },
                                reviewedAt: { type: "string", format: "date-time", nullable: true },
                                hasNotes: { type: "boolean" }
                              }
                            }
                          }
                        }
                      },
                      total: { type: "integer" },
                      statistics: {
                        type: "object",
                        properties: {
                          total: { type: "integer" },
                          byStatus: {
                            type: "object",
                            properties: {
                              PENDING: { type: "integer" },
                              APPROVED: { type: "integer" },
                              REJECTED: { type: "integer" }
                            }
                          },
                          pendingCount: { type: "integer" },
                          approvedCount: { type: "integer" },
                          rejectedCount: { type: "integer" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "403": { description: "Only students can view their company requests" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/student/company-request-status/{id}": {
        get: {
          tags: ["Student"],
          summary: "Get a specific company request status by ID",
          description: "Returns detailed information about a specific company request for the authenticated student",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Company request ID"
            }
          ],
          responses: {
            "200": {
              description: "Company request retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      request: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          phone: { type: "string", nullable: true },
                          address: { type: "string", nullable: true },
                          website: { type: "string", nullable: true },
                          industry: { type: "string" },
                          description: { type: "string", nullable: true },
                          reason: { type: "string", nullable: true },
                          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
                          notes: { type: "string", nullable: true },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" },
                          reviewedAt: { type: "string", format: "date-time", nullable: true },
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
                      },
                      statusInfo: {
                        type: "object",
                        properties: {
                          currentStatus: { type: "string" },
                          isPending: { type: "boolean" },
                          isApproved: { type: "boolean" },
                          isRejected: { type: "boolean" },
                          submittedAt: { type: "string", format: "date-time" },
                          lastUpdatedAt: { type: "string", format: "date-time" },
                          reviewedAt: { type: "string", format: "date-time", nullable: true },
                          hasNotes: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Valid request ID is required" },
            "403": { description: "Only students can view company request status or request doesn't belong to user" },
            "404": { description: "Company request not found" },
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
          description: "Note: Faculty approval of AppEx A only updates the AppEx A status. Only admin approval of AppEx A will approve the internship.",
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
                          contactEmail: { type: "string", format: "email" },
                          internshipField: { type: "string" },
                          internshipLocation: { type: "string" },
                          startDate: { type: "string", format: "date-time" },
                          endDate: { type: "string", format: "date-time" },
                          workingDays: { type: "string" },
                          workingHours: { type: "string" },
                          status: { type: "string", enum: ["pending", "approved", "rejected"] },
                          student: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              regNo: { type: "string" }
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
            "403": { description: "Only faculty and admin can access AppEx-A details" },
            "404": { description: "AppEx-A submission not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/faculty/appex-b-verification": {
        get: {
          tags: ["Faculty"],
          summary: "Get all AppEx B assignments assigned to faculty supervisor for verification",
          description: "Retrieve AppEx B assignments that are assigned to the authenticated faculty supervisor. Can filter by verification status.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { 
                type: "string", 
                enum: ["PENDING_VERIFICATION", "FACULTY_VERIFIED", "STUDENT_VERIFIED", "BOTH_VERIFIED", "CHANGES_REQUESTED", "all"] 
              },
              description: "Filter by verification status"
            }
          ],
          responses: {
            "200": {
              description: "AppEx B assignments retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            degreeProgram: { type: "string" },
                            email: { type: "string", format: "email" },
                            semester: { type: "string" },
                            contactNo: { type: "string" },
                            preferredField: { type: "string" },
                            companyName: { type: "string", nullable: true },
                            internshipRole: { type: "string", nullable: true },
                            facultySupervisorNameDesig: { type: "string", nullable: true },
                            siteSupervisorNameDesig: { type: "string", nullable: true },
                            durationWeeks: { type: "integer", nullable: true },
                            startDate: { type: "string", format: "date-time", nullable: true },
                            endDate: { type: "string", format: "date-time", nullable: true },
                            agreementAccepted: { type: "boolean", nullable: true },
                            status: { type: "string" },
                            facultyVerified: { type: "boolean", nullable: true },
                            facultyVerifiedAt: { type: "string", format: "date-time", nullable: true },
                            facultyVerificationComments: { type: "string", nullable: true },
                            studentVerified: { type: "boolean", nullable: true },
                            studentVerifiedAt: { type: "string", format: "date-time", nullable: true },
                            studentVerificationComments: { type: "string", nullable: true },
                            calculatedStatus: { 
                              type: "string", 
                              enum: ["PENDING_VERIFICATION", "FACULTY_VERIFIED", "STUDENT_VERIFIED", "BOTH_VERIFIED", "CHANGES_REQUESTED"],
                              description: "Calculated overall verification status"
                            },
                            student: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" },
                                regNo: { type: "string" }
                              }
                            },
                            site: {
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
                      }
                    }
                  }
                }
              }
            },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only faculty can access AppEx B verifications" },
            "500": { description: "Internal server error" }
          }
        },
        patch: {
          tags: ["Faculty"],
          summary: "Verify AppEx B assignment (approve or request changes)",
          description: "Faculty supervisor can verify an AppEx B assignment by either approving it or requesting changes. This action updates the faculty verification status and recalculates the overall assignment status. When both faculty and student approve (status becomes BOTH_VERIFIED), the faculty and site supervisors from AppEx B are automatically linked to the student's internship.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["assignmentId", "action"],
                  properties: {
                    assignmentId: { type: "string", description: "AppEx B assignment ID" },
                    action: { 
                      type: "string", 
                      enum: ["approve", "request_changes"], 
                      description: "Verification action: 'approve' to approve, 'request_changes' to request modifications" 
                    },
                    comments: { type: "string", description: "Optional comments for the verification" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "AppEx B verified successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          facultyVerified: { type: "boolean" },
                          facultyVerifiedAt: { type: "string", format: "date-time" },
                          facultyVerificationComments: { type: "string", nullable: true },
                          status: { 
                            type: "string", 
                            enum: ["PENDING_VERIFICATION", "FACULTY_VERIFIED", "STUDENT_VERIFIED", "BOTH_VERIFIED", "CHANGES_REQUESTED"]
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid action" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only faculty can verify AppEx B or assignment not assigned to this faculty" },
            "404": { description: "AppEx B assignment not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/faculty/evaluation-summary": {
        post: {
          tags: ["Faculty", "Evaluation"],
          summary: "Add faculty supervisor marks to evaluation summary",
          description: "Faculty supervisor adds their marks (0-40) to the final evaluation summary for an internship. Part of the Onsite/Virtual Internship Model: Faculty Supervisor (max 40), Site Supervisor (max 40), Internship Office (max 20), Total (max 100).",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["internshipId", "marks"],
                  properties: {
                    internshipId: {
                      type: "string",
                      description: "Internship ID to add evaluation marks for"
                    },
                    marks: {
                      type: "integer",
                      minimum: 0,
                      maximum: 40,
                      description: "Marks awarded by faculty supervisor (max 40)"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Faculty evaluation marks submitted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      evaluationSummary: {
                        type: "object",
                        properties: {
                          facultyMarks: { type: "integer" },
                          siteMarks: { type: "integer", nullable: true },
                          officeMarks: { type: "integer" },
                          totalMarks: { type: "integer" },
                          status: { type: "string", enum: ["pass", "fail"] },
                          maximumMarks: {
                            type: "object",
                            properties: {
                              faculty: { type: "integer", description: "40" },
                              site: { type: "integer", description: "40" },
                              office: { type: "integer", description: "20" },
                              total: { type: "integer", description: "100" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or marks out of range (0-40)" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only assigned faculty supervisor can add marks for this internship" },
            "404": { description: "Internship not found" },
            "500": { description: "Internal server error" }
          }
        },
        get: {
          tags: ["Faculty", "Evaluation"],
          summary: "Get evaluation summary for an internship",
          description: "Retrieve the evaluation summary (Faculty Supervisor, Site Supervisor, Internship Office marks, total, pass/fail status). Accessible to student, faculty supervisor, site supervisor, and admin.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "internshipId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Internship ID to get evaluation summary for"
            }
          ],
          responses: {
            "200": {
              description: "Evaluation summary retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      evaluationSummary: {
                        type: "object",
                        properties: {
                          facultyMarks: { type: "integer", nullable: true },
                          siteMarks: { type: "integer", nullable: true },
                          officeMarks: { type: "integer", nullable: true },
                          totalMarks: { type: "integer", nullable: true },
                          status: { type: "string", nullable: true, enum: ["pass", "fail"] },
                          maximumMarks: {
                            type: "object",
                            properties: {
                              faculty: { type: "integer" },
                              site: { type: "integer" },
                              office: { type: "integer" },
                              total: { type: "integer" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing internshipId or invalid type parameter" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "User is not allowed to view evaluation summary for this internship" },
            "404": { description: "Internship not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/faculty/evaluation-form": {
        post: {
          tags: ["Faculty", "Evaluation"],
          summary: "Submit faculty evaluation form",
          description: "Faculty supervisor submits the evaluation form with 6 criteria graded 1-10 each: Platform Activity & Engagement, Completion of Internship Project(s), Earnings Achieved, Skill Development & Learning, Client Rating and Feedback, Professionalism & Communication. Total max 60, scaled to 40 for the evaluation summary.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["internshipId", "criteria"],
                  properties: {
                    internshipId: {
                      type: "string",
                      description: "Internship ID to evaluate"
                    },
                    criteria: {
                      type: "object",
                      required: [
                        "platformActivityEngagement",
                        "completionOfInternshipProjects",
                        "earningsAchieved",
                        "skillDevelopmentLearning",
                        "clientRatingAndFeedback",
                        "professionalismCommunication"
                      ],
                      properties: {
                        platformActivityEngagement: { type: "integer", minimum: 1, maximum: 10, description: "Platform Activity & Engagement" },
                        completionOfInternshipProjects: { type: "integer", minimum: 1, maximum: 10, description: "Completion of Internship Project(s)" },
                        earningsAchieved: { type: "integer", minimum: 1, maximum: 10, description: "Earnings Achieved" },
                        skillDevelopmentLearning: { type: "integer", minimum: 1, maximum: 10, description: "Skill Development & Learning" },
                        clientRatingAndFeedback: { type: "integer", minimum: 1, maximum: 10, description: "Client Rating and Feedback" },
                        professionalismCommunication: { type: "integer", minimum: 1, maximum: 10, description: "Professionalism & Communication" }
                      }
                    },
                    comments: { type: "string", nullable: true, description: "Optional overall comments" }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Faculty evaluation form submitted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      evaluation: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          type: { type: "string", enum: ["faculty"] },
                          totalMarks: { type: "integer" },
                          maxMarks: { type: "integer", description: "60" },
                          facultyMarksScaled: { type: "integer", description: "Scaled to 40 for evaluation summary" },
                          criteria: { type: "array", items: { type: "object" } },
                          comments: { type: "string", nullable: true },
                          submittedDate: { type: "string", format: "date-time" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid criteria (each 1-10)" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only assigned faculty supervisor can submit for this internship" },
            "404": { description: "Internship not found" },
            "409": { description: "Faculty evaluation form already submitted for this internship" },
            "500": { description: "Internal server error" }
          }
        },
        get: {
          tags: ["Faculty", "Evaluation"],
          summary: "Get faculty evaluation form for an internship",
          description: "Retrieve the submitted faculty evaluation form. Accessible to student, faculty supervisor, site supervisor, and admin.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "internshipId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Internship ID to get faculty evaluation for"
            }
          ],
          responses: {
            "200": {
              description: "Faculty evaluation form retrieved (or null if not submitted)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      evaluation: {
                        type: "object",
                        nullable: true,
                        properties: {
                          id: { type: "string" },
                          type: { type: "string" },
                          totalMarks: { type: "integer" },
                          maxMarks: { type: "integer" },
                          criteria: { type: "array", items: { type: "object" } },
                          comments: { type: "string", nullable: true },
                          submittedDate: { type: "string", format: "date-time" },
                          evaluator: { type: "object" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing internshipId" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "User is not allowed to view this evaluation" },
            "404": { description: "Internship not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/admin/office-evaluation": {
        post: {
          tags: ["Admin", "Evaluation"],
          summary: "Submit office evaluation form (Admin only)",
          description: "Admin submits the office evaluation form with 4 criteria. Each criterion: Excellent (10), Good (8), Satisfactory (5), Needs Improvement (3). Total max 40, scaled to 20 for the evaluation summary.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["internshipId", "criteria"],
                  properties: {
                    internshipId: {
                      type: "string",
                      description: "Internship ID to evaluate"
                    },
                    criteria: {
                      type: "object",
                      required: [
                        "internshipReport",
                        "portfolioEvidence",
                        "timeManagement",
                        "overallInternshipImpact"
                      ],
                      properties: {
                        internshipReport: { type: "integer", enum: [3, 5, 8, 10], description: "Internship Report (Logbook)" },
                        portfolioEvidence: { type: "integer", enum: [3, 5, 8, 10], description: "Portfolio Evidence (Screenshots, Files, Chat Logs)" },
                        timeManagement: { type: "integer", enum: [3, 5, 8, 10], description: "Time Management & Deadline Compliance" },
                        overallInternshipImpact: { type: "integer", enum: [3, 5, 8, 10], description: "Overall Internship Impact" }
                      }
                    },
                    comments: { type: "string", nullable: true, description: "Optional overall comments" }
                  }
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Office evaluation form submitted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      evaluation: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          type: { type: "string", enum: ["office"] },
                          totalMarks: { type: "integer" },
                          maxMarks: { type: "integer", description: "40" },
                          officeMarksScaled: { type: "integer", description: "Scaled to 20 for evaluation summary" },
                          criteria: { type: "array", items: { type: "object" } },
                          comments: { type: "string", nullable: true },
                          submittedDate: { type: "string", format: "date-time" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid criteria (each must be 3, 5, 8, or 10)" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "Only admins can submit office evaluation" },
            "404": { description: "Internship not found" },
            "409": { description: "Office evaluation already submitted for this internship" },
            "500": { description: "Internal server error" }
          }
        },
        get: {
          tags: ["Admin", "Evaluation"],
          summary: "Get office evaluation form for an internship",
          description: "Retrieve the submitted office evaluation form. Accessible to student, faculty supervisor, site supervisor, and admin.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "internshipId",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Internship ID to get office evaluation for"
            }
          ],
          responses: {
            "200": {
              description: "Office evaluation form retrieved (or null if not submitted)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      evaluation: {
                        type: "object",
                        nullable: true,
                        properties: {
                          id: { type: "string" },
                          type: { type: "string" },
                          totalMarks: { type: "integer" },
                          maxMarks: { type: "integer" },
                          criteria: { type: "array", items: { type: "object" } },
                          comments: { type: "string", nullable: true },
                          submittedDate: { type: "string", format: "date-time" },
                          evaluator: { type: "object" }
                        }
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing internshipId" },
            "401": { description: "User information not found or invalid token" },
            "403": { description: "User is not allowed to view this evaluation" },
            "404": { description: "Internship not found" },
            "500": { description: "Internal server error" }
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
      "/api/admin/appex-a": {
        get: {
          tags: ["Admin"],
          summary: "Get all AppEx-A submissions (Admin only)",
          description: "Retrieve all AppEx-A submissions with limited fields. Can filter by status.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["pending", "approved", "rejected"] },
              description: "Filter by approval status"
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
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            startDate: { type: "string", format: "date-time" },
                            endDate: { type: "string", format: "date-time" },
                            status: { type: "string", enum: ["pending", "approved", "rejected"] },
                            student: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" },
                                regNo: { type: "string" }
                              }
                            }
                          }
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
        },
        patch: {
          tags: ["Admin"],
          summary: "Approve or reject AppEx-A submission (Admin only)",
          description: "Allows admins to approve or reject AppEx-A submissions. Can update status even if already processed. When admin approves AppEx A, the student's internship is automatically approved and linked with start/end dates from AppEx A. Note: Only admin approval of AppEx A approves the internship; faculty approval only updates AppEx A status.",
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
                    status: { 
                      type: "string", 
                      enum: ["approved", "rejected"],
                      description: "New status for the AppEx-A submission"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "AppEx-A status updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      appexA: {
                        type: "object",
                        description: "Updated AppEx-A submission"
                      },
                      student: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          regNo: { type: "string" }
                        }
                      },
                      processedBy: { type: "string", description: "Admin user ID who processed the request" }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing required fields or invalid status" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "AppEx-A submission not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/admin/appex-b": {
        get: {
          tags: ["Admin"],
          summary: "Get all AppEx B (Internship Assignment) submissions (Admin only)",
          description: "Retrieve all AppEx B submissions with student information. Can filter by status and adminApprovalStatus. If 'id' parameter is provided, returns a single AppEx B submission with full details including supervisor information.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "query",
              schema: { type: "string" },
              description: "Optional: Get specific AppEx B by ID"
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string" },
              description: "Optional status filter"
            },
            {
              name: "adminApprovalStatus",
              in: "query",
              schema: {
                type: "string",
                enum: ["PENDING", "APPROVED", "REJECTED"]
              },
              description: "Optional admin approval status filter"
            }
          ],
          responses: {
            "200": {
              description: "AppEx B submissions retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            degreeProgram: { type: "string" },
                            email: { type: "string", format: "email" },
                            semester: { type: "string" },
                            contactNo: { type: "string" },
                            preferredField: { type: "string" },
                            companyName: { type: "string", nullable: true, description: "Company name (when id parameter is provided)" },
                            internshipRole: { type: "string", nullable: true, description: "Internship role/position (when id parameter is provided)" },
                            facultySupervisorNameDesig: { type: "string", nullable: true, description: "Faculty supervisor name and designation (when id parameter is provided)" },
                            siteSupervisorNameDesig: { type: "string", nullable: true, description: "Site supervisor name and designation (when id parameter is provided)" },
                            durationWeeks: { type: "number", nullable: true, description: "Duration in weeks (when id parameter is provided)" },
                            startDate: { type: "string", format: "date-time", nullable: true, description: "Start date (when id parameter is provided)" },
                            endDate: { type: "string", format: "date-time", nullable: true, description: "End date (when id parameter is provided)" },
                            agreementAccepted: { type: "boolean" },
                            status: { type: "string" },
                            adminApprovalStatus: {
                              type: "string",
                              enum: ["PENDING", "APPROVED", "REJECTED"],
                              description: "Admin approval status for AppEx B"
                            },
                            student: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" },
                                regNo: { type: "string" }
                              }
                            },
                            faculty: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" }
                              },
                              description: "Faculty supervisor details (if assigned)"
                            },
                            site: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" }
                              },
                              description: "Site supervisor details (if assigned)"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "AppEx B not found (when id parameter is provided)" },
            "500": { description: "Internal server error" }
          }
        },
        patch: {
          tags: ["Admin"],
          summary: "Update AppEx B extended details (Admin only)",
          description: "Update extended details of an AppEx B submission including company name, internship role, supervisor information, duration, and dates.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["studentId"],
                  properties: {
                    studentId: { type: "string", description: "Student ID (required)" },
                    companyName: { type: "string", description: "Company name (optional)" },
                    internshipRole: { type: "string", description: "Internship role/position (optional)" },
                    facultySupervisorNameDesig: { type: "string", description: "Faculty supervisor name and designation (optional, for backward compatibility)" },
                    siteSupervisorNameDesig: { type: "string", description: "Site supervisor name and designation (optional, for backward compatibility)" },
                    facultyId: { type: "string", nullable: true, description: "Optional: Faculty supervisor user ID (must have role FACULTY). Set to null to remove assignment." },
                    siteId: { type: "string", nullable: true, description: "Optional: Site supervisor user ID (must have role SITE_SUPERVISOR). Set to null to remove assignment." },
                    durationWeeks: { type: "number", description: "Duration in weeks (optional)" },
                    startDate: { type: "string", format: "date", description: "Start date (optional)" },
                    endDate: { type: "string", format: "date", description: "End date (optional)" },
                    adminApprovalAction: {
                      type: "string",
                      enum: ["approve", "reject", "reset"],
                      description: "Optional admin approval action to perform on this AppEx B (approve, reject, or reset to pending)"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "AppEx B updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      internshipAssignment: {
                        type: "object",
                        description: "Updated AppEx B submission"
                      }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing studentId, invalid durationWeeks, invalid supervisor IDs (facultyId must reference FACULTY role, siteId must reference SITE_SUPERVISOR role), or no fields to update" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "AppEx B (Internship Assignment) not found for student" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/admin/edit-faculty": {
        put: {
          tags: ["Admin"],
          summary: "Edit faculty information and profile (Admin only)",
          description: "Updates faculty user information and profile details including department, designation, and other profile fields.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "string", description: "Faculty user ID (required)" },
                    email: { type: "string", format: "email", description: "Faculty email address (optional)" },
                    name: { type: "string", description: "Faculty full name (optional)" },
                    password: { type: "string", description: "New password (optional, will be hashed)" },
                    department: { type: "string", description: "Faculty department (optional)" },
                    designation: { type: "string", description: "Faculty designation/position (optional)" },
                    phone: { type: "string", description: "Faculty phone number (optional)" },
                    office: { type: "string", description: "Faculty office location (optional)" },
                    bio: { type: "string", description: "Faculty biography (optional)" },
                    avatarUrl: { type: "string", format: "uri", description: "Faculty avatar image URL (optional)" },
                    qualifications: { type: "string", description: "Faculty qualifications (optional)" },
                    expertise: { type: "string", description: "Faculty areas of expertise (optional)" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Faculty updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      faculty: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          email: { type: "string", format: "email" },
                          name: { type: "string" },
                          role: { type: "string", enum: ["FACULTY"] },
                          verified: { type: "boolean" },
                          profile: {
                            type: "object",
                            properties: {
                              department: { type: "string" },
                              designation: { type: "string" },
                              phone: { type: "string" },
                              office: { type: "string" },
                              bio: { type: "string" },
                              avatarUrl: { type: "string", format: "uri" },
                              qualifications: { type: "string" },
                              expertise: { type: "string" }
                            }
                          },
                          updatedAt: { type: "string", format: "date-time" }
                        }
                      },
                      updatedBy: { type: "string", description: "Admin user ID who made the update" }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing faculty ID, invalid email format, or user is not a faculty member" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Faculty not found" },
            "409": { description: "Email already exists" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/admin/delete-faculty": {
        delete: {
          tags: ["Admin"],
          summary: "Delete faculty member (Admin only)",
          description: "Deletes a faculty member with safety checks to prevent deletion of faculty with active internships or evaluations.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Faculty user ID to delete"
            }
          ],
          responses: {
            "200": {
              description: "Faculty deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      deletedFaculty: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          email: { type: "string", format: "email" },
                          name: { type: "string" },
                          role: { type: "string", enum: ["FACULTY"] }
                        }
                      },
                      deletedBy: { type: "string", description: "Admin user ID who performed the deletion" }
                    }
                  }
                }
              }
            },
            "400": { description: "Faculty ID required, user is not a faculty member, or faculty has active internships/evaluations" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Faculty not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/admin/search-faculty": {
        get: {
          tags: ["Admin"],
          summary: "Search faculty members (Admin only)",
          description: "Search for faculty members by name, email, department, or designation. Returns up to 50 results. If no search query is provided, returns all faculty members.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "q",
              in: "query",
              schema: { type: "string" },
              description: "Search query (searches in name, email, department, designation). Can also use 'search' parameter."
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Alternative search query parameter (same as 'q')"
            }
          ],
          responses: {
            "200": {
              description: "Faculty search completed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            verified: { type: "boolean" },
                            createdAt: { type: "string", format: "date-time" },
                            facultyProfile: {
                              type: "object",
                              nullable: true,
                              properties: {
                                department: { type: "string" },
                                designation: { type: "string" },
                                phone: { type: "string" },
                                office: { type: "string" }
                              }
                            }
                          }
                        }
                      },
                      count: { type: "number", description: "Number of results returned" }
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
      "/api/admin/search-site-supervisors": {
        get: {
          tags: ["Admin"],
          summary: "Search site supervisors (Admin only)",
          description: "Search for site supervisors by name, email, or company name. Returns up to 50 results. If no search query is provided, returns all site supervisors.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "q",
              in: "query",
              schema: { type: "string" },
              description: "Search query (searches in name, email, company name, company email). Can also use 'search' parameter."
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" },
              description: "Alternative search query parameter (same as 'q')"
            }
          ],
          responses: {
            "200": {
              description: "Site supervisors search completed successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            verified: { type: "boolean" },
                            createdAt: { type: "string", format: "date-time" },
                            company: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" },
                                phone: { type: "string" },
                                industry: { type: "string" }
                              },
                              description: "Company the supervisor is assigned to"
                            }
                          }
                        }
                      },
                      count: { type: "number", description: "Number of results returned" }
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
      "/api/admin/edit-site-supervisor": {
        put: {
          tags: ["Admin"],
          summary: "Edit site supervisor information (Admin only)",
          description: "Updates site supervisor user information including company assignment.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "string", description: "Site supervisor user ID (required)" },
                    email: { type: "string", format: "email", description: "Site supervisor email address (optional)" },
                    name: { type: "string", description: "Site supervisor full name (optional)" },
                    password: { type: "string", description: "New password (optional, will be hashed)" },
                    companyId: { type: "string", description: "Company ID to assign supervisor to (optional)" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Site supervisor updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      supervisor: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          email: { type: "string", format: "email" },
                          name: { type: "string" },
                          role: { type: "string", enum: ["SITE_SUPERVISOR"] },
                          verified: { type: "boolean" },
                          company: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" }
                            }
                          },
                          updatedAt: { type: "string", format: "date-time" }
                        }
                      },
                      updatedBy: { type: "string", description: "Admin user ID who made the update" }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing supervisor ID, invalid email format, or user is not a site supervisor" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Site supervisor or company not found" },
            "409": { description: "Email already exists" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/admin/delete-site-supervisor": {
        delete: {
          tags: ["Admin"],
          summary: "Delete site supervisor (Admin only)",
          description: "Deletes a site supervisor with safety checks to prevent deletion of supervisors with active internships or evaluations.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Site supervisor user ID to delete"
            }
          ],
          responses: {
            "200": {
              description: "Site supervisor deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      deletedSupervisor: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          email: { type: "string", format: "email" },
                          name: { type: "string" },
                          role: { type: "string", enum: ["SITE_SUPERVISOR"] },
                          company: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" }
                            }
                          }
                        }
                      },
                      deletedBy: { type: "string", description: "Admin user ID who performed the deletion" }
                    }
                  }
                }
              }
            },
            "400": { description: "Supervisor ID required, user is not a site supervisor, or supervisor has active internships/evaluations" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Site supervisor not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/admin/edit-company": {
        put: {
          tags: ["Admin"],
          summary: "Edit company information (Admin only)",
          description: "Updates company information including contact details, industry, and description.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "string", description: "Company ID (required)" },
                    name: { type: "string", description: "Company name (optional)" },
                    email: { type: "string", format: "email", description: "Company email address (optional)" },
                    phone: { type: "string", description: "Company phone number (optional)" },
                    address: { type: "string", description: "Company address (optional)" },
                    website: { type: "string", format: "uri", description: "Company website URL (optional)" },
                    industry: { type: "string", description: "Company industry (optional)" },
                    description: { type: "string", description: "Company description (optional)" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Company updated successfully",
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
                          siteSupervisors: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string", format: "email" }
                              }
                            }
                          },
                          createdAt: { type: "string", format: "date-time" },
                          updatedAt: { type: "string", format: "date-time" }
                        }
                      },
                      updatedBy: { type: "string", description: "Admin user ID who made the update" }
                    }
                  }
                }
              }
            },
            "400": { description: "Missing company ID or invalid email format" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Company not found" },
            "409": { description: "Email already exists" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/admin/delete-company": {
        delete: {
          tags: ["Admin"],
          summary: "Delete company and associated supervisors (Admin only)",
          description: "Deletes a company and all its site supervisors with safety checks to prevent deletion of companies with supervisors having active internships or evaluations.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Company ID to delete"
            }
          ],
          responses: {
            "200": {
              description: "Company deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      deletedCompany: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                          siteSupervisorsCount: { type: "integer" }
                        }
                      },
                      deletedBy: { type: "string", description: "Admin user ID who performed the deletion" }
                    }
                  }
                }
              }
            },
            "400": { description: "Company ID required or company has supervisors with active internships/evaluations" },
            "401": { description: "Authorization header with Bearer token is required" },
            "403": { description: "Admin access required" },
            "404": { description: "Company not found" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/dropdown/faculty": {
        get: {
          tags: ["Dropdown"],
          summary: "Get faculty dropdown data",
          description: "Returns a list of verified faculty members for dropdown selection",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "search",
              in: "query",
              description: "Search faculty by name (case-insensitive)",
              required: false,
              schema: { type: "string" }
            },
            {
              name: "department",
              in: "query",
              description: "Filter by department (case-insensitive)",
              required: false,
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Faculty dropdown data retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            department: { type: "string" },
                            designation: { type: "string" }
                          }
                        }
                      },
                      total: { type: "integer" }
                    }
                  }
                }
              }
            },
            "401": { description: "Unauthorized - Invalid or missing token" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/dropdown/site-supervisors": {
        get: {
          tags: ["Dropdown"],
          summary: "Get site supervisors dropdown data",
          description: "Returns a list of verified site supervisors with company information",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "search",
              in: "query",
              description: "Search supervisors by name (case-insensitive)",
              required: false,
              schema: { type: "string" }
            },
            {
              name: "companyId",
              in: "query",
              description: "Filter supervisors by company ID",
              required: false,
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Site supervisors dropdown data retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            company: {
                              type: "object",
                              nullable: true,
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                industry: { type: "string" }
                              }
                            }
                          }
                        }
                      },
                      total: { type: "integer" }
                    }
                  }
                }
              }
            },
            "401": { description: "Unauthorized - Invalid or missing token" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/dropdown/companies": {
        get: {
          tags: ["Dropdown"],
          summary: "Get companies dropdown data",
          description: "Returns a list of companies with their information and supervisor counts",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "search",
              in: "query",
              description: "Search companies by name (case-insensitive)",
              required: false,
              schema: { type: "string" }
            },
            {
              name: "industry",
              in: "query",
              description: "Filter by industry (case-insensitive)",
              required: false,
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Companies dropdown data retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string", format: "email" },
                            phone: { type: "string", nullable: true },
                            address: { type: "string", nullable: true },
                            website: { type: "string", nullable: true },
                            industry: { type: "string" },
                            description: { type: "string", nullable: true },
                            supervisorCount: { type: "integer" }
                          }
                        }
                      },
                      total: { type: "integer" }
                    }
                  }
                }
              }
            },
            "401": { description: "Unauthorized - Invalid or missing token" },
            "500": { description: "Internal server error" }
          }
        }
      },
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Health check endpoint",
          description: "Returns the health status of the API",
          responses: {
            "200": {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "healthy" },
                      timestamp: { type: "string", format: "date-time" },
                      environment: { type: "string", example: "production" },
                      version: { type: "string", example: "1.5.0" }
                    }
                  }
                }
              }
            },
            "500": {
              description: "Service is unhealthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "unhealthy" },
                      error: { type: "string" },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/maintenance/cleanup-tokens": {
        get: {
          tags: ["Cron"],
          summary: "Cleanup expired tokens",
          description: "Manually trigger cleanup of expired refresh tokens from the database",
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
                      deletedCount: { type: "integer" },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            },
            "500": {
              description: "Token cleanup failed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      error: { type: "string" },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/maintenance/weekly-reminders": {
        get: {
          tags: ["Cron"],
          summary: "Send weekly reminders to students",
          description: "Manually trigger weekly log reminders and mid-report notifications for active internships",
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
                      totalInternships: { type: "integer", description: "Total number of active internships processed" }
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
        name: "Site Supervisor",
        description: "Site supervisor functions - requires SITE_SUPERVISOR role",
      },
      {
        name: "Cron",
        description: "Automated system endpoints for scheduled tasks and reminders",
      },
      {
        name: "Health",
        description: "Health check and system status endpoints",
      },
      {
        name: "Dropdown",
        description: "Dropdown data endpoints for select fields",
      },
    ],
  } as const;

  return NextResponse.json(openapi);
}


