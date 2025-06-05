'use client';

import ProductPage from '@/components/ProductPage';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  console.log('Page params:', params); // Add logging to debug
  return <ProductPage params={params} />;
} 