import React, { createContext, useContext, useState, useEffect } from "react";
import { signUp, signIn, signOut, getCurrentUser } from "aws-amplify/auth";

interface AuthContextType {
  currentUser: any | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext) as AuthContextType;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function signup(email: string, password: string, displayName: string) {
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: displayName,
          },
        },
      });
      return result;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      const result = await signIn({
        username: email,
        password,
      });
      setCurrentUser(result);
      return result;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  async function loginAnonymously() {
    throw new Error("Anonymous login is not supported with AWS Cognito");
  }

  async function logout() {
    try {
      await signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  const value = {
    currentUser,
    loading,
    signup,
    login,
    loginAnonymously,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
