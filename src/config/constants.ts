// src/config/constants.ts

export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Emergency severity levels
export const EMERGENCY_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

// Emergency types
export const EMERGENCY_TYPES = [
  "Accident",
  "Heart Attack",
  "Stroke",
  "Burn",
  "Fracture",
  "Poisoning",
  "Breathing Problem",
  "Other",
];

// User roles
export const USER_ROLES = {
  PATIENT: "PATIENT",
  DRIVER: "DRIVER",
  ADMIN: "ADMIN",
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Ambulance types
export const AMBULANCE_TYPES = [
  "Basic",
  "Advanced",
  "Mobile ICU",
];