import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, LayoutAnimation } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getSession, clearSession } from '../../lib/session';

export default function VendorDashboard() {
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const session = await getSession();
        if (!session) {
          router.replace('/vendor/vendor-login');
          return;
        }

        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', session.id)
          .single();

        if (error) throw error;
        setVendorData(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load vendor data');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  const toggleSidebar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace('/vendor/vendor-login');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2980b9" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (showProfile) {
      return (
        <>
          <Text style={styles.sectionHeader}>Your Profile</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Personal Information</Text>
            <InfoRow label="Full Name" value={vendorData?.full_name} />
            <InfoRow label="Mobile" value={vendorData?.mobile} />
            <InfoRow label="Email" value={vendorData?.email} />
            <InfoRow label="GST ID" value={vendorData?.gst_id} />
            <InfoRow label="Unique ID" value={vendorData?.id} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Bank Details</Text>
            <InfoRow label="Bank Name" value={vendorData?.bank_name} />
            <InfoRow label="Account Number" value={vendorData?.account_number} />
            <InfoRow label="IFSC Code" value={vendorData?.ifsc_code} />
            <InfoRow label="Branch Name" value={vendorData?.branch_name} />
          </View>
        </>
      );
    }

    return (
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome, {vendorData?.full_name}</Text>
        <Text style={styles.welcomeText}>Manage your vendor account and transactions here</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <SafeAreaView style={styles.navBar}>
        <View style={styles.navContent}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          <Text style={styles.navTitle}>Vendor Dashboard</Text>
          
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
              <Text style={styles.sidebarTitle}>Vendor Menu</Text>
              
              <TouchableOpacity
                style={[styles.navButton, showProfile && styles.activeNavButton]}
                onPress={() => {
                  setShowProfile(true);
                  toggleSidebar();
                }}
              >
                <Text style={styles.navButtonText}>Profile</Text>
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
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

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
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 15,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});