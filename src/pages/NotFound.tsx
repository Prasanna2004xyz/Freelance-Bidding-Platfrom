import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-7xl font-bold gradient-text mb-4">404</h1>
      <h2 className="text-3xl font-bold text-silver-100 mb-2">Page Not Found</h2>
      <p className="text-silver-400 mb-8">Sorry, the page you are looking for does not exist.</p>
      <Link to="/dashboard">
        <Button size="lg">Go to Dashboard</Button>
      </Link>
      <Link to="/">
        <Button variant="secondary" className="mt-4">Go Home</Button>
      </Link>
    </div>
  );
} 