import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

export default function AdminDashboard() {
  const handleLogout = () => {
    router.replace('/admin');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topBar}>
        <View style={styles.navContainer}>
          <Text style={styles.appName}>Admin Dashboard</Text>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={styles.title}>Admin Controls</Text>
        
        {/* Add your admin features here */}
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});