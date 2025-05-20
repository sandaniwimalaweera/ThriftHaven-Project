// // components/UserSelector.js (for admin to start new conversations)
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useMessages } from '../context/MessageContext';

// const UserSelector = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const { selectConversation } = useMessages();

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         setLoading(true);
//         const response = await axios.get('/api/messages/users');
//         setUsers(response.data);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error fetching users:', error);
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   const filteredUsers = users.filter(
//     (user) =>
//       user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       user.email.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="border rounded-lg overflow-hidden">
//       <div className="bg-gray-100 px-4 py-3 border-b">
//         <h2 className="font-medium">Select User to Message</h2>
//       </div>
//       <div className="p-4">
//         <input
//           type="text"
//           placeholder="Search users..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//       </div>
//       <div className="max-h-64 overflow-y-auto divide-y">
//         {loading ? (
//           <div className="p-4 text-center">Loading users...</div>
//         ) : filteredUsers.length === 0 ? (
//           <div className="p-4 text-center">No users found</div>
//         ) : (
//           filteredUsers.map((user) => (
//             <div
//               key={user.id}
//               className="px-4 py-3 cursor-pointer hover:bg-gray-50"
//               onClick={() => {
//                 selectConversation({
//                   id: user.id,
//                   name: user.name,
//                   email: user.email,
//                   userType: user.userType
//                 });
//               }}
//             >
//               <div className="flex justify-between">
//                 <div>
//                   <h3 className="font-medium">{user.name}</h3>
//                   <p className="text-sm text-gray-500">{user.email}</p>
//                 </div>
//                 <span
//                   className={`px-2 py-1 text-xs rounded-full ${
//                     user.userType === 'Seller'
//                       ? 'bg-green-100 text-green-800'
//                       : 'bg-blue-100 text-blue-800'
//                   }`}
//                 >
//                   {user.userType}
//                 </span>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserSelector;