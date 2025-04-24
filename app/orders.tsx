// app/orders.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products:product_id (
          *,
          product_img (img_url)
        )
      `)
      .eq('user_email', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Ionicons name="refresh" size={24} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={50} color="#7f8c8d" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        ) : (
          orders.map(order => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <View style={[
                  styles.statusBadge,
                  order.status === 'delivered' && styles.deliveredBadge,
                  order.status === 'processing' && styles.processingBadge,
                  order.status === 'cancelled' && styles.cancelledBadge,
                ]}>
                  <Text style={styles.statusText}>{order.status || 'Processing'}</Text>
                </View>
              </View>

              <View style={styles.productContainer}>
                <Image
                  source={
                    order.products?.product_img?.length > 0
                      ? { uri: order.products.product_img[0].img_url }
                      : require('../assets/placeholder.jpg')
                  }
                  style={styles.productImage}
                />
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={2}>{order.products?.name}</Text>
                  <Text style={styles.productPrice}>₹{order.products?.price}</Text>
                  <Text style={styles.quantity}>Quantity: {order.quantity}</Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={16} color="#7f8c8d" />
                  <Text style={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.orderTotal}>₹{(order.total).toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 15,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    fontSize: 14,
    color: '#7f8c8d',
    flexShrink: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: '#ecf0f1',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  deliveredBadge: {
    backgroundColor: '#d4edda',
  },
  processingBadge: {
    backgroundColor: '#fff3cd',
  },
  cancelledBadge: {
    backgroundColor: '#f8d7da',
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27ae60',
  },
});