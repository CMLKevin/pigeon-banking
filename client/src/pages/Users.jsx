import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import { userAPI } from '../services/api';
import { formatDate } from '../utils/formatters';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPayment = (username) => {
    navigate('/send', { state: { preselectedUser: username } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
            <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary opacity-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">Users</h1>
          <p className="text-phantom-text-secondary text-lg">Browse all Agon users</p>
        </div>

        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
          {/* Search */}
          <div className="mb-8">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {/* Users List */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-phantom-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-phantom-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-phantom-text-primary font-semibold text-lg mb-2">
                {searchQuery ? 'No users found' : 'No users registered yet'}
              </p>
              {searchQuery && (
                <p className="text-sm text-phantom-text-secondary">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-phantom-text-tertiary px-2">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
              </div>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-5 hover:bg-phantom-bg-tertiary rounded-2xl transition-all duration-200 border border-transparent hover:border-phantom-border-light group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-phantom rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-xl">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-phantom-text-primary text-lg">{user.username}</p>
                      <p className="text-sm text-phantom-text-tertiary">
                        Joined {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendPayment(user.username)}
                    className="px-5 py-2.5 bg-gradient-phantom text-white rounded-2xl hover:shadow-glow transition-all duration-200 font-semibold text-sm transform hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Payment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
