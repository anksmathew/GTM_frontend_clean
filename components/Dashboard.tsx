"use client";
import React from 'react';

const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="col-span-1 md:col-span-2 bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Interactive Report</h2>
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <p className="text-lg font-semibold">Users</p>
            <p className="text-3xl">44,542</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Sessions</p>
            <p className="text-3xl">58,015</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Page Views</p>
            <p className="text-3xl">232,634</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Transactions</p>
            <p className="text-3xl">58</p>
          </div>
        </div>
        <div className="bg-gray-100 h-64">Chart Placeholder</div>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Channel Performance</h2>
        <div className="bg-gray-100 h-64">Chart Placeholder</div>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Visitor Overview</h2>
        <div className="bg-gray-100 h-64">Pie Chart Placeholder</div>
      </div>
    </div>
  );
};

export default Dashboard; 