import { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StyleSheet, Animated, Easing, Dimensions, ScrollView, Image, ViewStyle, ActivityIndicator } from 'react-native';
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

  // Add this useEffect for fetching products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*');

        if (error) throw error;

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
              <TouchableOpacity style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>Profile</Text>
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

          {/* Products Section */}
          <View style={styles.productsContainer}>
            <Text style={styles.sectionTitle}>Featured Products</Text>

            {loadingProducts ? (
              <ActivityIndicator size="large" color="#2ecc71" />
            ) : products.length > 0 ? (
              <View style={styles.productsGrid}>
                {products.map((product) => (
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
                      <Text style={styles.productPrice}>₹{product.price}</Text>

                      <TouchableOpacity style={styles.buyButton}>
                        <Text style={styles.buyButtonText}>Buy Now</Text>
                        <Ionicons name="cart" size={18} color="white" />
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
    </>
  );
}

// Keep the same styles from previous implementation
const styles = StyleSheet.create({
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