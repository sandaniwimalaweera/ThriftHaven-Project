import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function Donation() {
  return <DonationForm />;
}

const DonationForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    category: "",
    type: "",
    size: "",
    status: "",
    quantity: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file" && files[0]) {
      setFormData({
        ...formData,
        [name]: files[0],
      });
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const {
    product_name,
    description,
    category,
    type,
    size,
    status,
    quantity,
    image,
  } = formData;

  // Basic validations
  if (product_name.trim().length < 2) {
    alert("Product name must be at least 2 characters.");
    return;
  }

  if (description.trim().length < 10) {
    alert("Description must be at least 10 characters.");
    return;
  }

  if (!category || !type || !size || !status) {
    alert("Please select category, type, size, and status.");
    return;
  }

  if (!quantity || Number(quantity) <= 0) {
    alert("Quantity must be a positive number.");
    return;
  }

  if (!image) {
    alert("Please upload an image.");
    return;
  }

  if (!image.type.startsWith("image/")) {
    alert("Only image files are allowed.");
    return;
  }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image" && value) {
        data.append("image", value);
      } else {
        data.append(key, value);
      }
    });

    try {
      const response = await axios.post("http://localhost:5000/api/donations/donate", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert( "Your donation currently under review. We'll notify you as soon as it gets approved. Thank you for your patience!");
      router.back(); // Redirects to the previous page
    } catch (error) {
      console.error("Donation failed:", error);
      alert("Error making donation");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left Section - Donation Form - IMPROVED */}
      <div className="md:w-1/2 w-full bg-primary flex flex-col justify-center items-center text-white px-4 md:px-8 py-10">
        <div className="bg-white/10 p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-lg my-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
            Donation
          </h2>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {/* Product Name */}
            <div className="relative">
              <input
                type="text"
                name="product_name"
                placeholder="Product Name"
                className="pl-4 w-full p-3.5 bg-white/20 text-white rounded-lg placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="relative">
              <textarea
                name="description"
                placeholder="Describe your clothing item, including brand, color, condition(how many times used) , and any unique features..."
                className="pl-4 w-full p-3.5 bg-white/20 text-white rounded-lg placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                onChange={handleChange}
                rows="3"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category */}
              <div className="relative">
                <select
                  name="category"
                  className="pl-4 w-full p-3 bg-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="kids">Kids</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Type */}
              <div className="relative">
                <select
                  name="type"
                  className="pl-4 w-full p-3 bg-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="frock">Frock</option>
                  <option value="blouse">Blouse</option>
                  <option value="skirt">Skirt</option>
                  <option value="saree">Sarees</option>
                  <option value="pant">Pant</option>
                  <option value="shirt">Shirt</option>
                  <option value="tshirt">TShirt</option>
                  <option value="denim">Denim</option>
                  <option value="short">Short</option>
                  <option value="trouser">Trouser</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Size */}
              <div className="relative">
                <select
                  name="size"
                  className="pl-4 w-full p-3 bg-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Size</option>
                  <option value="xsmall">X-Small</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xlarge">X-Large</option>
                  <option value="xxlarge">XX-Large</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Status */}
              <div className="relative">
                <select
                  name="status"
                  className="pl-4 w-full p-3 bg-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="relative">
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                className="pl-4 w-full p-3.5 bg-white/20 text-white rounded-lg placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            {/* Image Upload with Preview */}
            <div className="relative space-y-3">
              {imagePreview ? (
                <div className="mb-3">
                  <div className="flex flex-col items-center">
                    <div className="w-full relative">
                      <img 
                        src={imagePreview} 
                        alt="Product Preview" 
                        className="h-48 w-full object-cover rounded-lg border-2 border-white/40"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({...formData, image: null});
                        }}
                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-full hover:bg-red-600/80"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-white/80 text-sm mt-2">Image uploaded successfully</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-20 border-2 border-dashed border-white/40 rounded-lg cursor-pointer hover:bg-white/10 transition">
                    <div className="flex flex-col items-center justify-center pt-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="pt-1 text-sm tracking-wider text-white/60">Upload product image</p>
                    </div>
                    <input 
                      type="file" 
                      name="image" 
                      className="opacity-0" 
                      onChange={handleChange}
                      accept="image/*"
                      required={!imagePreview}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="w-1/2 bg-white/10 text-white py-3 rounded-full hover:bg-white/20 transition-all duration-300 font-medium"
              >
                ADD
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section - Illustration (UNCHANGED) */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-gray-100 px-6 md:px-10 py-10">
        <h2 className="text-3xl md:text-4xl font-bold text-primary text-center">
          Give back while you thrift!
        </h2>
        <p className="text-md mt-2 text-primary text-center">
          "Donate your gently used items and help make a positive impact in someone's life."
        </p>

        <div className="mt-10">
          <img
            src="/img1.svg"
            alt="Illustration"
            className="w-full max-w-md md:max-w-lg lg:max-w-xl h-auto"
          />
        </div>

    
      </div>
    </div>
  );
};