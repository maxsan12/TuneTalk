/* File to check and handle user authentication - will be used for Navigation bar file */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Object that represents the initial state of the user.
const initialUser = {
  _id: null, // Initialize _id as null
  email: '',
  username: '',
  password: '',
  spotifyAccount: '',
  bio: '',
  profileImage: '',
  isAuthenticated: false,
  recommendations: [],
};

/* Passing initialUser object as the default value - if user info 
  is not inputted/not found, email, password, spotifyAccount etc. remain empty and authentication is false.
*/

/* (This is the old code and causing crash when you first load the website)

const UserContext = createContext(initialUser);

// UserProvider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState((initialUser) => {
    // Retrieve the user from localStorage if it exists
    const storedUser = localStorage.getItem('user');
    console.log(localStorage.getItem('user'));
    //return initialUser;
    return storedUser ? JSON.parse(storedUser) : initialUser; // KEEP THIS HERE OTHERWISE THE TUNETALK EMAIL AND USERNAME WILL NOT BE SAVED IN THE DROPDOWN MENU AFTER REDIRECTING TO ACCOUNT/SPOTIFY
  });
  // Effect to store user in localStorage whenever it changes
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
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

*/

const UserContext = createContext(null);

function loadUserFromStorage() {
  const raw = localStorage.getItem("user");
  // raw can be null, "undefined", "", etc.
  if (!raw || raw === "undefined" || raw === "null") return initialUser;

  try {
    const parsed = JSON.parse(raw);
    // merge with defaults so missing fields don't become undefined
    return { ...initialUser, ...parsed };
  } catch (e) {
    console.warn("Bad localStorage user value, resetting:", raw, e);
    localStorage.removeItem("user");
    return initialUser;
  }
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => loadUserFromStorage());

  useEffect(() => {
    // Only persist real objects
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  return (
    <UserContext.Provider value={[user, setUser]}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

export { initialUser };
