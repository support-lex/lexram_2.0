"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BriefsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/matters'); }, [router]);
  return null;
}
