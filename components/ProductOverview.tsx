"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  description: string;
  launch_date: string;
}

const ProductOverview = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', description: '', launch_date: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/products');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const addProduct = async () => {
    try {
      await axios.post('http://localhost:3001/api/products', newProduct);
      fetchProducts();
      setNewProduct({ name: '', description: '', launch_date: '' });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  return (
    <div>
      <h2>Product Overview</h2>
      <div>
        <input
          type="text"
          name="name"
          value={newProduct.name || ''}
          onChange={handleInputChange}
          placeholder="Product Name"
        />
        <input
          type="text"
          name="description"
          value={newProduct.description || ''}
          onChange={handleInputChange}
          placeholder="Description"
        />
        <input
          type="date"
          name="launch_date"
          value={newProduct.launch_date || ''}
          onChange={handleInputChange}
        />
        <button onClick={addProduct}>Add Product</button>
      </div>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name} - {product.description} - {product.launch_date}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProductOverview; 