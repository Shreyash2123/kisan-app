import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getSession, clearSession } from '../../lib/session';

export default function VendorDashboard() {
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
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
        if (!data) throw new Error('Vendor not found');

        setVendorData(data);
      } catch (error) {
        let errorMessage = 'An unexpected error occurred';
        
        // Type-safe error handling
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = String(error.message);
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndFetchData();
  }, []);

  const handleLogout = async () => {
    await clearSession();
    router.replace('/vendor/vendor-login');
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Vendor Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {vendorData?.full_name}</Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <InfoRow label="Email" value={vendorData?.email} />
          <InfoRow label="Mobile" value={vendorData?.mobile} />
          <InfoRow label="GST ID" value={vendorData?.gst_id} />
        </View>

        {/* Bank Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <InfoRow label="Bank Name" value={vendorData?.bank_name} />
          <InfoRow label="Account Number" value={vendorData?.account_number} />
          <InfoRow label="IFSC Code" value={vendorData?.ifsc_code} />
          <InfoRow label="Branch Name" value={vendorData?.branch_name} />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 10,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
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
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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
    margin: 20,
  },
});