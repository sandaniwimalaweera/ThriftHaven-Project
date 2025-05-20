// pages/auth/SellerProductTable.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SellerSidebar from "../../components/seller-sidebar";

const SellerProductTable = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Define your custom purple colors here
  const colors = {
    // Main purple colors
    editBtnBg: '#752078',      // Purple-600
    editBtnHover: '#804582',   // Purple-700
    deleteBtnBg: '#dcabde',    // Purple-800
    deleteBtnHover: '#b496b5', // Purple-900
    headerColor: '#611964',
    
    // Focus ring colors
    editFocusRing: '#A78BFA',  // Purple-400
    deleteFocusRing: '#7C3AED' // Purple-700
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search criteria
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products.filter(product => {
      // Text search
      const nameMatch = !searchQuery || 
        product.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const categoryMatch = !categoryFilter || 
        product.category?.toLowerCase() === categoryFilter.toLowerCase();
      
      // Type filter
      const typeMatch = !typeFilter || 
        product.type?.toLowerCase() === typeFilter.toLowerCase();
      
      // Size filter
      const sizeMatch = !sizeFilter || 
        product.size?.toLowerCase() === sizeFilter.toLowerCase();
      
      // Status filter
      const statusMatch = !statusFilter || 
        product.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return nameMatch && categoryMatch && typeMatch && sizeMatch && statusMatch;
    });
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter, typeFilter, sizeFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        router.push('/login');
        return;
      }
  
      const response = await fetch('http://localhost:5000/api/products/seller/approved', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
  
      const data = await response.json();
      console.log('Products fetched:', data);
      
      // Ensure price is a number
      const processedData = data.map(product => ({
        ...product,
        price: parseFloat(product.price) || 0,
        original_price: parseFloat(product.original_price) || 0,
        quantity: parseInt(product.quantity) || 0
      }));
      
      setProducts(processedData);
      setFilteredProducts(processedData);
      setLoading(false);
    } catch (err) {
      console.error('Error details:', err);
      setError(`Error fetching products: ${err.message}`);
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product.product_id);
    setEditForm({
      product_name: product.product_name || '',
      description: product.description || '',
      category: product.category || '',
      type: product.type || '',
      size: product.size || '',
      status: product.status || '',
      quantity: product.quantity || '',
      original_price: product.original_price || '',
      price: product.price || ''
    });
  };

  const handleSaveEdit = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products/edit', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, ...editForm })
      });

      const data = await response.json();
      if (data.success || data.message) {
        setEditingProduct(null);
        fetchProducts(); // Refresh the products list
      } else {
        setError(data.error || 'Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Error updating product');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({});
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();
      if (data.success || data.message) {
        fetchProducts(); // Refresh the products list
      } else {
        setError(data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Error deleting product');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setTypeFilter('');
    setSizeFilter('');
    setStatusFilter('');
  };

  // Calculate total products and total quantity
  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, product) => sum + (parseInt(product.quantity) || 0), 0);
  
  // Calculate total value of inventory
  const totalValue = products.reduce((sum, product) => {
    return sum + (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0);
  }, 0);

  // Extract unique values for filters
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const types = [...new Set(products.map(p => p.type).filter(Boolean))];
  const sizes = [...new Set(products.map(p => p.size).filter(Boolean))];
  const statuses = [...new Set(products.map(p => p.status).filter(Boolean))];

  // Helper function to format price
  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  if (loading) return (
    <div className="flex min-h-screen">
      <SellerSidebar />
      <div className="flex-1 flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: colors.editFocusRing }}></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex min-h-screen">
      <SellerSidebar />
      <div className="flex-1 p-4 bg-gray-50">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm" role="alert">
          <p className="font-bold">Error!</p>
          <p>{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <SellerSidebar />
      
      <div className="flex-1 p-4 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold" style={{ color: colors.headerColor }}>
              My Products
            </h1>
            <p className="mt-1 text-sm text-gray-600">Manage your approved products</p>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No products yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding some products to your inventory.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Product Statistics Section */}
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                    <h3 className="text-lg font-medium mb-1" style={{ color: colors.headerColor }}>Total Products</h3>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold" style={{ color: colors.editBtnBg }}>{totalProducts}</span>
                      <span className="ml-2 text-sm text-gray-500">items</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                    <h3 className="text-lg font-medium mb-1" style={{ color: colors.headerColor }}>Total Quantity</h3>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold" style={{ color: colors.editBtnBg }}>{totalQuantity}</span>
                      <span className="ml-2 text-sm text-gray-500">units</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                    <h3 className="text-lg font-medium mb-1" style={{ color: colors.headerColor }}>Total Value</h3>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold" style={{ color: colors.editBtnBg }}>LKR {formatPrice(totalValue)}</span>
                      <span className="ml-2 text-sm text-gray-500">inventory value</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <h3 className="text-lg font-medium mb-3" style={{ color: colors.headerColor }}>Search & Filter</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {/* Search by name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="search-query">
                      Search by name
                    </label>
                    <input
                      id="search-query"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Category filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category-filter">
                      Category
                    </label>
                    <select
                      id="category-filter"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="type-filter">
                      Type
                    </label>
                    <select
                      id="type-filter"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Types</option>
                      {types.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Size filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="size-filter">
                      Size
                    </label>
                    <select
                      id="size-filter"
                      value={sizeFilter}
                      onChange={(e) => setSizeFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Sizes</option>
                      {sizes.map((size, index) => (
                        <option key={index} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status-filter">
                      Status
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Status</option>
                      {statuses.map((status, index) => (
                        <option key={index} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md"
                    style={{ backgroundColor: colors.editBtnBg }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.editBtnHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.editBtnBg}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Results counter */}
              <div className="mb-2">
                <p className="text-sm text-gray-600">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-6 text-center text-sm text-gray-500">
                            No products match your search criteria
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map(product => (
                          <tr key={product.product_id} className="hover:bg-gray-50 transition-colors duration-150">
                            {editingProduct === product.product_id ? (
                              <>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <input
  type="text"
  name="product_name"
  value={editForm.product_name}
  disabled
  className="block w-full bg-gray-100 cursor-not-allowed rounded-md border-gray-300 shadow-sm sm:text-sm"
/>

                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    name="category"
                                    value={editForm.category}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:outline-none sm:text-sm"
                                    style={{ 
                                      borderColor: '#D1D5DB', 
                                      boxShadow: `0 0 0 1px #D1D5DB`
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    name="type"
                                    value={editForm.type}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:outline-none sm:text-sm"
                                    style={{ 
                                      borderColor: '#D1D5DB', 
                                      boxShadow: `0 0 0 1px #D1D5DB`
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <input
  type="number"
  name="original_price"
  value={editForm.original_price}
  disabled
  className="block w-full bg-gray-100 cursor-not-allowed rounded-md border-gray-300 shadow-sm sm:text-sm"
/>

                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <input
                                    type="number"
                                    name="quantity"
                                    value={editForm.quantity}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:outline-none sm:text-sm"
                                    style={{ 
                                      borderColor: '#D1D5DB', 
                                      boxShadow: `0 0 0 1px #D1D5DB`
                                    }}
                                    min="0"
                                  />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <select
                                    name="status"
                                    value={editForm.status}
                                    onChange={handleInputChange}
                                    disabled
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:outline-none sm:text-sm"
                                    style={{ 
                                      borderColor: '#D1D5DB', 
                                      boxShadow: `0 0 0 1px #D1D5DB`
                                    }}
                                  >
                              
                                    <option value="new">new</option>
                                    <option value="used">used</option>
                                  </select>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => handleSaveEdit(product.product_id)}
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white mr-1"
                                    style={{ backgroundColor: '#906aa3' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c398d9'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#906aa3'}
                                  >
                                    Save
                                  </button>
                                  <button 
                                    onClick={handleCancelEdit}
                                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white"
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="text-sm font-medium text-gray-900">{product.product_name || 'N/A'}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{product.category || 'N/A'}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{product.type || 'N/A'}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">LKR {formatPrice(product.price)}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{product.quantity || 0}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    product.status === 'Like New' ? 'bg-green-100 text-green-800' :
                                    product.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {product.status || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => handleEdit(product)}
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white mr-1"
                                    style={{ backgroundColor: colors.editBtnBg }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.editBtnHover}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.editBtnBg}
                                    onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.editFocusRing}4D`}
                                    onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(product.product_id)}
                                    className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white"
                                    style={{ backgroundColor: colors.deleteBtnBg }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.deleteBtnHover}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.deleteBtnBg}
                                    onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.deleteFocusRing}4D`}
                                    onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProductTable;