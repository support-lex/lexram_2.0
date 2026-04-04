/**
 * Authentication API endpoint
 * Handles sign-in and sign-out
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

interface SignInRequest {
  email: string;
  password: string;
}

/** POST /api/auth — sign in */
export async function POST(request: NextRequest) {
  try {
    const body: SignInRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Demo authentication: any email + "demo123"
    if (password !== 'demo123') {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    const token = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

    return NextResponse.json(
      { success: true, token, user: { email } },
      {
        status: 200,
        headers: {
          'Set-Cookie': `lexram_auth=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax${secure}`,
        },
      }
    );
  } catch (error) {
    log('error', 'api', 'Auth sign-in error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/** DELETE /api/auth — sign out */
export async function DELETE(request: NextRequest) {
  try {
    const body: { token: string } = await request.json();
    if (!body.token) {
      return NextResponse.json({ success: false, error: 'Token is required for sign-out' }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, message: 'Signed out successfully' },
      { status: 200, headers: { 'Set-Cookie': 'lexram_auth=; Path=/; Max-Age=0; SameSite=Lax' } }
    );
  } catch (error) {
    log('error', 'api', 'Auth sign-out error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
