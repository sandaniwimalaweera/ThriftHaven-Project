// pages/sellerdonation.js
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/admin-sidebar";

export default function SellerDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");

  // Function to fetch donations based on an optional seller name filter.
  const fetchDonations = async (name = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Use the search endpoint with the name query if provided.
      const endpoint = name
        ? `http://localhost:5000/api/donations/seller/search?name=${encodeURIComponent(name)}`
        : "http://localhost:5000/api/donations/seller/search";
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDonations(response.data);
    } catch (error) {
      console.error("Error fetching seller donations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initially fetch all donations.
  useEffect(() => {
    fetchDonations();
  }, []);

  // Debounce the search so that API calls are not made on every keystroke.
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchDonations(searchName);
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [searchName]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar Section */}
      <div className="w-full md:w-1/4">
        <div className="sticky top-0">
          <Sidebar />
        </div>
      </div>

      {/* Main Content Section */}
      <div className="w-full md:w-3/4 p-4">
        <h1 className="text-2xl font-bold mb-4">Seller Donation Details</h1>

        {/* Display the total donation count */}
        <p className="mb-4">Total Donations: {donations.length}</p>
        
        {/* Full-width Search Input Field */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by seller name..."
            className="p-2 border rounded w-full"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>
        
        {/* Table wrapped in a scrollable container */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Donation ID</th>
                <th className="border border-gray-300 p-2">Product Name</th>
                <th className="border border-gray-300 p-2">Description</th>
                <th className="border border-gray-300 p-2">Category</th>
                <th className="border border-gray-300 p-2">Type</th>
                <th className="border border-gray-300 p-2">Size</th>
                <th className="border border-gray-300 p-2">Status</th>
                <th className="border border-gray-300 p-2">Quantity</th>
                <th className="border border-gray-300 p-2">Image</th>
                <th className="border border-gray-300 p-2">Date</th>
                <th className="border border-gray-300 p-2">Seller Name</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.donation_id}>
                  <td className="border border-gray-300 p-2">{donation.donation_id}</td>
                  <td className="border border-gray-300 p-2">{donation.product_name}</td>
                  <td className="border border-gray-300 p-2">{donation.description}</td>
                  <td className="border border-gray-300 p-2">{donation.category}</td>
                  <td className="border border-gray-300 p-2">{donation.type}</td>
                  <td className="border border-gray-300 p-2">{donation.size}</td>
                  <td className="border border-gray-300 p-2">{donation.status}</td>
                  <td className="border border-gray-300 p-2">{donation.quantity}</td>
                  <td className="border border-gray-300 p-2">
                    {donation.image && (
                      <img
                        src={`http://localhost:5000/${donation.image}`}
                        alt="Donation"
                        className="w-20 h-auto object-cover"
                      />
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {new Date(donation.donation_date).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 p-2">{donation.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


