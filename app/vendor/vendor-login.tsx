import { useState, useEffect } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import bcrypt from 'react-native-bcrypt';
import { storeSession } from '../../lib/session';

export default function VendorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);

    try {
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .from('vendors')
        .select('*')
        .eq('email', email)
        .single();

      if (supabaseError || !data) throw new Error('Invalid credentials');

      // Compare passwords using react-native-bcrypt
      const isValid = bcrypt.compareSync(password, data.hashed_password);
      if (!isValid) throw new Error('Invalid credentials');

      // Store session
      await storeSession({
        id: data.id,
        email: data.email,
        name: data.full_name
      });

      router.replace('/vendor/vendor-dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)')}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Vendor Login</Text>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2980b9" />
          <Text style={styles.loadingText}>Logging in...</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <Text style={styles.header}>Vendor Login</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/vendor/register')}
        >
          <Text style={styles.linkText}>
            Don't have an account? Register here
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2980b9',
    textAlign: 'center',
    marginBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2980b9',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 32,
    lineHeight: 32,
  },
  titleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#2980b9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#2980b9',
    fontWeight: '500',
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2980b9',
  },
});