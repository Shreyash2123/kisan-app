import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, LayoutAnimation, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'users' | 'vendors' | 'orders' | 'products'>('users');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let query;

      switch (activeSection) {
        case 'users':
          query = supabase.from('users').select('id, full_name, email, mobile, address');
          break;
        case 'vendors':
          query = supabase.from('vendors').select('*');
          break;
        case 'orders':
          query = supabase.from('orders')
            .select(`
            id, 
            total, 
            status,
            created_at,
            payment_method,
            product_id,
            vendor_id,
            users:user_email (full_name),
            products:product_id (name),
            vendors:vendor_id (full_name)
          `);
          break;
        case 'products':
          query = supabase.from('products')
            .select(`
              id,
              name,
              category,
              price,
              quantity,
              vendors:vendor_id (full_name),
              product_img (img_url)
            `);
          break;
      }

      const { data, error } = await query!;
      if (error) throw error;
      setData(data || []);
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

  const renderItem = (item: any) => {
    switch (activeSection) {
      case 'users':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.full_name}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID:</Text>
              <Text style={styles.detailValue}>{item.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{item.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile:</Text>
              <Text style={styles.detailValue}>{item.mobile}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{item.address}</Text>
            </View>
          </View>
        );

      case 'vendors':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.full_name}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vendor ID:</Text>
              <Text style={styles.detailValue}>{item.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{item.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile:</Text>
              <Text style={styles.detailValue}>{item.mobile}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Business Name:</Text>
              <Text style={styles.detailValue}>{item.business_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GST ID:</Text>
              <Text style={styles.detailValue}>{item.gst_id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Details:</Text>
              <Text style={styles.detailValue}>{item.bank_name} (A/C: {item.account_number})</Text>
            </View>
          </View>
        );

      case 'orders':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.orderIdContainer}>
                <Text style={styles.cardTitle}>Order #{item.id}</Text>
              </View>
            </View>
            <Text style={[styles.status, item.status === 'delivered' && styles.deliveredStatus]}>
              {item.status}
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Product ID:</Text>
              <Text style={styles.detailValue}>{item.product_id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vendor ID:</Text>
              <Text style={styles.detailValue}>{item.vendor_id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer:</Text>
              <Text style={styles.detailValue}>{item.users?.full_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Product:</Text>
              <Text style={styles.detailValue}>{item.products?.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vendor:</Text>
              <Text style={styles.detailValue}>{item.vendors?.full_name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total:</Text>
              <Text style={styles.detailValue}>₹{item.total}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment:</Text>
              <Text style={styles.detailValue}>{item.payment_method}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        );

      case 'products':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>

            {/* Image Gallery */}
            {item.product_img?.length > 0 && (
              <View style={styles.imageContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {item.product_img.map((img: any) => (
                    <Image
                      key={img.img_url}
                      source={{ uri: img.img_url }}
                      style={styles.productImage}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Product ID:</Text>
              <Text style={styles.detailValue}>{item.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{item.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>₹{item.price}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock:</Text>
              <Text style={styles.detailValue}>{item.quantity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vendor:</Text>
              <Text style={styles.detailValue}>{item.vendors?.full_name}</Text>
            </View>
          </View>
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'users': return 'Registered Users';
      case 'vendors': return 'Approved Vendors';
      case 'orders': return 'Recent Orders';
      case 'products': return 'Available Products';
    }
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

      {/* Sidebar */}
      {isSidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        >
          <View style={styles.sidebar}>
            <View style={styles.sidebarContent}>
              <Text style={styles.sidebarTitle}>Admin Panel</Text>

              {['users', 'vendors', 'orders', 'products'].map((section) => (
                <TouchableOpacity
                  key={section}
                  style={[styles.navButton, activeSection === section && styles.activeNavButton]}
                  onPress={() => {
                    setActiveSection(section as any);
                    toggleSidebar();
                  }}
                >
                  <Text style={styles.navButtonText}>
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2980b9" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : data.length === 0 ? (
          <Text style={styles.noDataText}>No {activeSection} found</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{getSectionTitle()} ({data.length})</Text>
            {data.map((item, index) => (
              <View key={index}>{renderItem(item)}</View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    marginVertical: 10,
    height: 120,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  orderIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#2c3e50',
    padding: 20,
    zIndex: 99,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 98,
  },
  content: {
    padding: 20,
    paddingTop: 80,
  },
  sidebarContent: {
    marginTop: 60,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 25,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  activeNavButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2980b9',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#e9ecef',
  },
  deliveredStatus: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  date: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'right',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  noDataText: {
    color: '#6c757d',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
});