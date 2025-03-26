import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  confirmSignUp,
  fetchAuthSession,
  type AuthUser,
  SignInOutput,
} from "aws-amplify/auth";

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<any>;
  confirmSignup: (email: string, code: string) => Promise<any>;
  login: (email: string, password: string) => Promise<SignInOutput>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext) as AuthContextType;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function signup(email: string, password: string, displayName: string) {
    try {
      // Generate a unique username instead of using email
      const generatedUsername = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log("Generated username:", generatedUsername);
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: displayName,
          },
          autoSignIn: {
            enabled: true,
          },
        },
      });

      return result;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }

  async function confirmSignup(email: string, code: string) {
    try {
      console.log("Confirming signup for email:", email);
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      return result;
    } catch (error) {
      console.error("Error confirming sign up:", error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      try {
        await signOut();
      } catch (e) {
        // Ignores errors during sign out
      }

      const result = await signIn({
        username: email,
        password,
      });

      // Only set currentUser if sign in is complete
      if (result.isSignedIn) {
        const user = await getCurrentUser();
        setCurrentUser(user);
      }

      return result;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
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
      // Check if user has a valid session
      const { tokens } = await fetchAuthSession();

      if (tokens) {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
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
    confirmSignup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
