import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View, SafeAreaView, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    address: '', // New address field
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateMobile = (mobile: string) => {
    const re = /^\d{10}$/;
    return re.test(mobile);
  };

  const handleRegister = async () => {
    if (!form.fullName || !form.mobile || !form.address || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!validateMobile(form.mobile)) {
      Alert.alert('Error', 'Mobile number must be 10 digits');
      return;
    }
    if (!validateEmail(form.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true); // Start loading

    try {
      // Step 1: Create user in Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;
      if (!user) throw new Error('User registration failed');

      // Step 2: Insert user profile into public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          full_name: form.fullName,
          mobile: form.mobile,
          address: form.address,
          email: form.email,
          password_hash: form.password // Never store plain text passwords in production!
        });

      if (profileError) throw profileError;

      Alert.alert('Success', 'Registration successful! Please check your email for confirmation.');
      router.back();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Registering...</Text>
        </View>
      )}

      <SafeAreaView style={styles.topBar}>
        <View style={styles.navContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.appName}>Register</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <TextInput
            placeholder="Full Name"
            value={form.fullName}
            onChangeText={(text) => setForm({ ...form, fullName: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Mobile Number"
            value={form.mobile}
            onChangeText={(text) => setForm({ ...form, mobile: text })}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <TextInput
            placeholder="Address"
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            style={[styles.input, styles.addressInput]}
            multiline
            numberOfLines={3}
          />
          <TextInput
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            style={styles.input}
            secureTextEntry
          />
          <TextInput
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
            style={styles.input}
            secureTextEntry
          />
          <TouchableOpacity
            onPress={handleRegister}
            style={styles.registerButton}
          >
            <Text style={styles.buttonText}>Register Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Keep the same StyleSheet as before
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    backgroundColor: '#2ecc71',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 15,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 20,
  },
  backButton: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    fontSize: 16,
  },
  addressInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  registerButton: {
    width: '100%',
    backgroundColor: '#2ecc71',
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
    color: '#333',
  },
});