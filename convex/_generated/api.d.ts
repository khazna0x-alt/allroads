/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as bookingJobs from "../bookingJobs.js";
import type * as bookings from "../bookings.js";
import type * as challenges from "../challenges.js";
import type * as contractJobs from "../contractJobs.js";
import type * as crons from "../crons.js";
import type * as elkqr from "../elkqr.js";
import type * as http from "../http.js";
import type * as importExport from "../importExport.js";
import type * as inquiries from "../inquiries.js";
import type * as inspections from "../inspections.js";
import type * as integrations_heffl from "../integrations/heffl.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bookings from "../lib/bookings.js";
import type * as lib_contracts from "../lib/contracts.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_formChallenge from "../lib/formChallenge.js";
import type * as lib_identifiers from "../lib/identifiers.js";
import type * as lib_inspections from "../lib/inspections.js";
import type * as lib_passwords from "../lib/passwords.js";
import type * as lib_pricing from "../lib/pricing.js";
import type * as lib_publish from "../lib/publish.js";
import type * as lib_qrSync from "../lib/qrSync.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_siteContact from "../lib/siteContact.js";
import type * as lib_staffEmail from "../lib/staffEmail.js";
import type * as lib_staffUsers from "../lib/staffUsers.js";
import type * as lib_uploads from "../lib/uploads.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_vehicleCopy from "../lib/vehicleCopy.js";
import type * as lib_vehicleStatus from "../lib/vehicleStatus.js";
import type * as lib_vehicles from "../lib/vehicles.js";
import type * as lib_waagentsWebhook from "../lib/waagentsWebhook.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as public_ from "../public.js";
import type * as qrGenerate from "../qrGenerate.js";
import type * as seed from "../seed.js";
import type * as site from "../site.js";
import type * as staff from "../staff.js";
import type * as vehiclePhotos from "../vehiclePhotos.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  bookingJobs: typeof bookingJobs;
  bookings: typeof bookings;
  challenges: typeof challenges;
  contractJobs: typeof contractJobs;
  crons: typeof crons;
  elkqr: typeof elkqr;
  http: typeof http;
  importExport: typeof importExport;
  inquiries: typeof inquiries;
  inspections: typeof inspections;
  "integrations/heffl": typeof integrations_heffl;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  "lib/bookings": typeof lib_bookings;
  "lib/contracts": typeof lib_contracts;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/formChallenge": typeof lib_formChallenge;
  "lib/identifiers": typeof lib_identifiers;
  "lib/inspections": typeof lib_inspections;
  "lib/passwords": typeof lib_passwords;
  "lib/pricing": typeof lib_pricing;
  "lib/publish": typeof lib_publish;
  "lib/qrSync": typeof lib_qrSync;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/siteContact": typeof lib_siteContact;
  "lib/staffEmail": typeof lib_staffEmail;
  "lib/staffUsers": typeof lib_staffUsers;
  "lib/uploads": typeof lib_uploads;
  "lib/validators": typeof lib_validators;
  "lib/vehicleCopy": typeof lib_vehicleCopy;
  "lib/vehicleStatus": typeof lib_vehicleStatus;
  "lib/vehicles": typeof lib_vehicles;
  "lib/waagentsWebhook": typeof lib_waagentsWebhook;
  migrations: typeof migrations;
  notifications: typeof notifications;
  public: typeof public_;
  qrGenerate: typeof qrGenerate;
  seed: typeof seed;
  site: typeof site;
  staff: typeof staff;
  vehiclePhotos: typeof vehiclePhotos;
  vehicles: typeof vehicles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
