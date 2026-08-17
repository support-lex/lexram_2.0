import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <h1 className="font-serif text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-8">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-black text-white rounded-lg">
        Go back home
      </Link>
    </div>
  );
}
