import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeSession = async (vendorData: any) => {
  await AsyncStorage.setItem('vendorSession', JSON.stringify(vendorData));
};

export const getSession = async () => {
  const session = await AsyncStorage.getItem('vendorSession');
  return session ? JSON.parse(session) : null;
};

export const clearSession = async () => {
  await AsyncStorage.removeItem('vendorSession');
};