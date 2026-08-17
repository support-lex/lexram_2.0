// Wrapper that keeps a route's error contract JSON.
//
// An exception thrown out of a route handler (a missing env var, a dead
// upstream) makes Next return a bare 500 with an EMPTY body. The browser then
// fails at `res.json()` and the user sees nothing at all — which is how a
// missing SUPABASE_SERVICE_ROLE_KEY on the deploy presented as a silent,
// undiagnosable signup failure. Wrap handlers so callers always get a body and
// the real cause always reaches the server log.

import { NextResponse } from 'next/server';

type Handler = (req: Request) => Promise<Response>;

export function jsonRoute(name: string, handler: Handler): Handler {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      // Full detail to the log, nothing internal to the caller.
      console.error(`[${name}] unhandled error:`, err);
      return NextResponse.json(
        { error: 'Something went wrong on our end. Please try again.' },
        { status: 500 }
      );
    }
  };
}
