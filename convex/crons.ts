import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "contract expiry sweep",
  { hours: 12 },
  internal.contractJobs.sweepExpiring,
  {},
);

crons.interval(
  "booking hold expiry",
  { hours: 1 },
  internal.bookingJobs.sweepExpiredHolds,
  {},
);

crons.interval(
  "form challenge sweep",
  { hours: 1 },
  internal.challenges.sweepExpired,
  {},
);

export default crons;
