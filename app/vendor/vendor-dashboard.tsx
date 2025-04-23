import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, LayoutAnimation, Alert, TextInput, Modal, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getSession, clearSession } from '../../lib/session';
import { uploadToCloudinary } from '@/lib/cloudinary';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function VendorDashboard() {
  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '', // New field
    quantity: '',
    price: '',
    description: ''
  });

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<{
    img_url: string | undefined; id: string, url: string
  }[]>([]);
  const [uploading, setUploading] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);

  // Add this useEffect for fetching orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (vendorData?.id) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
          *,
          products:product_id (*)
        `)
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });

        if (data) setOrders(data);
        if (error) console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [vendorData]);

  // Add this function to handle status updates
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  // Add this function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing': return '#fff3cd';
      case 'shipped': return '#cce5ff';
      case 'delivered': return '#d4edda';
      case 'cancelled': return '#f8d7da';
      default: return '#f8f9fa';
    }
  };

  // Add this status selector component
  const StatusSelector = ({ currentStatus, onSelect }: {
    currentStatus: string;
    onSelect: (status: string) => void
  }) => {
    const [showOptions, setShowOptions] = useState(false);

    return (
      <View style={styles.statusContainer}>
        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}
          onPress={() => setShowOptions(true)}
        >
          <Text style={styles.statusText}>{currentStatus}</Text>
        </TouchableOpacity>

        <Modal
          visible={showOptions}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOptions(false)}
        >
          <View style={styles.statusModal}>
            <View style={styles.statusOptions}>
              {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusOption,
                  { backgroundColor: getStatusColor(status) }]}
                  onPress={() => {
                    onSelect(status);
                    setShowOptions(false);
                  }}
                >
                  <Text style={styles.statusOptionText}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    );
  };


  // Add image picker handler
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Sorry, we need camera roll permissions to select images.'
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false, // Set to true if you want to allow image editing
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };


  // Add image upload handler
  const handleUpload = async () => {
    if (!selectedImage || !selectedProduct) return;

    setUploading(true);
    try {
      // Upload to Cloudinary
      const filename = selectedImage.split('/').pop();
      const fileType = filename?.split('.').pop();

      const file = {
        uri: selectedImage,
        name: filename,
        type: `image/${fileType}`,
      } as any;

      const cloudinaryResponse = await uploadToCloudinary(file, selectedProduct);

      // Save to Supabase
      const { data, error } = await supabase
        .from('product_img')
        .insert([{
          product_id: selectedProduct,
          img_url: cloudinaryResponse.secure_url
        }])
        .select();

      if (error) throw error;

      setUploadedUrls(prev => [...prev, ...data]);
      setSelectedImage(null);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Add useEffect to fetch existing images
  useEffect(() => {
    const fetchProductImages = async () => {
      if (selectedProduct) {
        const { data, error } = await supabase
          .from('product_img')
          .select('*')
          .eq('product_id', selectedProduct);

        if (data) setUploadedUrls(data);
        if (error) console.error('Error fetching images:', error);
      }
    };

    fetchProductImages();
  }, [selectedProduct]);

  // Add this useEffect for fetching products
  useEffect(() => {
    const fetchProducts = async () => {
      if (vendorData?.id) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('vendor_id', vendorData.id);

        if (data) setProducts(data);
        if (error) console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [vendorData, showProductForm]);

  // Add this function for product submission
  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.category || !productForm.quantity || !productForm.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productForm,
          vendor_id: vendorData?.id,
          quantity: Number(productForm.quantity),
          price: Number(productForm.price),
          category: productForm.category // Add category
        }])
        .select();

      if (error) throw error;

      setProducts([...products, ...data]);
      setProductForm({ name: '', category: '', quantity: '', price: '', description: '' });
      // setShowProductForm(false);
      Alert.alert('Success', 'Product added successfully!');

    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add product');
    }
  };


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

    if (showProductForm) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Add Product</Text>
          <TextInput
            placeholder="Product Name"
            value={productForm.name}
            onChangeText={(text) => setProductForm({ ...productForm, name: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Category"
            value={productForm.category}
            onChangeText={(text) => setProductForm({ ...productForm, category: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Quantity"
            value={productForm.quantity}
            onChangeText={(text) => setProductForm({ ...productForm, quantity: text })}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Price"
            value={productForm.price}
            onChangeText={(text) => setProductForm({ ...productForm, price: text })}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Description"
            value={productForm.description}
            onChangeText={(text) => setProductForm({ ...productForm, description: text })}
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddProduct}
          >
            <Text style={styles.buttonText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowProductForm(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {/* Products */}
          {products.length > 0 && (
            <View style={styles.productSection}>
              <Text style={styles.sectionHeader}>Your Products ({products.length})</Text>
              {products.map((product, index) => (
                <View key={index} style={styles.productCard}>
                  <Text style={styles.productHeader}>Product Id : {product.id}</Text>
                  <Text style={styles.productHeader}>{product.name}</Text>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{product.category}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Price:</Text>
                    <Text style={[styles.infoValue, styles.priceText]}>₹{product.price}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Quantity:</Text>
                    <Text style={[styles.infoValue, styles.quantityText]}>{product.quantity}</Text>
                  </View>
                  {product.description && (
                    <View style={{ borderTopWidth: 1, borderTopColor: '#ecf0f1', marginTop: 10, paddingTop: 10 }}>
                      <Text style={styles.descriptionText}>{product.description}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => {
                      // Pass the actual product ID here
                      setSelectedProduct(product.id);
                      setShowImageModal(true);
                    }}
                  >
                    <Text style={styles.buttonText}>Upload Images</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Modal
            visible={showImageModal}
            animationType="slide"
            onRequestClose={() => setShowImageModal(false)}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                Product Images ({uploadedUrls.length})
              </Text>
              {selectedProduct && (
                <Text style={styles.productIdText}>Product ID: {selectedProduct}</Text>
              )}

              <ScrollView contentContainerStyle={styles.imageGrid}>
                {uploadedUrls.map((image) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.img_url }}
                    style={styles.thumbnail}
                  />
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.buttonText}>Select New Image</Text>
              </TouchableOpacity>

              {selectedImage && (
                <>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleUpload}
                    disabled={uploading}
                  >
                    <Text style={styles.buttonText}>
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowImageModal(false);
                  setUploadedUrls([]);
                  setSelectedProduct(null);
                }}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </View>
      );
    }

    return (
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome, {vendorData?.full_name}</Text>
        <Text style={styles.welcomeText}>Manage your vendor account - Products & Orders here</Text>

        {orders.length > 0 ? (
          <View style={styles.ordersSection}>
            <Text style={styles.sectionHeader}>Recent Orders ({orders.length})</Text>
            {orders.map(order => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderId}>Order # {order.id}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>

                {order.products && (
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{order.products.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>₹{order.products.price} x {order.quantity}</Text>
                      <Text style={styles.totalPrice}>₹{(order.total).toFixed(2)}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={14} color="#7f8c8d" />
                    <Text style={styles.detailLabel}>Customer:</Text>
                    <Text style={styles.detailValue}>{order.shipping_info?.fullName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={14} color="#7f8c8d" />
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>
                      {order.shipping_info?.address}, {order.shipping_info?.pinCode}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={14} color="#7f8c8d" />
                    <Text style={styles.detailLabel}>Payment:</Text>
                    <Text style={[styles.detailValue, styles.paymentMethod]}>
                      {order.payment_method || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Update Status:</Text>
                  <StatusSelector
                    currentStatus={order.status || 'processing'}
                    onSelect={(newStatus) => handleStatusChange(order.id, newStatus)}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyOrdersContainer}>
            <Ionicons name="cube-outline" size={50} color="#bdc3c7" />
            <Text style={styles.emptyOrdersText}>No orders right now</Text>
          </View>
        )}
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
                  setShowProfile(false);
                  setShowProductForm(false);
                  toggleSidebar();
                }}
              >
                <Text style={styles.navButtonText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, showProfile && styles.activeNavButton]}
                onPress={() => {
                  setShowProfile(true);
                  setShowProductForm(false);
                  toggleSidebar();
                }}
              >
                <Text style={styles.navButtonText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, showProductForm && styles.activeNavButton]}
                onPress={() => {
                  setShowProductForm(true);
                  setShowProfile(false);
                  toggleSidebar();
                }}
              >
                <Text style={styles.navButtonText}>Product</Text>
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
  ordersSection: {
    marginTop: 20,
    width: '100%',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 12,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  totalPrice: {
    fontSize: 15,
    color: '#27ae60',
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  paymentMethod: {
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyOrdersContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyOrdersText: {
    fontSize: 16,
    color: '#bdc3c7',
    marginTop: 10,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptions: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '80%',
  },
  statusOption: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
  },
  productIdText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 15,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginVertical: 10,
  },
  urlList: {
    marginTop: 20,
  },
  urlTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  urlItem: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  demoButton: {
    backgroundColor: '#9b59b6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#bdc3c7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#2c3e50',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  productSection: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'stretch',
  },
  productHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  categoryTag: {
    backgroundColor: '#3498db',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  priceText: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  quantityText: {
    color: '#e67e22',
    fontWeight: '500',
  },
  descriptionText: {
    color: '#7f8c8d',
    fontStyle: 'italic',
    fontSize: 12,
    paddingBottom: 5,
  },
});