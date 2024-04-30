/* File to check and handle user authentication - will be used for Navigation bar file */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Object that represents the initial state of the user.
const initialUser = {
  email: '',
  username: '',
  spotifyAccount: '',
  password: '',
  isAuthenticated: false,
};

/* Passing initialUser object as the default value - if user info 
  is not inputted/not found, email and password remain empty and authentication is false.
*/
const UserContext = createContext(initialUser);

// UserProvider component
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : initialUser;
  }); // State variable to handle state of the initial user.

  //Effect to sore user is localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  // Wrap children components with the user context provider
  return (
    <UserContext.Provider value={[user, setUser]}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook function to access user context
const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export { UserProvider, useUser };