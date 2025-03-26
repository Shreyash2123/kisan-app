import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, LayoutAnimation } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'users' | 'vendors'>('users');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if(activeSection === 'users') {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, mobile, address, email');
        
        if (error) throw error;
        setUsers(data || []);
      } else {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, full_name, mobile, email, gst_id, bank_name');
        
        if (error) throw error;
        setVendors(data || []);
      }
      
      setLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleLogout = () => {
    router.replace('/admin');
  };

  const renderData = () => {
    const data = activeSection === 'users' ? users : vendors;
    const title = activeSection === 'users' ? 'Registered Users' : 'Registered Vendors';

    if (loading) return <ActivityIndicator size="large" color="#2980b9" />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (data.length === 0) return <Text style={styles.noUsersText}>No {activeSection} found</Text>;

    return (
      <>
        <Text style={styles.sectionTitle}>{title} ({data.length})</Text>
        {data.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.info}>📱 {item.mobile}</Text>
            <Text style={styles.info}>📧 {item.email}</Text>
            
            {activeSection === 'vendors' && (
              <>
                <Text style={styles.info}>🪪 ( Unique Vendor ID ) {item.id}</Text>
                <Text style={styles.info}>🏛️ {item.bank_name}</Text>
                <Text style={styles.info}>🧾 {item.gst_id}</Text>
              </>
            )}
            
            {activeSection === 'users' && (
              <Text style={styles.info}>🏠 {item.address}</Text>
            )}
          </View>
        ))}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <SafeAreaView style={styles.navBar}>
        <View style={styles.navContent}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          <Text style={styles.navTitle}>Admin Dashboard</Text>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Sidebar Overlay */}
      {isSidebarVisible && (
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        >
          <View style={styles.sidebar}>
            <View style={styles.sidebarContent}>
              <Text style={styles.sidebarTitle}>Admin Panel</Text>
              
              <TouchableOpacity
                style={[styles.navButton, activeSection === 'users' && styles.activeNavButton]}
                onPress={() => {
                  setActiveSection('users');
                  toggleSidebar();
                }}
              >
                <Text style={styles.navButtonText}>All Users</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.navButton, activeSection === 'vendors' && styles.activeNavButton]}
                onPress={() => {
                  setActiveSection('vendors');
                  toggleSidebar();
                }}
              >
                <Text style={styles.navButtonText}>All Vendors</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Main Content */}
      <ScrollView 
        contentContainerStyle={styles.content}
        style={styles.mainContent}
      >
        {renderData()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navBar: {
    backgroundColor: '#2980b9',
    zIndex: 100,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 15,
  },
  menuButton: {
    padding: 10,
  },
  menuIcon: {
    color: 'white',
    fontSize: 24,
  },
  navTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#2c3e50',
    padding: 15,
    zIndex: 99,
    elevation: 99,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 98,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 80,
  },
  sidebarContent: {
    marginTop: 60,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  navButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  activeNavButton: {
    backgroundColor: '#2980b9',
  },
  navButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  card: {
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
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
});