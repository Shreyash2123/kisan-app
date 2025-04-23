import { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StyleSheet, Animated, Easing, Dimensions, ScrollView, Image, ViewStyle, ActivityIndicator, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { cld } from '@/lib/cloudinary';


const { width: screenWidth } = Dimensions.get('window');

export default function Home() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(300))[0];
  const dropdownAnim = useState(new Animated.Value(0))[0];
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [userDetails, setUserDetails] = useState<any>({});
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    pinCode: '',
    mobile: '',
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: '', // 'card' or 'cod'
    cardType: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [orderId, setOrderId] = useState('');

  const handlePayNow = async () => {
    // Simple validation
    if (paymentData.paymentMethod === 'card' &&
      (!paymentData.cardNumber || !paymentData.expiry || !paymentData.cvv || !paymentData.cardType)) {
      alert('Please fill all payment details');
      return;
    }

    // Process order
    const orderData = {
      user_email: userEmail,
      product_id: selectedProduct?.id,
      vendor_id: selectedProduct?.vendor_id,
      quantity,
      total: selectedProduct?.price * quantity,
      shipping_info: formData,
      payment_method: paymentData.paymentMethod === 'cod' ? 'COD' : paymentData.cardType
    };

    // Insert order into database
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select();

    if (error) {
      alert('Error placing order: ' + error.message);
      return;
    }

    if (data) {
      setOrderId(data[0].id);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
    }
  };

  // Add this useEffect for fetching products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;

        // Get unique categories
        const uniqueCategories = Array.from(
          new Set(productsData.map(product => product.category))
        );
        setCategories(['All', ...uniqueCategories]);

        // Fetch images for each product
        const productsWithImages = await Promise.all(
          productsData.map(async (product) => {
            const { data: imagesData } = await supabase
              .from('product_img')
              .select('img_url')
              .eq('product_id', product.id)
              .limit(1);

            return {
              ...product,
              image: imagesData?.[0]?.img_url || require('../assets/placeholder.jpg')
            };
          })
        );

        setProducts(productsWithImages);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Add this function to fetch all images when opening modal
  const fetchProductDetails = async (productId: string) => {
    try {
      const { data: imagesData } = await supabase
        .from('product_img')
        .select('img_url')
        .eq('product_id', productId);

      return imagesData?.map(img => img.img_url) || [require('../assets/placeholder.jpg')];
    } catch (error) {
      console.error('Error fetching product images:', error);
      return [require('../assets/placeholder.jpg')];
    }
  };

  // Update the Buy Now button handler
  const handleBuyNow = async (product: any) => {
    setLoadingProductId(product.id);
    try {
      const allImages = await fetchProductDetails(product.id);
      setSelectedProduct({
        ...product,
        images: allImages
      });
      setShowProductModal(true);
    } catch (error) {
      console.error('Error loading product details:', error);
    } finally {
      setLoadingProductId(null);
    }
  };

  // Fetch user details when checkout modal opens
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (showCheckoutModal) {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, address, mobile')
          .eq('email', userEmail)
          .single();

        if (data) {
          setUserDetails(data);
          setFormData({
            fullName: data.full_name,
            address: data.address,
            mobile: data.mobile,
            pinCode: ''
          });
        }
      }
    };
    fetchUserDetails();
  }, [showCheckoutModal]);

  const slides: any[] = [
    { id: 1, title: "Fresh Produce", subtitle: "Direct from Farm to Table", image: require('../assets/img1.jpg') },
    { id: 2, title: "Organic Products", subtitle: "100% Natural & Healthy", image: require('../assets/img2.jpg') },
    { id: 3, title: "Daily Essentials", subtitle: "Everything You Need", image: require('../assets/img3.jpg') },
  ];

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }
      setUserEmail(user.email || '');
      animateHeader();
    };

    checkSession();
  }, []);

  const animateHeader = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.replace('/');
  };

  // Toggle function with animation
  const toggleDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: dropdownVisible ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setDropdownVisible(!dropdownVisible));
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / screenWidth);
    setActiveIndex(currentIndex);
  };

  return (
    <>
      <View style={styles.container}>
        <SafeAreaView style={styles.topBar}>
          {/* Main Navigation Container */}
          <Animated.View
            style={[
              styles.navContainer,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim
              }
            ]}
          >
            <Text style={styles.appName}>Kisan App</Text>
            <TouchableOpacity onPress={toggleDropdown} style={styles.profileButton}>
              <Ionicons name="person-circle" size={28} color="white" />
            </TouchableOpacity>
          </Animated.View>

          {/* Dropdown Menu */}
          {dropdownVisible && (
            <Animated.View
              style={[
                styles.dropdown,
                {
                  opacity: dropdownAnim,
                  transform: [
                    {
                      scale: dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1]
                      })
                    },
                    {
                      translateY: dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <Text style={styles.dropdownEmail}>{userEmail}</Text>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => router.push('/profile')}
              >
                <Text style={styles.dropdownText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => router.push('/orders')}
              >
                <Text style={styles.dropdownText}>Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
                <Text style={styles.dropdownText}>Logout</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </SafeAreaView>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Slider Section */}
          <View style={styles.sliderContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {slides.map((slide) => (
                <View key={slide.id} style={styles.slide}>
                  <Image source={slide.image} style={styles.slideImage} />
                  <View style={styles.slideContent}>
                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                    <TouchableOpacity style={styles.slideButton}>
                      <Text style={styles.slideButtonText}>Explore Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Slider Indicators */}
            <View style={styles.indicatorContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    activeIndex === index && styles.activeIndicator
                  ]} />
              ))}
            </View>
          </View>

          {/* Filter Section */}
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.activeCategoryButton
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.activeCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Products Section */}
          <View style={styles.productsContainer}>
            <Text style={styles.sectionTitle}>Featured Products</Text>

            {loadingProducts ? (
              <ActivityIndicator size="large" color="#2ecc71" />
            ) : products.length > 0 ? (
              <View style={styles.productsGrid}>
                {products
                  .filter(product =>
                    selectedCategory === 'All' || product.category === selectedCategory
                  )
                  .map((product) => (
                    <View key={product.id} style={styles.productCard}>
                      <View style={styles.imageContainer}>
                        <Image
                          source={typeof product.image === 'string' ?
                            { uri: product.image } : product.image}
                          style={styles.productImage}
                        />
                        <TouchableOpacity style={styles.heartButton}>
                          <Ionicons
                            name="heart-outline"
                            size={24}
                            color="#e74c3c"
                            style={styles.heartIcon}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                        <Text style={styles.productCategory}>{product.category}</Text>
                        <Text style={styles.productPrice}>₹{product.price}</Text>

                        <TouchableOpacity
                          style={[
                            styles.buyButton,
                            loadingProductId === product.id && styles.loadingButton
                          ]}
                          onPress={() => handleBuyNow(product)}
                          disabled={loadingProductId !== null}
                        >
                          {loadingProductId === product.id ? (
                            <ActivityIndicator color="white" />
                          ) : (
                            <>
                              <Text style={styles.buyButtonText}>Buy Now</Text>
                              <Ionicons name="cart" size={18} color="white" />
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            ) : (
              <View style={styles.comingSoon}>
                <Ionicons name="leaf" size={50} color="#2ecc71" />
                <Text style={styles.comingSoonText}>Exciting Products Coming Soon!</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View >

      {/* Product Modal */}
      <Modal visible={showProductModal} transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.productModal}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProductModal(false)}
            >
              <Ionicons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
            <ScrollView horizontal pagingEnabled>
              {selectedProduct?.images.map((img: string, index: number) => (
                <Image
                  key={index}
                  source={typeof img === 'string' ? { uri: img } : img}
                  style={styles.modalImage}
                />
              ))}
            </ScrollView>

            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.productCategory}>{selectedProduct?.category}</Text>
            <Text style={styles.modalDescription}>{selectedProduct?.description}</Text>
            <Text style={styles.modalPrice}>₹{selectedProduct?.price}</Text>

            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                <Ionicons name="remove" size={24} color="#2ecc71" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
                <Ionicons name="add" size={24} color="#2ecc71" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.proceedButton}
              onPress={() => {
                setShowProductModal(false);
                setShowCheckoutModal(true);
              }}
            >
              <Text style={styles.proceedButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={showCheckoutModal} transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.checkoutModal}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowCheckoutModal(false);
                setQuantity(1); // Reset quantity
              }}
            >
              <Ionicons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
            <ScrollView>
              <Text style={styles.checkoutTitle}>Checkout</Text>

              <View style={styles.orderSummary}>
                <Text style={styles.summaryText}>Product: {selectedProduct?.name}</Text>
                <Text style={styles.summaryText}>Quantity: {quantity}</Text>
                <Text style={styles.summaryText}>
                  Total: ₹{(selectedProduct?.price * quantity).toFixed(2)}
                </Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.fullName}
                onChangeText={text => setFormData({ ...formData, fullName: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={formData.address}
                onChangeText={text => setFormData({ ...formData, address: text })}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Pin Code"
                value={formData.pinCode}
                onChangeText={text => setFormData({ ...formData, pinCode: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                value={formData.mobile}
                onChangeText={text => setFormData({ ...formData, mobile: text })}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={styles.payButton}
                onPress={() => {
                  setShowCheckoutModal(false);
                  setShowPaymentModal(true);
                }}
              >
                <Text style={styles.payButtonText}>Proceed to Payment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.paymentModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Ionicons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>

            <Text style={styles.paymentTitle}>Select Payment Method</Text>

            <View style={styles.paymentOptionsContainer}>
              {/* Visa */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentData.paymentMethod === 'card' &&
                  paymentData.cardType === 'visa' &&
                  styles.selectedPaymentMethod
                ]}
                onPress={() => setPaymentData({
                  ...paymentData,
                  paymentMethod: 'card',
                  cardType: 'visa'
                })}
              >
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png' }}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                <Text style={styles.paymentMethodText}>Visa</Text>
              </TouchableOpacity>

              {/* Mastercard */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentData.paymentMethod === 'card' &&
                  paymentData.cardType === 'mastercard' &&
                  styles.selectedPaymentMethod
                ]}
                onPress={() => setPaymentData({
                  ...paymentData,
                  paymentMethod: 'card',
                  cardType: 'mastercard'
                })}
              >
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/2560px-Mastercard_2019_logo.svg.png' }}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
                <Text style={styles.paymentMethodText}>Mastercard</Text>
              </TouchableOpacity>

              {/* COD */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentData.paymentMethod === 'cod' &&
                  styles.selectedPaymentMethod
                ]}
                onPress={() => setPaymentData({
                  ...paymentData,
                  paymentMethod: 'cod',
                  cardType: ''
                })}
              >
                <Ionicons name="cash" size={32} color="#2c3e50" />
                <Text style={styles.paymentMethodText}>COD</Text>
              </TouchableOpacity>
            </View>

            {/* Card Details Form */}
            {paymentData.paymentMethod === 'card' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Card Number"
                  keyboardType="numeric"
                  maxLength={19}
                  value={paymentData.cardNumber.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ')}
                  onChangeText={text => setPaymentData({ ...paymentData, cardNumber: text })}
                />

                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="MM/YY"
                    maxLength={5}
                    value={paymentData.expiry}
                    onChangeText={text => setPaymentData({ ...paymentData, expiry: text })}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="CVV"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    value={paymentData.cvv}
                    onChangeText={text => setPaymentData({ ...paymentData, cvv: text })}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.payNowButton}
              onPress={handlePayNow}
            >
              <Text style={styles.payNowButtonText}>
                {paymentData.paymentMethod === 'cod' ?
                  `Confirm COD Order` :
                  `Pay ₹${(selectedProduct?.price * quantity).toFixed(2)}`
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={showReceiptModal} transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModal}>
            <View style={styles.receiptHeader}>
              <Ionicons
                name="checkmark-circle"
                size={60}
                color="#2ecc71"
              />
              <Text style={styles.receiptTitle}>Order Confirmed!</Text>
            </View>

            <View style={styles.receiptDetails}>
              <Text style={styles.receiptText}>Order ID: #{orderId}</Text>
              <Text style={styles.receiptText}>Product: {selectedProduct?.name}</Text>
              <Text style={styles.receiptText}>Quantity: {quantity}</Text>
              <Text style={styles.receiptText}>
                Total: ₹{(selectedProduct?.price * quantity).toFixed(2)}
              </Text>
              <Text style={styles.receiptText}>
                Payment Method: {paymentData.paymentMethod === 'cod' ?
                  'COD (Cash on Delivery)' :
                  paymentData.cardType.toUpperCase()
                }
              </Text>
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => alert('Receipt downloaded!')}
            >
              <Ionicons name="download" size={20} color="white" />
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueShopping}
              onPress={() => {
                setShowReceiptModal(false);
                setQuantity(1);
                setSelectedProduct(null);
              }}
            >
              <Text style={styles.continueText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Keep the same styles from previous implementation
const styles = StyleSheet.create({
  paymentOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8, // Reduced gap
    marginBottom: 20,
    paddingHorizontal: 10, // Added horizontal padding
  },
  paymentMethodButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12, // Reduced padding
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    minWidth: 0, // Important for flex to work properly
    marginHorizontal: 4, // Added small horizontal margin
  },
  cardImage: {
    width: 50, // Reduced image size
    height: 30,
  },
  paymentMethodText: {
    marginTop: 6,
    fontSize: 11, // Slightly smaller text
    fontWeight: '500',
    color: '#2c3e50',
  },
  selectedPaymentMethod: {
    borderColor: '#2ecc71',
    backgroundColor: '#f0fdf4',
  },
  codButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    marginTop: 10,
    gap: 10,
  },
  selectedCod: {
    borderColor: '#2ecc71',
    backgroundColor: '#f0fdf4',
  },
  codButtonText: {
    color: '#2c3e50',
    fontWeight: '500',
  },
  cardButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    width: 100,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedCard: {
    borderColor: '#2ecc71',
    backgroundColor: '#f0fdf4',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentModal: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 25,
    padding: 25,
    maxHeight: '90%',
    position: 'relative',
  },
  paymentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  cardIcon: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ecf0f1',
  },
  rupayText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d47a1',
  },
  row: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
  },
  payNowButton: {
    backgroundColor: '#2ecc71',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  payNowButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  receiptModal: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2ecc71',
    marginTop: 15,
  },
  receiptDetails: {
    width: '100%',
    marginBottom: 25,
  },
  receiptText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginVertical: 8,
  },
  downloadButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  continueShopping: {
    padding: 10,
  },
  continueText: {
    color: '#2ecc71',
    fontWeight: '600',
  },
  loadingButton: {
    opacity: 0.8,
  },
  filterContainer: {
    marginBottom: 20,
    marginTop: 20
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
  },
  activeCategoryButton: {
    backgroundColor: '#2ecc71',
  },
  categoryButtonText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: 'white',
  },
  productCategory: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 5,
  },
  checkoutModal: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 20,
    padding: 25, // Increased padding for close button space
    maxHeight: '90%',
    position: 'relative',
  },
  productModal: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 20,
    padding: 25, // Increased padding for close button space
    maxHeight: '80%',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 15,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
    marginBottom: 15,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2ecc71',
    marginBottom: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalImage: {
    width: screenWidth - 80,
    height: 200,
    resizeMode: 'contain'
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 20
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600'
  },
  proceedButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  proceedButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  checkoutTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center'
  },
  orderSummary: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10
  },
  summaryText: {
    fontSize: 16,
    marginVertical: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16
  },
  payButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },
  payButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  productCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 5,
  },
  heartIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#27ae60',
    marginBottom: 12,
  },
  buyButton: {
    flexDirection: 'row',
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  navContainer: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    width: '100%',
    backgroundColor: '#2ecc71', // Added background color
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    backgroundColor: '#2ecc71',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dropdown: {
    position: 'absolute',
    right: 20,
    top: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  dropdownItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ecf0f1',
  },
  dropdownText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  content: {
    paddingBottom: 40,
  },
  sliderContainer: {
    height: 300,
    marginTop: 20,
  },
  slide: {
    width: screenWidth - 40,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  slideButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  slideButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#bdc3c7',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#2ecc71',
    width: 20,
  },
  productsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
  },
  comingSoon: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 200,
  },
  comingSoonText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 15,
    textAlign: 'center',
  },
});