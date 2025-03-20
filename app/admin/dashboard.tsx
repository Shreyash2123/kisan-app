import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, mobile, address, email');
      
      if (error) throw error;
      
      setUsers(data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch users');
      setLoading(false);
      console.error(error);
    }
  };

  const handleLogout = () => {
    router.replace('/admin');
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.navContainer}>
          <Text style={styles.appName}>Admin Dashboard</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setShowUsers(!showUsers)}
          >
            <Text style={styles.navButtonText}>All Users</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Content Area */}
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2980b9" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : showUsers && users.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Registered Users ({users.length})</Text>
            {users.map((user, index) => (
              <View key={index} style={styles.userCard}>
                <Text style={styles.userName}>{user.full_name}</Text>
                <Text style={styles.userInfo}>📱 {user.mobile}</Text>
                <Text style={styles.userInfo}>📧 {user.email}</Text>
                <Text style={styles.userInfo}>🏠 {user.address}</Text>
              </View>
            ))}
          </>
        ) : showUsers ? (
          <Text style={styles.noUsersText}>No users found</Text>
        ) : (
          <Text style={styles.welcomeText}>Welcome to Admin Dashboard</Text>
        )}
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 15,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  navButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
  },
  noUsersText: {
    color: '#7f8c8d',
    fontSize: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 20,
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 40,
  },
});