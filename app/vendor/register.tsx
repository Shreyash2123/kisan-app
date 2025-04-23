import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View, SafeAreaView, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import bcrypt from 'react-native-bcrypt';

export default function VendorRegister() {
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    email: '',
    gst_id: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;
    const ifscRegex = /^[0-9]{6}$/;
    const gstRegex = /^[0-9]{6}$/;

    if (!formData.full_name.trim()) newErrors.full_name = 'Full Name is required';
    if (!mobileRegex.test(formData.mobile)) newErrors.mobile = 'Invalid mobile number';
    if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!gstRegex.test(formData.gst_id)) newErrors.gst_id = 'Invalid GST ID';
    if (!formData.bank_name.trim()) newErrors.bank_name = 'Bank name is required';
    if (!formData.account_number.trim()) newErrors.account_number = 'Account number is required';
    if (!ifscRegex.test(formData.ifsc_code)) newErrors.ifsc_code = 'Invalid IFSC code';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setLoading(true); // Start loading when validation begins

    if (!validateForm()) {
      setLoading(false); // Stop loading if validation fails
      return;
    }  

    try {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(formData.password, salt);

      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          full_name: formData.full_name,
          mobile: formData.mobile,
          email: formData.email,
          gst_id: formData.gst_id,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          ifsc_code: formData.ifsc_code,
          branch_name: formData.branch_name,
          hashed_password: hashedPassword
        }])
        .select();

      if (error) throw error;

      Alert.alert('Success', 'Registration successful! Please Login');
      router.replace('/vendor/vendor-login');
    } catch (error) {
      let errorMessage = 'Registration failed';

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

  return (
    <SafeAreaView style={styles.container}>

      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Vendor Registration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2980b9" />
            <Text style={styles.loadingText}>Registering...</Text>
          </View>
        )}

        <Text style={styles.header}>Vendor Registration</Text>

        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <InputField
            label="Full Name"
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            error={errors.full_name}
          />
          <InputField
            label="Mobile Number"
            value={formData.mobile}
            onChangeText={(text) => setFormData({ ...formData, mobile: text })}
            keyboardType="phone-pad"
            error={errors.mobile}
          />
          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            error={errors.email}
          />
          <InputField
            label="GST ID"
            value={formData.gst_id}
            onChangeText={(text) => setFormData({ ...formData, gst_id: text })}
            error={errors.gst_id}
          />
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <InputField
            label="Bank Name"
            value={formData.bank_name}
            onChangeText={(text) => setFormData({ ...formData, bank_name: text })}
            error={errors.bank_name}
          />
          <InputField
            label="Account Number"
            value={formData.account_number}
            onChangeText={(text) => setFormData({ ...formData, account_number: text })}
            keyboardType="numeric"
            error={errors.account_number}
          />
          <InputField
            label="IFSC Code"
            value={formData.ifsc_code}
            onChangeText={(text) => setFormData({ ...formData, ifsc_code: text })}
            error={errors.ifsc_code}
          />
          <InputField
            label="Branch Name"
            value={formData.branch_name}
            onChangeText={(text) => setFormData({ ...formData, branch_name: text })}
          />
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <InputField
            label="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            error={errors.password}
          />
          <InputField
            label="Confirm Password"
            value={formData.confirm_password}
            onChangeText={(text) => setFormData({ ...formData, confirm_password: text })}
            secureTextEntry
            error={errors.confirm_password}
          />
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.replace('/vendor/vendor-login')}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

const InputField = ({
  label,
  value,
  onChangeText,
  error,
  ...props
}: InputFieldProps) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error ? styles.inputError : null]}
      value={value}
      onChangeText={onChangeText}
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2980b9',
    textAlign: 'center',
    marginVertical: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },
  registerButton: {
    backgroundColor: '#2980b9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#2980b9',
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2980b9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2980b9',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 32,
    lineHeight: 32,
  },
  titleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});