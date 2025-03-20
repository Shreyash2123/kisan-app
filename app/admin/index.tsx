import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    const ADMIN_EMAIL = Constants.expoConfig?.extra?.ADMIN_EMAIL;
    const ADMIN_PASSWORD = Constants.expoConfig?.extra?.ADMIN_PASSWORD;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      router.replace('/admin/dashboard');
    } else {
      Alert.alert('Error', 'Invalid admin credentials');
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Verifying...</Text>
        </View>
      )}

      <SafeAreaView style={styles.topBar}>
        <View style={styles.navContainer}>
          <Text style={styles.appName}>Kisan App - Admin Portal</Text>
        </View>
      </SafeAreaView>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Admin Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Admin Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TouchableOpacity
          onPress={handleAdminLogin}
          style={styles.loginButton}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  topBar: {
    backgroundColor: '#2980b9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  navContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#2980b9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});