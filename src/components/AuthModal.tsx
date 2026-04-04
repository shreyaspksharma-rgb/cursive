import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, LogIn, UserPlus, Chrome } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'The email address is badly formatted.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/weak-password':
        return 'The password is too weak. Use at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'The sign-in popup was closed before completion.';
      case 'auth/operation-not-allowed':
        return 'This authentication method is not enabled.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      }
      onClose();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white text-black max-w-md w-full p-8 relative shadow-2xl border border-gray-200 rounded-3xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-black/5 transition-colors rounded-full"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tighter mb-2">
                {isLogin ? 'Welcome Back.' : 'Join Cursive.'}
              </h2>
              <p className="text-sm opacity-60 font-serif italic">
                {isLogin ? 'Sign in to sync your progress.' : 'Create an account to save your journey.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
                    <LogIn size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/5 border border-gray-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              )}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/5 border border-gray-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/5 border border-gray-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-xl flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : isLogin ? <><LogIn size={16} /> Sign In</> : <><UserPlus size={16} /> Create Account</>}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-white px-4 text-gray-400">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border border-gray-200 text-black py-3 font-mono text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-xl flex items-center justify-center gap-2"
            >
              <Chrome size={16} /> Google Account
            </button>

            <p className="mt-8 text-center text-xs opacity-60">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
