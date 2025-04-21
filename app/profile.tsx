import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/');
                return;
            }

            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .single();

            setUser({ ...user, ...userData });
            setLoading(false);
        };

        fetchUser();
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
                <Text style={styles.title}>Profile</Text>
                <View style={{ width: 24 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.label}>Full Name:</Text>
                    <Text style={styles.value}>{user?.full_name || 'Not provided'}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{user?.email}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>Mobile:</Text>
                    <Text style={styles.value}>{user?.mobile || 'Not provided'}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>{user?.address || 'Not provided'}</Text>
                </View>
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
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
    },
});