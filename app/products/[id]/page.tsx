'use client';

import React from 'react';
import ProductPage from '../../../components/ProductPage';

export default function Page({ params }: { params: { id: string } }) {
  console.log('Page params:', params); // Add logging to debug
  return <ProductPage params={params} />;
} 