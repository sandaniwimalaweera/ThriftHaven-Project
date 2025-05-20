// pages/auth/SellerMyDonations.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SellerSidebar from "../../components/seller-sidebar";

const SellerMyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDonation, setEditingDonation] = useState(null);
  const [editForm, setEditForm] = useState({});
  const router = useRouter();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Define colors to match your theme
  const colors = {
    editBtnBg: '#752078',      // Purple-600
    editBtnHover: '#804582',   // Purple-700
    deleteBtnBg: '#dcabde',    // Purple-800
    deleteBtnHover: '#b496b5', // Purple-900
    headerColor: '#611964',
    editFocusRing: '#A78BFA',  // Purple-400
    deleteFocusRing: '#7C3AED' // Purple-700
  };

  useEffect(() => {
    fetchMyDonations();
  }, []);

  useEffect(() => {
    // Filter donations based on search criteria
    if (donations.length === 0) {
      setFilteredDonations([]);
      return;
    }

    const filtered = donations.filter(donation => {
      // Text search
      const nameMatch = !searchQuery || 
        donation.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const categoryMatch = !categoryFilter || 
        donation.category?.toLowerCase() === categoryFilter.toLowerCase();
      
      // Type filter
      const typeMatch = !typeFilter || 
        donation.type?.toLowerCase() === typeFilter.toLowerCase();
      
      // Size filter
      const sizeMatch = !sizeFilter || 
        donation.size?.toLowerCase() === sizeFilter.toLowerCase();
      
      // Status filter
      const statusMatch = !statusFilter || 
        donation.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return nameMatch && categoryMatch && typeMatch && sizeMatch && statusMatch;
    });
    
    setFilteredDonations(filtered);
  }, [donations, searchQuery, categoryFilter, typeFilter, sizeFilter, statusFilter]);

  const fetchMyDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        router.push('/login');
        return;
      }
  
      const response = await fetch('http://localhost:5000/api/donations/seller/mydonations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }
  
      const data = await response.json();
      console.log('Donations fetched:', data);
      
      setDonations(data);
      setFilteredDonations(data);
      setLoading(false);
    } catch (err) {
      console.error('Error details:', err);
      setError(`Error fetching donations: ${err.message}`);
      setLoading(false);
    }
  };

  const handleEdit = (donation) => {
    setEditingDonation(donation.donation_id);
    setEditForm({
      product_name: donation.product_name || '',
      description: donation.description || '',
      category: donation.category || '',
      type: donation.type || '',
      size: donation.size || '',
      quantity: donation.quantity || ''
    });
  };

  const handleSaveEdit = async (donationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/donations/edit', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ donationId, ...editForm })
      });

      const data = await response.json();
      if (data.success || data.message) {
        setEditingDonation(null);
        fetchMyDonations(); // Refresh the donations list
      } else {
        setError(data.error || 'Failed to update donation');
      }
    } catch (err) {
      console.error('Error updating donation:', err);
      setError('Error updating donation');
    }
  };

  const handleCancelEdit = () => {
    setEditingDonation(null);
    setEditForm({});
  };

  const handleDelete = async (donationId) => {
    if (!window.confirm('Are you sure you want to delete this donation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/donations/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ donationId })
      });

      const data = await response.json();
      if (data.success || data.message) {
        fetchMyDonations(); // Refresh the donations list
      } else {
        setError(data.error || 'Failed to delete donation');
      }
    } catch (err) {
      console.error('Error deleting donation:', err);
      setError('Error deleting donation');
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

  // Extract unique values for filters
  const categories = [...new Set(donations.map(d => d.category).filter(Boolean))];
  const types = [...new Set(donations.map(d => d.type).filter(Boolean))];
  const sizes = [...new Set(donations.map(d => d.size).filter(Boolean))];
  const statuses = [...new Set(donations.map(d => d.status).filter(Boolean))];

  // Calculate total donation count and quantity
  const totalDonations = donations.length;
  const totalQuantity = donations.reduce((sum, donation) => sum + (parseInt(donation.quantity) || 0), 0);

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
              My Donations
            </h1>
            <p className="mt-1 text-sm text-gray-600">Manage your donations</p>
          </div>

          {donations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No donations yet</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't made any donations yet.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Donation Statistics Section */}
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                    <h3 className="text-lg font-medium mb-1" style={{ color: colors.headerColor }}>Total Donations</h3>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold" style={{ color: colors.editBtnBg }}>{totalDonations}</span>
                      <span className="ml-2 text-sm text-gray-500">items donated</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                    <h3 className="text-lg font-medium mb-1" style={{ color: colors.headerColor }}>Total Quantity</h3>
                    <div className="flex items-end">
                      <span className="text-3xl font-bold" style={{ color: colors.editBtnBg }}>{totalQuantity}</span>
                      <span className="ml-2 text-sm text-gray-500">units</span>
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
                      placeholder="Search donations..."
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
                  Showing {filteredDonations.length} of {donations.length} donations
                </p>
              </div>

              {/* Donations Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donation Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDonations.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-6 text-center text-sm text-gray-500">
                            No donations match your search criteria
                          </td>
                        </tr>
                      ) : (
                        filteredDonations.map(donation => (
                          <tr key={donation.donation_id} className="hover:bg-gray-50 transition-colors duration-150">
                            {editingDonation === donation.donation_id ? (
                              <>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    name="product_name"
                                    value={editForm.product_name}
                                    onChange={handleInputChange}
                                    disabled
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
                                    <option value="Like New">Like New</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                  </select>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <input
                                    type="text"
                                    name="size"
                                    value={editForm.size}
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
                                  <div className="text-sm text-gray-900">
                                    {donation.donation_date ? new Date(donation.donation_date).toLocaleDateString() : 'N/A'}
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => handleSaveEdit(donation.donation_id)}
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
                                    <div className="text-sm font-medium text-gray-900">{donation.product_name || 'N/A'}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{donation.category || 'N/A'}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{donation.type || 'N/A'}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    donation.status === 'Like New' ? 'bg-green-100 text-green-800' :
                                    donation.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {donation.status || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{donation.size || 'N/A'}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{donation.quantity || 0}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {donation.donation_date ? new Date(donation.donation_date).toLocaleDateString() : 'N/A'}
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                  <button 
                                    onClick={() => handleEdit(donation)}
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
                                    onClick={() => handleDelete(donation.donation_id)}
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

export default SellerMyDonations;