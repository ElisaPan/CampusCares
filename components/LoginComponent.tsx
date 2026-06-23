/*************
 * TODO:
 *  Severe:
 *    Store existingUser in your RN global state
 *    Home Page
 *    Sign Up Page
 *    Register Page
 *    Router.push('tabs')
 *  High:
 *    Fix env constant
 *  Low
 *    -
 */
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import * as api from '../api';
import { loginTest } from '../api';
import { signInWithGoogleIdToken, signOut } from '../firebase-config';
import { User } from '../types';

import { ActivityIndicator, Animated, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// interface LoginProps {
//   onGoogleSignIn: () => void;
//   error: string | null;
//   isLoading: boolean;
//   setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
//   mode: string;
// }
interface LoginProps {
  mode: 'login' | 'sign-up';
}

// Bare RN CLI: swap this line for `import Config from 'react-native-config'; const env = Config.ENV;`
const env = process.env.EXPO_PUBLIC_ENV;

const Login: React.FC<LoginProps> = ({ mode }) => {

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    translateY.setValue(-20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [mode]);

  // expo-auth-session resolves asynchronously via `response` — mirrors handleGoogleSignIn in AppContent.tsx
  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const { id_token } = response.params;

      (async () => {
        try {
          const firebaseUser = await signInWithGoogleIdToken(id_token);
          const email = firebaseUser.email.toLowerCase();
          const isCampusEmail =
            email.endsWith('@cornell.edu') || email.endsWith('@ithaca.edu');

          // Non-campus emails go through the approval check, same as web
          if (!isCampusEmail) {
            try {
              const approvalCheck = await api.checkEmailApproval(email);
              if (!approvalCheck.is_approved) {
                setError(
                  'Your email is not approved for this platform. Please contact team@campuscares.us for access.'
                );
                await signOut();
                return;
              }
            } catch {
              setError(
                'Unable to verify email approval. Please try again or contact team@campuscares.us.'
              );
              await signOut();
              return;
            }
          }

          const token = await firebaseUser.getIdToken();
          const authResult = await api.verifyFirebaseToken(token);

          if (authResult.success) {
            const { exists } = await api.checkUserExists(email);

            if (exists) {
              const existingUser = await api.getUserByEmail(email, token);
              // TODO: store existingUser in your RN global state
              // (Zustand store, Context, etc.) — same role as setCurrentUser on web
              router.push(`/HomePage`);
            } else {
              // New user — send to registration, same as web's navigate('/register')
              router.push(`/RegisterPage`);
            }
          }
        } catch (e: any) {
          console.error('Google sign-in error:', e);
          setError(e.message || 'Google sign-in failed. Please try again.');
        } finally {
          setIsLoading(false);
        }
      })();
    } else if (response.type === 'error') {
      setError('Sign-in failed. Please try again.');
      setIsLoading(false);
    } else if (response.type === 'dismiss') {
      setIsLoading(false);
    }
  }, [response]);
  
  const handleGoogleSignIn = () => {
    setError(null);
    setIsLoading(true);
    promptAsync();
  };

  const handleLoginTest = async (id: number) => {
    try {
      const res = await loginTest(id);
      const data: User = await res.json();
      router.push(`/HomePage`);
    } catch {
    }
  };

  const ver = mode === 'login' ? 'in' : 'up';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.page,
          { opacity: fadeAnim, transform: [{ translateY }] },
        ]}
      >
        <Image
          source={require(`@/assets/images/logo.png`)}
          style={styles.loginLogo}
          resizeMode="contain"
        />
        <Text style={styles.loginTitle}>CampusCares</Text>
        <Text style={styles.loginSubtitle}>Your hub for making a difference in Ithaca.</Text>

        <View style={styles.loginContent}>
          <Text style={styles.loginWelcome}>
            {mode === 'login' ? 'Welcome Back!' : 'Welcome!'}
          </Text>

          {error && (
            <View style={styles.loginError}>
              <Text style={styles.loginErrorText}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isLoading || !request}
            style={[styles.loginButton, styles.loginButtonGoogle]}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size='small' color='white' style={styles.spinner} />
                <Text style={styles.loginButtonText}>Signing {ver}...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Sign {ver} with Cornell/IC email</Text>
            )}
          </Pressable>

          {mode === 'login' ? (
            <View style={styles.subq}>
              <Text>Don't have an account?</Text>
              <Pressable onPress={() => router.push(`../SignUpPage`)}>
                <Text style={styles.loginLink}>Sign up</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.subq}>
              <Text>Already have an account?</Text>
              <Pressable onPress={() => router.push(`../LoginPage`)}>
                <Text style={styles.loginLink}>Log in</Text>
              </Pressable>
            </View>
          )}

          {env === 'staging' && (
            <View style={styles.loginTestButtons}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Pressable
                  key={i + 1}
                  style={[styles.loginButton, styles.loginButtonTest]}
                  onPress={() => handleLoginTest(i + 1)}
                >
                  <Text>Sign in with test user {i + 1}</Text>
                  <Text style={{ color: 'darkblue' }}>{i % 2 === 1 ? '(admin)' : ''}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.bottomInfo}>
            <Text style={styles.loginContact}>
              Not a student? Reach out to{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('mailto:team@campuscares.us')}>
                team@campuscares.us
              </Text>
              .
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  page: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  loginLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginContent: {
    width: '100%',
    alignItems: 'center',
  },
  loginWelcome: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  loginError: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    width: '100%',
  },
  loginErrorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginButtonGoogle: {
    backgroundColor: '#4285F4',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  subq: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  loginLink: {
    color: '#4285F4',
    fontWeight: '600',
  },
  loginTestButtons: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  loginButtonTest: {
    backgroundColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bottomInfo: {
    marginTop: 8,
  },
  loginContact: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  link: {
    color: '#4285F4',
    textDecorationLine: 'underline',
  },
});
